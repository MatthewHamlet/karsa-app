import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./app/lib/supabase/config";
import { hasChosenRole } from "./app/lib/roles";

/** Session upkeep, on every request.
 *
 *  ── Why this file is called `proxy.ts` ────────────────────────────────────
 *  Every Supabase guide in existence puts this in `middleware.ts` exporting a
 *  function named `middleware`. That convention is **deprecated in Next.js 16**
 *  and renamed to `proxy.ts` exporting `proxy`; the old name still works but
 *  warns, and it is on its way out. Same capabilities, different name. Next 16
 *  also runs this on the Node.js runtime rather than the edge, and setting
 *  `runtime` in here is an error.
 *
 *  ── Why it has to exist at all ────────────────────────────────────────────
 *  Supabase access tokens are short-lived. Something has to spend the refresh
 *  token and write the new cookies back, and Server Components are not allowed
 *  to write cookies — so if this file is missing or its `setAll` is wrong, the
 *  symptom is not a clean error. It is people being logged out at random.
 *
 *  Note `setAll`'s second argument. This version of `@supabase/ssr` hands over
 *  no-store headers that must go on the response: without them a CDN can cache
 *  a response carrying `Set-Cookie` and serve one person's session to somebody
 *  else. Older examples do not have this parameter. */

/** Routes reachable without a session. **Everything else needs one.**
 *
 *  Written as an allow-list rather than a list of protected paths, and that
 *  choice matters more than it looks: with a protected-list, every page added
 *  later is public until somebody remembers to add it, and the failure is
 *  silent. Inverted, a new page is closed by default and the mistake is
 *  "I cannot reach my own page", which gets noticed in seconds.
 *
 *  This is an optimistic first pass and nothing more. The proxy runs on
 *  prefetches too, so it only reads the session — it never decides who may see
 *  which patient. That lives in RLS, next to the data. */
const PUBLIC_PREFIXES = ["/login", "/auth"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** The only routes a caregiver with nobody to care for may reach.
 *
 *  Everything else in the app divides by a patient, so until there is one there
 *  is nothing behind those pages but zeroes. The rule is enforced here rather
 *  than page by page for the same reason `PUBLIC_PREFIXES` is an allow-list: a
 *  page added next month is closed by default, and the mistake shows up
 *  immediately as "I cannot reach my own page" instead of silently as a
 *  dashboard full of nothing.
 *
 *  `/pasien` is on the list because a person can be both — somebody's carer and
 *  somebody else's patient — and being locked out of their own patient screen
 *  for not yet having added a patient of their own would be absurd. */
const ONBOARDING_ALLOWED = ["/mulai", "/care/tambah-pasien", "/pair", "/pasien"];

function allowedWhileOnboarding(pathname: string): boolean {
  return ONBOARDING_ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  /* Nothing to refresh before anyone has pasted a key in. Returning early keeps
     the whole app usable while the backend is half-wired. */
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        /* Written twice, and both are needed. Onto `request` so anything
           rendering later in this same pass sees the fresh token, and onto a
           newly built `response` so the browser is told to store it. */
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  /* This call is the point of the whole file: it validates the token and, when
     it has expired, refreshes it — which triggers `setAll` above. Do not remove
     it just because the result looks unused. */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    /* Where they were headed, so signing in returns them there instead of
       dumping everyone on the home page. `/login` itself is never carried —
       that would bounce someone back to the door they just came through. */
    if (pathname !== "/") url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  /* A signed-in visitor to `/login` is not bounced from here — the page does it,
     and one place owning that decision beats two. */

  /* ── The role question ──────────────────────────────────────────────────
     An account that has never said whether it is a pendamping or a pasien is
     sent to answer before it reaches either app.

     `/auth/callback` already redirects there straight after a Google sign-in,
     so in the ordinary case this never fires. It exists for the two ways round
     that: an account created by Google *before* this screen existed, and
     anybody who closes the tab on the question and comes back later.

     Costs nothing — `user` is already in hand from the `getUser` above, and
     this is a property read on it. Public paths are excluded, which is what
     keeps `/login/peran` itself reachable rather than redirecting to itself. */
  if (user && !isPublic(pathname) && !hasChosenRole(user.user_metadata)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login/peran";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  /* ── The onboarding gate ────────────────────────────────────────────────
     A caregiver who is not yet looking after anybody gets exactly one screen.

     Only for caregivers, and only for pages they are not already allowed. The
     role comes off the token's metadata, which is already in hand from the
     `getUser` above — reading `profiles` instead would be a second database
     round trip on every navigation in the app, to answer a question that
     changes roughly never.

     Metadata can be stale or, for a Google account, absent. That is survivable
     in both directions: a patient mislabelled as a caregiver is asked to add
     somebody and can walk to `/pasien`, and a caregiver mislabelled as a
     patient is not gated here — `app/page.tsx` still sends them to `/mulai`.
     This layer is the net, not the only check. */
  if (user && !isPublic(pathname) && !allowedWhileOnboarding(pathname)) {
    const role = user.user_metadata?.role;
    const isCaregiver = role !== "patient" && role !== "pasien";

    if (isCaregiver) {
      /* `head: true` fetches no rows at all — this asks the database "is there
         at least one" and nothing more. RLS scopes it to their own side. */
      const { count } = await supabase
        .from("care_relationships")
        .select("id", { count: "exact", head: true })
        .eq("caregiver_id", user.id)
        .in("status", ["pending", "active"]);

      if ((count ?? 0) === 0) {
        const url = request.nextUrl.clone();
        url.pathname = "/mulai";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  /* Without a matcher this runs on static assets too, which would make every
     CSS and image request pay for a token check. The negative lookahead skips
     Next's internals, the auth callback (it manages its own cookies), and
     anything that looks like a file. */
  matcher: [
    "/((?!_next/static|_next/image|auth/callback|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};

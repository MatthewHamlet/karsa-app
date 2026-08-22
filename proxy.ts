import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./app/lib/supabase/config";

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

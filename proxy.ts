import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "./app/lib/supabase/config";
import { hasChosenRole } from "./app/lib/roles";

const PUBLIC_PREFIXES = ["/login", "/auth"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

const ONBOARDING_ALLOWED = [
  "/mulai",
  "/care/tambah-pasien",
  "/pair",
  "/pasien",
  "/community",
  "/settings",
  "/mascot",
];

function allowedWhileOnboarding(pathname: string): boolean {
  return ONBOARDING_ALLOWED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

const GATE_COOKIE = "karsa-gate";

const GATE_MAX_AGE = 600;

function passGate(response: NextResponse, userId: string) {
  response.cookies.set(GATE_COOKIE, userId, {
    maxAge: GATE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet)
          request.cookies.set(name, value);

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (!user) {
      return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
    }
    return response;
  }

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/")
      url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (user && !isPublic(pathname) && !hasChosenRole(user.user_metadata)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login/peran";
    url.search = "";
    if (pathname !== "/")
      url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (user && !isPublic(pathname) && !allowedWhileOnboarding(pathname)) {
    if (request.cookies.get(GATE_COOKIE)?.value === user.id) return response;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) return response;

    if (profile.role === "patient") {
      passGate(response, user.id);
      return response;
    }

    const { count, error: countError } = await supabase
      .from("care_relationships")
      .select("id", { count: "exact", head: true })
      .eq("caregiver_id", user.id)
      .in("status", ["pending", "active"]);

    if (countError || count === null) return response;

    if (count === 0) {
      const url = request.nextUrl.clone();
      url.pathname = "/mulai";
      url.search = "";
      return NextResponse.redirect(url);
    }

    passGate(response, user.id);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|auth/callback|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};

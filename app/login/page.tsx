import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginPage from "../section/LoginPage";
import { getUser } from "../lib/supabase/server";
import { isSupabaseConfigured } from "../lib/supabase/config";

export const metadata: Metadata = {
  title: "Masuk · Karsa",
  description: "Masuk ke akun Karsa untuk melanjutkan pendampingan hari ini.",
};

/** Rendered per request, never prerendered. Without this the page is static
 *  whenever the build runs without credentials — and it would then keep serving
 *  that build's logged-out HTML even after the keys are in place. */
export const dynamic = "force-dynamic";

export default async function Login({
  searchParams,
}: {
  /* A promise in this version of Next, and it has to be awaited — reading it as
     a plain object yields undefined with no error. */
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  /* Only same-site paths survive. This value ends up in a redirect, and letting
     an arbitrary URL through turns the login into a phishing hop. */
  const raw = params.next ?? "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  /* Skipped entirely until there are credentials, so the page still renders for
     design work before the backend exists. */
  const user = isSupabaseConfigured() ? await getUser() : null;

  /* Straight through, no "you are already signed in" stop-over. That screen was
     only ever scaffolding for testing the loop; for anyone else it is a door
     that opens onto another door. */
  if (user) redirect(next);

  return <LoginPage next={next} initialError={params.error ?? null} />;
}

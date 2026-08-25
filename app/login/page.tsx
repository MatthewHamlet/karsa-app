import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginPage from "../section/LoginPage";
import { getUser } from "../lib/supabase/server";
import { isSupabaseConfigured } from "../lib/supabase/config";

export const metadata: Metadata = {
  title: "Masuk · Karsa",
  description: "Masuk ke akun Karsa untuk melanjutkan pendampingan hari ini.",
};


export const dynamic = "force-dynamic";

export default async function Login({
  searchParams,
}: {

  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;


  const raw = params.next ?? "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";


  const user = isSupabaseConfigured() ? await getUser() : null;


  if (user) redirect(next);

  return <LoginPage next={next} initialError={params.error ?? null} />;
}

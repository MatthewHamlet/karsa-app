import type { Metadata } from "next";
import { redirect } from "next/navigation";
import RegisterPage from "../../section/RegisterPage";
import { getUser } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/config";

export const metadata: Metadata = {
  title: "Daftar · Karsa",
  description: "Buat akun Karsa untuk mulai mendampingi.",
};

export const dynamic = "force-dynamic";

export default async function Daftar() {
  if (isSupabaseConfigured() && (await getUser())) redirect("/");
  return <RegisterPage />;
}

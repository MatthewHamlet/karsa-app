import type { Metadata } from "next";
import { redirect } from "next/navigation";
import StartHere from "../section/StartHere";
import { getSessionProfile } from "../lib/profile";
import { getMyPatients } from "../lib/care/queries";
import { isSupabaseConfigured } from "../lib/supabase/config";

export const metadata: Metadata = {
  title: "Mulai · Karsa",
  description: "Tambahkan orang yang kamu dampingi untuk mulai memakai Karsa.",
};

export const dynamic = "force-dynamic";

export default async function Mulai() {
  if (!isSupabaseConfigured()) return <StartHere />;

  const me = await getSessionProfile();
  if (!me) redirect("/login?next=/mulai");

  const patients = await getMyPatients();
  if (patients.length > 0) redirect("/");

  return <StartHere name={me.fullName.split(" ")[0]} />;
}

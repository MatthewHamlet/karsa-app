import type { Metadata } from "next";
import { redirect } from "next/navigation";
import StartHere from "../section/StartHere";
import { getSessionProfile } from "../lib/profile";
import { getMyPatients } from "../lib/care/queries";
import { isSupabaseConfigured } from "../lib/supabase/config";
import { HOME_FOR } from "../lib/roles";

export const metadata: Metadata = {
  title: "Mulai · Karsa",
  description: "Tambahkan orang yang kamu dampingi untuk mulai memakai Karsa.",
};

export const dynamic = "force-dynamic";

export default async function Mulai() {
  if (!isSupabaseConfigured()) return <StartHere />;

  const me = await getSessionProfile();
  if (!me) redirect("/login?next=/mulai");

  /* halaman ini cuma buat pendamping. middleware gak nyaring di sini karena
     /mulai masuk ONBOARDING_ALLOWED (biar pendamping baru bisa masuk), jadi
     penyaringan perannya dilakukan di sini. */
  if (me.role === "patient") redirect(HOME_FOR.patient);

  const patients = await getMyPatients();
  if (patients.length > 0) redirect(HOME_FOR.caregiver);

  return <StartHere name={me.fullName.split(" ")[0]} />;
}

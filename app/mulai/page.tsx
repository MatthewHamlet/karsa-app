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

/** The onboarding gate's destination.
 *
 *  Also its own exit: a caregiver who already has somebody is sent on to the
 *  dashboard rather than being shown a screen asking them to start. Without
 *  that, pairing successfully in another tab would leave this one insisting
 *  they still had nobody. */
export default async function Mulai() {
  if (!isSupabaseConfigured()) return <StartHere />;

  const me = await getSessionProfile();
  if (!me) redirect("/login?next=/mulai");

  const patients = await getMyPatients();
  if (patients.length > 0) redirect("/");

  return <StartHere name={me.fullName.split(" ")[0]} />;
}

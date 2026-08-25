import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PatientCareTeam from "../../section/PatientCareTeam";
import { getMyCareTeam, getMyPatientRecord } from "../../lib/care/queries";
import { getSessionProfile } from "../../lib/profile";
import { isSupabaseConfigured } from "../../lib/supabase/config";

export const metadata: Metadata = {
  title: "Pendamping saya · Karsa",
  description: "Atur siapa yang boleh melihat data perawatanmu.",
};

export const dynamic = "force-dynamic";

export default async function Pendamping() {
  if (!isSupabaseConfigured()) return <PatientCareTeam team={[]} shareCode={null} />;

  if (!(await getSessionProfile())) redirect("/login?next=/pasien/pendamping");

  const [record, team] = await Promise.all([getMyPatientRecord(), getMyCareTeam()]);

  return <PatientCareTeam team={team} shareCode={record?.share_code ?? null} />;
}

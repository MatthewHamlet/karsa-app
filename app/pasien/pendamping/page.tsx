import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PatientCareTeam from "../../section/PatientCareTeam";
import { getCareMessages, getMyCareTeam, getMyPatientRecord } from "../../lib/care/queries";
import { getSessionProfile } from "../../lib/profile";
import { isSupabaseConfigured } from "../../lib/supabase/config";

export const metadata: Metadata = {
  title: "Pendamping saya · Karsa",
  description: "Atur siapa yang boleh melihat data perawatanmu.",
};

export const dynamic = "force-dynamic";

export default async function Pendamping() {
  if (!isSupabaseConfigured()) {
    return <PatientCareTeam team={[]} shareCode={null} patientId={null} me={null} messages={[]} />;
  }

  const me = await getSessionProfile();
  if (!me) redirect("/login?next=/pasien/pendamping");

  const [record, team] = await Promise.all([getMyPatientRecord(), getMyCareTeam()]);
  const patientId = record?.id ?? null;
  const messages = patientId ? await getCareMessages(patientId) : [];

  return (
    <PatientCareTeam
      team={team}
      shareCode={record?.share_code ?? null}
      patientId={patientId}
      me={{ id: me.id, name: me.fullName, initial: me.initial }}
      messages={messages}
    />
  );
}

import type { Metadata } from "next";
import PatientJournalPage from "../../section/PatientJournal";
import { getMyPatientRecord, hasJournaledToday } from "../../lib/care/queries";
import { getSessionProfile } from "../../lib/profile";
import { isSupabaseConfigured } from "../../lib/supabase/config";

export const metadata: Metadata = {
  title: "Jurnal Sehat · Karsa",
  description:
    "Catat perasaan, rekam cerita singkat, dan lihat riwayat hari-hari sebelumnya di kalender sehat.",
};

/** Reads the session, so it must not be cached across visitors. */
export const dynamic = "force-dynamic";

export default async function PatientJournal() {
  /* No keys or no session: the wizard still renders so the design is workable,
     it simply has no patient to write against. */
  if (!isSupabaseConfigured() || !(await getSessionProfile())) {
    return <PatientJournalPage />;
  }

  const record = await getMyPatientRecord();
  if (!record) return <PatientJournalPage />;

  const name = record.display_name;
  return (
    <PatientJournalPage
      patientId={record.id}
      patientName={name}
      initial={name.trim().charAt(0).toUpperCase() || "?"}
      filledToday={await hasJournaledToday(record.id)}
    />
  );
}

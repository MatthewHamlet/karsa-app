import type { Metadata } from "next";
import PatientJournalPage from "../../section/PatientJournal";
import {
  getJournalMonth,
  getMyPatientRecord,
  hasJournaledToday,
} from "../../lib/care/queries";
import { getSessionProfile } from "../../lib/profile";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { jakartaToday } from "../../lib/care/time";

export const metadata: Metadata = {
  title: "Jurnal Sehat · Karsa",
  description:
    "Catat perasaan, rekam cerita singkat, dan lihat riwayat hari-hari sebelumnya di kalender sehat.",
};

/** Reads the session, so it must not be cached across visitors.
 *
 *  It also has to be re-read after every save: the wizard writes through server
 *  actions that `revalidatePath`, and that is what puts today's entry into the
 *  calendar behind it without a reload. */
export const dynamic = "force-dynamic";

export default async function PatientJournal() {
  const today = jakartaToday();

  /* No keys or no session: the wizard still renders so the design is workable,
     it simply has no patient to write against and no month to read. */
  if (!isSupabaseConfigured() || !(await getSessionProfile())) {
    return <PatientJournalPage month={await getJournalMonth("", today.y, today.m)} />;
  }

  const record = await getMyPatientRecord();
  if (!record) {
    return <PatientJournalPage month={await getJournalMonth("", today.y, today.m)} />;
  }

  const name = record.display_name;
  const [month, filledToday] = await Promise.all([
    getJournalMonth(record.id, today.y, today.m),
    hasJournaledToday(record.id),
  ]);

  return (
    <PatientJournalPage
      patientId={record.id}
      patientName={name}
      initial={name.trim().charAt(0).toUpperCase() || "?"}
      filledToday={filledToday}
      month={month}
    />
  );
}

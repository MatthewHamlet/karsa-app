import type { Metadata } from "next";
import PatientJournalPage from "../../section/PatientJournal";

export const metadata: Metadata = {
  title: "Jurnal Sehat · Karsa",
  description:
    "Catat perasaan, rekam cerita singkat, dan lihat riwayat hari-hari sebelumnya di kalender sehat.",
};

export default function PatientJournal() {
  return <PatientJournalPage />;
}

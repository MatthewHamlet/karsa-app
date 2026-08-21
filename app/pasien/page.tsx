import type { Metadata } from "next";
import PatientDesktopDashboard from "../components/PatientDesktopDashboard";

export const metadata: Metadata = {
  title: "Karsa · Beranda Pasien",
  description:
    "Ruang Karsa untuk pasien: tugas harian, energi sehat, dan pesan dari pendamping.",
};

/** The patient app, kept on its own path. Everything under `/pasien` opts out
 *  of the caregiver rail and bottom bar — see the guard in `Sidebar`. */
export default function PatientHome() {
  return <PatientDesktopDashboard />;
}

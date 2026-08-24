import type { Metadata } from "next";
import ScanPrescriptionPage from "../section/ScanPrescription";
import { getMyPatients } from "../lib/care/queries";
import { getPrescriptions } from "../lib/scan/queries";
import { getSessionProfile } from "../lib/profile";
import { isSupabaseConfigured } from "../lib/supabase/config";

export const metadata: Metadata = {
  title: "Scan Resep · Karsa",
  description:
    "Foto resep dokter dan Karsa membaca obat, dosis, serta jadwal minumnya untuk dipasang ke jadwal perawatan.",
};

export const dynamic = "force-dynamic";

export default async function Scan() {
  if (!isSupabaseConfigured() || !(await getSessionProfile())) {
    return <ScanPrescriptionPage />;
  }

  const patients = await getMyPatients();
  const active = patients.find((p) => p.status === "active") ?? patients[0];
  if (!active) return <ScanPrescriptionPage />;

  return (
    <ScanPrescriptionPage
      patientId={active.patientId}
      patientName={active.displayName}
      history={await getPrescriptions(active.patientId)}
    />
  );
}

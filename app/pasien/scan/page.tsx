import type { Metadata } from "next";
import ScanPrescriptionPage from "../../section/ScanPrescription";
import { getMyPatientRecord } from "../../lib/care/queries";
import { getPrescriptions } from "../../lib/scan/queries";
import { getSessionProfile } from "../../lib/profile";
import { isSupabaseConfigured } from "../../lib/supabase/config";

export const metadata: Metadata = {
  title: "Scan Resep · Karsa",
  description:
    "Foto resep dokter dan Karsa membaca obat, dosis, serta jadwal minumnya untuk dipasang ke jadwal perawatan.",
};

export const dynamic = "force-dynamic";

export default async function PatientScan() {
  if (!isSupabaseConfigured() || !(await getSessionProfile())) {
    return <ScanPrescriptionPage />;
  }

  const record = await getMyPatientRecord();
  if (!record) return <ScanPrescriptionPage />;

  return (
    <ScanPrescriptionPage
      patientId={record.id}
      patientName={record.display_name}
      history={await getPrescriptions(record.id)}
    />
  );
}

import type { Metadata } from "next";
import ScanPrescriptionPage from "../../section/ScanPrescription";

export const metadata: Metadata = {
  title: "Scan Resep · Karsa",
  description:
    "Foto resep dokter dan Karsa membaca obat, dosis, serta jadwal minumnya untuk dipasang ke jadwal perawatan.",
};

/** The caregiver's scanner, unchanged. Reading a prescription is the same job
 *  from either side — and a patient standing at the pharmacy counter is often
 *  the one holding the paper. */
export default function PatientScan() {
  return <ScanPrescriptionPage />;
}

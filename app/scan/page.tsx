import type { Metadata } from "next";
import ScanPrescriptionPage from "../section/ScanPrescription";

export const metadata: Metadata = {
  title: "Scan Resep · Karsa",
  description:
    "Foto resep dokter dan Karsa membaca obat, dosis, serta jadwal minumnya untuk dipasang ke jadwal perawatan.",
};

export default function Scan() {
  return <ScanPrescriptionPage />;
}

import type { Metadata } from "next";
import CarePage from "../section/Care";

export const metadata: Metadata = {
  title: "Perawatan · Karsa",
  description: "Profil perawatan pasien: kebutuhan, informasi penting, dan tim perawatan.",
};

export default function Care() {
  return <CarePage />;
}

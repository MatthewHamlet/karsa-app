import type { Metadata } from "next";
import CarePage from "../section/Care";

export const metadata: Metadata = {
  title: "Perawatan · Karsa",
  description: "Profil perawatan pasien: statistik, aktivitas, dan obrolan tim.",
};

export default async function Care({ searchParams }: PageProps<"/care">) {
  return <CarePage params={await searchParams} />;
}

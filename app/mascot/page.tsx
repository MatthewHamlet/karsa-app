import type { Metadata } from "next";
import MascotAssistant from "../section/MascotAssistant";

export const metadata: Metadata = {
  title: "Maskot Karsa · Karsa",
  description:
    "Asisten pendamping Karsa: tanya apa saja soal perawatan, catat obat dan vital, atau minta bantuan darurat.",
};

export default function Mascot() {
  return <MascotAssistant />;
}

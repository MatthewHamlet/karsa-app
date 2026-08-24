import type { Metadata } from "next";
import MascotAssistant from "../section/MascotAssistant";
import { getMascotView } from "../lib/assistant/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arsa · Karsa",
  description:
    "Asisten pendamping Karsa: tanya apa saja soal perawatan, catat obat dan vital, atau minta bantuan darurat.",
};

export default async function Mascot() {
  const view = await getMascotView();
  return <MascotAssistant {...view} />;
}

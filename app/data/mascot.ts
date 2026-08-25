import type { Tone } from "../components/tones";


export type MascotState = "idle" | "thinking" | "presenting";

export type ActionCardKind = "medication" | "vitals" | "emergency" | "note";


export type ActionCard = {
  id: string;
  kind: ActionCardKind;
  tone: Tone;
  title: string;
  detail: string;

  meta?: string;
  cta: string;
};

export type Intent = "meds" | "vitals" | "tasks" | "urgent" | "general";

export const QUICK_ACTIONS: {
  intent: Intent;
  icon: "tasks" | "vitals" | "urgent";
  label: string;

  urgent?: boolean;
}[] = [
  { intent: "tasks", icon: "tasks", label: "Apa yang belum dikerjakan?" },
  { intent: "vitals", icon: "vitals", label: "Bagaimana kondisinya minggu ini?" },
  { intent: "urgent", icon: "urgent", label: "Butuh bantuan darurat", urgent: true },
];


export function promptFor(intent: Intent, patientName: string): string {
  const who = patientName.trim();

  if (!who) {
    switch (intent) {
      case "tasks":
        return "Rutinitas harian apa yang baik untuk lansia di rumah?";
      case "vitals":
        return "Apa saja yang sebaiknya rutin dipantau saat merawat orang tua?";
      case "urgent":
        return "Tanda bahaya apa yang harus segera dibawa ke IGD?";
      default:
        return "";
    }
  }

  switch (intent) {
    case "meds":
      return `Obat apa saja yang harus ${who} minum hari ini, dan jam berapa?`;
    case "tasks":
      return `Apa saja tugas harian ${who} yang belum dikerjakan hari ini?`;
    case "vitals":
      return `Bagaimana catatan kesehatan dan perasaan ${who} seminggu terakhir?`;
    case "urgent":
      return `${who} sedang tidak enak badan dan aku panik. Aku harus apa sekarang?`;
    default:
      return "";
  }
}

export function greetingFor(patientName: string, viewerName: string): string {
  const who = patientName.trim();
  const you = viewerName.trim().split(/\s+/)[0];

  if (!who) {
    return `Halo${you ? `, ${you}` : ""}. Aku Arsa. Tanya apa saja soal perawatan hari ini.`;
  }

  return `Halo${you ? `, ${you}` : ""}. Aku Arsa, dan aku ikut menemani ${who} hari ini. Tanya apa saja, atau pilih salah satu di bawah untuk mulai cepat.`;
}


export type HistorySession = {
  id: string;

  day: string;
  time: string;
  title: string;
  turns: { from: "me" | "karsa"; text: string }[];
};

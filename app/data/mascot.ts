import type { Tone } from "../components/tones";

/** What the mascot is doing right now. The page only ever moves
 *  idle → thinking → presenting → idle. */
export type MascotState = "idle" | "thinking" | "presenting";

export type ActionCardKind = "medication" | "vitals" | "emergency" | "note";

/** A card the mascot puts on the table in answer to something. It is an
 *  offer to do the next step, not a summary of what was said. */
export type ActionCard = {
  id: string;
  kind: ActionCardKind;
  tone: Tone;
  title: string;
  detail: string;
  /** The quiet line under the action — a time, a reading, a phone number. */
  meta?: string;
  cta: string;
};

export type Intent = "meds" | "vitals" | "tasks" | "urgent" | "general";

export const QUICK_ACTIONS: {
  intent: Intent;
  emoji: string;
  label: string;
  /** One button on this page is allowed to be red. */
  urgent?: boolean;
}[] = [
  { intent: "tasks", emoji: "✅", label: "Apa yang belum dikerjakan?" },
  { intent: "vitals", emoji: "🩺", label: "Bagaimana kondisinya minggu ini?" },
  { intent: "urgent", emoji: "🚨", label: "Butuh bantuan darurat", urgent: true },
];

/** What a quick action types into the box, addressed to the person the
 *  conversation is actually about. */
export function promptFor(intent: Intent, patientName: string): string {
  const who = patientName.trim() || "pasien";

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

  return `Halo${you ? `, ${you}` : ""}. Aku Arsa, dan aku ikut menemani ${who} hari ini — tanya apa saja, atau pilih salah satu di bawah untuk mulai cepat.`;
}

/** Sessions the caregiver has had with Karsa before. Each carries its whole
 *  thread, so reopening one restores the conversation rather than showing a
 *  summary of it — a caregiver looking up what they were told last Tuesday
 *  needs the words, not a title. */
export type HistorySession = {
  id: string;
  /** Grouping label, already resolved — the page does no date maths. */
  day: string;
  time: string;
  title: string;
  turns: { from: "me" | "karsa"; text: string }[];
};

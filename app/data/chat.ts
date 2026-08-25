

import { CARE_GROUP } from "./careStats";

export type Sender = (typeof CARE_GROUP.members)[number];

export const SENDERS = Object.fromEntries(
  CARE_GROUP.members.map((member) => [member.id, member]),
) as Record<string, Sender>;


export const ME = "matthew";

export type ChatMessage =
  | { kind: "text"; id: string; from: string; time: string; text: string }
  | {
      kind: "voice";
      id: string;
      from: string;
      time: string;

      length: number;

      wave: number[];
    }
  | {
      kind: "system";
      id: string;
      time: string;
      icon: "medication" | "meal" | "fluid" | "sleep" | "vital";
      text: string;
      detail?: string;
    };

export const CHAT_DAY = "Hari ini";

export const MESSAGES: ChatMessage[] = [
  {
    kind: "system",
    id: "s1",
    time: "05:30",
    icon: "sleep",
    text: "Meimei bangun tidur",
    detail: "Tidur 7 jam 20 menit",
  },
  {
    kind: "text",
    id: "m1",
    from: "sinta",
    time: "06:25",
    text: "Pagi semua. Meimei sudah bangun dan mood-nya bagus hari ini 🙂",
  },
  {
    kind: "system",
    id: "s2",
    time: "06:40",
    icon: "medication",
    text: "Meimei menyelesaikan Metformin 500 mg",
    detail: "Setelah sarapan · dosis 1 dari 3",
  },
  {
    kind: "text",
    id: "m2",
    from: "matthew",
    time: "06:52",
    text: "Syukurlah. Sarapannya habis nggak, Sin?",
  },
  {
    kind: "text",
    id: "m3",
    from: "sinta",
    time: "06:58",
    text: "Habis semua, bubur ayam. Nafsu makannya jauh lebih baik dari kemarin.",
  },
  {
    kind: "voice",
    id: "m4",
    from: "truman",
    time: "07:14",
    length: 32,
    wave: [
      0.3, 0.55, 0.8, 0.45, 0.9, 0.65, 0.35, 0.75, 1, 0.6, 0.4, 0.85, 0.5, 0.7, 0.3, 0.6,
      0.9, 0.45, 0.35, 0.8, 0.55, 0.25, 0.65, 0.4,
    ],
  },
  {
    kind: "system",
    id: "s3",
    time: "09:10",
    icon: "fluid",
    text: "Meimei minum 250 ml air",
    detail: "Total 1.500 ml dari 3.000 ml",
  },
  {
    kind: "text",
    id: "m5",
    from: "matthew",
    time: "09:30",
    text: "Sore nanti aku yang temani jalan ya. Jam 4 sekalian ke taman.",
  },
  {
    kind: "text",
    id: "m6",
    from: "sinta",
    time: "09:34",
    text: "Boleh. Jangan lupa obat malamnya jam 8 ya, Mat.",
  },
];

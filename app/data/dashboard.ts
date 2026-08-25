

export type Stamp = { y: number; m: number; d: number; hh: number; mm: number };

export const TODAY = { y: 2024, m: 8, d: 3 } as const;
export const NOW_TIME = "08:42";

export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];


export const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const pad = (n: number) => String(n).padStart(2, "0");

export const timeOf = (s: Stamp) => `${pad(s.hh)}:${pad(s.mm)}`;

export const isToday = (s: Stamp) =>
  s.y === TODAY.y && s.m === TODAY.m && s.d === TODAY.d;


export function whenOf(s: Stamp) {
  return isToday(s) ? timeOf(s) : `${s.d} ${MONTHS_SHORT[s.m]} · ${timeOf(s)}`;
}


export const dayKey = (y: number, m: number, d: number) => `${y}-${m}-${d}`;



export type Task = {
  id: string;
  label: string;
  hint?: string;
  done: boolean;
};

export const TASKS: Task[] = [
  { id: "walk", label: "Jalan pagi bersama Truman", hint: "Sebelum 09:00", done: true },
  { id: "breakfast", label: "Sarapan & obat pagi", hint: "07:00", done: true },
  { id: "bp", label: "Cek tekanan darah", hint: "Siang", done: false },
  { id: "refill", label: "Isi ulang obat", hint: "18:00", done: false },
  { id: "night-med", label: "Obat malam", hint: "20:00", done: false },
];



export type Activity = {
  id: string;
  actor: string;
  action: string;
  at: Stamp;
  tone: "care" | "health" | "meal";
};

export const ACTIVITIES: Activity[] = [
  {
    id: "a1",
    actor: "Truman",
    action: "menyiapkan sarapan",
    at: { y: 2024, m: 8, d: 3, hh: 6, mm: 20 },
    tone: "meal",
  },
  {
    id: "a2",
    actor: "Meimei",
    action: "mencatat tekanan darah 128/82",
    at: { y: 2024, m: 8, d: 3, hh: 6, mm: 5 },
    tone: "health",
  },
  {
    id: "a3",
    actor: "Sinta",
    action: "memindai kondisi kesehatan",
    at: { y: 2024, m: 8, d: 2, hh: 21, mm: 50 },
    tone: "health",
  },
  {
    id: "a4",
    actor: "Truman",
    action: "memberikan obat malam",
    at: { y: 2024, m: 8, d: 2, hh: 19, mm: 10 },
    tone: "care",
  },
  {
    id: "a5",
    actor: "Meimei",
    action: "mengajak jalan sore",
    at: { y: 2024, m: 8, d: 2, hh: 16, mm: 30 },
    tone: "care",
  },
];



export const SUMMARY = {
  label: "Kemarin",
  headline: "Kemarin berjalan cukup baik!",
  points: [
    "4 dari 5 tugas selesai",
    "Nafsu makan pasien lebih baik dari hari sebelumnya",
    "Obat dan makanan sudah tercatat lengkap",
  ],
};



export type ScheduleKind = "appointment" | "meds" | "therapy" | "checkup";

export type ScheduleEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  kind: ScheduleKind;
};

export const SCHEDULE: Record<string, ScheduleEvent[]> = {
  [dayKey(2024, 8, 3)]: [
    { id: "s1", title: "Janji temu dokter", start: "08:00", end: "12:00", kind: "appointment" },
    { id: "s2", title: "Isi ulang obat", start: "18:00", end: "19:00", kind: "meds" },
  ],
  [dayKey(2024, 8, 6)]: [
    { id: "s3", title: "Terapi fisik", start: "10:00", end: "11:30", kind: "therapy" },
  ],
  [dayKey(2024, 8, 12)]: [
    { id: "s4", title: "Kontrol rutin", start: "09:00", end: "10:00", kind: "checkup" },
  ],
  [dayKey(2024, 8, 20)]: [
    { id: "s5", title: "Cek darah", start: "07:30", end: "08:30", kind: "checkup" },
  ],
};




export type Patient = {
  id: string;
  name: string;
  relation: string;
  initial: string;
  color: string;

  note: string;
};

export const PATIENTS: Patient[] = [
  {
    id: "meimei",
    name: "Meimei",
    relation: "Ibu",
    initial: "M",
    color: "#56785d",
    note: "72 tahun · Diabetes tipe 2",
  },
  {
    id: "hadi",
    name: "Pak Hadi",
    relation: "Ayah",
    initial: "H",
    color: "#8a76bd",
    note: "76 tahun · Pasca-stroke",
  },
];

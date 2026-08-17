/** Mock data for the home dashboard.
 *
 *  Timestamps are stored as plain field objects rather than `Date`s on purpose:
 *  a real `Date` would be formatted in the server's timezone during SSR and in
 *  the browser's on hydration, which mismatches. Everything here is pure
 *  arithmetic on the fields, so both renders agree.
 *
 *  `TODAY` stands in for "now" until real data is wired up — swap it for the
 *  live clock and the labels below follow automatically. */

export type Stamp = { y: number; m: number; d: number; hh: number; mm: number };

export const TODAY = { y: 2024, m: 8, d: 3 } as const; // 3 September 2024
export const NOW_TIME = "08:42";

export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** Monday-first, matching the sketch. */
export const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const pad = (n: number) => String(n).padStart(2, "0");

export const timeOf = (s: Stamp) => `${pad(s.hh)}:${pad(s.mm)}`;

export const isToday = (s: Stamp) =>
  s.y === TODAY.y && s.m === TODAY.m && s.d === TODAY.d;

/** Activities only carry a clock. The date is added once a day has passed,
 *  so today's feed stays uncluttered. */
export function whenOf(s: Stamp) {
  return isToday(s) ? timeOf(s) : `${s.d} ${MONTHS_SHORT[s.m]} · ${timeOf(s)}`;
}

/** Key used to look schedules up by calendar day. */
export const dayKey = (y: number, m: number, d: number) => `${y}-${m}-${d}`;

/* ── Tasks ──────────────────────────────────────────────────────────────────
   Recurring, every-day things: meals, walks, medication, self check-ups. */

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

/* ── Activity ───────────────────────────────────────────────────────────────
   Things that already happened — a completed task, or something logged in
   the app. Newest first. */

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

/* ── Summary ────────────────────────────────────────────────────────────────
   AI recap of yesterday's activity. */

export const SUMMARY = {
  label: "Kemarin",
  headline: "Kemarin berjalan cukup baik!",
  points: [
    "4 dari 5 tugas selesai",
    "Nafsu makan pasien lebih baik dari hari sebelumnya",
    "Obat dan makanan sudah tercatat lengkap",
  ],
};

/* ── Schedule ───────────────────────────────────────────────────────────── */

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

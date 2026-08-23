/** The patient's journal: how a day felt, and how every day before it went.
 *
 *  Placeholders — this is a design pass. `HISTORY` is keyed by day-of-month for
 *  one month, which is all the calendar reads. */

/* ── Moods ──────────────────────────────────────────────────────────────────
   Re-exported from `./mood`, not defined here.

   This file used to carry its own four — segar, baik, pusing, sedih — drawn as
   emoji, while the caregiver's side of the same app used five drawn as
   `MoodFace`. Two problems came out of that, and only one of them was visual.

   The visual one: the patient tapped a yellow emoji and their caregiver read
   the result as a different face with a different name, so the two halves of a
   conversation about how somebody felt did not agree on the vocabulary.

   The real one: `mood_entries` accepts exactly `great | good | okay | low |
   verylow` and nothing else (migration 0006). None of the four words above is
   in that list, so a mood picked in this journal could not be written to the
   database at all — the form was a dead end by construction.

   One list now, shared by both. */
export type { MoodKey } from "./mood";
export { MOODS, MOOD_BY_KEY } from "./mood";

import type { MoodKey } from "./mood";
import { MONITOR_STATS, type MonitorKey, type StatTone } from "./careStats";

/** Each reading's colour, taken from the caregiver's stat cards rather than
 *  chosen again here. One table, so a shade changed for the dashboard changes
 *  in the journal too instead of the two drifting apart. */
export const MONITOR_TONE = Object.fromEntries(
  MONITOR_STATS.map((s) => [s.key, s.tone]),
) as Record<MonitorKey, StatTone>;

/** One day in the heatmap. `done`/`total` is the medicine ratio the detail
 *  panel prints; `complete` is what colours the square, and it is derived from
 *  those two rather than stored, so a green square can never disagree with the
 *  ratio underneath it. */
export type JournalDay = {
  mood: MoodKey;
  done: number;
  total: number;
  /** Seconds. Absent when nothing was recorded that day. */
  voice?: number;
  /** What the voice note said, in their own words. The report reads this out
   *  as a speech bubble — a duration alone tells a caregiver nothing. */
  story?: string;
  /* Readings, stored as numbers and formatted at the edge. Only what was
     actually measured that day is present. */
  glucose?: number;
  bp?: [number, number];
  weight?: number;
  temp?: number;
  hr?: number;
};

/** One tile in the report's metric row. */
/** One tile in the report's metric row.
 *
 *  `monitor` is the key of the caregiver's own illustration for this reading —
 *  see `MONITOR_ART` below. It replaced an `emoji` field: the two halves of the
 *  app were drawing the same blood pressure as 🩺 here and as a drawn cuff
 *  there, so a patient and their caregiver were looking at different pictures
 *  of the same number. */
export type DayMetric = {
  monitor: MonitorKey;
  label: string;
  value: string;
  unit: string;
};

/** Just the measured half of a day.
 *
 *  `dayMetrics` used to take a whole `JournalDay`, which tied it to the mock
 *  shape — the real one from the database has a nullable mood and would not
 *  fit. It only ever reads these five fields, so these five are what it asks
 *  for. */
export type DayReadings = {
  glucose?: number;
  bp?: [number, number];
  weight?: number;
  temp?: number;
  hr?: number;
};

/** Flattens a day's readings into the tiles the carousel shows, in a fixed
 *  order so the row never reshuffles between dates. */
export function dayMetrics(day: DayReadings): DayMetric[] {
  const out: DayMetric[] = [];
  if (day.glucose !== undefined)
    out.push({ monitor: "bloodSugar", label: "Gula Darah", value: String(day.glucose), unit: "mg/dL" });
  if (day.bp) out.push({ monitor: "bloodPressure", label: "Tensi", value: `${day.bp[0]}/${day.bp[1]}`, unit: "mmHg" });
  if (day.hr !== undefined)
    out.push({ monitor: "heartRate", label: "Detak Jantung", value: String(day.hr), unit: "bpm" });
  if (day.temp !== undefined)
    out.push({ monitor: "temperature", label: "Suhu", value: day.temp.toFixed(1), unit: "°C" });
  if (day.weight !== undefined)
    out.push({ monitor: "weight", label: "Berat", value: String(day.weight), unit: "kg" });
  return out;
}

export const MONTH_LABEL = "Agustus 2026";

/** Weekday of the 1st, Monday-first: 0 = Senin. August 2026 starts on a
 *  Saturday, so five blanks lead the grid. */
export const MONTH_START_OFFSET = 5;
export const MONTH_DAYS = 31;

export const HISTORY: Record<number, JournalDay> = {
  1: { mood: "good", done: 3, total: 3 },
  2: { mood: "great", done: 3, total: 3, voice: 24 },
  3: { mood: "good", done: 2, total: 3 },
  4: {
    mood: "low",
    done: 1,
    total: 3,
    voice: 41,
    story: "Kepala pusing dari pagi, tidak enak badan.",
    glucose: 142,
    bp: [148, 92],
  },
  5: { mood: "good", done: 3, total: 3, glucose: 108, bp: [126, 80] },
  /* Four readings on purpose: this is the day the carousel's arrows have to
     appear, and the one the sketch is drawn from. */
  6: {
    mood: "verylow",
    done: 1,
    total: 3,
    voice: 36,
    story: "Aku sangat sakit.",
    glucose: 110,
    bp: [120, 80],
    hr: 96,
    temp: 37.8,
  },
  7: { mood: "good", done: 3, total: 3, voice: 18, story: "Hari ini enak, sempat jalan pagi.", glucose: 104 },
  8: { mood: "verylow", done: 0, total: 3, bp: [138, 88] },
  9: { mood: "good", done: 2, total: 3 },
  10: { mood: "great", done: 3, total: 3 },
  11: { mood: "good", done: 3, total: 3 },
  12: { mood: "low", done: 1, total: 3, voice: 33 },
  13: { mood: "good", done: 3, total: 3 },
  14: { mood: "great", done: 3, total: 3 },
  15: { mood: "good", done: 2, total: 3 },
  16: { mood: "good", done: 3, total: 3 },
  17: { mood: "great", done: 3, total: 3, voice: 52 },
  18: { mood: "good", done: 3, total: 3 },
  19: { mood: "low", done: 2, total: 3 },
  20: { mood: "good", done: 3, total: 3 },
  21: { mood: "great", done: 3, total: 3 },
  22: { mood: "good", done: 1, total: 3 },
  23: {
    mood: "good",
    done: 3,
    total: 3,
    voice: 27,
    story: "Cucu datang sore tadi, senang sekali.",
    glucose: 106,
    bp: [124, 78],
    hr: 74,
  },
  24: { mood: "great", done: 3, total: 3, glucose: 99 },
  25: { mood: "good", done: 2, total: 3, bp: [130, 82] },
  26: { mood: "good", done: 3, total: 3, glucose: 112, bp: [122, 79], weight: 58 },
};

/** Today, in this placeholder month. Days after it are simply blank. */
export const TODAY_DATE = 26;

export const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/* ── Metrik kesehatan ─────────────────────────────────────────────────────── */

export type MetricKind = "bp" | "glucose" | "weight" | "temp" | "hr";

export type MetricSpec = {
  kind: MetricKind;
  /** The caregiver's illustration for this reading, so both sides of the app
   *  draw it the same way. */
  monitor: MonitorKey;
  label: string;
  unit: string;
  /** Stepper metrics only — blood pressure takes two typed numbers instead. */
  step?: number;
  initial?: number;
  /** How many decimals the stepper prints. Temperature needs one; the rest
   *  are whole numbers and a trailing ".0" only invites a misread. */
  decimals?: number;
};

export const METRICS: Record<MetricKind, MetricSpec> = {
  bp: { kind: "bp", monitor: "bloodPressure", label: "Tekanan Darah", unit: "mmHg" },
  glucose: {
    kind: "glucose",
    monitor: "bloodSugar",
    label: "Gula Darah",
    unit: "mg/dL",
    step: 5,
    initial: 110,
    decimals: 0,
  },
  weight: {
    kind: "weight",
    monitor: "weight",
    label: "Berat Badan",
    unit: "kg",
    step: 1,
    initial: 58,
    decimals: 0,
  },
  temp: {
    kind: "temp",
    monitor: "temperature",
    label: "Suhu Tubuh",
    unit: "°C",
    step: 0.1,
    initial: 36.6,
    decimals: 1,
  },
  hr: {
    kind: "hr",
    monitor: "heartRate",
    label: "Detak Jantung",
    unit: "bpm",
    step: 1,
    initial: 78,
    decimals: 0,
  },
};

/** On the card from the start — the two a caregiver is most often asked for. */
export const DEFAULT_METRICS: MetricKind[] = ["bp", "glucose"];

/** Offered by the add button, in the order the button's own caption lists. */
export const ADDABLE_METRICS: MetricKind[] = ["weight", "temp", "hr"];

export const mmss = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

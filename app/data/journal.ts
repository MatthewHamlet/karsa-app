/** The patient's journal: how a day felt, and how every day before it went.
 *
 *  Placeholders — this is a design pass. `HISTORY` is keyed by day-of-month for
 *  one month, which is all the calendar reads. */

export type MoodKey = "segar" | "baik" | "pusing" | "sedih";

export const MOODS: { key: MoodKey; emoji: string; label: string }[] = [
  { key: "segar", emoji: "😄", label: "Segar" },
  { key: "baik", emoji: "🙂", label: "Baik" },
  { key: "pusing", emoji: "😵‍💫", label: "Pusing" },
  { key: "sedih", emoji: "😢", label: "Sedih" },
];

export const MOOD_BY_KEY = Object.fromEntries(MOODS.map((m) => [m.key, m])) as Record<
  MoodKey,
  (typeof MOODS)[number]
>;

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
export type DayMetric = { emoji: string; label: string; value: string; unit: string };

/** Flattens a day's readings into the tiles the carousel shows, in a fixed
 *  order so the row never reshuffles between dates. */
export function dayMetrics(day: JournalDay): DayMetric[] {
  const out: DayMetric[] = [];
  if (day.glucose !== undefined)
    out.push({ emoji: "🩸", label: "Gula Darah", value: String(day.glucose), unit: "mg/dL" });
  if (day.bp) out.push({ emoji: "🩺", label: "Tensi", value: `${day.bp[0]}/${day.bp[1]}`, unit: "mmHg" });
  if (day.hr !== undefined)
    out.push({ emoji: "❤️", label: "Detak Jantung", value: String(day.hr), unit: "bpm" });
  if (day.temp !== undefined)
    out.push({ emoji: "🌡️", label: "Suhu", value: day.temp.toFixed(1), unit: "°C" });
  if (day.weight !== undefined)
    out.push({ emoji: "⚖️", label: "Berat", value: String(day.weight), unit: "kg" });
  return out;
}

export const MONTH_LABEL = "Agustus 2026";

/** Weekday of the 1st, Monday-first: 0 = Senin. August 2026 starts on a
 *  Saturday, so five blanks lead the grid. */
export const MONTH_START_OFFSET = 5;
export const MONTH_DAYS = 31;

export const HISTORY: Record<number, JournalDay> = {
  1: { mood: "baik", done: 3, total: 3 },
  2: { mood: "segar", done: 3, total: 3, voice: 24 },
  3: { mood: "baik", done: 2, total: 3 },
  4: {
    mood: "pusing",
    done: 1,
    total: 3,
    voice: 41,
    story: "Kepala pusing dari pagi, tidak enak badan.",
    glucose: 142,
    bp: [148, 92],
  },
  5: { mood: "baik", done: 3, total: 3, glucose: 108, bp: [126, 80] },
  /* Four readings on purpose: this is the day the carousel's arrows have to
     appear, and the one the sketch is drawn from. */
  6: {
    mood: "sedih",
    done: 1,
    total: 3,
    voice: 36,
    story: "Aku sangat sakit.",
    glucose: 110,
    bp: [120, 80],
    hr: 96,
    temp: 37.8,
  },
  7: { mood: "baik", done: 3, total: 3, voice: 18, story: "Hari ini enak, sempat jalan pagi.", glucose: 104 },
  8: { mood: "sedih", done: 0, total: 3, bp: [138, 88] },
  9: { mood: "baik", done: 2, total: 3 },
  10: { mood: "segar", done: 3, total: 3 },
  11: { mood: "baik", done: 3, total: 3 },
  12: { mood: "pusing", done: 1, total: 3, voice: 33 },
  13: { mood: "baik", done: 3, total: 3 },
  14: { mood: "segar", done: 3, total: 3 },
  15: { mood: "baik", done: 2, total: 3 },
  16: { mood: "baik", done: 3, total: 3 },
  17: { mood: "segar", done: 3, total: 3, voice: 52 },
  18: { mood: "baik", done: 3, total: 3 },
  19: { mood: "pusing", done: 2, total: 3 },
  20: { mood: "baik", done: 3, total: 3 },
  21: { mood: "segar", done: 3, total: 3 },
  22: { mood: "baik", done: 1, total: 3 },
  23: {
    mood: "baik",
    done: 3,
    total: 3,
    voice: 27,
    story: "Cucu datang sore tadi, senang sekali.",
    glucose: 106,
    bp: [124, 78],
    hr: 74,
  },
  24: { mood: "segar", done: 3, total: 3, glucose: 99 },
  25: { mood: "baik", done: 2, total: 3, bp: [130, 82] },
  26: { mood: "baik", done: 3, total: 3, glucose: 112, bp: [122, 79], weight: 58 },
};

/** Today, in this placeholder month. Days after it are simply blank. */
export const TODAY_DATE = 26;

export const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/* ── Metrik kesehatan ─────────────────────────────────────────────────────── */

export type MetricKind = "bp" | "glucose" | "weight" | "temp" | "hr";

export type MetricSpec = {
  kind: MetricKind;
  emoji: string;
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
  bp: { kind: "bp", emoji: "🩺", label: "Tekanan Darah", unit: "mmHg" },
  glucose: {
    kind: "glucose",
    emoji: "🩸",
    label: "Gula Darah",
    unit: "mg/dL",
    step: 5,
    initial: 110,
    decimals: 0,
  },
  weight: {
    kind: "weight",
    emoji: "⚖️",
    label: "Berat Badan",
    unit: "kg",
    step: 1,
    initial: 58,
    decimals: 0,
  },
  temp: {
    kind: "temp",
    emoji: "🌡️",
    label: "Suhu Tubuh",
    unit: "°C",
    step: 0.1,
    initial: 36.6,
    decimals: 1,
  },
  hr: {
    kind: "hr",
    emoji: "❤️",
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

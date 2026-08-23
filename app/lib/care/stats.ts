import { cache } from "react";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { getPatientDetail } from "./queries";
import { clockOf, jakartaMidnight, jakartaToday } from "./time";

/** The Care page's numbers, computed from the logs rather than typed out.
 *
 *  `app/data/careStats.ts` held these as literals — "1.500 ml dari 3.000 ml",
 *  "2 dari 3 dosis". Everything in here produces the same shapes from the rows
 *  in `health_readings`, `meal_logs`, `medication_logs` and `mood_entries`, so
 *  the cards keep their design and stop being fiction.
 *
 *  All aggregation happens in JavaScript, on rows already narrowed by patient
 *  and date. That is the right trade at this size — a month of one patient's
 *  logs is a few hundred rows — and it keeps the arithmetic somewhere it can be
 *  read, rather than in five SQL functions that have to be migrated to change a
 *  caption. If a patient ever has years of history behind one card, the fix is
 *  a materialised rollup, not a cleverer query here.
 *
 *  Formatting is done server-side and in `id-ID` on purpose: a component
 *  calling `toLocaleString` renders the host's locale during SSR and the
 *  visitor's on hydration, which mismatches. */

export type Period = "daily" | "weekly" | "monthly";

/** The shape every stat card reads. Matches the design's `StatValue`. */
export type StatValue = {
  /** The headline figure. */
  value: string;
  /** The quieter line under it. */
  caption: string;
  /** 0–100, for cards that show a fill. */
  progress?: number;
  /** Daily meals only. */
  meals?: { label: string; done: boolean }[];
};

export type FixedStatKey = "fluid" | "meals" | "medication" | "mood" | "sleep";

export type MonitorKey =
  | "bloodPressure"
  | "bloodSugar"
  | "oxygen"
  | "heartRate"
  | "temperature"
  | "weight";

/** How many days each period covers. Used both for the query window and as the
 *  divisor for the targets, so the two can never disagree. */
const DAYS: Record<Period, number> = { daily: 1, weekly: 7, monthly: 30 };

const PERIOD_WORD: Record<Period, string> = {
  daily: "hari ini",
  weekly: "minggu ini",
  monthly: "bulan ini",
};

/** The instant a period starts: midnight in Jakarta, `n - 1` days back. */
function windowStart(period: Period): Date {
  const today = jakartaToday();
  return jakartaMidnight({ ...today, d: today.d - (DAYS[period] - 1) });
}

const pct = (current: number, target: number) =>
  target <= 0 ? 0 : Math.min(100, Math.round((current / target) * 100));

/** `1.500`, `54,2` — Indonesian digit grouping, pinned to a locale so the
 *  server and the browser produce the same characters. */
const num = (value: number, decimals = 0) =>
  value.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const EMPTY: StatValue = { value: "—", caption: "belum ada data" };

/* ── Raw rows for a window ───────────────────────────────────────────────── */

type Reading = { kind: string; value: number; secondary: number | null; at: string };

/** Every reading in the window, in one query.
 *
 *  Deliberately not one query per card. Five cards over three periods is
 *  fifteen round trips for what is one narrow index scan — `health_readings`
 *  is already indexed on `(patient_id, kind, recorded_at desc)`, and the split
 *  by kind is cheaper in memory than on the wire. */
const readingsIn = cache(async (patientId: string, period: Period): Promise<Reading[]> => {
  if (!isSupabaseConfigured() || !patientId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("health_readings")
    .select("kind, value, value_secondary, recorded_at")
    .eq("patient_id", patientId)
    .gte("recorded_at", windowStart(period).toISOString())
    .order("recorded_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    kind: row.kind as string,
    value: Number(row.value),
    secondary: row.value_secondary === null ? null : Number(row.value_secondary),
    at: row.recorded_at as string,
  }));
});

const ofKind = (rows: Reading[], kind: string) => rows.filter((r) => r.kind === kind);
const mean = (values: number[]) =>
  values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;

/* ── The five fixed cards ────────────────────────────────────────────────── */

const MEALS: { key: string; label: string }[] = [
  { key: "sarapan", label: "Sarapan" },
  { key: "makan_siang", label: "Makan siang" },
  { key: "makan_malam", label: "Makan malam" },
];

const MOOD_LABEL: Record<string, string> = {
  great: "Senang sekali",
  good: "Senang",
  okay: "Biasa saja",
  low: "Kurang baik",
  verylow: "Sedih",
};

/** Minutes as "7 jam 20 mnt", which is how the card has always printed it. */
function hoursAndMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h} jam ${String(m).padStart(2, "0")} mnt`;
}

export const getFixedStats = cache(
  async (patientId: string, period: Period): Promise<Record<FixedStatKey, StatValue>> => {
    const blank = {
      fluid: EMPTY,
      meals: EMPTY,
      medication: EMPTY,
      mood: EMPTY,
      sleep: EMPTY,
    } satisfies Record<FixedStatKey, StatValue>;

    if (!isSupabaseConfigured() || !patientId) return blank;

    const supabase = await createClient();
    const since = windowStart(period).toISOString();
    const days = DAYS[period];

    const [patient, readings, mealRows, medRows, doseRows, moodRows] = await Promise.all([
      getPatientDetail(patientId),
      readingsIn(patientId, period),
      supabase
        .from("meal_logs")
        .select("meal")
        .eq("patient_id", patientId)
        .gte("logged_at", since),
      /* The denominator for medication: how many doses a day is supposed to
         have. Read from the schedule rather than assumed, because "2 dari 3"
         is meaningless if the 3 is a guess. */
      supabase
        .from("medications")
        .select("times")
        .eq("patient_id", patientId)
        .eq("active", true),
      supabase
        .from("medication_logs")
        .select("id")
        .eq("patient_id", patientId)
        .gte("logged_at", since),
      supabase
        .from("mood_entries")
        .select("mood, note, recorded_at")
        .eq("patient_id", patientId)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: false }),
    ]);

    /* ── Cairan ── */
    const fluidTotal = ofKind(readings, "fluid").reduce((sum, r) => sum + r.value, 0);
    const fluidTarget = (patient?.fluidTargetMl ?? 2000) * days;
    const fluid: StatValue =
      fluidTotal === 0
        ? { ...EMPTY, caption: `target ${num(fluidTarget)} ml`, progress: 0 }
        : period === "daily"
          ? {
              value: `${num(fluidTotal)} ml`,
              caption: `dari ${num(fluidTarget)} ml`,
              progress: pct(fluidTotal, fluidTarget),
            }
          : {
              value: `${num(fluidTotal / 1000, 1)} L`,
              caption: `dari ${num(fluidTarget / 1000, 1)} L`,
              progress: pct(fluidTotal, fluidTarget),
            };

    /* ── Makan ── */
    const logged = new Set((mealRows.data ?? []).map((row) => row.meal as string));
    const mealCount = (mealRows.data ?? []).length;
    const mealTarget = 3 * days;
    const meals: StatValue =
      period === "daily"
        ? {
            value: `${logged.size} dari 3`,
            caption: "makan hari ini",
            meals: MEALS.map((m) => ({ label: m.label, done: logged.has(m.key) })),
          }
        : {
            value: `${mealCount} dari ${mealTarget}`,
            caption: `makan ${PERIOD_WORD[period]}`,
            progress: pct(mealCount, mealTarget),
          };

    /* ── Obat ── */
    const slotsPerDay = (medRows.data ?? []).reduce(
      /* A medication with no times listed is still taken once a day — the
         schedule is optional, the dose is not. */
      (sum, row) => sum + Math.max(1, ((row.times as string[]) ?? []).length),
      0,
    );
    const doseTarget = slotsPerDay * days;
    const doseCount = (doseRows.data ?? []).length;
    const medication: StatValue =
      doseTarget === 0
        ? { value: "—", caption: "belum ada obat terdaftar" }
        : {
            value: `${doseCount} dari ${doseTarget}`,
            caption: `dosis ${PERIOD_WORD[period]}`,
            progress: pct(doseCount, doseTarget),
          };

    /* ── Perasaan ── */
    const moodList = moodRows.data ?? [];
    let mood: StatValue = { ...EMPTY, caption: "belum ada catatan perasaan" };
    if (moodList.length > 0) {
      if (period === "daily") {
        const latest = moodList[0];
        mood = {
          value: MOOD_LABEL[latest.mood as string] ?? (latest.mood as string),
          caption: latest.note ? `"${latest.note}"` : `dicatat ${clockOf(latest.recorded_at as string)}`,
        };
      } else {
        const tally = new Map<string, number>();
        for (const row of moodList) {
          tally.set(row.mood as string, (tally.get(row.mood as string) ?? 0) + 1);
        }
        const [top] = [...tally.entries()].sort((a, b) => b[1] - a[1]);
        mood = {
          value: MOOD_LABEL[top[0]] ?? top[0],
          caption: `paling sering ${PERIOD_WORD[period]}`,
        };
      }
    }

    /* ── Tidur ── */
    const sleepMinutes = ofKind(readings, "sleep_minutes").map((r) => r.value);
    const sleepAvg = mean(sleepMinutes);
    const sleep: StatValue =
      sleepAvg === null
        ? { ...EMPTY, caption: "belum ada catatan tidur" }
        : {
            value: hoursAndMinutes(period === "daily" ? sleepMinutes[0] : sleepAvg),
            caption: period === "daily" ? "semalam" : "rata-rata per malam",
            progress: pct(sleepAvg, patient?.sleepTargetMin ?? 480),
          };

    return { fluid, meals, medication, mood, sleep };
  },
);

/* ── Yesterday, in three lines ───────────────────────────────────────────── */

export type DaySummary = {
  label: string;
  headline: string;
  points: string[];
};

/** The recap card at the foot of Home.
 *
 *  Presented as "Ringkasan AI" in the design, and it is worth being honest
 *  about what it is: counting, not a model. Every line below is a fact the
 *  database already knows, phrased. That is a feature rather than a shortcut —
 *  a summary that can only ever say true things about somebody's mother is the
 *  right thing to put on this page, and the day a model writes this card it
 *  should be handed these same counts rather than left to infer them.
 *
 *  Yesterday rather than today, because a day still in progress always reads
 *  as a failure: at nine in the morning every count is near zero. */
export const getDaySummary = cache(async (patientId: string): Promise<DaySummary | null> => {
  if (!isSupabaseConfigured() || !patientId) return null;

  const today = jakartaToday();
  const start = jakartaMidnight({ ...today, d: today.d - 1 });
  const end = jakartaMidnight(today);
  const supabase = await createClient();

  const [tasks, done, meals, moods, readings] = await Promise.all([
    supabase
      .from("daily_tasks")
      .select("id")
      .eq("patient_id", patientId)
      .eq("active", true),
    supabase
      .from("task_completions")
      .select("id")
      .eq("patient_id", patientId)
      .gte("completed_at", start.toISOString())
      .lt("completed_at", end.toISOString()),
    supabase
      .from("meal_logs")
      .select("meal")
      .eq("patient_id", patientId)
      .gte("logged_at", start.toISOString())
      .lt("logged_at", end.toISOString()),
    supabase
      .from("mood_entries")
      .select("mood")
      .eq("patient_id", patientId)
      .gte("recorded_at", start.toISOString())
      .lt("recorded_at", end.toISOString()),
    supabase
      .from("health_readings")
      .select("id")
      .eq("patient_id", patientId)
      .gte("recorded_at", start.toISOString())
      .lt("recorded_at", end.toISOString()),
  ]);

  const taskTotal = (tasks.data ?? []).length;
  const taskDone = (done.data ?? []).length;
  const mealCount = (meals.data ?? []).length;
  const moodList = (moods.data ?? []).map((m) => m.mood as string);
  const readingCount = (readings.data ?? []).length;

  /* Nothing at all was logged. A card that says "0 dari 5 tugas selesai" about
     a day nobody opened the app is an accusation, not a summary — so it says
     what actually happened instead. */
  if (taskDone === 0 && mealCount === 0 && moodList.length === 0 && readingCount === 0) {
    return {
      label: "Kemarin",
      headline: "Belum ada catatan untuk kemarin.",
      points: [
        "Centang tugas harian supaya ringkasannya terisi",
        "Catatan makan dan obat ikut terhitung di sini",
      ],
    };
  }

  const ratio = taskTotal === 0 ? 0 : taskDone / taskTotal;
  const headline =
    ratio >= 0.8
      ? "Kemarin berjalan baik sekali!"
      : ratio >= 0.5
        ? "Kemarin berjalan cukup baik."
        : "Kemarin agak berat, tidak apa-apa.";

  const points: string[] = [];
  if (taskTotal > 0) points.push(`${taskDone} dari ${taskTotal} tugas selesai`);
  if (mealCount > 0) points.push(`${mealCount} dari 3 waktu makan tercatat`);
  if (moodList.length > 0) {
    const tally = new Map<string, number>();
    for (const m of moodList) tally.set(m, (tally.get(m) ?? 0) + 1);
    const [top] = [...tally.entries()].sort((a, b) => b[1] - a[1]);
    points.push(`Perasaannya paling sering "${MOOD_LABEL[top[0]] ?? top[0]}"`);
  }
  if (readingCount > 0) points.push(`${readingCount} catatan kesehatan ditambahkan`);

  return { label: "Kemarin", headline, points };
});

/* ── The six monitor cards ───────────────────────────────────────────────── */

/** Each card's database kind, unit, and how many decimals it is quoted to. */
const MONITOR: Record<
  MonitorKey,
  { kind: string; unit: string; decimals: number; dailyCaption: string }
> = {
  bloodPressure: { kind: "blood_pressure", unit: "mmHg", decimals: 0, dailyCaption: "mmHg" },
  bloodSugar: { kind: "blood_sugar", unit: "mg/dL", decimals: 0, dailyCaption: "mg/dL" },
  oxygen: { kind: "oxygen", unit: "SpO₂", decimals: 0, dailyCaption: "SpO₂" },
  heartRate: { kind: "heart_rate", unit: "bpm", decimals: 0, dailyCaption: "saat istirahat" },
  temperature: { kind: "temperature", unit: "°C", decimals: 1, dailyCaption: "terakhir diukur" },
  weight: { kind: "weight", unit: "kg", decimals: 1, dailyCaption: "terakhir ditimbang" },
};

/** The manual readings, per card.
 *
 *  Daily shows the most recent measurement and when it was taken — an average
 *  of one morning's blood pressure is just that morning's blood pressure, with
 *  the time thrown away. The longer periods show the mean, which is the only
 *  reading of a fortnight of numbers that means anything. */
export const getMonitorStats = cache(
  async (patientId: string, period: Period): Promise<Record<MonitorKey, StatValue>> => {
    const rows = await readingsIn(patientId, period);

    const entries = (Object.keys(MONITOR) as MonitorKey[]).map((key) => {
      const spec = MONITOR[key];
      const mine = ofKind(rows, spec.kind);
      if (mine.length === 0) return [key, EMPTY] as const;

      const compound = spec.kind === "blood_pressure";

      if (period === "daily") {
        const latest = mine[0];
        const value = compound
          ? `${num(latest.value, 0)}/${num(latest.secondary ?? 0, 0)}`
          : `${num(latest.value, spec.decimals)}${spec.unit === "SpO₂" ? "%" : ` ${spec.unit}`}`;
        return [
          key,
          { value, caption: `${spec.dailyCaption} · ${clockOf(latest.at)}` },
        ] as const;
      }

      const primary = mean(mine.map((r) => r.value)) ?? 0;
      const value = compound
        ? `${num(primary, 0)}/${num(mean(mine.map((r) => r.secondary ?? 0)) ?? 0, 0)}`
        : `${num(primary, spec.decimals)}${spec.unit === "SpO₂" ? "%" : ` ${spec.unit}`}`;

      return [
        key,
        { value, caption: `rata-rata ${PERIOD_WORD[period]} · ${mine.length} catatan` },
      ] as const;
    });

    return Object.fromEntries(entries) as Record<MonitorKey, StatValue>;
  },
);

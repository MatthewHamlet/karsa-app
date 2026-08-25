import { cache } from "react";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { getPatientDetail } from "./queries";
import { clockOf, jakartaMidnight, jakartaToday } from "./time";

export type Period = "daily" | "weekly" | "monthly";

export type StatValue = {
  value: string;
  caption: string;
  progress?: number;
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

const DAYS: Record<Period, number> = { daily: 1, weekly: 7, monthly: 30 };

const PERIOD_WORD: Record<Period, string> = {
  daily: "hari ini",
  weekly: "minggu ini",
  monthly: "bulan ini",
};

function windowStart(period: Period): Date {
  const today = jakartaToday();
  return jakartaMidnight({ ...today, d: today.d - (DAYS[period] - 1) });
}

const pct = (current: number, target: number) =>
  target <= 0 ? 0 : Math.min(100, Math.round((current / target) * 100));

const num = (value: number, decimals = 0) =>
  value.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const EMPTY: StatValue = { value: "—", caption: "belum ada data" };

type Reading = { kind: string; value: number; secondary: number | null; at: string };

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

    const slotsPerDay = (medRows.data ?? []).reduce(
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

export type DaySummary = {
  label: string;
  headline: string;
  points: string[];
};

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

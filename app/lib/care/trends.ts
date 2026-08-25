import { cache } from "react";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { jakartaMidnight, jakartaToday, MONTHS_SHORT } from "./time";
import type { PeriodDetail, Series, Compliance, DayStatus, Comparison } from "../../data/careTrends";
import { TREND_FORMAT, type FormatKey } from "../../data/trendFormats";
import type { MoodKey } from "../../data/mood";

export type TrendPeriod = "weekly" | "monthly";


export type SerialSeries = Omit<Series, "format"> & { formatKey: FormatKey };
export type SerialDetail = Omit<PeriodDetail, "series"> & { series?: SerialSeries };

const DAYS: Record<TrendPeriod, number> = { weekly: 7, monthly: 30 };

const WEEKDAY_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const num = (value: number, decimals = 0) =>
  value.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const asDuration = (minutes: number) => {
  const m = Math.round(minutes);
  return `${Math.floor(m / 60)}j ${String(m % 60).padStart(2, "0")}m`;
};

type Day = { key: string; label: string; start: Date; end: Date };


function daysOf(period: TrendPeriod): Day[] {
  const today = jakartaToday();
  const count = DAYS[period];

  return Array.from({ length: count }, (_, i) => {
    const offset = count - 1 - i;
    const start = jakartaMidnight({ ...today, d: today.d - offset });
    const end = jakartaMidnight({ ...today, d: today.d - offset + 1 });
    const at = new Date(start.getTime() + 12 * 3600_000);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    }).formatToParts(at);

    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const key = `${get("year")}-${get("month")}-${get("day")}`;
    const dayNum = Number(get("day"));
    const weekdayIndex = (new Date(`${key}T12:00:00+07:00`).getUTCDay() + 6) % 7;

    return {
      key,
      label: period === "weekly" ? WEEKDAY_SHORT[weekdayIndex] : String(dayNum),
      start,
      end,
    };
  });
}

function seriesFrom(
  days: Day[],
  valueByDay: Map<string, number>,
  formatKey: FormatKey,
  decimals = 0,
  secondaryByDay?: Map<string, number>,
): SerialSeries | undefined {
  const format = TREND_FORMAT[formatKey];
  const points = days.map((d) => ({
    label: d.label,
    value: valueByDay.get(d.key) ?? 0,
    secondary: secondaryByDay ? secondaryByDay.get(d.key) : undefined,
  }));

  const withData = days.filter((d) => valueByDay.has(d.key));
  if (withData.length === 0) return undefined;

  const values = withData.map((d) => valueByDay.get(d.key)!);
  const average = values.reduce((a, b) => a + b, 0) / values.length;

  const secondaries = secondaryByDay
    ? days.filter((d) => secondaryByDay.has(d.key)).map((d) => secondaryByDay.get(d.key)!)
    : [];
  const averageSecondary =
    secondaries.length > 0
      ? secondaries.reduce((a, b) => a + b, 0) / secondaries.length
      : undefined;

  return {
    points,
    average,
    averageSecondary,
    averageLabel: format(
      Number(average.toFixed(decimals)),
      averageSecondary === undefined ? undefined : Number(averageSecondary.toFixed(decimals)),
    ),
    formatKey,
  };
}

function complianceFrom(days: Day[], doneByDay: Map<string, number>, perDay: number): Compliance {
  const rows = days.map((d) => {
    const done = doneByDay.get(d.key) ?? 0;
    const status: DayStatus = done >= perDay ? "done" : done > 0 ? "partial" : "missed";
    return { label: d.label, status, done, target: perDay };
  });

  return {
    done: rows.reduce((sum, r) => sum + r.done, 0),
    target: perDay * days.length,
    days: rows,
  };
}


function compareHalves(
  days: Day[],
  valueByDay: Map<string, number>,
  unit: string,
  decimals = 0,
): Comparison | undefined {
  const withData = days.filter((d) => valueByDay.has(d.key));
  if (withData.length < 4) return undefined;

  const mid = Math.floor(withData.length / 2);
  const avg = (list: Day[]) =>
    list.reduce((sum, d) => sum + valueByDay.get(d.key)!, 0) / list.length;

  const delta = avg(withData.slice(mid)) - avg(withData.slice(0, mid));
  const rounded = Number(delta.toFixed(decimals));

  if (rounded === 0) return { text: `stabil, ${unit}`, direction: "flat" };

  return {
    text: `${rounded > 0 ? "+" : "−"}${num(Math.abs(rounded), decimals)} ${unit}`,
    direction: rounded > 0 ? "up" : "down",
  };
}

const READING_META: Record<
  string,
  { kind: string; chart: "line" | "dualLine"; unit: string; decimals: number; formatKey: FormatKey }
> = {
  bloodPressure: {
    kind: "blood_pressure",
    chart: "dualLine",
    unit: "mmHg sistolik",
    decimals: 0,
    formatKey: "mmHg",
  },
  bloodSugar: { kind: "blood_sugar", chart: "line", unit: "mg/dL", decimals: 0, formatKey: "mgdl" },
  oxygen: { kind: "oxygen", chart: "line", unit: "% SpO₂", decimals: 0, formatKey: "spo2" },
  heartRate: { kind: "heart_rate", chart: "line", unit: "bpm", decimals: 0, formatKey: "bpm" },
  temperature: { kind: "temperature", chart: "line", unit: "°C", decimals: 1, formatKey: "celsius" },
  weight: { kind: "weight", chart: "line", unit: "kg", decimals: 1, formatKey: "kg" },
};

export const getTrendDetail = cache(
  async (patientId: string, period: TrendPeriod): Promise<Record<string, SerialDetail>> => {
    if (!isSupabaseConfigured() || !patientId) return {};

    const days = daysOf(period);
    const from = days[0].start.toISOString();
    const supabase = await createClient();

    const [readings, meals, meds, moods, medCount] = await Promise.all([
      supabase
        .from("health_readings")
        .select("kind, value, value_secondary, recorded_at")
        .eq("patient_id", patientId)
        .gte("recorded_at", from),
      supabase.from("meal_logs").select("meal, done_on").eq("patient_id", patientId).gte("done_on", days[0].key),
      supabase
        .from("medication_logs")
        .select("taken_on")
        .eq("patient_id", patientId)
        .gte("taken_on", days[0].key),
      supabase
        .from("mood_entries")
        .select("mood, recorded_at")
        .eq("patient_id", patientId)
        .gte("recorded_at", from),
      supabase
        .from("medications")
        .select("times")
        .eq("patient_id", patientId)
        .eq("active", true),
    ]);

    const dayKeyOf = (iso: string) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(iso));

    const out: Record<string, SerialDetail> = {};


    const rows = readings.data ?? [];

    const sumByDay = (kind: string) => {
      const map = new Map<string, number>();
      for (const r of rows) {
        if (r.kind !== kind) continue;
        const k = dayKeyOf(r.recorded_at as string);
        map.set(k, (map.get(k) ?? 0) + Number(r.value));
      }
      return map;
    };

    const meanByDay = (kind: string, secondary = false) => {
      const acc = new Map<string, { sum: number; n: number }>();
      for (const r of rows) {
        if (r.kind !== kind) continue;
        const raw = secondary ? r.value_secondary : r.value;
        if (raw === null || raw === undefined) continue;
        const k = dayKeyOf(r.recorded_at as string);
        const cur = acc.get(k) ?? { sum: 0, n: 0 };
        acc.set(k, { sum: cur.sum + Number(raw), n: cur.n + 1 });
      }
      return new Map([...acc].map(([k, v]) => [k, v.sum / v.n]));
    };

    const fluid = sumByDay("fluid");
    const fluidSeries = seriesFrom(days, fluid, "ml");
    if (fluidSeries) {
      out.fluid = { chart: "bar", series: fluidSeries, comparison: compareHalves(days, fluid, "ml/hari") };
    }

    const sleep = sumByDay("sleep_minutes");
    const sleepSeries = seriesFrom(days, sleep, "duration");
    if (sleepSeries) {
      out.sleep = { chart: "bar", series: sleepSeries, comparison: compareHalves(days, sleep, "mnt tidur") };
    }


    const mealByDay = new Map<string, number>();
    for (const m of meals.data ?? []) {
      const k = String(m.done_on);
      mealByDay.set(k, (mealByDay.get(k) ?? 0) + 1);
    }
    out.meals = {
      chart: "compliance",
      compliance: complianceFrom(days, mealByDay, 3),
      comparison: compareHalves(days, mealByDay, "porsi"),
    };

    const dosesPerDay = (medCount.data ?? []).reduce(
      (sum, m) => sum + Math.max(1, ((m.times as string[]) ?? []).length),
      0,
    );
    const medByDay = new Map<string, number>();
    for (const m of meds.data ?? []) {
      const k = String(m.taken_on);
      medByDay.set(k, (medByDay.get(k) ?? 0) + 1);
    }
    out.medication = {
      chart: "compliance",
      compliance: complianceFrom(days, medByDay, Math.max(1, dosesPerDay)),
      comparison: compareHalves(days, medByDay, "dosis"),
    };


    const moodByDay = new Map<string, MoodKey>();
    for (const m of (moods.data ?? []).slice().sort((a, b) =>
      String(a.recorded_at).localeCompare(String(b.recorded_at)),
    )) {
      moodByDay.set(dayKeyOf(m.recorded_at as string), m.mood as MoodKey);
    }

    if (moodByDay.size > 0) {
      const moodDays = days.map((d) => ({
        label: d.label,
        mood: moodByDay.get(d.key) ?? ("okay" as MoodKey),
      }));
      const tally = days.reduce<Record<string, number>>((acc, d) => {
        const mood = moodByDay.get(d.key);
        if (mood) acc[mood] = (acc[mood] ?? 0) + 1;
        return acc;
      }, {});
      const [dominant, dominantDays] = Object.entries(tally).reduce(
        (best, entry) => (entry[1] > best[1] ? entry : best),
        ["okay", 0] as [string, number],
      );
      out.mood = {
        chart: "mood",
        mood: { dominant: dominant as MoodKey, dominantDays, days: moodDays },
      };
    }


    for (const [key, meta] of Object.entries(READING_META)) {
      const primary = meanByDay(meta.kind);
      const secondary = meta.chart === "dualLine" ? meanByDay(meta.kind, true) : undefined;
      const series = seriesFrom(days, primary, meta.formatKey, meta.decimals, secondary);
      if (!series) continue;
      out[key] = {
        chart: meta.chart,
        series,
        comparison: compareHalves(days, primary, meta.unit, meta.decimals),
      };
    }

    return out;
  },
);


export function monthShortOf(): string {
  return MONTHS_SHORT[jakartaToday().m];
}

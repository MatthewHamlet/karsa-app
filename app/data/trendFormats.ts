export type FormatKey =
  | "ml"
  | "duration"
  | "mmHg"
  | "mgdl"
  | "spo2"
  | "bpm"
  | "celsius"
  | "kg";

const id = (value: number, decimals = 0) =>
  value.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const duration = (minutes: number) => {
  const m = Math.round(minutes);
  return `${Math.floor(m / 60)}j ${String(m % 60).padStart(2, "0")}m`;
};

export const TREND_FORMAT: Record<FormatKey, (value: number, secondary?: number) => string> = {
  ml: (v) => `${id(v)} ml`,
  duration: (v) => duration(v),
  mmHg: (v, s) => (s === undefined ? `${id(v)} mmHg` : `${id(v)}/${id(s)} mmHg`),
  mgdl: (v) => `${id(v)} mg/dL`,
  spo2: (v) => `${id(v)}% SpO₂`,
  bpm: (v) => `${id(v)} bpm`,
  celsius: (v) => `${id(v, 1)} °C`,
  kg: (v) => `${id(v, 1)} kg`,
};

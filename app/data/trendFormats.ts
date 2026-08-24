/** How each metric prints one reading.
 *
 *  These are functions, and a function cannot cross the server-to-client
 *  boundary — React has to serialise what a Server Component hands down, and a
 *  closure has no serialisation. The mock trends got away with it by living in
 *  a module the client imported directly; real trends are computed on the
 *  server, so they travel as a key and the formatter is looked up here, on the
 *  side of the boundary that can hold one. */

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

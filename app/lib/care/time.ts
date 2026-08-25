export const TZ = "Asia/Jakarta";

export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export const DAYS_FULL = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
];

export type CalendarDay = { y: number; m: number; d: number };

export const dayKey = (y: number, m: number, d: number) => `${y}-${m}-${d}`;

const partsOf = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    y: get("year"),
    m: get("month") - 1,
    d: get("day"),
    hh: get("hour") % 24,
    mm: get("minute"),
  };
};

export function jakartaToday(now: Date = new Date()): CalendarDay {
  const { y, m, d } = partsOf(now);
  return { y, m, d };
}

export function jakartaDateString(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: TZ });
}

const pad = (n: number) => String(n).padStart(2, "0");

export function clockOf(iso: string | Date): string {
  const { hh, mm } = partsOf(typeof iso === "string" ? new Date(iso) : iso);
  return `${pad(hh)}:${pad(mm)}`;
}

export function calendarDayOf(iso: string | Date): CalendarDay {
  const { y, m, d } = partsOf(typeof iso === "string" ? new Date(iso) : iso);
  return { y, m, d };
}

export const sameDay = (a: CalendarDay, b: CalendarDay) =>
  a.y === b.y && a.m === b.m && a.d === b.d;

export function whenLabel(iso: string, today: CalendarDay = jakartaToday()): string {
  const day = calendarDayOf(iso);
  const time = clockOf(iso);
  return sameDay(day, today) ? time : `${day.d} ${MONTHS_SHORT[day.m]} · ${time}`;
}

export function longDateLabel(day: CalendarDay): string {
  const weekday = DAYS_FULL[new Date(day.y, day.m, day.d).getDay()];
  return `${weekday}, ${day.d} ${MONTHS[day.m]} ${day.y}`;
}

export function jakartaMidnight(day: CalendarDay): Date {
  return new Date(Date.UTC(day.y, day.m, day.d, -7, 0, 0));
}

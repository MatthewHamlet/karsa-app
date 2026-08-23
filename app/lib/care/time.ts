/** Time, in the one timezone this app is about.
 *
 *  Karsa is used in Indonesia and its database writes `Asia/Jakarta` dates
 *  (see the `done_on` defaults in migration 0005). The server renders in
 *  whatever timezone the host happens to be in — UTC on Vercel — and the
 *  browser re-renders in the visitor's. Formatting a `Date` in a component
 *  therefore produces two different strings for the same instant and React
 *  throws a hydration mismatch, which is why `app/data/dashboard.ts` went to
 *  the trouble of storing `{ y, m, d, hh, mm }` field objects instead.
 *
 *  The fix is to pick the timezone rather than inherit it. Everything here
 *  formats in `Asia/Jakarta` explicitly, so the two renders agree, and the
 *  queries hand components finished strings rather than instants.
 *
 *  No imports on purpose: client components read these too. */

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

/** A calendar day, timezone already resolved. The same shape the calendar and
 *  the schedule lookup have always spoken. */
export type CalendarDay = { y: number; m: number; d: number };

/** Key used to look schedules up by calendar day. Month is 0-based, matching
 *  `Date` and the calendar grid. */
export const dayKey = (y: number, m: number, d: number) => `${y}-${m}-${d}`;

/** `Intl` is the only thing in the platform that can answer "what is the wall
 *  clock in Jakarta right now" without shipping a timezone database. Formatting
 *  to parts and reading the numbers back is the standard way to use it as a
 *  conversion rather than as a display. */
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
    /* `Intl` counts months from 1, `Date` and the calendar grid from 0. */
    m: get("month") - 1,
    d: get("day"),
    hh: get("hour") % 24,
    mm: get("minute"),
  };
};

/** Today, in Jakarta. */
export function jakartaToday(now: Date = new Date()): CalendarDay {
  const { y, m, d } = partsOf(now);
  return { y, m, d };
}

/** `YYYY-MM-DD` in Jakarta — the form the `date` columns store. */
export function jakartaDateString(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: TZ });
}

const pad = (n: number) => String(n).padStart(2, "0");

/** `08:42`, in Jakarta. */
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

/** How the activity feed stamps a row: a bare clock while it is still today,
 *  and the date once a day has passed. Today's feed stays uncluttered and an
 *  older entry never pretends to be recent. */
export function whenLabel(iso: string, today: CalendarDay = jakartaToday()): string {
  const day = calendarDayOf(iso);
  const time = clockOf(iso);
  return sameDay(day, today) ? time : `${day.d} ${MONTHS_SHORT[day.m]} · ${time}`;
}

/** "Senin, 3 September 2024" — the line above the greeting. */
export function longDateLabel(day: CalendarDay): string {
  const weekday = DAYS_FULL[new Date(day.y, day.m, day.d).getDay()];
  return `${weekday}, ${day.d} ${MONTHS[day.m]} ${day.y}`;
}

/** Midnight in Jakarta on a given calendar day, as an instant.
 *
 *  Jakarta is a fixed +07:00 with no daylight saving, so the offset is a
 *  constant rather than something to look up for the date. Midnight there is
 *  17:00 UTC the day before, which is what the negative hour below says.
 *
 *  Built through `Date.UTC` rather than by formatting an ISO string, because
 *  every caller does arithmetic on the fields before handing them over —
 *  "thirty days ago" is `d: today.d - 29`, which on the 5th of a month is day
 *  −24. `Date.UTC` rolls that back into the previous month; the equivalent ISO
 *  string, `2026-08--24T00:00:00+07:00`, is simply an Invalid Date, and every
 *  window query built from it would silently return nothing. Month overflow
 *  works the same way, which is what lets the schedule ask for `m + 2`. */
export function jakartaMidnight(day: CalendarDay): Date {
  return new Date(Date.UTC(day.y, day.m, day.d, -7, 0, 0));
}

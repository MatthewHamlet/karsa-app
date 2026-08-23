import { cache } from "react";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { getSessionProfile } from "../profile";
import type { CarePatient, CareTeamMember, PatientStatus, RelationshipStatus } from "./types";
import {
  MONTHS_SHORT,
  calendarDayOf,
  clockOf,
  dayKey,
  jakartaDateString,
  jakartaMidnight,
  jakartaToday,
  whenLabel,
} from "./time";

/** Reads for the caregiver–patient relationship system.
 *
 *  Every query here filters by the signed-in user as well as relying on RLS.
 *  That is deliberate belt-and-braces: RLS is the thing that actually stops a
 *  caregiver reaching a patient they have no relationship with, and the filters
 *  are what stop a bug in *this* file quietly returning somebody else's row
 *  before RLS gets asked. Neither is a substitute for the other.
 *
 *  `cache` is per-request, so a layout and three components asking the same
 *  question in one render share one round trip. */

const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

/* Supabase's generated row types are not wired up yet, so the joined shapes are
   described here. Narrow and local on purpose — a wrong guess shows up as a
   type error at the mapping below rather than as `any` spreading outwards. */
type PatientRow = {
  id: string;
  display_name: string;
  date_of_birth: string | null;
  status: PatientStatus;
  /** Only ever selected for the patient's own row. It is what they read out to
     a caregiver, so it must not travel with a list of other people. */
  share_code?: string;
};
type CaregiverRow = { id: string; full_name: string | null };

/** Patients this caregiver is connected to, accepted or not.
 *
 *  Pending ones are included on purpose: the dashboard has to be able to say
 *  "menunggu persetujuan" rather than pretend the invitation was never sent.
 *  They carry no access — RLS refuses the care data behind them. */
export const getMyPatients = cache(async (): Promise<CarePatient[]> => {
  if (!isSupabaseConfigured()) return [];
  const me = await getSessionProfile();
  if (!me) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("care_relationships")
    .select(
      "id, status, relation, patient:patients!inner(id, display_name, date_of_birth, status)",
    )
    .eq("caregiver_id", me.id)
    /* Withdrawn and refused relationships are history, not a patient list. */
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.flatMap((row) => {
    /* PostgREST types an embedded row as an array even for a to-one join. */
    const p = (Array.isArray(row.patient) ? row.patient[0] : row.patient) as PatientRow | undefined;
    if (!p) return [];
    return [
      {
        relationshipId: row.id as string,
        patientId: p.id,
        displayName: p.display_name,
        initial: initialOf(p.display_name),
        relation: (row.relation as string | null) ?? null,
        dateOfBirth: p.date_of_birth,
        status: row.status as RelationshipStatus,
        patientStatus: p.status,
      },
    ];
  });
});

/** The patient row belonging to the signed-in user, if they have claimed one. */
export const getMyPatientRecord = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const me = await getSessionProfile();
  if (!me) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("id, display_name, date_of_birth, status, share_code")
    .eq("user_id", me.id)
    .maybeSingle();

  return (data as PatientRow | null) ?? null;
});

/** Who is asking to look after me, and who already does. */
export const getMyCareTeam = cache(async (): Promise<CareTeamMember[]> => {
  const record = await getMyPatientRecord();
  if (!record) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("care_relationships")
    .select(
      "id, status, relation, invited_at, caregiver:profiles!care_relationships_caregiver_id_fkey(id, full_name)",
    )
    .eq("patient_id", record.id)
    .in("status", ["pending", "active"])
    .order("invited_at", { ascending: false });

  if (error || !data) return [];

  return data.flatMap((row) => {
    const c = (Array.isArray(row.caregiver) ? row.caregiver[0] : row.caregiver) as
      | CaregiverRow
      | undefined;
    if (!c) return [];
    const name = c.full_name?.trim() || "Pendamping";
    return [
      {
        relationshipId: row.id as string,
        caregiverId: c.id,
        fullName: name,
        initial: initialOf(name),
        relation: (row.relation as string | null) ?? null,
        status: row.status as RelationshipStatus,
        invitedAt: row.invited_at as string,
      },
    ];
  });
});

export type DailyTask = {
  id: string;
  label: string;
  hint: string | null;
  done: boolean; // sudah completed hari ini?
};

/** Tugas harian pasien, plus status "sudah dicentang hari ini" — dua query
 *  join di JS daripada SQL supaya tetap kebaca; volumenya kecil per pasien. */
export const getTodayTasks = cache(async (patientId: string): Promise<DailyTask[]> => {
  const supabase = await createClient();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }); // YYYY-MM-DD

  const [{ data: tasks }, { data: done }] = await Promise.all([
    supabase
      .from("daily_tasks")
      .select("id, label, hint")
      .eq("patient_id", patientId)
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("task_completions")
      .select("task_id")
      .eq("patient_id", patientId)
      .eq("done_on", today),
  ]);

  const doneIds = new Set((done ?? []).map((d) => d.task_id));
  return (tasks ?? []).map((t) => ({ ...t, done: doneIds.has(t.id) }));
});

/** Satu jenis bacaan (tensi, gula, dst) dalam rentang tanggal, terbaru dulu. */
export async function getHealthReadings(
  patientId: string,
  kind: string,
  sinceDays: number,
) {
  const supabase = await createClient();
  const since = new Date(Date.now() - sinceDays * 86400_000).toISOString();

  const { data, error } = await supabase
    .from("health_readings")
    .select("value, value_secondary, recorded_at")
    .eq("patient_id", patientId)
    .eq("kind", kind)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true });

  if (error) return [];
  return data;
}
/** Unclaimed patient profiles created for this email address, so someone
 *  signing up can be offered "is this you?" instead of starting from nothing.
 *
 *  Not implemented as a lookup by email on purpose — `patients` holds no email,
 *  and adding one would let anybody probe for who is registered. Activation
 *  goes through an explicit invitation code instead; this is the hook that will
 *  read it. */
export async function getPendingActivationFor(_email: string): Promise<CarePatient[]> {
  return [];
}

/* ═══════════════════════════════════════════════════════════════════════════
   The rest of the dashboard
   ═══════════════════════════════════════════════════════════════════════════

   Everything below reads what migration 0007 added. Two conventions hold
   throughout:

   · Times come back as finished strings, formatted in Asia/Jakarta by
     `./time`. A component that formats a `Date` itself renders one string on
     the server and a different one in the browser — see the note in that file.

   · A query that cannot answer returns an empty list, never `null` and never a
     throw. Every one of these feeds a card that has to render for a caregiver
     whose patient was added this morning and has no history at all. */

/** Display names for a set of profile ids, resolved in one round trip.
 *
 *  The activity feed is a view, and PostgREST cannot embed across a view the
 *  way it does across a table's foreign key — there is no constraint for it to
 *  follow. So the ids are collected and looked up together rather than one
 *  query per row. */
async function namesFor(ids: (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name").in("id", unique);

  return new Map(
    (data ?? []).map((row) => [
      row.id as string,
      (row.full_name as string | null)?.trim() || "Seseorang",
    ]),
  );
}

/* ── Activity feed ───────────────────────────────────────────────────────── */

export type FeedKind = "task" | "reading" | "meal" | "medication" | "mood";

export type FeedItem = {
  id: string;
  kind: FeedKind;
  /** Who did it. "Sistem" when the row has no actor — an import, or a profile
   *  that has since been deleted. */
  actor: string;
  /** The sentence after the name: "menyiapkan sarapan". Built here rather than
   *  in the component, so the same wording is used everywhere it appears. */
  action: string;
  /** Already formatted: a clock today, a date and a clock before that. */
  when: string;
  /** For sorting and keys on the client, which must not re-derive the label. */
  at: string;
};

const MEAL_WORD: Record<string, string> = {
  sarapan: "sarapan",
  makan_siang: "makan siang",
  makan_malam: "makan malam",
};

const READING_WORD: Record<string, string> = {
  blood_pressure: "tekanan darah",
  blood_sugar: "gula darah",
  oxygen: "saturasi oksigen",
  heart_rate: "detak jantung",
  temperature: "suhu tubuh",
  weight: "berat badan",
  fluid: "asupan cairan",
  sleep_minutes: "durasi tidur",
};

const MOOD_WORD: Record<string, string> = {
  great: "senang sekali",
  good: "senang",
  okay: "biasa saja",
  low: "kurang baik",
  verylow: "sedih",
};

/** Turns one row of the union view into the sentence the feed prints. */
function phraseFor(row: { kind: string; title: string | null; detail: string | null }): string {
  const title = row.title ?? "";
  switch (row.kind) {
    case "task":
      return `menyelesaikan "${title}"`;
    case "meal":
      return `mencatat ${MEAL_WORD[title] ?? title}`;
    case "medication":
      return `memberikan ${title}${row.detail ? ` (${row.detail})` : ""}`;
    case "mood":
      return `merasa ${MOOD_WORD[title] ?? title}`;
    case "reading":
      return `mencatat ${READING_WORD[title] ?? title} ${row.detail ?? ""}`.trimEnd();
    default:
      return title;
  }
}

/** How the feed's icon is chosen. The view's five kinds collapse to the three
 *  tones the timeline draws. */
export const FEED_TONE: Record<FeedKind, "care" | "health" | "meal"> = {
  task: "care",
  reading: "health",
  meal: "meal",
  medication: "health",
  mood: "care",
};

/** Everything that has happened to this patient, newest first.
 *
 *  Reads `activity_feed`, the union view from 0007. The view runs as the caller
 *  and so is governed by the same RLS as the five tables it draws from — a
 *  caregiver with a pending invitation gets an empty list here, not a partial
 *  one. */
export const getActivityFeed = cache(
  async (patientId: string, limit = 8): Promise<FeedItem[]> => {
    if (!isSupabaseConfigured() || !patientId) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("activity_feed")
      .select("id, kind, title, detail, actor_id, occurred_at")
      .eq("patient_id", patientId)
      .order("occurred_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    const names = await namesFor(data.map((r) => r.actor_id as string | null));
    const today = jakartaToday();

    return data.map((row) => ({
      id: row.id as string,
      kind: row.kind as FeedKind,
      actor: names.get(row.actor_id as string) ?? "Sistem",
      action: phraseFor(row as { kind: string; title: string | null; detail: string | null }),
      when: whenLabel(row.occurred_at as string, today),
      at: row.occurred_at as string,
    }));
  },
);

/** How the feed's five kinds map onto the Perawatan page's five icons. Finer
 *  than `FEED_TONE` because that list has more room: a glass of water and a
 *  night's sleep are both "readings" to the timeline on Home, and their own
 *  icons here. */
export type ActivityIcon = "medication" | "meal" | "fluid" | "sleep" | "vital";

export type PatientActivityRow = {
  id: string;
  icon: ActivityIcon;
  /** The whole sentence, including who did it. */
  text: string;
  /** `06:40`, Jakarta. */
  time: string;
};

function iconFor(kind: string, title: string | null): ActivityIcon {
  if (kind === "medication") return "medication";
  if (kind === "meal") return "meal";
  if (title === "fluid") return "fluid";
  if (title === "sleep_minutes") return "sleep";
  return "vital";
}

/** A month of activity, keyed `dayKey(y, m, d)`. */
export type CarePatientActivityMap = Record<string, PatientActivityRow[]>;

/** A month of activity, bucketed by day, for the calendar inside the
 *  "lihat semua" modal on Perawatan.
 *
 *  Keyed `y-m-d` with a zero-based month, matching `dayKey` and the grid. */
export const getActivitiesByDate = cache(
  async (
    patientId: string,
    month: { y: number; m: number },
  ): Promise<CarePatientActivityMap> => {
    if (!isSupabaseConfigured() || !patientId) return {};

    const from = jakartaMidnight({ y: month.y, m: month.m, d: 1 });
    const to = jakartaMidnight({ y: month.y, m: month.m + 1, d: 1 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("activity_feed")
      .select("id, kind, title, detail, actor_id, occurred_at")
      .eq("patient_id", patientId)
      .gte("occurred_at", from.toISOString())
      .lt("occurred_at", to.toISOString())
      .order("occurred_at", { ascending: false });

    if (error || !data) return {};

    const names = await namesFor(data.map((r) => r.actor_id as string | null));
    const byDate: CarePatientActivityMap = {};

    for (const row of data) {
      const day = calendarDayOf(row.occurred_at as string);
      const actor = names.get(row.actor_id as string) ?? "Sistem";
      (byDate[dayKey(day.y, day.m, day.d)] ??= []).push({
        id: row.id as string,
        icon: iconFor(row.kind as string, row.title as string | null),
        text: `${actor} ${phraseFor(row as { kind: string; title: string | null; detail: string | null })}`,
        time: clockOf(row.occurred_at as string),
      });
    }

    return byDate;
  },
);

/* ── Schedule ────────────────────────────────────────────────────────────── */

export type ScheduleEntry = {
  id: string;
  title: string;
  kind: "appointment" | "meds" | "therapy" | "checkup";
  /** `08:00`, Jakarta. */
  start: string;
  /** The end time, or the start again when the event has no duration — the
   *  card prints a range, and an empty half reads as a rendering bug. */
  end: string;
};

/** The month's events, bucketed by calendar day.
 *
 *  Returned as a lookup rather than a list because that is the question the
 *  calendar asks: it has a grid of 42 days and needs to know, for each, whether
 *  anything is on. A window is fetched rather than the whole history — a
 *  patient of two years has hundreds of appointments, and the grid can show
 *  42 days of them. */
export const getScheduleByDay = cache(
  async (patientId: string, around = jakartaToday()): Promise<Record<string, ScheduleEntry[]>> => {
    if (!isSupabaseConfigured() || !patientId) return {};

    /* One month either side, so paging the calendar back or forward once does
       not land on a month that looks empty because it was never fetched. */
    const from = jakartaMidnight({ y: around.y, m: around.m - 1, d: 1 });
    const to = jakartaMidnight({ y: around.y, m: around.m + 2, d: 1 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("schedule_events")
      .select("id, title, kind, starts_at, ends_at")
      .eq("patient_id", patientId)
      .gte("starts_at", from.toISOString())
      .lt("starts_at", to.toISOString())
      .order("starts_at", { ascending: true });

    if (error || !data) return {};

    const byDay: Record<string, ScheduleEntry[]> = {};
    for (const row of data) {
      const day = calendarDayOf(row.starts_at as string);
      const key = dayKey(day.y, day.m, day.d);
      const start = clockOf(row.starts_at as string);
      (byDay[key] ??= []).push({
        id: row.id as string,
        title: row.title as string,
        kind: row.kind as ScheduleEntry["kind"],
        start,
        end: row.ends_at ? clockOf(row.ends_at as string) : start,
      });
    }
    return byDay;
  },
);

/* ── Standing care notes ─────────────────────────────────────────────────── */

export type CareNote = {
  id: string;
  body: string;
  /** "14 Agu" — when it last changed, for the history panel. */
  updatedLabel: string;
  updatedBy: string;
};

export const getCareNotes = cache(async (patientId: string): Promise<CareNote[]> => {
  if (!isSupabaseConfigured() || !patientId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("care_notes")
    .select("id, body, created_by, updated_at")
    .eq("patient_id", patientId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const names = await namesFor(data.map((r) => r.created_by as string | null));

  return data.map((row) => {
    const day = calendarDayOf(row.updated_at as string);
    return {
      id: row.id as string,
      body: row.body as string,
      updatedLabel: `${day.d} ${MONTHS_SHORT[day.m]}`,
      updatedBy: names.get(row.created_by as string) ?? "Tim perawatan",
    };
  });
});

/* ── Team chat ───────────────────────────────────────────────────────────── */

export type CareMessage = {
  id: string;
  authorId: string;
  author: string;
  initial: string;
  body: string;
  when: string;
  at: string;
  /** The care item this message was started from, if any. */
  context: { type: string; label: string; detail: string | null } | null;
};

export const getCareMessages = cache(
  async (patientId: string, limit = 60): Promise<CareMessage[]> => {
    if (!isSupabaseConfigured() || !patientId) return [];

    const supabase = await createClient();
    /* Newest `limit` rows, then flipped: `order desc + limit` is the only way
       to ask for the *end* of a conversation, but a chat reads oldest-first. */
    const { data, error } = await supabase
      .from("care_messages")
      .select("id, author_id, body, context_type, context_label, context_detail, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    const names = await namesFor(data.map((r) => r.author_id as string));
    const today = jakartaToday();

    return data
      .map((row) => {
        const author = names.get(row.author_id as string) ?? "Seseorang";
        return {
          id: row.id as string,
          authorId: row.author_id as string,
          author,
          initial: initialOf(author),
          body: row.body as string,
          when: whenLabel(row.created_at as string, today),
          at: row.created_at as string,
          context: row.context_type
            ? {
                type: row.context_type as string,
                label: (row.context_label as string | null) ?? "",
                detail: (row.context_detail as string | null) ?? null,
              }
            : null,
        };
      })
      .reverse();
  },
);

/* ── The care team, as the caregiver's page shows it ─────────────────────── */

export type CareGroupMember = {
  id: string;
  name: string;
  initial: string;
  /** Whether the invitation has been accepted. Pending members are listed —
   *  they are part of the plan — but marked. */
  active: boolean;
};

/** Everybody looking after this patient, including the person asking.
 *
 *  `getMyCareTeam` answers the same question from the patient's side, and only
 *  for their own record. This one is scoped by patient id, so a caregiver can
 *  see who else is on the team for someone they look after. */
export const getCareGroup = cache(
  async (patientId: string): Promise<{ members: CareGroupMember[]; since: string | null }> => {
    if (!isSupabaseConfigured() || !patientId) return { members: [], since: null };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("care_relationships")
      .select(
        "status, created_at, caregiver:profiles!care_relationships_caregiver_id_fkey(id, full_name)",
      )
      .eq("patient_id", patientId)
      .in("status", ["pending", "active"])
      .order("created_at", { ascending: true });

    if (error || !data) return { members: [], since: null };

    const members = data.flatMap((row) => {
      const c = (Array.isArray(row.caregiver) ? row.caregiver[0] : row.caregiver) as
        | CaregiverRow
        | undefined;
      if (!c) return [];
      const name = c.full_name?.trim() || "Pendamping";
      return [{ id: c.id, name, initial: initialOf(name), active: row.status === "active" }];
    });

    const first = data[0]?.created_at as string | undefined;
    const day = first ? calendarDayOf(first) : null;

    return {
      members,
      since: day ? `Dibuat ${day.d} ${MONTHS_SHORT[day.m]} ${day.y}` : null,
    };
  },
);

/* ── The patient record behind a dashboard ───────────────────────────────── */

export type PatientDetail = {
  id: string;
  displayName: string;
  dateOfBirth: string | null;
  fluidTargetMl: number;
  sleepTargetMin: number;
  notes: string | null;
  shareCode: string | null;
};

/** One patient in full, including the targets the stat cards divide by.
 *
 *  Separate from `getMyPatients`, which deliberately selects a narrow set for a
 *  list — a share code must never travel with a list of other people. */
export const getPatientDetail = cache(async (patientId: string): Promise<PatientDetail | null> => {
  if (!isSupabaseConfigured() || !patientId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("id, display_name, date_of_birth, fluid_target_ml, sleep_target_min, notes, share_code")
    .eq("id", patientId)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id as string,
    displayName: data.display_name as string,
    dateOfBirth: (data.date_of_birth as string | null) ?? null,
    fluidTargetMl: (data.fluid_target_ml as number) ?? 2000,
    sleepTargetMin: (data.sleep_target_min as number) ?? 480,
    notes: (data.notes as string | null) ?? null,
    shareCode: (data.share_code as string | null) ?? null,
  };
});

/* ── Medication ──────────────────────────────────────────────────────────── */

export type Medication = {
  id: string;
  name: string;
  dose: string;
  rule: string;
  times: string[];
  /** Which of `times` has already been logged today. */
  takenTimes: string[];
};

export const getMedications = cache(async (patientId: string): Promise<Medication[]> => {
  if (!isSupabaseConfigured() || !patientId) return [];

  const supabase = await createClient();
  const today = jakartaDateString();

  const [{ data: meds }, { data: logs }] = await Promise.all([
    supabase
      .from("medications")
      .select("id, name, dose, rule, times")
      .eq("patient_id", patientId)
      .eq("active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("medication_logs")
      .select("medication_id, scheduled_time")
      .eq("patient_id", patientId)
      .eq("taken_on", today),
  ]);

  const takenBy = new Map<string, string[]>();
  for (const log of logs ?? []) {
    const key = log.medication_id as string;
    takenBy.set(key, [...(takenBy.get(key) ?? []), (log.scheduled_time as string | null) ?? ""]);
  }

  return (meds ?? []).map((m) => ({
    id: m.id as string,
    name: m.name as string,
    dose: (m.dose as string) ?? "",
    rule: (m.rule as string) ?? "",
    times: (m.times as string[]) ?? [],
    takenTimes: takenBy.get(m.id as string) ?? [],
  }));
});

/* ── Mood ────────────────────────────────────────────────────────────────── */

export type MoodKey = "great" | "good" | "okay" | "low" | "verylow";

export type MoodEntryRow = {
  id: string;
  mood: MoodKey;
  note: string | null;
  when: string;
  at: string;
  /** The calendar day it belongs to, so the trend can bucket without
   *  re-parsing timestamps in the browser. */
  day: { y: number; m: number; d: number };
};

/** The mood log over a window, newest first.
 *
 *  One query rather than three: the trend, the tally and "how are they today"
 *  are three readings of the same rows, and splitting them into separate round
 *  trips only creates a window in which the three can disagree. */
export const getMoodLog = cache(
  async (patientId: string, days = 30): Promise<MoodEntryRow[]> => {
    if (!isSupabaseConfigured() || !patientId) return [];

    const since = new Date(Date.now() - days * 86400_000).toISOString();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("mood_entries")
      .select("id, mood, note, recorded_at")
      .eq("patient_id", patientId)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: false });

    if (error || !data) return [];
    const today = jakartaToday();

    return data.map((row) => ({
      id: row.id as string,
      mood: row.mood as MoodKey,
      note: (row.note as string | null) ?? null,
      when: whenLabel(row.recorded_at as string, today),
      at: row.recorded_at as string,
      day: calendarDayOf(row.recorded_at as string),
    }));
  },
);

/* ── The patient's own screen ────────────────────────────────────────────── */

/** A task as the patient sees it: an emoji, a line, and what it is worth.
 *
 *  The caregiver's version of the same row is a label and a hint. This is the
 *  same data dressed for a different reader — larger, warmer, and countable,
 *  because the energy bar is the only feedback this screen gives. */
export type PatientHomeTask = {
  id: string;
  emoji: string;
  title: string;
  detail: string;
  points: number;
  done: boolean;
};

/** Picks the emoji from the words in the task.
 *
 *  Derived rather than stored. Asking a caregiver to choose an icon while they
 *  are writing down "obat malam" is asking them to do design work in the middle
 *  of a care plan, and a column of emoji is a column that has to be migrated
 *  the first time the set changes. The matching is deliberately loose: getting
 *  it wrong costs a generic tick, which is what an unmatched task would have
 *  had anyway. */
const EMOJI_RULES: [RegExp, string][] = [
  [/obat|pil|tablet|vitamin/i, "💊"],
  [/sarapan|makan|nutrisi|bubur/i, "🍚"],
  [/minum|air|cairan|gelas/i, "🥤"],
  [/jalan|olahraga|senam|gerak/i, "🚶"],
  [/tidur|istirahat|rebah/i, "🛏️"],
  [/cek|tekanan|gula|ukur|timbang|periksa/i, "🩺"],
  [/mandi|bersih|gosok/i, "🧼"],
  [/telepon|hubungi|kabar|cerita/i, "📞"],
];

function emojiFor(label: string): string {
  for (const [pattern, emoji] of EMOJI_RULES) if (pattern.test(label)) return emoji;
  return "✅";
}

/** Every task is worth the same.
 *
 *  A weighting would mean somebody deciding that a walk matters twice as much
 *  as a glass of water, for every patient, in a table nobody can see. Equal
 *  points make the bar say exactly one thing — how much of today is done — and
 *  that is the only claim this screen is entitled to make. */
const POINTS_PER_TASK = 10;

export type PatientHome = {
  patientId: string;
  displayName: string;
  tasks: PatientHomeTask[];
  /** Points for a full day: every task, ticked. */
  energyTarget: number;
  /** The most recent thing a caregiver said, shown as a note on the bench.
   *  Null when the team has not written anything. */
  affirmation: { from: string; relation: string; text: string } | null;
};

/** Everything the patient's home screen needs, for whoever is signed in.
 *
 *  Returns `null` when the signed-in person has no patient record — a caregiver
 *  who navigated to `/pasien` by hand, or somebody who has not claimed a
 *  profile yet. The page turns that into a sign-post rather than a blank room. */
export const getPatientHome = cache(async (): Promise<PatientHome | null> => {
  if (!isSupabaseConfigured()) return null;

  const record = await getMyPatientRecord();
  if (!record) return null;

  const [tasks, messages] = await Promise.all([
    getTodayTasks(record.id),
    getCareMessages(record.id, 1),
  ]);

  const latest = messages.at(-1) ?? null;

  return {
    patientId: record.id,
    displayName: record.display_name,
    tasks: tasks.map((task) => ({
      id: task.id,
      emoji: emojiFor(task.label),
      title: task.label,
      detail: task.hint ?? "",
      points: POINTS_PER_TASK,
      done: task.done,
    })),
    /* Never zero: the bar divides by this, and a patient with no tasks yet
       would otherwise get `NaN%` across their whole screen. */
    energyTarget: Math.max(POINTS_PER_TASK, tasks.length * POINTS_PER_TASK),
    affirmation: latest
      ? { from: latest.author, relation: "Pendamping", text: latest.body }
      : null,
  };
});

/** Has this patient already written today's journal?
 *
 *  Asked of `mood_entries` rather than of a "journal entries" table, because
 *  the mood is the one step of the wizard that is not optional — a day with a
 *  reading but no mood was never finished.
 *
 *  Deliberately not a bar on writing again. A mood is a reading taken at a
 *  moment, and somebody who felt awful this morning and better tonight has two
 *  true things to record; this only decides which screen opens first. */
export const hasJournaledToday = cache(async (patientId: string): Promise<boolean> => {
  if (!isSupabaseConfigured() || !patientId) return false;

  const today = jakartaToday();
  const start = jakartaMidnight(today);
  const end = jakartaMidnight({ ...today, d: today.d + 1 });

  const supabase = await createClient();
  const { count } = await supabase
    .from("mood_entries")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientId)
    .gte("recorded_at", start.toISOString())
    .lt("recorded_at", end.toISOString());

  return (count ?? 0) > 0;
});

/* ── Meals ───────────────────────────────────────────────────────────────── */

export type MealKey = "sarapan" | "makan_siang" | "makan_malam";

export const MEAL_LABEL: Record<MealKey, string> = {
  sarapan: "Sarapan",
  makan_siang: "Makan siang",
  makan_malam: "Makan malam",
};

/** Which of today's three meals have been logged. */
export const getTodayMeals = cache(async (patientId: string): Promise<MealKey[]> => {
  if (!isSupabaseConfigured() || !patientId) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("meal_logs")
    .select("meal")
    .eq("patient_id", patientId)
    .eq("done_on", jakartaDateString());

  return (data ?? []).map((row) => row.meal as MealKey);
});

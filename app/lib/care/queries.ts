import { cache } from "react";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { getSessionProfile } from "../profile";
import type { CarePatient, CareTeamMember, PatientStatus, RelationshipStatus } from "./types";
import {
  MONTHS,
  MONTHS_SHORT,
  TZ,
  calendarDayOf,
  clockOf,
  dayKey,
  jakartaDateString,
  jakartaMidnight,
  jakartaToday,
  whenLabel,
} from "./time";



const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || "?";


type PatientRow = {
  id: string;
  display_name: string;
  date_of_birth: string | null;
  status: PatientStatus;

  share_code?: string;
};
type CaregiverRow = { id: string; full_name: string | null };


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
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.flatMap((row) => {

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


export const getMyCareTeam = cache(async (): Promise<CareTeamMember[]> => {
  const record = await getMyPatientRecord();
  if (!record) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("care_relationships")
    .select(
      "id, status, relation, invited_at, caregiver_id, caregiver:profiles!care_relationships_caregiver_id_fkey(id, full_name)",
    )
    .eq("patient_id", record.id)
    .in("status", ["pending", "active"])
    .order("invited_at", { ascending: false });

  if (error || !data) return [];


  return data.map((row) => {
    const c = (Array.isArray(row.caregiver) ? row.caregiver[0] : row.caregiver) as
      | CaregiverRow
      | undefined;
    const name = c?.full_name?.trim() || "Pendamping";
    return {
      relationshipId: row.id as string,
      caregiverId: c?.id ?? (row.caregiver_id as string) ?? "",
      fullName: name,
      initial: initialOf(name),
      relation: (row.relation as string | null) ?? null,
      status: row.status as RelationshipStatus,
      invitedAt: row.invited_at as string,
    };
  });
});

export type DailyTask = {
  id: string;
  label: string;
  hint: string | null;

  atTime: string | null;

  note: string | null;

  assigneeId: string | null;
  assigneeName: string | null;
  assigneeInitial: string | null;
  done: boolean;
};


export const getTodayTasks = cache(async (patientId: string): Promise<DailyTask[]> => {
  const supabase = await createClient();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  const [{ data: tasks }, { data: done }] = await Promise.all([
    supabase
      .from("daily_tasks")
      .select("id, label, hint, at_time, note, assignee_id")
      .eq("patient_id", patientId)
      .eq("active", true)
      .order("at_time", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true }),
    supabase
      .from("task_completions")
      .select("task_id")
      .eq("patient_id", patientId)
      .eq("done_on", today),
  ]);

  const doneIds = new Set((done ?? []).map((d) => d.task_id));

  const assigneeIds = [
    ...new Set((tasks ?? []).map((t) => t.assignee_id as string | null).filter(Boolean)),
  ] as string[];
  const names = assigneeIds.length > 0 ? await namesFor(assigneeIds) : new Map<string, string>();

  return (tasks ?? []).map((t) => {
    const assigneeId = (t.assignee_id as string | null) ?? null;
    const assigneeName = assigneeId ? (names.get(assigneeId) ?? "Seseorang") : null;

    return {
      id: t.id as string,
      label: t.label as string,
      hint: (t.hint as string | null) ?? null,

      atTime: t.at_time ? String(t.at_time).slice(0, 5) : null,
      note: (t.note as string | null) ?? null,
      assigneeId,
      assigneeName,
      assigneeInitial: assigneeName ? initialOf(assigneeName) : null,
      done: doneIds.has(t.id),
    };
  });
});


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

export async function getPendingActivationFor(_email: string): Promise<CarePatient[]> {
  return [];
}




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



export type FeedKind = "task" | "reading" | "meal" | "medication" | "mood";

export type FeedItem = {
  id: string;
  kind: FeedKind;

  actor: string;

  action: string;

  when: string;

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


export const FEED_TONE: Record<FeedKind, "care" | "health" | "meal"> = {
  task: "care",
  reading: "health",
  meal: "meal",
  medication: "health",
  mood: "care",
};


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


export type ActivityIcon = "medication" | "meal" | "fluid" | "sleep" | "vital";

export type PatientActivityRow = {
  id: string;
  icon: ActivityIcon;

  text: string;

  time: string;
};

function iconFor(kind: string, title: string | null): ActivityIcon {
  if (kind === "medication") return "medication";
  if (kind === "meal") return "meal";
  if (title === "fluid") return "fluid";
  if (title === "sleep_minutes") return "sleep";
  return "vital";
}


export type CarePatientActivityMap = Record<string, PatientActivityRow[]>;


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



export type ScheduleEntry = {
  id: string;
  title: string;
  kind: "appointment" | "meds" | "therapy" | "checkup";

  start: string;

  end: string;
};


export const getScheduleByDay = cache(
  async (patientId: string, around = jakartaToday()): Promise<Record<string, ScheduleEntry[]>> => {
    if (!isSupabaseConfigured() || !patientId) return {};


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



export type CareNote = {
  id: string;
  body: string;

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



export type CareMessage = {
  id: string;
  authorId: string;
  author: string;
  initial: string;
  body: string;
  when: string;
  at: string;

  context: { type: string; label: string; detail: string | null } | null;
};

export const getCareMessages = cache(
  async (patientId: string, limit = 60): Promise<CareMessage[]> => {
    if (!isSupabaseConfigured() || !patientId) return [];

    const supabase = await createClient();

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



export type CareGroupMember = {
  id: string;
  name: string;
  initial: string;

  active: boolean;
};


export const getCareGroup = cache(
  async (patientId: string): Promise<{ members: CareGroupMember[]; since: string | null }> => {
    if (!isSupabaseConfigured() || !patientId) return { members: [], since: null };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("care_relationships")
      .select(
        "status, created_at, caregiver_id, caregiver:profiles!care_relationships_caregiver_id_fkey(id, full_name)",
      )
      .eq("patient_id", patientId)
      .in("status", ["pending", "active"])
      .order("created_at", { ascending: true });

    if (error || !data) return { members: [], since: null };


    const members = data.map((row) => {
      const c = (Array.isArray(row.caregiver) ? row.caregiver[0] : row.caregiver) as
        | CaregiverRow
        | undefined;
      const name = c?.full_name?.trim() || "Pendamping";
      return {
        id: c?.id ?? (row.caregiver_id as string) ?? "",
        name,
        initial: initialOf(name),
        active: row.status === "active",
      };
    });

    const first = data[0]?.created_at as string | undefined;
    const day = first ? calendarDayOf(first) : null;

    return {
      members,
      since: day ? `Dibuat ${day.d} ${MONTHS_SHORT[day.m]} ${day.y}` : null,
    };
  },
);



export type PatientDetail = {
  id: string;
  displayName: string;
  dateOfBirth: string | null;
  fluidTargetMl: number;
  sleepTargetMin: number;
  notes: string | null;
  shareCode: string | null;
};


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



export type Medication = {
  id: string;
  name: string;
  dose: string;
  rule: string;
  times: string[];

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



export type MoodKey = "great" | "good" | "okay" | "low" | "verylow";

export type MoodEntryRow = {
  id: string;
  mood: MoodKey;
  note: string | null;
  when: string;
  at: string;

  day: { y: number; m: number; d: number };
};


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




export type PatientHomeTask = {
  id: string;
  emoji: string;
  title: string;
  detail: string;
  points: number;
  done: boolean;
};


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


const POINTS_PER_TASK = 10;

export type PatientHome = {
  patientId: string;
  displayName: string;
  tasks: PatientHomeTask[];

  energyTarget: number;

  affirmation: { from: string; relation: string; text: string } | null;
};


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

    energyTarget: Math.max(POINTS_PER_TASK, tasks.length * POINTS_PER_TASK),
    affirmation: latest
      ? { from: latest.author, relation: "Pendamping", text: latest.body }
      : null,
  };
});


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




export type JournalDayData = {
  mood: MoodKey | null;

  done: number;
  total: number;

  story: string | null;

  voice?: number;
  voiceUrl?: string;
  glucose?: number;
  bp?: [number, number];
  weight?: number;
  temp?: number;
  hr?: number;
};

export type JournalMonth = {
  year: number;

  month: number;
  label: string;
  days: number;

  startOffset: number;

  today: number | null;
  entries: Record<number, JournalDayData>;
};


const JOURNAL_READING: Record<string, keyof JournalDayData> = {
  blood_sugar: "glucose",
  weight: "weight",
  temperature: "temp",
  heart_rate: "hr",
};


export const getJournalMonth = cache(
  async (patientId: string, year: number, month: number): Promise<JournalMonth> => {
    const days = new Date(year, month + 1, 0).getDate();
    const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const now = jakartaToday();
    const shell: JournalMonth = {
      year,
      month,
      label: `${MONTHS[month]} ${year}`,
      days,
      startOffset,
      today: now.y === year && now.m === month ? now.d : null,
      entries: {},
    };

    if (!isSupabaseConfigured() || !patientId) return shell;

    const from = jakartaMidnight({ y: year, m: month, d: 1 });
    const to = jakartaMidnight({ y: year, m: month + 1, d: 1 });
    const supabase = await createClient();

    const [{ data: moods }, { data: readings }, { data: completions }, { data: tasks }] =
      await Promise.all([
        supabase
          .from("mood_entries")
          .select("mood, note, recorded_at, voice_path, voice_seconds")
          .eq("patient_id", patientId)
          .gte("recorded_at", from.toISOString())
          .lt("recorded_at", to.toISOString())
          .order("recorded_at", { ascending: false }),
        supabase
          .from("health_readings")
          .select("kind, value, value_secondary, recorded_at")
          .eq("patient_id", patientId)
          .gte("recorded_at", from.toISOString())
          .lt("recorded_at", to.toISOString())
          .order("recorded_at", { ascending: false }),
        supabase
          .from("task_completions")
          .select("done_on")
          .eq("patient_id", patientId)
          .gte("done_on", from.toLocaleDateString("en-CA", { timeZone: TZ }))
          .lt("done_on", to.toLocaleDateString("en-CA", { timeZone: TZ })),
        supabase
          .from("daily_tasks")
          .select("id")
          .eq("patient_id", patientId)
          .eq("active", true),
      ]);


    const total = (tasks ?? []).length;
    const entries: Record<number, JournalDayData> = {};
    const voicePaths: { day: number; path: string }[] = [];

    const dayOf = (n: number): JournalDayData =>
      (entries[n] ??= { mood: null, done: 0, total, story: null });


    for (const row of moods ?? []) {
      const d = calendarDayOf(row.recorded_at as string).d;
      const entry = dayOf(d);
      if (entry.mood === null) {
        entry.mood = row.mood as MoodKey;
        entry.story = (row.note as string | null)?.trim() || null;
        const path = row.voice_path as string | null;
        if (path) {
          entry.voice = (row.voice_seconds as number | null) ?? undefined;
          voicePaths.push({ day: d, path });
        }
      }
    }

    for (const row of readings ?? []) {
      const d = calendarDayOf(row.recorded_at as string).d;
      const entry = dayOf(d);
      const kind = row.kind as string;

      if (kind === "blood_pressure") {
        if (entry.bp === undefined && row.value_secondary !== null) {
          entry.bp = [Number(row.value), Number(row.value_secondary)];
        }
        continue;
      }

      const field = JOURNAL_READING[kind];
      if (field && entry[field] === undefined) {

        (entry as Record<string, unknown>)[field] = Number(row.value);
      }
    }

    for (const row of completions ?? []) {

      const d = Number((row.done_on as string).slice(-2));
      if (Number.isFinite(d)) dayOf(d).done += 1;
    }

    if (voicePaths.length > 0) {
      const { data: signed } = await supabase.storage
        .from("voices")
        .createSignedUrls(voicePaths.map((v) => v.path), 3600);

      (signed ?? []).forEach((item, i) => {
        if (item.signedUrl) entries[voicePaths[i].day].voiceUrl = item.signedUrl;
      });
    }

    return { ...shell, entries };
  },
);



export type MealKey = "sarapan" | "makan_siang" | "makan_malam";

export const MEAL_LABEL: Record<MealKey, string> = {
  sarapan: "Sarapan",
  makan_siang: "Makan siang",
  makan_malam: "Makan malam",
};


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


export async function getInvitablePatients(
  profileId: string,
): Promise<{ id: string; name: string }[]> {
  if (!isSupabaseConfigured() || !profileId) return [];
  const me = await getSessionProfile();
  if (!me || profileId === me.id) return [];

  const supabase = await createClient();

  const { data: mine } = await supabase
    .from("care_relationships")
    .select("patient_id, patients(id, display_name)")
    .eq("caregiver_id", me.id)
    .eq("status", "active");

  const ids = (mine ?? []).map((r) => r.patient_id as string);
  if (ids.length === 0) return [];

  const [{ data: theirs }, { data: asked }] = await Promise.all([
    supabase
      .from("care_relationships")
      .select("patient_id")
      .eq("caregiver_id", profileId)
      .in("patient_id", ids)
      .in("status", ["pending", "active"]),
    supabase
      .from("care_team_invites")
      .select("patient_id")
      .eq("invitee_id", profileId)
      .in("patient_id", ids)
      .eq("status", "pending"),
  ]);

  const taken = new Set([
    ...(theirs ?? []).map((r) => r.patient_id as string),
    ...(asked ?? []).map((r) => r.patient_id as string),
  ]);

  return (mine ?? [])
    .filter((row) => !taken.has(row.patient_id as string))
    .map((row) => {
      const patient = row.patients as unknown as { id: string; display_name: string } | null;
      return {
        id: row.patient_id as string,
        name: patient?.display_name ?? "Pasien",
      };
    });
}


export type CareInvite = {
  id: string;
  patientName: string;
  fromName: string;
  when: string;
};

export const getMyCareInvites = cache(async (): Promise<CareInvite[]> => {
  if (!isSupabaseConfigured()) return [];
  const me = await getSessionProfile();
  if (!me) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("care_team_invites")
    .select("id, created_at, invited_by, patients(display_name)")
    .eq("invitee_id", me.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!data?.length) return [];

  const names = await namesFor(data.map((r) => r.invited_by as string));
  const today = jakartaToday();

  return data.map((row) => {
    const patient = row.patients as unknown as { display_name: string } | null;
    return {
      id: row.id as string,
      patientName: patient?.display_name ?? "Pasien",
      fromName: names.get(row.invited_by as string) ?? "Seseorang",
      when: whenLabel(row.created_at as string, today),
    };
  });
});

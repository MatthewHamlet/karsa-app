import { cache } from "react";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { getSessionProfile } from "../profile";
import { getMyPatientRecord, getMyPatients } from "../care/queries";
import { MONTHS, calendarDayOf, clockOf, dayKey, jakartaToday } from "../care/time";

export type AssistantTurn = { from: "me" | "karsa"; text: string };

export type AssistantThread = {
  id: string;
  day: string;
  time: string;
  title: string;
  turns: AssistantTurn[];
};

const THREAD_LIMIT = 30;

const keyOf = (day: { y: number; m: number; d: number }) => dayKey(day.y, day.m, day.d);

function dayLabel(iso: string): string {
  const stamp = calendarDayOf(iso);

  if (keyOf(stamp) === keyOf(jakartaToday())) return "Hari ini";
  if (keyOf(stamp) === keyOf(jakartaToday(new Date(Date.now() - 86400_000)))) {
    return "Kemarin";
  }

  return `${stamp.d} ${MONTHS[stamp.m]}`;
}

export type MascotView = {
  patientName: string;
  patientAge: number | null;
  viewerName: string;
  alerts: string[];
  history: AssistantThread[];
  ready: boolean;
};

function ageOf(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;

  const born = calendarDayOf(`${dateOfBirth}T00:00:00+07:00`);
  const today = jakartaToday();
  const years =
    today.y - born.y - (today.m < born.m || (today.m === born.m && today.d < born.d) ? 1 : 0);

  return years >= 0 && years < 130 ? years : null;
}

export const getMascotView = cache(async (): Promise<MascotView> => {
  const empty: MascotView = {
    patientName: "",
    patientAge: null,
    viewerName: "",
    alerts: [],
    history: [],
    ready: false,
  };

  if (!isSupabaseConfigured()) return empty;

  const me = await getSessionProfile();
  if (!me) return empty;

  const supabase = await createClient();

  let patientId: string | null = null;
  let patientName = "";
  let dateOfBirth: string | null = null;

  if (me.role === "patient") {
    const record = await getMyPatientRecord();
    if (record) {
      patientId = record.id;
      patientName = record.display_name;
      dateOfBirth = record.date_of_birth;
    }
  } else {
    const patients = await getMyPatients();
    const active = patients.find((p) => p.status === "active") ?? patients[0];
    if (active) {
      patientId = active.patientId;
      patientName = active.displayName;
      dateOfBirth = active.dateOfBirth;
    }
  }

  if (!patientId) {
    return { ...empty, viewerName: me.fullName, history: await getAssistantThreads(), ready: true };
  }

  const [notes, history] = await Promise.all([
    supabase
      .from("care_notes")
      .select("body")
      .eq("patient_id", patientId)
      .order("sort_order", { ascending: true })
      .limit(6),
    getAssistantThreads(),
  ]);

  return {
    patientName,
    patientAge: ageOf(dateOfBirth),
    viewerName: me.fullName,
    alerts: (notes.data ?? []).map((n) => n.body as string),
    history,
    ready: true,
  };
});

export const getAssistantThreads = cache(async (): Promise<AssistantThread[]> => {
  if (!isSupabaseConfigured()) return [];

  const me = await getSessionProfile();
  if (!me) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assistant_threads")
    .select("id, title, created_at, assistant_messages (role, body, created_at)")
    .eq("owner_id", me.id)
    .order("updated_at", { ascending: false })
    .limit(THREAD_LIMIT);

  if (error || !data) return [];

  return data.flatMap((row) => {
    const messages = (row.assistant_messages ?? []) as {
      role: string;
      body: string;
      created_at: string;
    }[];
    if (messages.length === 0) return [];

    messages.sort((a, b) => a.created_at.localeCompare(b.created_at));

    return [
      {
        id: row.id as string,
        day: dayLabel(row.created_at as string),
        time: clockOf(new Date(row.created_at as string)),
        title: (row.title as string) || "Obrolan",
        turns: messages.map((m) => ({
          from: m.role === "user" ? ("me" as const) : ("karsa" as const),
          text: m.body,
        })),
      },
    ];
  });
});

import { cache } from "react";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { getSessionProfile } from "../profile";
import { MONTHS, calendarDayOf, jakartaDateString } from "../care/time";
import {
  getMyCareInvites,
  getMyCareTeam,
  getMyPatientRecord,
  getMyPatients,
} from "../care/queries";
import type { CareInvite } from "../care/queries";
import type { CarePatient, CareTeamMember } from "../care/types";

export type MySettings = {
  id: string;
  fullName: string;
  email: string;
  role: "caregiver" | "patient";
  avatarUrl: string | null;
  headline: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  emergencyContact: string | null;
  theme: "system" | "light" | "dark";
  textScale: "small" | "medium" | "large";
  reduceMotion: boolean;
  language: "id" | "en";
};

export type PatientAccess = {
  patients: CarePatient[];
  caregivers: CareTeamMember[];
  shareCode: string | null;

  invites: CareInvite[];
};

export const getMySettings = cache(async (): Promise<MySettings | null> => {
  if (!isSupabaseConfigured()) return null;

  const me = await getSessionProfile();
  if (!me) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "full_name, avatar_url, headline, phone, date_of_birth, address, emergency_contact, theme, text_scale, reduce_motion, language",
    )
    .eq("id", me.id)
    .maybeSingle();

  return {
    id: me.id,
    fullName: (data?.full_name as string | null)?.trim() || me.fullName,
    email: me.email,
    role: me.role,
    avatarUrl: (data?.avatar_url as string | null) ?? null,
    headline: (data?.headline as string | null) ?? null,
    phone: (data?.phone as string | null) ?? null,
    dateOfBirth: (data?.date_of_birth as string | null) ?? null,
    address: (data?.address as string | null) ?? null,
    emergencyContact: (data?.emergency_contact as string | null) ?? null,
    theme: (data?.theme as MySettings["theme"]) ?? "system",
    textScale: (data?.text_scale as MySettings["textScale"]) ?? "medium",
    reduceMotion: Boolean(data?.reduce_motion),
    language: (data?.language as MySettings["language"]) ?? "id",
  };
});

export type Contributions = {
  notes: number;
  doses: number;
  replies: number;
  streakDays: number;
  since: string | null;
};

export const getContributions = cache(async (): Promise<Contributions> => {
  const blank = { notes: 0, doses: 0, replies: 0, streakDays: 0, since: null };
  if (!isSupabaseConfigured()) return blank;

  const me = await getSessionProfile();
  if (!me) return blank;

  const supabase = await createClient();
  const [moods, readings, doses, replies, profile, recent] = await Promise.all([
    supabase
      .from("mood_entries")
      .select("id", { count: "exact", head: true })
      .eq("recorded_by", me.id),
    supabase
      .from("health_readings")
      .select("id", { count: "exact", head: true })
      .eq("recorded_by", me.id),
    supabase
      .from("medication_logs")
      .select("id", { count: "exact", head: true })
      .eq("logged_by", me.id),
    supabase
      .from("community_comments")
      .select("id", { count: "exact", head: true })
      .eq("author_id", me.id),
    supabase.from("profiles").select("created_at").eq("id", me.id).maybeSingle(),
    supabase
      .from("task_completions")
      .select("done_on")
      .eq("completed_by", me.id)
      .order("done_on", { ascending: false })
      .limit(400),
  ]);

  const days = [...new Set((recent.data ?? []).map((r) => r.done_on as string))].sort().reverse();
  let streakDays = 0;
  if (days.length > 0) {
    const today = jakartaDateString();
    const yesterday = jakartaDateString(new Date(Date.now() - 86400_000));

    if (days[0] === today || days[0] === yesterday) {
      let cursor = new Date(`${days[0]}T00:00:00+07:00`);
      for (const day of days) {
        if (day !== cursor.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })) break;
        streakDays += 1;
        cursor = new Date(cursor.getTime() - 86400_000);
      }
    }
  }

  const createdAt = profile.data?.created_at as string | undefined;
  const day = createdAt ? calendarDayOf(createdAt) : null;

  return {
    notes: (moods.count ?? 0) + (readings.count ?? 0),
    doses: doses.count ?? 0,
    replies: replies.count ?? 0,
    streakDays,
    since: day ? `Sejak ${MONTHS[day.m]} ${day.y}` : null,
  };
});

export const getPatientAccess = cache(async (): Promise<PatientAccess> => {
  if (!isSupabaseConfigured()) {
    return { patients: [], caregivers: [], shareCode: null, invites: [] };
  }

  const [patients, caregivers, record, invites] = await Promise.all([
    getMyPatients(),
    getMyCareTeam(),
    getMyPatientRecord(),
    getMyCareInvites(),
  ]);

  return { patients, caregivers, shareCode: record?.share_code ?? null, invites };
});

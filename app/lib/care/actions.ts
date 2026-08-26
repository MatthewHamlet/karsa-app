"use server";

import { revalidateCare, revalidateCareTalk, revalidateRelationships } from "../revalidate";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { NOT_CONFIGURED_MESSAGE } from "../supabase/config";
import { getSessionProfile } from "../profile";
import { jakartaDateString } from "./time";
import { getCareMessages, getJournalMonth } from "./queries";



export type CareResult = { error: string | null; ok?: boolean };

const NOT_SIGNED_IN = "Kamu belum masuk.";

function readable(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("care_relationships_unique_pair") || m.includes("duplicate key"))
    return "Kamu sudah terhubung dengan pasien ini.";
  if (m.includes("row-level security") || m.includes("violates row-level"))
    return "Kamu tidak punya akses untuk melakukan itu.";
  if (m.includes("patients_link_matches_status"))
    return "Status profil pasien tidak konsisten.";
  return process.env.NODE_ENV === "development"
    ? `Gagal menyimpan.\n\n[dev] ${message}`
    : "Gagal menyimpan. Coba lagi sebentar lagi.";
}


export async function createPatientProfile(
  _prev: CareResult,
  formData: FormData,
): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const displayName = String(formData.get("display_name") ?? "").trim();
  const relation = String(formData.get("relation") ?? "").trim();
  const dobRaw = String(formData.get("date_of_birth") ?? "").trim();

  if (!displayName) return { error: "Nama pasien harus diisi." };
  if (displayName.length > 80) return { error: "Nama terlalu panjang." };

  const supabase = await createClient();

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .insert({
      display_name: displayName,
      date_of_birth: dobRaw || null,
      created_by: me.id,

      user_id: null,
      status: "pending_activation",
    })
    .select("id")
    .single();

  if (patientError || !patient) {
    return { error: readable(patientError?.message ?? "insert failed") };
  }

  const { error: relError } = await supabase.from("care_relationships").insert({
    caregiver_id: me.id,
    patient_id: patient.id,
    invited_by: me.id,
    relation: relation || null,
    status: "active",
    accepted_at: new Date().toISOString(),
  });

  if (relError) {

    return { error: readable(relError.message) };
  }

  revalidateRelationships();
  return { error: null, ok: true };
}


export async function invitePatient(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const code = String(formData.get("share_code") ?? "").trim().toUpperCase();
  const relation = String(formData.get("relation") ?? "").trim();
  if (code.length < 6) return { error: "Kode undangannya 8 karakter." };

  const supabase = await createClient();
  const { data: found, error: lookupError } = await supabase.rpc("find_patient_by_code", {
    p_code: code,
  });
  if (lookupError) return { error: readable(lookupError.message) };

  const match = Array.isArray(found) ? found[0] : found;

  if (!match?.patient_id) return { error: "Kode itu tidak cocok dengan pasien mana pun." };
  if (match.already_linked) return { error: "Kamu sudah terhubung dengan pasien ini." };

  const patientId = match.patient_id as string;

  const { error } = await supabase.from("care_relationships").insert({
    caregiver_id: me.id,
    patient_id: patientId,
    invited_by: me.id,
    relation: relation || null,
    status: "pending",
    accepted_at: null,
  });

  if (error) return { error: readable(error.message) };

  revalidateRelationships();
  return { error: null, ok: true };
}


export async function respondToInvitation(
  _prev: CareResult,
  formData: FormData,
): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const relationshipId = String(formData.get("relationship_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");
  if (!relationshipId) return { error: "Undangan tidak ditemukan." };
  if (decision !== "accept" && decision !== "reject") {
    return { error: "Pilihannya hanya terima atau tolak." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("care_relationships")
    .update(
      decision === "accept"
        ? { status: "active", accepted_at: new Date().toISOString() }
        : { status: "rejected", accepted_at: null },
    )
    .eq("id", relationshipId)
    .eq("status", "pending")
    .select("id");

  if (error) return { error: readable(error.message) };

  if (!data?.length) return { error: "Undangan itu sudah tidak berlaku." };

  revalidateRelationships();
  return { error: null, ok: true };
}


export async function revokeRelationship(
  _prev: CareResult,
  formData: FormData,
): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const relationshipId = String(formData.get("relationship_id") ?? "").trim();
  if (!relationshipId) return { error: "Hubungan tidak ditemukan." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("care_relationships")
    .update({ status: "revoked", accepted_at: null })
    .eq("id", relationshipId)
    .select("id");

  if (error) return { error: readable(error.message) };
  if (!data?.length) return { error: "Kamu tidak bisa mencabut hubungan itu." };

  revalidateRelationships();
  return { error: null, ok: true };
}


export async function toggleTask(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const taskId = String(formData.get("task_id") ?? "").trim();
  const patientId = String(formData.get("patient_id") ?? "").trim();
  if (!taskId || !patientId) return { error: "Tugasnya tidak ditemukan." };
  const today = jakartaDateString();

  const supabase = await createClient();


  const { data: existing } = await supabase
    .from("task_completions")
    .select("id")
    .eq("task_id", taskId)
    .eq("done_on", today)
    .maybeSingle();

  if (existing) {
    await supabase.from("task_completions").delete().eq("id", existing.id);
  } else {
    const { error } = await supabase.from("task_completions").insert({
      task_id: taskId,
      patient_id: patientId,
      completed_by: me.id,
    });
    if (error) return { error: readable(error.message) };
  }

  revalidateCare();
  return { error: null, ok: true };
}


export async function logHealthReading(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  const kind = String(formData.get("kind") ?? "").trim();
  const value = Number(formData.get("value"));
  const rawSecondary = formData.get("value_secondary");
  const secondary = rawSecondary === null || rawSecondary === "" ? null : Number(rawSecondary);

  if (!patientId) return { error: "Pasien tidak ditemukan." };
  if (!oneOf(READING_KINDS, kind)) return { error: "Jenis catatannya tidak dikenali." };
  if (!Number.isFinite(value)) return { error: "Angkanya belum diisi." };
  if (secondary !== null && !Number.isFinite(secondary)) {
    return { error: "Angka keduanya belum benar." };
  }

  if (kind === "blood_pressure" && secondary === null) {
    return { error: "Tekanan darah butuh dua angka: sistolik dan diastolik." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("health_readings").insert({
    patient_id: patientId,
    kind,
    value,
    value_secondary: secondary,
    recorded_by: me.id,
  });

  if (error) return { error: readable(error.message) };
  revalidateCare();
  return { error: null, ok: true };
}

export async function activatePatientProfile(
  _prev: CareResult,
  formData: FormData,
): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  if (!patientId) return { error: "Profil pasien tidak ditemukan." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("activate_patient_profile", { p_patient: patientId });

  if (error) return { error: readable(error.message) };

  revalidateRelationships();
  return { error: null, ok: true };
}


export async function loadJournalMonth(patientId: string, year: number, month: number) {

  const y = year + Math.floor(month / 12);
  const m = ((month % 12) + 12) % 12;
  return getJournalMonth(patientId, y, m);
}



const MEALS = ["sarapan", "makan_siang", "makan_malam"] as const;
const MOODS = ["great", "good", "okay", "low", "verylow"] as const;
const READING_KINDS = [
  "blood_pressure", "blood_sugar", "oxygen", "heart_rate",
  "temperature", "weight", "fluid", "sleep_minutes",
] as const;
const EVENT_KINDS = ["appointment", "meds", "therapy", "checkup"] as const;

const oneOf = <T extends readonly string[]>(list: T, value: string): value is T[number] =>
  (list as readonly string[]).includes(value);


export async function logMood(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  const mood = String(formData.get("mood") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const voicePath = String(formData.get("voice_path") ?? "").trim();
  const voiceSeconds = Number(formData.get("voice_seconds"));

  if (!patientId) return { error: "Pasien tidak ditemukan." };
  if (!oneOf(MOODS, mood)) return { error: "Pilih dulu perasaannya." };
  if (note.length > 1000) return { error: "Catatannya terlalu panjang." };
  if (voicePath && !voicePath.startsWith(`${patientId}/`)) {
    return { error: "Rekamannya tidak dikenali." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("mood_entries").insert({
    patient_id: patientId,
    mood,
    note: note || null,
    recorded_by: me.id,
    voice_path: voicePath || null,
    voice_seconds: voicePath && Number.isFinite(voiceSeconds) ? Math.round(voiceSeconds) : null,
  });

  if (error) return { error: readable(error.message) };

  revalidateCare();
  return { error: null, ok: true };
}


export async function toggleMeal(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  const meal = String(formData.get("meal") ?? "").trim();
  if (!patientId) return { error: "Pasien tidak ditemukan." };
  if (!oneOf(MEALS, meal)) return { error: "Waktu makannya tidak dikenali." };

  const supabase = await createClient();
  const today = jakartaDateString();

  const { data: existing } = await supabase
    .from("meal_logs")
    .select("id")
    .eq("patient_id", patientId)
    .eq("meal", meal)
    .eq("done_on", today)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("meal_logs").delete().eq("id", existing.id)
    : await supabase
        .from("meal_logs")
        .insert({ patient_id: patientId, meal, logged_by: me.id });

  if (error) return { error: readable(error.message) };

  revalidateCare();
  return { error: null, ok: true };
}


export async function logMedication(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  const medicationId = String(formData.get("medication_id") ?? "").trim();
  const slot = String(formData.get("scheduled_time") ?? "").trim();
  if (!patientId || !medicationId) return { error: "Obatnya tidak ditemukan." };

  const supabase = await createClient();
  const today = jakartaDateString();

  const { data: existing } = await supabase
    .from("medication_logs")
    .select("id")
    .eq("medication_id", medicationId)
    .eq("scheduled_time", slot)
    .eq("taken_on", today)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("medication_logs").delete().eq("id", existing.id)
    : await supabase.from("medication_logs").insert({
        patient_id: patientId,
        medication_id: medicationId,
        scheduled_time: slot || null,
        logged_by: me.id,
      });

  if (error) return { error: readable(error.message) };

  revalidateCare();
  return { error: null, ok: true };
}


export async function addMedication(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const dose = String(formData.get("dose") ?? "").trim();
  const rule = String(formData.get("rule") ?? "").trim();

  const times = String(formData.get("times") ?? "")
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (!patientId) return { error: "Pasien tidak ditemukan." };
  if (!name) return { error: "Nama obatnya harus diisi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("medications")
    .insert({ patient_id: patientId, name, dose, rule, times });

  if (error) return { error: readable(error.message) };

  revalidateCare();
  return { error: null, ok: true };
}


export async function addScheduleEvent(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "appointment").trim();
  const date = String(formData.get("date") ?? "").trim();
  const start = String(formData.get("start") ?? "").trim();
  const end = String(formData.get("end") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!patientId) return { error: "Pasien tidak ditemukan." };
  if (!title) return { error: "Judul jadwalnya harus diisi." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Tanggalnya belum benar." };
  if (!/^\d{2}:\d{2}$/.test(start)) return { error: "Jam mulainya belum benar." };
  if (end && !/^\d{2}:\d{2}$/.test(end)) return { error: "Jam selesainya belum benar." };
  if (!oneOf(EVENT_KINDS, kind)) return { error: "Jenis jadwalnya tidak dikenali." };

  const supabase = await createClient();
  const { error } = await supabase.from("schedule_events").insert({
    patient_id: patientId,
    title,
    kind,
    starts_at: `${date}T${start}:00+07:00`,
    ends_at: end ? `${date}T${end}:00+07:00` : null,
    note: note || null,
    created_by: me.id,
  });

  if (error) return { error: readable(error.message) };

  revalidateCare();
  return { error: null, ok: true };
}

export async function deleteScheduleEvent(
  _prev: CareResult,
  formData: FormData,
): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const id = String(formData.get("event_id") ?? "").trim();
  if (!id) return { error: "Jadwalnya tidak ditemukan." };

  const supabase = await createClient();
  const { error } = await supabase.from("schedule_events").delete().eq("id", id);

  if (error) return { error: readable(error.message) };

  revalidateCare();
  return { error: null, ok: true };
}


export async function addCareNote(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!patientId) return { error: "Pasien tidak ditemukan." };
  if (!body) return { error: "Catatannya masih kosong." };
  if (body.length > 500) return { error: "Catatannya terlalu panjang." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("care_notes")
    .insert({ patient_id: patientId, body, sort_order: 100, created_by: me.id });

  if (error) return { error: readable(error.message) };

  revalidateCareTalk();
  return { error: null, ok: true };
}


export async function saveCareNotes(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  if (!patientId) return { error: "Pasien tidak ditemukan." };

  let lines: { id: string | null; body: string }[];
  try {
    const parsed: unknown = JSON.parse(String(formData.get("notes") ?? "[]"));
    if (!Array.isArray(parsed)) throw new Error("not an array");
    lines = parsed
      .map((row) => ({
        id: typeof (row as { id?: unknown }).id === "string" ? (row as { id: string }).id : null,
        body: String((row as { body?: unknown }).body ?? "").trim(),
      }))
      .filter((row) => row.body.length > 0 && row.body.length <= 500);
  } catch {
    return { error: "Catatannya tidak bisa dibaca." };
  }

  const supabase = await createClient();


  const keep = lines.map((l) => l.id).filter((id): id is string => Boolean(id));
  const removal = supabase.from("care_notes").delete().eq("patient_id", patientId);
  const { error: deleteError } = await (keep.length
    ? removal.not("id", "in", `(${keep.join(",")})`)
    : removal);
  if (deleteError) return { error: readable(deleteError.message) };


  for (const [index, line] of lines.entries()) {
    const { error } = line.id
      ? await supabase
          .from("care_notes")
          .update({ body: line.body, sort_order: index })
          .eq("id", line.id)
          .eq("patient_id", patientId)
      : await supabase.from("care_notes").insert({
          patient_id: patientId,
          body: line.body,
          sort_order: index,
          created_by: me.id,
        });

    if (error) return { error: readable(error.message) };
  }

  revalidateCareTalk();
  return { error: null, ok: true };
}

export async function deleteCareNote(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const id = String(formData.get("note_id") ?? "").trim();
  if (!id) return { error: "Catatannya tidak ditemukan." };

  const supabase = await createClient();
  const { error } = await supabase.from("care_notes").delete().eq("id", id);

  if (error) return { error: readable(error.message) };

  revalidateCareTalk();
  return { error: null, ok: true };
}


export async function loadCareMessages(patientId: string) {
  if (!isSupabaseConfigured() || !patientId) return [];
  if (!(await getSessionProfile())) return [];
  return getCareMessages(patientId);
}


export async function sendCareMessage(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const contextType = String(formData.get("context_type") ?? "").trim();
  const contextLabel = String(formData.get("context_label") ?? "").trim();
  const contextDetail = String(formData.get("context_detail") ?? "").trim();

  if (!patientId) return { error: "Pasien tidak ditemukan." };
  if (!body) return { error: "Pesannya masih kosong." };
  if (body.length > 2000) return { error: "Pesannya terlalu panjang." };

  const supabase = await createClient();
  const { error } = await supabase.from("care_messages").insert({
    patient_id: patientId,
    author_id: me.id,
    body,
    context_type: contextType || null,
    context_label: contextLabel || null,
    context_detail: contextDetail || null,
  });

  if (error) return { error: readable(error.message) };

  revalidateCareTalk();
  return { error: null, ok: true };
}


export async function updatePatientCare(
  _prev: CareResult,
  formData: FormData,
): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  if (!patientId) return { error: "Pasien tidak ditemukan." };

  const fluid = Number(formData.get("fluid_target_ml"));
  const sleep = Number(formData.get("sleep_target_min"));
  const notes = String(formData.get("notes") ?? "").trim();


  if (!Number.isFinite(fluid) || fluid < 500 || fluid > 6000) {
    return { error: "Target cairan harus antara 500 dan 6.000 ml." };
  }
  if (!Number.isFinite(sleep) || sleep < 120 || sleep > 900) {
    return { error: "Target tidur harus antara 2 dan 15 jam." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .update({
      fluid_target_ml: Math.round(fluid),
      sleep_target_min: Math.round(sleep),
      notes: notes || null,
    })
    .eq("id", patientId)
    .select("id");

  if (error) return { error: readable(error.message) };
  if (!data?.length) return { error: "Kamu tidak punya akses untuk mengubah itu." };

  revalidateCare();
  return { error: null, ok: true };
}




const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const TASK_DUPLICATE =
  "Tugas dengan nama dan jam yang sama sudah ada. Ubah namanya, jamnya, atau tugaskan yang sudah ada ke orang lain.";


function readTaskFields(formData: FormData):
  | { error: string }
  | { error: null; fields: { label: string; at_time: string | null; note: string | null; assignee_id: string | null } } {
  const label = String(formData.get("label") ?? "").trim();
  const atTime = String(formData.get("at_time") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const assignee = String(formData.get("assignee_id") ?? "").trim();

  if (!label) return { error: "Nama tugasnya masih kosong." };
  if (label.length > 80) return { error: "Nama tugasnya terlalu panjang." };
  if (note.length > 300) return { error: "Catatannya terlalu panjang." };
  if (atTime && !TIME_RE.test(atTime)) return { error: "Jamnya belum benar. Contoh: 07:00." };

  return {
    error: null,
    fields: {
      label,
      at_time: atTime || null,
      note: note || null,
      assignee_id: assignee || null,
    },
  };
}


export async function createDailyTask(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  if (!patientId) return { error: "Pasien tidak ditemukan." };

  const read = readTaskFields(formData);
  if (read.error !== null) return { error: read.error };

  const supabase = await createClient();
  const { error } = await supabase.from("daily_tasks").insert({
    patient_id: patientId,
    created_by: me.id,
    ...read.fields,
  });

  if (error) {

    if (error.message.includes("daily_tasks_unique_per_slot")) return { error: TASK_DUPLICATE };
    return { error: readable(error.message) };
  }

  revalidateCare();
  return { error: null, ok: true };
}


export async function updateDailyTask(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const taskId = String(formData.get("task_id") ?? "").trim();
  if (!taskId) return { error: "Tugasnya tidak ditemukan." };

  const read = readTaskFields(formData);
  if (read.error !== null) return { error: read.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_tasks")
    .update(read.fields)
    .eq("id", taskId)
    .select("id");

  if (error) {
    if (error.message.includes("daily_tasks_unique_per_slot")) return { error: TASK_DUPLICATE };
    return { error: readable(error.message) };
  }

  if (!data?.length) return { error: "Kamu tidak punya akses untuk mengubah itu." };

  revalidateCare();
  return { error: null, ok: true };
}


export async function deleteDailyTask(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const taskId = String(formData.get("task_id") ?? "").trim();
  if (!taskId) return { error: "Tugasnya tidak ditemukan." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_tasks")
    .update({ active: false })
    .eq("id", taskId)
    .select("id");

  if (error) return { error: readable(error.message) };
  if (!data?.length) return { error: "Kamu tidak punya akses untuk menghapus itu." };

  revalidateCare();
  return { error: null, ok: true };
}




export async function inviteToCareTeam(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  const inviteeId = String(formData.get("invitee_id") ?? "").trim();

  if (!patientId) return { error: "Pilih dulu pasien yang mau didampingi bersama." };
  if (!inviteeId) return { error: "Orangnya tidak ditemukan." };
  if (inviteeId === me.id) return { error: "Itu kamu sendiri." };

  const supabase = await createClient();
  const { error } = await supabase.from("care_team_invites").insert({
    patient_id: patientId,
    invitee_id: inviteeId,
    invited_by: me.id,
  });

  if (error) {
    if (error.message.includes("care_team_invites_one_pending")) {
      return { error: "Dia sudah diundang dan belum menjawab." };
    }
    return { error: readable(error.message) };
  }

  revalidateRelationships();
  return { error: null, ok: true };
}


export async function respondToCareInvite(
  _prev: CareResult,
  formData: FormData,
): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const inviteId = String(formData.get("invite_id") ?? "").trim();
  const accept = String(formData.get("accept") ?? "") === "true";
  if (!inviteId) return { error: "Undangannya tidak ditemukan." };

  const supabase = await createClient();

  if (accept) {
    const { error } = await supabase.rpc("accept_care_invite", { p_invite: inviteId });
    if (error) return { error: readable(error.message) };
  } else {
    const { data, error } = await supabase
      .from("care_team_invites")
      .update({ status: "declined", responded_at: new Date().toISOString() })
      .eq("id", inviteId)
      .eq("status", "pending")
      .select("id");

    if (error) return { error: readable(error.message) };
    if (!data?.length) return { error: "Undangannya sudah dijawab." };
  }

  revalidateRelationships();
  return { error: null, ok: true };
}

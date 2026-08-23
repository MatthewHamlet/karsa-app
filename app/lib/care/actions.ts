"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { NOT_CONFIGURED_MESSAGE } from "../supabase/config";
import { getSessionProfile } from "../profile";
import { jakartaDateString } from "./time";

/** Mutations for the caregiver–patient relationship system.
 *
 *  Every one of these is a POST endpoint reachable by anyone who can load the
 *  site. So nothing here trusts its arguments: an id arriving from the browser
 *  is treated as a request, not a fact, and the database decides. RLS is what
 *  makes that safe — a relationship id belonging to a stranger simply matches
 *  no row, and the update affects nothing.
 *
 *  That is also why none of these look up "am I allowed" in JavaScript first.
 *  A check in this file can be bypassed by calling the action directly; a
 *  policy in Postgres cannot. */

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

/** Writes down someone who has no Karsa account yet.
 *
 *  Creates the patient row and the caregiver's own relationship to it in one
 *  go. The relationship starts `active` here, which is the one case where that
 *  is allowed: there is nobody to ask. The moment the patient claims the
 *  profile, the ordinary consent rules take over — see migration 0003.
 *
 *  No placeholder auth user is created. A fake account is an account somebody
 *  can be locked out of, with a password nobody set. */
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
      /* Both forced rather than defaulted, because the insert policy checks
         them — an unclaimed profile is the only kind a caregiver may create. */
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
    /* The patient row is left behind rather than deleted. Deleting it would be
       a second write that can also fail, and an orphaned unclaimed profile is
       harmless — only its creator can see it, and they can try again. */
    return { error: readable(relError.message) };
  }

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

/** Asks an existing Karsa patient for access, using the code they shared.
 *
 *  The code, not an email. Looking a patient up by address would let anyone
 *  test whether a given person has an account here, and fire invitations at
 *  people they merely suspect are on Karsa. A code has to be handed over.
 *
 *  Starts `pending` and grants nothing: the caregiver sees the name in their
 *  list with "menunggu persetujuan" beside it and no data behind it. */
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
  /* Same answer for "no such code" as for a malformed one. Distinguishing them
     would turn this into a way to test codes one at a time. */
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

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

/** The patient's answer. Only they can run this to any effect — the update
 *  policy for setting `active` matches on `is_my_patient`, so a caregiver
 *  calling it against their own row updates nothing. */
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
    /* Only an undecided invitation can be answered. Without this, re-posting an
       old form could flip a relationship that was revoked months ago back on. */
    .eq("status", "pending")
    .select("id");

  if (error) return { error: readable(error.message) };
  /* Zero rows means RLS refused it or it was not pending — indistinguishable
     from here, and deliberately so: telling the caller which would confirm that
     somebody else's invitation exists. */
  if (!data?.length) return { error: "Undangan itu sudah tidak berlaku." };

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

/** Ends an existing relationship. Either side may do this: the patient
 *  withdrawing consent, or the caregiver stepping away. */
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

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

/** Claims a patient profile a caregiver created before this person signed up.
 *
 *  Goes through the SQL function rather than a direct update: the two writes
 *  must not half-happen, and "is this row still unclaimed" has to be checked in
 *  the same statement that claims it, or two people racing could both win. */
export async function toggleTask(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const taskId = String(formData.get("task_id") ?? "").trim();
  const patientId = String(formData.get("patient_id") ?? "").trim();
  if (!taskId || !patientId) return { error: "Tugasnya tidak ditemukan." };
  const today = jakartaDateString();

  const supabase = await createClient();

  // Sudah dicentang? toggle jadi hapus; kalau belum, insert.
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

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

/** One manual measurement: a blood pressure, a glass of water, last night's
 *  sleep. The stat cards on Perawatan are all averages and sums over this one
 *  table, so this is the write behind most of that page.
 *
 *  `kind` is checked against the same list the column's constraint holds. The
 *  duplication is worth it only because the constraint's failure message is
 *  unreadable — the constraint is still the thing that decides. */
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
  /* Blood pressure is the only compound reading, and a systolic without a
     diastolic would be stored as a bare number that the feed then prints as
     one. Caught here because the column allows it — `value_secondary` is
     nullable for the seven kinds that have no second number. */
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
  revalidatePath("/", "layout");
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

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Logging the day
   ═══════════════════════════════════════════════════════════════════════════

   The writes behind the cards on Home and Perawatan. None of them checks
   whether the caller may touch this patient — the insert policies on all of
   these tables ask `is_my_patient or can_care_for`, so a `patient_id` belonging
   to a stranger matches no policy and the insert is refused. A check here as
   well would be a second, weaker copy of that rule, and the day the two drift
   apart the one in JavaScript is the one that will be wrong.

   What they do check is the input: an enum arriving from a form is a string
   until something narrows it, and Postgres's `check` constraint fails with a
   message meant for a developer, not for the person who pressed the button. */

const MEALS = ["sarapan", "makan_siang", "makan_malam"] as const;
const MOODS = ["great", "good", "okay", "low", "verylow"] as const;
const READING_KINDS = [
  "blood_pressure", "blood_sugar", "oxygen", "heart_rate",
  "temperature", "weight", "fluid", "sleep_minutes",
] as const;
const EVENT_KINDS = ["appointment", "meds", "therapy", "checkup"] as const;

const oneOf = <T extends readonly string[]>(list: T, value: string): value is T[number] =>
  (list as readonly string[]).includes(value);

/** How the patient is feeling, from either side of the relationship.
 *
 *  Insert-only, never an update: a mood is a reading taken at a moment, and
 *  overwriting this morning's "sedih" with this evening's "senang" would erase
 *  the very thing the trend is drawn from. Two entries in a day is correct. */
export async function logMood(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  const mood = String(formData.get("mood") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!patientId) return { error: "Pasien tidak ditemukan." };
  if (!oneOf(MOODS, mood)) return { error: "Pilih dulu perasaannya." };
  if (note.length > 1000) return { error: "Catatannya terlalu panjang." };

  const supabase = await createClient();
  const { error } = await supabase.from("mood_entries").insert({
    patient_id: patientId,
    mood,
    note: note || null,
    recorded_by: me.id,
  });

  if (error) return { error: readable(error.message) };

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

/** Ticks or un-ticks one of today's three meals.
 *
 *  A toggle rather than an insert, for the same reason `toggleTask` is one: the
 *  control is a checkbox, and a checkbox that cannot be un-ticked turns a
 *  mis-tap into a permanent wrong record of whether somebody ate. The unique
 *  constraint on `(patient_id, meal, done_on)` is what makes the read-then-write
 *  safe — a double submit can only ever land one row. */
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

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

/** Records one dose of one medication, for one slot of today.
 *
 *  `scheduled_time` is part of the unique key, so "the 08:00 one" and "the
 *  20:00 one" are separate records of the same medicine on the same day —
 *  which is the entire question the card is asking. */
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

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

/** Adds a medication to the standing plan. */
export async function addMedication(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const dose = String(formData.get("dose") ?? "").trim();
  const rule = String(formData.get("rule") ?? "").trim();
  /* "08:00, 20:00" from one field. Splitting here rather than asking for a
     repeatable input keeps the form to four boxes, which is what somebody
     copying a label off a box can actually fill in. */
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

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

/** Puts an appointment on the calendar.
 *
 *  The form collects a date and two clock times; they are assembled into
 *  instants at `+07:00` here rather than in the browser. A `datetime-local`
 *  value carries no zone, so letting the browser interpret it would file a
 *  caregiver's 09:00 appointment at 09:00 *their* time — which is a different
 *  moment the second anyone opens the app from another country. */
export async function addScheduleEvent(_prev: CareResult, formData: FormData): Promise<CareResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "appointment").trim();
  const date = String(formData.get("date") ?? "").trim();      // YYYY-MM-DD
  const start = String(formData.get("start") ?? "").trim();    // HH:MM
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

  revalidatePath("/", "layout");
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

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

/** One line of the standing care instructions. */
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
  /* Appended, not inserted at a position: `sort_order` only has to be
     monotonic, and counting the existing rows to find the next one is a race
     two caregivers can lose together. The timestamp breaks any tie. */
  const { error } = await supabase
    .from("care_notes")
    .insert({ patient_id: patientId, body, sort_order: 100, created_by: me.id });

  if (error) return { error: readable(error.message) };

  revalidatePath("/care");
  return { error: null, ok: true };
}

/** Saves the whole list of standing instructions in one go.
 *
 *  The editor is a reorderable list where every row can be retyped, moved or
 *  removed before anything is committed — so the write has to be the list, not
 *  a stream of per-row edits. It arrives as JSON in one field for the same
 *  reason: a `FormData` of parallel `body[]` and `id[]` arrays can be desynced
 *  by one dropped entry, and then the wrong note is overwritten.
 *
 *  Existing rows are updated rather than replaced. Deleting the lot and
 *  re-inserting would be four lines shorter and would reset `created_by` and
 *  `created_at` on every note each time somebody fixed a typo — which is
 *  exactly the history the "Riwayat" panel is showing. */
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

  /* What is on screen is the whole truth, so anything not in it was deleted.
     Scoped by `patient_id` as well as by id: without it, a crafted id would
     ask the database to delete a note belonging to someone else — RLS would
     refuse it, but the query should not be asking in the first place. */
  const keep = lines.map((l) => l.id).filter((id): id is string => Boolean(id));
  const removal = supabase.from("care_notes").delete().eq("patient_id", patientId);
  const { error: deleteError } = await (keep.length
    ? removal.not("id", "in", `(${keep.join(",")})`)
    : removal);
  if (deleteError) return { error: readable(deleteError.message) };

  /* Sequential rather than `Promise.all`: these are a handful of rows, and a
     partial failure that leaves the list half-reordered is harder to explain
     than one that stops at the first problem. */
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

  revalidatePath("/care");
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

  revalidatePath("/care");
  return { error: null, ok: true };
}

/** Says something to the rest of the care team.
 *
 *  `author_id` is sent as the caller's own id, and the insert policy checks
 *  that it matches `auth.uid()`. Both, not either: sending it is what makes the
 *  row correct, and the policy is what makes it impossible to send anything
 *  else. */
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

  revalidatePath("/care");
  return { error: null, ok: true };
}

/** The targets the stat cards divide by, and the free-text profile note. */
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

  /* Bounds rather than "is it a number": a target of 0 divides by zero in the
     progress ring, and 99999 ml is a typo that would make every day look like
     a failure. */
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

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

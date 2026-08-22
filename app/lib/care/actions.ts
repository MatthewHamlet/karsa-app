"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { NOT_CONFIGURED_MESSAGE } from "../supabase/config";
import { getSessionProfile } from "../profile";

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

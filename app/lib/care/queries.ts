import { cache } from "react";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { getSessionProfile } from "../profile";
import type { CarePatient, CareTeamMember, PatientStatus, RelationshipStatus } from "./types";

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

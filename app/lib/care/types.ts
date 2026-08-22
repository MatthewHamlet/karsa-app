/** Shapes shared between the server queries and the components that render
 *  them. No imports on purpose — client components read these, and a shared
 *  type must never drag a server-only module into the browser bundle. */

export type RelationshipStatus = "pending" | "active" | "rejected" | "revoked";
export type PatientStatus = "pending_activation" | "active";

/** A patient as their caregiver sees them: the person, plus the terms of this
 *  particular caregiver's access to them. */
export type CarePatient = {
  /** The relationship row, which is what accept/reject/revoke act on. */
  relationshipId: string;
  /** The patient row. Used to scope queries; never rendered. */
  patientId: string;
  displayName: string;
  initial: string;
  /** "Ibu", "Nenek" — how *this* caregiver refers to them. Lives on the
   *  relationship, not the patient: the same person is Ibu to one caregiver and
   *  Nenek to another. */
  relation: string | null;
  dateOfBirth: string | null;
  status: RelationshipStatus;
  /** Whether the patient has claimed their own account yet. A caregiver can
   *  look after someone who has never opened Karsa. */
  patientStatus: PatientStatus;
};

/** A caregiver as their patient sees them. */
export type CareTeamMember = {
  relationshipId: string;
  caregiverId: string;
  fullName: string;
  initial: string;
  relation: string | null;
  status: RelationshipStatus;
  invitedAt: string;
};

/** Only these can be worked with. `pending` shows in the list with a label but
 *  grants nothing — RLS refuses the data behind it either way. */
export const isUsable = (p: CarePatient) => p.status === "active";

export const RELATIONSHIP_LABEL: Record<RelationshipStatus, string> = {
  pending: "Menunggu persetujuan",
  active: "Aktif",
  rejected: "Ditolak",
  revoked: "Dicabut",
};

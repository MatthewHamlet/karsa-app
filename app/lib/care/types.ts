export type RelationshipStatus = "pending" | "active" | "rejected" | "revoked";
export type PatientStatus = "pending_activation" | "active";

export type CarePatient = {
  relationshipId: string;
  patientId: string;
  displayName: string;
  initial: string;
  relation: string | null;
  dateOfBirth: string | null;
  status: RelationshipStatus;
  patientStatus: PatientStatus;
};

export type CareTeamMember = {
  relationshipId: string;
  caregiverId: string;
  fullName: string;
  initial: string;
  relation: string | null;
  status: RelationshipStatus;
  invitedAt: string;
};

export const isUsable = (p: CarePatient) => p.status === "active";

export const RELATIONSHIP_LABEL: Record<RelationshipStatus, string> = {
  pending: "Menunggu persetujuan",
  active: "Aktif",
  rejected: "Ditolak",
  revoked: "Dicabut",
};

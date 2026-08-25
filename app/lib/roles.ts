export type Role = "caregiver" | "patient";

export type SessionProfile = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl: string | null;
  initial: string;
};

export const ROLE_LABEL: Record<Role, string> = {
  caregiver: "Pendamping",
  patient: "Pasien",
};

export const HOME_FOR: Record<Role, string> = {
  caregiver: "/",
  patient: "/pasien",
};

export function normaliseRole(value: unknown): Role {
  return value === "patient" || value === "pasien" ? "patient" : "caregiver";
}

export function hasChosenRole(metadata: { role?: unknown } | undefined | null): boolean {
  const role = metadata?.role;
  return role === "caregiver" || role === "patient" || role === "pendamping" || role === "pasien";
}

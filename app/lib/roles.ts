/** Role vocabulary, safe to import from anywhere.
 *
 *  Deliberately its own module with no imports. The type and these labels are
 *  needed by the rail, which is a client component — and putting them in
 *  `profile.ts` dragged that file's `next/headers` dependency into the browser
 *  bundle and broke the build. A shared constant must not carry a server-only
 *  module in behind it. */

/** The database's two words. Policies and queries speak these; Indonesian is a
 *  display concern. */
export type Role = "caregiver" | "patient";

/** Who is signed in, as the application understands them. */
export type SessionProfile = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl: string | null;
  /** First letter, for the avatar circle. */
  initial: string;
};

export const ROLE_LABEL: Record<Role, string> = {
  caregiver: "Pendamping",
  patient: "Pasien",
};

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

/** Where each role lands after signing in.
 *
 *  One table, read by the login action, the proxy, and the two alias routes, so
 *  "which app does this person belong in" is answered in exactly one place. The
 *  brief names these `/caregiver/dashboard` and `/patient/home`; both of those
 *  paths exist and redirect here rather than being the real routes, because the
 *  patient app is a whole subtree under `/pasien` — `/pasien/jurnal`,
 *  `/pasien/maskot`, `/pasien/pendamping` and the rest — and renaming the root
 *  of it would break every link in the rail and the bottom bar for the sake of
 *  a spelling. */
export const HOME_FOR: Record<Role, string> = {
  caregiver: "/",
  patient: "/pasien",
};

/** Normalises whatever a role field happens to hold.
 *
 *  Three spellings are in circulation: the database's `caregiver`/`patient`,
 *  the Indonesian `pendamping`/`pasien` that the old signup form wrote into
 *  auth metadata, and nothing at all for accounts created through Google, which
 *  carry no role until the profile trigger defaults one. */
export function normaliseRole(value: unknown): Role {
  return value === "patient" || value === "pasien" ? "patient" : "caregiver";
}

/** Whether this account has ever answered "pendamping or pasien".
 *
 *  Read from **auth metadata**, never from `profiles.role`, and the distinction
 *  is the whole mechanism: `profiles.role` always holds something, because the
 *  signup trigger defaults it to caregiver, so it cannot tell "chose caregiver"
 *  apart from "was never asked". Metadata only carries a `role` if somebody put
 *  one there — the email signup form, or `chooseRole`. Absent means unanswered,
 *  which is every Google account until it has been through `/login/peran`.
 *
 *  Lives here rather than beside `chooseRole` because the proxy needs it, and
 *  every export of a `"use server"` module has to be an async action. It is
 *  also free to call: the user object is already in hand wherever this is
 *  asked, so it is a property read and not a query. */
export function hasChosenRole(metadata: { role?: unknown } | undefined | null): boolean {
  const role = metadata?.role;
  return role === "caregiver" || role === "patient" || role === "pendamping" || role === "pasien";
}

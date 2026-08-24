import { cache } from "react";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import { normaliseRole, type Role, type SessionProfile } from "./roles";

/** Who is signed in, as the application understands them.
 *
 *  `auth.users` answers "is this a real session"; `public.profiles` answers
 *  "who is this to Karsa" — their name and whether they are a caregiver or a
 *  patient. Both are needed, so both are fetched here and nowhere else.
 *
 *  Wrapped in React's `cache`, so a layout, a page and three components asking
 *  in the same render all share one round trip. Per-request, never across
 *  requests: this holds a specific person's identity.
 *
 *  The shape and the Indonesian labels live in `./roles`, which imports nothing
 *  — the rail is a client component and must not pull `next/headers` in behind
 *  a shared type.
 *
 *  Returns `null` rather than throwing when nobody is signed in, and also when
 *  Supabase is not configured at all — the design pages still have to render
 *  for someone working on them without credentials. */

export const getSessionProfile = cache(async (): Promise<SessionProfile | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  /* `getUser`, never `getSession`: the latter trusts a cookie the client sent,
     which on the server is just something a stranger can forge. */
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  /* `maybeSingle`, and a fallback below: the row is created by a database
     trigger, and an account made before that trigger existed has none. Better a
     usable session with a name derived from the email than a crash. */
  const email = user.email ?? "";
  const fullName = profile?.full_name?.trim() || email.split("@")[0] || "Pengguna";
  const role: Role =
    profile?.role === "patient" || profile?.role === "caregiver"
      ? profile.role
      : normaliseRole(user.user_metadata?.role);

  return {
    id: user.id,
    email,
    fullName,
    role,
    avatarUrl: profile?.avatar_url ?? null,
    initial: fullName.charAt(0).toUpperCase() || "?",
  };
});


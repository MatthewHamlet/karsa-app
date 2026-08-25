import { cache } from "react";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import { normaliseRole, type Role, type SessionProfile } from "./roles";



export const getSessionProfile = cache(async (): Promise<SessionProfile | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();


  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();


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


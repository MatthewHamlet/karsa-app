"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { NOT_CONFIGURED_MESSAGE, SUPABASE_URL, isSupabaseConfigured } from "../supabase/config";
import { getSessionProfile } from "../profile";

/** Writes for Komunitas.
 *
 *  Every one of these is a POST endpoint anybody who can load the site can
 *  call, so none of them trusts its arguments. The owner column is always sent
 *  as the caller's own id *and* checked by an RLS policy that requires it to
 *  equal `auth.uid()` — sending it is what makes the row correct, the policy is
 *  what makes it impossible to send anything else. */

export type CommunityResult = { error: string | null; ok?: boolean };

const NOT_SIGNED_IN = "Kamu belum masuk.";

function readable(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("duplicate key")) return "Sudah tercatat sebelumnya.";
  if (m.includes("row-level security") || m.includes("violates row-level"))
    return "Kamu tidak punya akses untuk melakukan itu.";
  return process.env.NODE_ENV === "development"
    ? `Gagal menyimpan.\n\n[dev] ${message}`
    : "Gagal menyimpan. Coba lagi sebentar lagi.";
}

/** Splits "lansia, obat" or a newline-separated list into clean terms. */
function terms(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[,\n#]/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, 8);
}

export async function createPost(
  _prev: CommunityResult,
  formData: FormData,
): Promise<CommunityResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const groupId = String(formData.get("group_id") ?? "").trim();
  const tags = terms(String(formData.get("tags") ?? ""));
  const imageUrl = String(formData.get("image_url") ?? "").trim();

  if (!title) return { error: "Judulnya harus diisi." };
  if (title.length > 160) return { error: "Judulnya terlalu panjang." };
  if (body.length > 8000) return { error: "Ceritanya terlalu panjang." };

  /* The URL arrives from the browser, so it is a request rather than a fact.
     Only our own Supabase storage host is accepted — without this the field is
     an open invitation to hotlink an arbitrary image, which is how a feed ends
     up rendering something nobody here uploaded and cannot take down. */
  if (imageUrl && !imageUrl.startsWith(`${SUPABASE_URL}/storage/v1/object/public/community/`)) {
    return { error: "Gambarnya tidak dikenali. Unggah ulang ya." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("community_posts").insert({
    author_id: me.id,
    group_id: groupId || null,
    title,
    body,
    tags,
    image_url: imageUrl || null,
    /* The search box reads `keywords`, and asking somebody to fill in two
       nearly identical fields is how you get one of them left empty. The tags
       they typed are the keywords. */
    keywords: tags,
  });

  if (error) return { error: readable(error.message) };

  revalidatePath("/community");
  revalidatePath("/pasien/komunitas");
  return { error: null, ok: true };
}

/** Upvote, or take it back.
 *
 *  A toggle rather than an insert: the control is a button that shows its own
 *  state, and one that cannot be un-pressed turns a mis-tap into a permanent
 *  endorsement. The primary key on `(post_id, profile_id)` is what makes the
 *  read-then-write safe — a double submit can only ever land one row. */
export async function toggleVote(
  _prev: CommunityResult,
  formData: FormData,
): Promise<CommunityResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const postId = String(formData.get("post_id") ?? "").trim();
  if (!postId) return { error: "Postingannya tidak ditemukan." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("community_votes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", me.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("community_votes")
        .delete()
        .eq("post_id", postId)
        .eq("profile_id", me.id)
    : await supabase.from("community_votes").insert({ post_id: postId, profile_id: me.id });

  if (error) return { error: readable(error.message) };

  revalidatePath("/community");
  revalidatePath("/pasien/komunitas");
  return { error: null, ok: true };
}

export async function toggleGroup(
  _prev: CommunityResult,
  formData: FormData,
): Promise<CommunityResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const groupId = String(formData.get("group_id") ?? "").trim();
  if (!groupId) return { error: "Grupnya tidak ditemukan." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("community_group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("profile_id", me.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("community_group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("profile_id", me.id)
    : await supabase
        .from("community_group_members")
        .insert({ group_id: groupId, profile_id: me.id });

  if (error) return { error: readable(error.message) };

  revalidatePath("/community");
  revalidatePath("/pasien/komunitas");
  return { error: null, ok: true };
}

export async function toggleSession(
  _prev: CommunityResult,
  formData: FormData,
): Promise<CommunityResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const sessionId = String(formData.get("session_id") ?? "").trim();
  if (!sessionId) return { error: "Sesinya tidak ditemukan." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("community_session_signups")
    .select("session_id")
    .eq("session_id", sessionId)
    .eq("profile_id", me.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("community_session_signups")
        .delete()
        .eq("session_id", sessionId)
        .eq("profile_id", me.id)
    : await supabase
        .from("community_session_signups")
        .insert({ session_id: sessionId, profile_id: me.id });

  if (error) return { error: readable(error.message) };

  revalidatePath("/community");
  revalidatePath("/pasien/komunitas");
  return { error: null, ok: true };
}

export async function toggleFollow(
  _prev: CommunityResult,
  formData: FormData,
): Promise<CommunityResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const target = String(formData.get("profile_id") ?? "").trim();
  if (!target) return { error: "Orangnya tidak ditemukan." };
  if (target === me.id) return { error: "Tidak bisa mengikuti diri sendiri." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("community_follows")
    .select("followee_id")
    .eq("follower_id", me.id)
    .eq("followee_id", target)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("community_follows")
        .delete()
        .eq("follower_id", me.id)
        .eq("followee_id", target)
    : await supabase
        .from("community_follows")
        .insert({ follower_id: me.id, followee_id: target });

  if (error) return { error: readable(error.message) };

  revalidatePath("/community");
  revalidatePath("/pasien/komunitas");
  return { error: null, ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { NOT_CONFIGURED_MESSAGE, SUPABASE_URL, isSupabaseConfigured } from "../supabase/config";
import { getSessionProfile } from "../profile";
import {
  getCommunityPosts,
  getGroupMembers,
  getGroupMessages,
  getPostComments,
  getProfileCard,
  searchPeople,
} from "./queries";
import { getInvitablePatients } from "../care/queries";
import { POSTS_PER_PAGE } from "./constants";



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

    keywords: tags,
  });

  if (error) return { error: readable(error.message) };

  revalidatePath("/community");
  revalidatePath("/pasien/komunitas");
  return { error: null, ok: true };
}


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

const ART_KINDS = ["nutrition", "elderly", "mind", "recovery"];
const TONE_KINDS = ["green", "lavender", "peach", "blue", "cream"];

export async function createGroup(
  _prev: CommunityResult,
  formData: FormData,
): Promise<CommunityResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const name = String(formData.get("name") ?? "").trim();
  const blurb = String(formData.get("blurb") ?? "").trim();
  const art = String(formData.get("art") ?? "elderly").trim();
  const tone = String(formData.get("tone") ?? "green").trim();
  const keywords = terms(String(formData.get("keywords") ?? ""));

  if (!name) return { error: "Nama grupnya harus diisi." };
  if (name.length > 80) return { error: "Nama grupnya terlalu panjang." };
  if (blurb.length > 300) return { error: "Deskripsinya terlalu panjang." };

  const supabase = await createClient();
  const { error } = await supabase.from("community_groups").insert({
    name,
    blurb,
    art: ART_KINDS.includes(art) ? art : "elderly",
    tone: TONE_KINDS.includes(tone) ? tone : "green",
    keywords,
    created_by: me.id,
  });

  if (error) {
    if (error.message.toLowerCase().includes("community_groups_one_per_creator")) {
      return { error: "Kamu sudah punya satu grup. Satu akun hanya bisa membuat satu grup." };
    }
    return { error: readable(error.message) };
  }

  revalidatePath("/community");
  revalidatePath("/pasien/komunitas");
  return { error: null, ok: true };
}

export async function kickMember(
  _prev: CommunityResult,
  formData: FormData,
): Promise<CommunityResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const groupId = String(formData.get("group_id") ?? "").trim();
  const profileId = String(formData.get("profile_id") ?? "").trim();
  if (!groupId || !profileId) return { error: "Anggotanya tidak ditemukan." };
  if (profileId === me.id) return { error: "Kamu admin grup ini, tidak bisa keluar sendiri." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("profile_id", profileId)
    .select("group_id");

  if (error) return { error: readable(error.message) };
  if (!data?.length) return { error: "Kamu bukan admin grup ini." };

  revalidatePath("/community");
  revalidatePath("/pasien/komunitas");
  return { error: null, ok: true };
}

export async function loadMorePosts(offset: number) {
  return getCommunityPosts(POSTS_PER_PAGE, Math.max(0, offset));
}

export async function loadPostComments(postId: string) {
  return getPostComments(postId);
}

export async function addComment(
  _prev: CommunityResult,
  formData: FormData,
): Promise<CommunityResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const postId = String(formData.get("post_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!postId) return { error: "Postingannya tidak ditemukan." };
  if (!body) return { error: "Komentarnya masih kosong." };
  if (body.length > 2000) return { error: "Komentarnya terlalu panjang." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("community_comments")
    .insert({ post_id: postId, author_id: me.id, body });

  if (error) return { error: readable(error.message) };

  revalidatePath("/community");
  revalidatePath("/pasien/komunitas");
  return { error: null, ok: true };
}

export async function deleteComment(
  _prev: CommunityResult,
  formData: FormData,
): Promise<CommunityResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const id = String(formData.get("comment_id") ?? "").trim();
  if (!id) return { error: "Komentarnya tidak ditemukan." };

  const supabase = await createClient();
  const { error } = await supabase.from("community_comments").delete().eq("id", id);

  if (error) return { error: readable(error.message) };

  revalidatePath("/community");
  revalidatePath("/pasien/komunitas");
  return { error: null, ok: true };
}

export async function loadGroupMembers(groupId: string) {
  return getGroupMembers(groupId);
}

export async function loadGroupMessages(groupId: string) {
  return getGroupMessages(groupId);
}

export async function sendGroupMessage(
  _prev: CommunityResult,
  formData: FormData,
): Promise<CommunityResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const groupId = String(formData.get("group_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!groupId) return { error: "Grupnya tidak ditemukan." };
  if (!body) return { error: "Pesannya masih kosong." };
  if (body.length > 2000) return { error: "Pesannya terlalu panjang." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("community_group_messages")
    .insert({ group_id: groupId, author_id: me.id, body });

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




export async function findPeople(query: string) {
  return searchPeople(query);
}


export async function loadProfileCard(profileId: string) {
  const [profile, me] = await Promise.all([getProfileCard(profileId), getSessionProfile()]);
  if (!profile) return null;


  const myPatients = me ? await getInvitablePatients(profileId) : [];

  return { profile, myPatients, meId: me?.id ?? null };
}

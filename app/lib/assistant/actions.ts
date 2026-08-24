"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from "../supabase/config";
import { getSessionProfile } from "../profile";

export type AssistantResult = { error: string | null };

const NOT_SIGNED_IN = "Kamu belum masuk.";

function refresh() {
  revalidatePath("/mascot");
  revalidatePath("/pasien/maskot");
}

export async function deleteAssistantThread(id: string): Promise<AssistantResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };

  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };
  if (!id) return { error: "Percakapan tidak ditemukan." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("assistant_threads")
    .delete()
    .eq("id", id)
    .eq("owner_id", me.id);

  if (error) return { error: "Gagal menghapus percakapan. Coba lagi." };

  refresh();
  return { error: null };
}

export async function clearAssistantHistory(): Promise<AssistantResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };

  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const supabase = await createClient();
  const { error } = await supabase
    .from("assistant_threads")
    .delete()
    .eq("owner_id", me.id);

  if (error) return { error: "Gagal menghapus riwayat. Coba lagi." };

  refresh();
  return { error: null };
}

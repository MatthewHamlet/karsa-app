"use server";

import { revalidateAccount } from "../revalidate";
import { createClient } from "../supabase/server";
import { NOT_CONFIGURED_MESSAGE, SUPABASE_URL, isSupabaseConfigured } from "../supabase/config";
import { getSessionProfile } from "../profile";

export type SettingsResult = { error: string | null; ok?: boolean };

const NOT_SIGNED_IN = "Kamu belum masuk.";

function readable(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("profiles_theme_check")) return "Pilihan temanya tidak dikenali.";
  if (m.includes("profiles_text_scale_check")) return "Ukuran teksnya tidak dikenali.";
  if (m.includes("profiles_language_check")) return "Bahasanya tidak dikenali.";
  if (m.includes("row-level security")) return "Kamu tidak punya akses untuk mengubah itu.";
  return process.env.NODE_ENV === "development"
    ? `Gagal menyimpan.\n\n[dev] ${message}`
    : "Gagal menyimpan. Coba lagi sebentar lagi.";
}

async function patch(fields: Record<string, unknown>): Promise<SettingsResult> {
  const me = await getSessionProfile();
  if (!me) return { error: NOT_SIGNED_IN };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", me.id)
    .select("id");

  if (error) return { error: readable(error.message) };
  if (!data?.length) return { error: "Profilnya tidak ditemukan." };

  revalidateAccount();
  return { error: null, ok: true };
}

const trimmed = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function updateProfile(
  _prev: SettingsResult,
  formData: FormData,
): Promise<SettingsResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };

  const fullName = trimmed(formData, "full_name");
  const headline = trimmed(formData, "headline");
  const avatarUrl = trimmed(formData, "avatar_url");

  if (!fullName) return { error: "Nama tidak boleh kosong." };
  if (fullName.length > 80) return { error: "Namanya terlalu panjang." };
  if (headline.length > 120) return { error: "Deskripsinya terlalu panjang." };


  if (avatarUrl && !avatarUrl.startsWith(`${SUPABASE_URL}/storage/v1/object/public/avatars/`)) {
    return { error: "Foto profilnya tidak dikenali. Coba pilih ulang." };
  }

  return patch({
    full_name: fullName,
    headline: headline || null,
    avatar_url: avatarUrl || null,
  });
}

export async function updatePersonalInfo(
  _prev: SettingsResult,
  formData: FormData,
): Promise<SettingsResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };

  const phone = trimmed(formData, "phone");
  const birth = trimmed(formData, "date_of_birth");
  const address = trimmed(formData, "address");
  const emergency = trimmed(formData, "emergency_contact");

  if (phone && !/^[+0-9][0-9\s-]{5,19}$/.test(phone)) {
    return { error: "Nomor teleponnya belum benar." };
  }
  if (birth && !/^\d{4}-\d{2}-\d{2}$/.test(birth)) {
    return { error: "Tanggal lahirnya belum benar." };
  }
  if (birth && new Date(birth) > new Date()) {
    return { error: "Tanggal lahirnya tidak boleh di masa depan." };
  }
  if (address.length > 200) return { error: "Alamatnya terlalu panjang." };
  if (emergency.length > 80) return { error: "Kontak daruratnya terlalu panjang." };

  return patch({
    phone: phone || null,
    date_of_birth: birth || null,
    address: address || null,
    emergency_contact: emergency || null,
  });
}

const THEMES = ["system", "light", "dark"];
const SCALES = ["small", "medium", "large"];
const LANGUAGES = ["id", "en"];

export async function updateAppearance(
  _prev: SettingsResult,
  formData: FormData,
): Promise<SettingsResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };

  const theme = trimmed(formData, "theme");
  const scale = trimmed(formData, "text_scale");
  const language = trimmed(formData, "language");
  const reduceMotion = formData.get("reduce_motion") === "on";

  if (!THEMES.includes(theme)) return { error: "Pilihan temanya tidak dikenali." };
  if (!SCALES.includes(scale)) return { error: "Ukuran teksnya tidak dikenali." };
  if (!LANGUAGES.includes(language)) return { error: "Bahasanya tidak dikenali." };

  return patch({
    theme,
    text_scale: scale,
    language,
    reduce_motion: reduceMotion,
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { NOT_CONFIGURED_MESSAGE, isSupabaseConfigured } from "../supabase/config";
import { getSessionProfile } from "../profile";

export type ScanResult = { error: string | null; ok?: boolean };

export async function savePrescription(
  _prev: ScanResult,
  formData: FormData,
): Promise<ScanResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: "Kamu belum masuk." };

  const patientId = String(formData.get("patient_id") ?? "").trim();
  const clinic = String(formData.get("clinic") ?? "").trim();
  const doctor = String(formData.get("doctor") ?? "").trim();
  const rawText = String(formData.get("raw_text") ?? "").trim();
  const imagePath = String(formData.get("image_path") ?? "").trim();

  if (!patientId) return { error: "Pasien tidak ditemukan." };
  if (imagePath && !imagePath.startsWith(`${patientId}/`)) {
    return { error: "Fotonya tidak dikenali." };
  }

  let medicines: { name: string; dose: string; rule: string; times: string[] }[];
  try {
    const parsed: unknown = JSON.parse(String(formData.get("medicines") ?? "[]"));
    if (!Array.isArray(parsed)) throw new Error("not an array");
    medicines = parsed
      .map((row) => {
        const r = row as Record<string, unknown>;
        return {
          name: String(r.name ?? "").trim().slice(0, 80),
          dose: String(r.dose ?? "").trim().slice(0, 60),
          rule: String(r.rule ?? "").trim().slice(0, 80),
          times: Array.isArray(r.times)
            ? r.times.map((t) => String(t).trim()).filter(Boolean).slice(0, 6)
            : [],
        };
      })
      .filter((m) => m.name.length > 0);
  } catch {
    return { error: "Daftar obatnya tidak bisa dibaca." };
  }

  if (medicines.length === 0) return { error: "Belum ada obat yang bisa disimpan." };

  const supabase = await createClient();

  const { data: prescription, error: headError } = await supabase
    .from("prescriptions")
    .insert({
      patient_id: patientId,
      clinic,
      doctor,
      raw_text: rawText || null,
      image_path: imagePath || null,
      scanned_by: me.id,
    })
    .select("id")
    .single();

  if (headError || !prescription) {
    return {
      error:
        process.env.NODE_ENV === "development"
          ? `Gagal menyimpan resep.\n\n[dev] ${headError?.message}`
          : "Gagal menyimpan resep. Coba lagi sebentar lagi.",
    };
  }

  const { error: medError } = await supabase.from("medications").insert(
    medicines.map((m) => ({
      patient_id: patientId,
      prescription_id: prescription.id,
      name: m.name,
      dose: m.dose,
      rule: m.rule,
      times: m.times,
    })),
  );

  if (medError) {
    return {
      error:
        process.env.NODE_ENV === "development"
          ? `Resep tersimpan tapi obatnya gagal.\n\n[dev] ${medError.message}`
          : "Resepnya tersimpan, tapi daftar obatnya gagal. Coba lagi.",
    };
  }

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

export async function deletePrescription(
  _prev: ScanResult,
  formData: FormData,
): Promise<ScanResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  const me = await getSessionProfile();
  if (!me) return { error: "Kamu belum masuk." };

  const id = String(formData.get("prescription_id") ?? "").trim();
  if (!id) return { error: "Resepnya tidak ditemukan." };

  const supabase = await createClient();
  const { error } = await supabase.from("prescriptions").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus resep." };

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

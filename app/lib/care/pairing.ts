"use server";

import { revalidateRelationships } from "../revalidate";
import { createClient } from "../supabase/server";
import { NOT_CONFIGURED_MESSAGE, isSupabaseConfigured } from "../supabase/config";
import { getSessionProfile } from "../profile";

export type PairCode = {
  code: string;
  expiresAt: string;
  relation: string | null;
};

export type PairCodeResult =
  | { ok: true; code: PairCode; error: null }
  | { ok: false; code: null; error: string };

export async function createPairingCode(relation?: string): Promise<PairCodeResult> {
  if (!isSupabaseConfigured()) return { ok: false, code: null, error: NOT_CONFIGURED_MESSAGE };

  const me = await getSessionProfile();
  if (!me) return { ok: false, code: null, error: "Kamu belum masuk." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_pairing_code", {
    p_relation: relation?.trim() || null,
  });

  if (error) {
    return {
      ok: false,
      code: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Gagal membuat kode.\n\n[dev] ${error.message}`
          : "Gagal membuat kode. Coba lagi sebentar lagi.",
    };
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { code: string; expires_at: string; relation: string | null }
    | undefined;

  if (!row?.code) return { ok: false, code: null, error: "Kode tidak terbuat. Coba lagi." };

  return {
    ok: true,
    error: null,
    code: { code: row.code, expiresAt: row.expires_at, relation: row.relation ?? null },
  };
}

export type RedeemState = {
  error: string | null;
  ok?: boolean;
  caregiverName?: string;
};

const REDEEM_MESSAGE: Record<string, string> = {
  not_signed_in: "Kamu belum masuk.",
  invalid: "Kodenya tidak cocok, sudah dipakai, atau sudah kedaluwarsa.",
  own_code: "Itu kodemu sendiri. Berikan kode ini ke orang yang kamu dampingi.",
  rate_limited: "Terlalu banyak percobaan. Coba lagi satu jam lagi ya.",
};

export async function redeemPairingCode(
  _prev: RedeemState,
  formData: FormData,
): Promise<RedeemState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };

  const me = await getSessionProfile();
  if (!me) return { error: "Kamu belum masuk." };

  const raw = String(formData.get("code") ?? "").trim().toUpperCase();
  const code = raw.replace(/[^A-Z0-9-]/g, "");

  if (code.replace(/^KRS-/, "").length < 6) {
    return { error: "Kodenya 6 karakter setelah KRS-." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_pairing_code", { p_code: code });

  if (error) {
    return {
      error:
        process.env.NODE_ENV === "development"
          ? `Gagal menghubungkan.\n\n[dev] ${error.message}`
          : "Gagal menghubungkan. Coba lagi sebentar lagi.",
    };
  }

  const verdict = data as { ok?: boolean; reason?: string; caregiver_name?: string } | null;

  if (!verdict?.ok) {
    return { error: REDEEM_MESSAGE[verdict?.reason ?? ""] ?? "Kodenya tidak bisa dipakai." };
  }

  revalidateRelationships();
  return { error: null, ok: true, caregiverName: verdict.caregiver_name ?? "Pendamping" };
}

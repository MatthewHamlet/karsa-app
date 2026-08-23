"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { NOT_CONFIGURED_MESSAGE, isSupabaseConfigured } from "../supabase/config";
import { getSessionProfile } from "../profile";

/** Pairing: the caregiver mints a code, the patient redeems it.
 *
 *  Both sides are one `rpc` call each. The work belongs in Postgres rather than
 *  here because redeeming does four things that must not half-happen — check
 *  the code, make sure the caller has a patient record, write the relationship,
 *  burn the code — and four round trips from a browser is four chances to stop
 *  halfway. See `supabase/migrations/0008_pairing.sql`.
 *
 *  Nothing in this file decides who may pair with whom. The functions it calls
 *  are `security definer` and do their own checking; these wrappers exist to
 *  turn a database answer into a sentence somebody can read. */

export type PairCode = {
  code: string;
  /** ISO. The modal counts down from it. */
  expiresAt: string;
  relation: string | null;
};

export type PairCodeResult =
  | { ok: true; code: PairCode; error: null }
  | { ok: false; code: null; error: string };

/** Mints a pairing code for the signed-in caregiver, or returns the one they
 *  already have.
 *
 *  Reusing an unexpired code matters more than it looks: a caregiver who has
 *  already written the code on a sticky note and closes the modal must not come
 *  back to a different one. The reuse lives in SQL so both callers get it. */
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

  /* The function is `returns table`, so PostgREST hands back an array even
     though it can only ever have one row in it. */
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
  /** Who the patient just connected to, for the confirmation line. */
  caregiverName?: string;
};

/** The database's verdicts, in the language the app speaks.
 *
 *  `invalid` deliberately covers "no such code", "already used" and "expired"
 *  at once — the function does not distinguish them, because telling them apart
 *  confirms which codes exist to anyone guessing. */
const REDEEM_MESSAGE: Record<string, string> = {
  not_signed_in: "Kamu belum masuk.",
  invalid: "Kodenya tidak cocok, sudah dipakai, atau sudah kedaluwarsa.",
  own_code: "Itu kodemu sendiri. Berikan kode ini ke orang yang kamu dampingi.",
  rate_limited: "Terlalu banyak percobaan. Coba lagi satu jam lagi ya.",
};

/** Redeems a code, run by the person being cared for.
 *
 *  On success the relationship is `active` straight away. The consent this
 *  records is the patient's own, and they are the one who just typed the code —
 *  asking them to approve their own action afterwards would be theatre. */
export async function redeemPairingCode(
  _prev: RedeemState,
  formData: FormData,
): Promise<RedeemState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };

  const me = await getSessionProfile();
  if (!me) return { error: "Kamu belum masuk." };

  const raw = String(formData.get("code") ?? "").trim().toUpperCase();
  /* Everything that is not a code character goes, so a pasted "KRS-8H2 K9M" or
     a link's worth of surrounding text still resolves. The database normalises
     the prefix itself. */
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

  /* The whole app changes shape once a relationship exists — the onboarding
     gate opens, the dashboard has somebody in it. */
  revalidatePath("/", "layout");
  return { error: null, ok: true, caregiverName: verdict.caregiver_name ?? "Pendamping" };
}

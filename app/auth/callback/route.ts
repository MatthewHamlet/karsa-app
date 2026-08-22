import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/config";

/** Where every link Supabase sends comes back to: Google, the signup
 *  confirmation email, and the password reset email.
 *
 *  A Route Handler rather than a page because it has to set cookies, which a
 *  Server Component may not. The proxy's matcher skips this path so a session
 *  refresh cannot race the exchange.
 *
 *  ── Two shapes arrive here, not one ───────────────────────────────────────
 *  OAuth returns `?code=`, which is traded for a session. Email links go first
 *  to Supabase's own `/auth/v1/verify`, which then bounces here — and depending
 *  on the project's email templates that arrives either as a `code` too, or as
 *  `token_hash` + `type`, which needs `verifyOtp` instead. Handling only `code`
 *  meant a valid confirmation link fell through to "kode login tidak ditemukan".
 *
 *  ── And failures arrive here as well ──────────────────────────────────────
 *  An expired or already-used link comes back with `error` and `error_code` set
 *  rather than a token. Those used to be answered with a flat "Login Google
 *  dibatalkan", which is wrong and unhelpful for someone who just clicked a
 *  confirmation email. They are translated properly now. */

/** Supabase's failure codes, in the words of the person who hit them. */
function readableCallbackError(code: string | null, raw: string | null): string {
  switch (code) {
    case "otp_expired":
      /* Not only about time. Supabase answers this for any unusable token —
         already clicked, superseded by a newer email, or prefetched and spent
         by a mail scanner before the person got to it. */
      return "Tautannya sudah tidak berlaku — mungkin kedaluwarsa atau sudah pernah dibuka. Minta kirim ulang ya.";
    case "access_denied":
      return "Akses ditolak. Coba ulangi dari awal.";
    case "provider_email_needs_verification":
      return "Email kamu belum diverifikasi.";
    case "validation_failed":
      return "Tautannya tidak lengkap. Coba buka lagi dari email aslinya.";
    default:
      return raw ? "Gagal menyelesaikan proses masuk. Coba lagi ya." : "Tautan tidak dikenali.";
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  /* Only same-site paths. This value ends up in a redirect, and letting an
     arbitrary URL through turns the callback into a phishing hop. */
  const raw = searchParams.get("next") ?? "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`);

  if (!isSupabaseConfigured()) return fail("Supabase belum tersambung.");

  /* Supabase reports refusals before it reports anything else, so this is
     checked first — otherwise the missing-token branch below would answer for
     it with the wrong explanation. */
  const errorCode = searchParams.get("error_code");
  if (searchParams.get("error") || errorCode) {
    return fail(readableCallbackError(errorCode, searchParams.get("error_description")));
  }

  const supabase = await createClient();

  /* Email links in the token-hash shape. Kept ahead of `code` only because the
     two never arrive together. */
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return fail(readableCallbackError(null, error.message));
    return NextResponse.redirect(`${origin}${next}`);
  }

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail(readableCallbackError(null, error.message));
    return NextResponse.redirect(`${origin}${next}`);
  }

  return fail("Tautannya tidak membawa kode apa pun. Coba buka lagi dari email aslinya.");
}

import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { hasChosenRole } from "../../lib/roles";




function readableCallbackError(code: string | null, raw: string | null): string {
  switch (code) {
    case "otp_expired":

      return "Tautannya sudah tidak berlaku, mungkin kedaluwarsa atau sudah pernah dibuka. Minta kirim ulang ya.";
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


  const raw = searchParams.get("next") ?? "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`);

  if (!isSupabaseConfigured()) return fail("Supabase belum tersambung.");


  const errorCode = searchParams.get("error_code");
  if (searchParams.get("error") || errorCode) {
    return fail(readableCallbackError(errorCode, searchParams.get("error_description")));
  }

  const supabase = await createClient();


  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return fail(readableCallbackError(null, error.message));
    return NextResponse.redirect(`${origin}${next}`);
  }

  const code = searchParams.get("code");
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail(readableCallbackError(null, error.message));


    if (!hasChosenRole(data.user?.user_metadata)) {
      const back = `${origin}/login/peran`;

      return NextResponse.redirect(
        next === "/" ? back : `${back}?next=${encodeURIComponent(next)}`,
      );
    }


    if (next === "/") {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user!.id)
        .maybeSingle();

      const home = profileRow?.role === "patient" ? "/pasien" : "/";
      return NextResponse.redirect(`${origin}${home}`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  return fail("Tautannya tidak membawa kode apa pun. Coba buka lagi dari email aslinya.");
}

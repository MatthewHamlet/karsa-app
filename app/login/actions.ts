"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "../lib/supabase/server";
import { NOT_CONFIGURED_MESSAGE, isSupabaseConfigured } from "../lib/supabase/config";
import { OTP_MAX, OTP_MIN } from "../lib/otp";
import { HOME_FOR, normaliseRole } from "../lib/roles";


export type AuthState = { error: string | null };


function readableError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email atau kata sandi salah.";
  if (m.includes("email not confirmed")) return "Email kamu belum dikonfirmasi. Cek kotak masuk dulu ya.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.";
  if (m.includes("provider is not enabled"))
    return "Login Google belum diaktifkan di proyek Supabase kamu.";
  return "Gagal masuk. Coba lagi sebentar lagi.";
}


async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}


function looksLikePhone(value: string): boolean {
  return /^[+0-9][0-9\s-]{6,}$/.test(value.trim());
}


export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };

  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!identifier || !password) return { error: "Email dan kata sandi harus diisi." };


  if (looksLikePhone(identifier)) {
    return { error: "Masuk pakai nomor HP belum aktif. Untuk sekarang gunakan email ya." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: identifier,
    password,
  });

  if (error) return { error: readableError(error.message) };


  revalidatePath("/", "layout");


  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/";


  redirect(safe !== "/" ? safe : await homeForUser(data.user?.id));
}


async function homeForUser(userId: string | undefined): Promise<string> {
  if (!userId) return HOME_FOR.caregiver;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return HOME_FOR[normaliseRole(data?.role)];
}


export async function signInWithGoogle(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };

  const next = String(formData.get("next") ?? "/");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(safeNext)}`,
    },
  });

  if (error) return { error: readableError(error.message) };
  if (!data.url) return { error: "Google tidak mengembalikan alamat login." };

  redirect(data.url);
}


export type SignUpState = {
  error: string | null;
  check_email: boolean;

  email?: string;
  resent?: boolean;
};


export async function signUp(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE, check_email: false };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "pendamping");

  if (!fullName) return { error: "Nama harus diisi.", check_email: false };
  if (!email || !password) return { error: "Email dan kata sandi harus diisi.", check_email: false };
  if (looksLikePhone(email)) {
    return { error: "Daftar pakai nomor HP belum aktif. Untuk sekarang gunakan email ya.", check_email: false };
  }

  if (password.length < 8) {
    return { error: "Kata sandi minimal 8 karakter.", check_email: false };
  }
  if (role !== "pendamping" && role !== "pasien") {
    return { error: "Pilih dulu kamu mendampingi atau pasien.", check_email: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },

      emailRedirectTo: `${await origin()}/auth/callback?next=/`,
    },
  });

  if (error) return { error: readableSignUpError(error.message), check_email: false };


  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return { error: "Email ini sudah terdaftar. Coba masuk saja.", check_email: false };
  }


  if (data.user && !data.session) return { error: null, check_email: true, email };

  revalidatePath("/", "layout");
  redirect("/");
}


export async function resendConfirmation(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE, check_email: true, email };
  if (!email) return { error: "Alamat emailnya tidak terbaca.", check_email: true };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${await origin()}/auth/callback?next=/` },
  });

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("rate") || m.includes("too many") || m.includes("security purposes")) {
      return {
        error:
          "Supabase membatasi pengiriman email (layanan bawaannya cuma beberapa per jam). Tunggu sebentar, atau matikan konfirmasi email di dashboard saat masih pengembangan.",
        check_email: true,
        email,
      };
    }
    if (m.includes("already confirmed")) {
      return { error: "Akun ini sudah terkonfirmasi. Langsung masuk saja.", check_email: true, email };
    }
    if (m.includes("error sending") || m.includes("smtp") || m.includes("mail")) {
      return {
        error: withDetail("Email gagal dikirim. Setelan SMTP di Supabase sepertinya belum benar.", error.message),
        check_email: true,
        email,
      };
    }
    return {
      error: withDetail("Gagal mengirim ulang. Coba lagi sebentar lagi.", error.message),
      check_email: true,
      email,
    };
  }

  return { error: null, check_email: true, email, resent: true };
}


function withDetail(friendly: string, raw: string): string {
  return process.env.NODE_ENV === "development" ? `${friendly}

[dev] ${raw}` : friendly;
}

function readableSignUpError(message: string): string {
  const m = message.toLowerCase();


  if (m.includes("error sending") || m.includes("smtp") || m.includes("mail")) {
    return withDetail(
      "Akunmu tidak jadi dibuat karena email konfirmasinya gagal terkirim. Ini masalah setelan email di server, bukan salah kamu.",
      message,
    );
  }

  if (m.includes("already registered") || m.includes("already been registered"))
    return "Email ini sudah terdaftar. Coba masuk saja.";
  if (m.includes("password")) return "Kata sandi terlalu lemah. Coba yang lebih panjang.";
  if (m.includes("invalid") && m.includes("email")) return "Format email tidak valid.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.";
  if (m.includes("signups not allowed") || m.includes("signup is disabled"))
    return "Pendaftaran sedang ditutup di proyek Supabase kamu.";
  return withDetail("Gagal mendaftar. Coba lagi sebentar lagi.", message);
}


export async function requestPasswordReset(
  _prev: AuthState & { sent?: boolean },
  formData: FormData,
): Promise<AuthState & { sent?: boolean }> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };

  const email = String(formData.get("identifier") ?? "").trim();
  if (!email) return { error: "Email harus diisi." };

  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=/login/kata-sandi-baru`,
  });

  return { error: null, sent: true };
}


export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { error: "Kata sandi minimal 8 karakter." };
  if (password !== confirm) return { error: "Dua kata sandinya belum sama." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi pemulihannya sudah habis. Minta tautan baru dari halaman lupa kata sandi." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: readableSignUpError(error.message) };

  revalidatePath("/", "layout");
  redirect("/");
}



export type OtpState = { error: string | null; email: string; sent?: boolean };

function readableOtpError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("expired")) return "Kodenya sudah kedaluwarsa. Minta kode baru ya.";
  if (m.includes("invalid") || m.includes("not found"))
    return "Kodenya salah. Coba periksa lagi 6 digitnya.";
  if (m.includes("rate") || m.includes("too many") || m.includes("security purposes"))
    return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  return "Gagal memverifikasi kode. Coba lagi sebentar lagi.";
}


export async function verifySignupCode(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");

  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE, email };
  if (token.length < OTP_MIN || token.length > OTP_MAX)
    return { error: `Kodenya ${OTP_MIN} sampai ${OTP_MAX} digit ya, salin lengkap dari email.`, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
  if (error) return { error: readableOtpError(error.message), email };

  revalidatePath("/", "layout");
  redirect("/");
}


export async function sendRecoveryCode(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE, email };
  if (!email) return { error: "Email harus diisi.", email };

  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=/login/kata-sandi-baru`,
  });

  return { error: null, email, sent: true };
}


export async function verifyRecoveryCode(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");

  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE, email };
  if (token.length < OTP_MIN || token.length > OTP_MAX)
    return { error: `Kodenya ${OTP_MIN} sampai ${OTP_MAX} digit ya, salin lengkap dari email.`, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "recovery" });
  if (error) return { error: readableOtpError(error.message), email };

  revalidatePath("/", "layout");
  redirect("/login/kata-sandi-baru");
}




export async function chooseRole(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };

  const picked = String(formData.get("role") ?? "");
  if (picked !== "caregiver" && picked !== "patient") {
    return { error: "Pilih dulu kamu mendampingi atau pasien." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesimu sudah habis. Masuk lagi ya." };


  const { error: metaError } = await supabase.auth.updateUser({ data: { role: picked } });
  if (metaError) return { error: "Gagal menyimpan pilihanmu. Coba lagi sebentar lagi." };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: picked })
    .eq("id", user.id);

  if (profileError) return { error: "Gagal menyimpan pilihanmu. Coba lagi sebentar lagi." };


  if (picked === "patient") {
    const { error } = await supabase.rpc("ensure_my_patient_record");

    if (error && process.env.NODE_ENV === "development") {
      console.error("[chooseRole] ensure_my_patient_record:", error.message);
    }
  }

  revalidatePath("/", "layout");


  const next = String(formData.get("next") ?? "");
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "";
  redirect(safe || HOME_FOR[picked]);
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

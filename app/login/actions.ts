"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "../lib/supabase/server";
import { NOT_CONFIGURED_MESSAGE, isSupabaseConfigured } from "../lib/supabase/config";
import { OTP_MAX, OTP_MIN } from "../lib/otp";
import { HOME_FOR, normaliseRole } from "../lib/roles";

/** What the form gets back. `null` never reaches the UI — a success either
 *  redirects or revalidates, so the only thing worth returning is a problem. */
export type AuthState = { error: string | null };

/** Supabase speaks English and speaks to developers. The person signing in
 *  should be told what to do about it, in the language the rest of the app uses.
 *  Anything unrecognised falls through to a generic line rather than leaking
 *  internal wording. */
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

/** This site's own absolute origin.
 *
 *  Every link Supabase sends — the OAuth hand-off, the confirmation email, the
 *  reset email — needs an absolute URL to come back to, and hardcoding localhost
 *  would break the moment this is deployed. Reading the request's own host keeps
 *  it right in every environment. */
async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Rough test for "they typed a phone number, not an email". Only used to give
 *  an honest message — see the note in `signIn`. */
function looksLikePhone(value: string): boolean {
  return /^[+0-9][0-9\s-]{6,}$/.test(value.trim());
}

/** Email + password sign-in.
 *
 *  A Server Action is a POST endpoint that anyone who can reach the site can
 *  call, so nothing here trusts the caller: the password goes straight to
 *  Supabase, which is what decides. The session cookies are written by the
 *  Supabase client through `cookies()`, so they land `httpOnly` and no token is
 *  ever readable from client-side JavaScript. */
export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };

  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!identifier || !password) return { error: "Email dan kata sandi harus diisi." };

  /* The field invites a phone number, and Supabase can do phone sign-in — but
     only with an SMS provider configured, which is a paid dependency and a
     separate decision. Saying so is better than passing a phone number to the
     email flow and returning "email atau kata sandi salah" for something that
     was never going to work. */
  if (looksLikePhone(identifier)) {
    return { error: "Masuk pakai nomor HP belum aktif. Untuk sekarang gunakan email ya." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: identifier,
    password,
  });

  if (error) return { error: readableError(error.message) };

  /* The layout is rendered per request and now has a different user in it. */
  revalidatePath("/", "layout");

  /* Only ever redirect to a path on this site. `next` arrives from the query
     string, and an open redirect is exactly how a sign-in page gets turned into
     a credible phishing hop to another domain. */
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  /* One form, two apps. Nobody is asked to pick "I am a patient" or "I am a
     caregiver" at the door — the answer is already in their profile, and asking
     invites the wrong answer from somebody who has both roles in their life.
     A `next` from a deep link still wins: it means they were already headed
     somewhere specific and were only interrupted by the login. */
  redirect(safe !== "/" ? safe : await homeForUser(data.user?.id));
}

/** The route this account belongs in.
 *
 *  Read from `profiles`, not from auth metadata: metadata is whatever the
 *  signup form happened to write and is absent entirely for Google accounts,
 *  while the profile row is what the rest of the app reads. Falls back to the
 *  caregiver app, which is the one that copes with having nothing in it — a
 *  patient dropped there sees the onboarding screen rather than a broken page. */
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

/** Hands off to Google, which sends the user back to `/auth/callback`.
 *
 *  Requires the Google provider to be switched on in the Supabase dashboard;
 *  until then Supabase answers "provider is not enabled" and the message above
 *  turns that into something actionable. */
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

/** What the register form gets back: either a problem, or a note that the
 *  account exists but is waiting on a confirmation email. */
export type SignUpState = {
  error: string | null;
  check_email: boolean;
  /** Kept so the "check your email" screen can offer to send it again without
   *  asking the person to type their address a second time. */
  email?: string;
  resent?: boolean;
};

/** Create an account.
 *
 *  `full_name` and `role` are passed as user metadata, which the
 *  `handle_new_user` trigger in `supabase/migrations/0001_profiles.sql` copies
 *  into `public.profiles`. Without that migration applied the signup still
 *  succeeds — there is simply no profile row behind it. */
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
  /* Supabase's own floor is 6. Saying so up front beats a round trip that comes
     back with an English sentence about it. */
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
      /* Without this the confirmation link falls back to the project's Site URL
         and lands on `/`, which handles nothing — so even a perfectly valid link
         left the person on the home page, still signed out. It has to point at
         the one route that knows how to finish the exchange.

         Supabase only honours this if the URL matches the project's Redirect
         URLs allow-list; anything else is silently replaced by the Site URL. */
      emailRedirectTo: `${await origin()}/auth/callback?next=/`,
    },
  });

  if (error) return { error: readableSignUpError(error.message), check_email: false };

  /* Supabase deliberately does NOT error on a duplicate address when email
     confirmation is on — answering "already registered" would turn this form
     into a way to test whether somebody has an account here. Instead it returns
     a user-shaped object with an EMPTY `identities` array and sends nothing.
     Without this check the screen cheerfully asked for a code that was never
     sent, and the person waited for an email that was never coming.
     Saying "coba masuk" reveals nothing a login attempt would not. */
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return { error: "Email ini sudah terdaftar. Coba masuk saja.", check_email: false };
  }

  /* A user with no session means the project requires email confirmation. The
     account is real but unusable until the link is clicked, and saying nothing
     here would leave someone waiting at a form that looked like it did nothing. */
  if (data.user && !data.session) return { error: null, check_email: true, email };

  revalidatePath("/", "layout");
  redirect("/");
}

/** Sends the confirmation email again.
 *
 *  Worth its own action because the built-in mailer is a shared sandbox capped
 *  at a couple of messages an hour, so a first email going missing — eaten by a
 *  spam filter, or spent by a scanner that prefetched the link — used to leave
 *  someone with no way forward but a new account on a new address.
 *
 *  The cap is reported honestly rather than as a generic failure: "try again"
 *  is useless advice when the answer is "in an hour". */
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
        error: withDetail("Email gagal dikirim — setelan SMTP di Supabase sepertinya belum benar.", error.message),
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

/** In development the raw message is appended.
 *
 *  Learned the hard way: an SMTP misconfiguration comes back as "Error sending
 *  confirmation email", which fell through to the generic line below — so the
 *  screen said "coba lagi sebentar lagi" for a problem that no amount of trying
 *  again would fix, and the actual cause was invisible.
 *
 *  Gated on `NODE_ENV` because Supabase's wording is English, technical, and
 *  occasionally leaks configuration detail that a stranger has no business
 *  reading. */
function withDetail(friendly: string, raw: string): string {
  return process.env.NODE_ENV === "development" ? `${friendly}

[dev] ${raw}` : friendly;
}

function readableSignUpError(message: string): string {
  const m = message.toLowerCase();

  /* Delivery failures, kept ahead of everything else: they are the project's
     problem, not the person's, and telling them to check their password would
     send them chasing the wrong thing. */
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

/** Sends a reset link. Deliberately answers the same way whether or not the
 *  address exists — a form that says "email tidak terdaftar" is a free tool for
 *  working out who has an account here. */
export async function requestPasswordReset(
  _prev: AuthState & { sent?: boolean },
  formData: FormData,
): Promise<AuthState & { sent?: boolean }> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE };

  const email = String(formData.get("identifier") ?? "").trim();
  if (!email) return { error: "Email harus diisi." };

  const supabase = await createClient();
  /* Lands on the callback, which turns the recovery token into a session and
     then sends them to the form that sets the new password. */
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=/login/kata-sandi-baru`,
  });

  return { error: null, sent: true };
}

/** Sets a new password for whoever the recovery link signed in.
 *
 *  There is no "current password" field and there does not need to be: reaching
 *  this action at all requires the session minted from the emailed token, and
 *  `updateUser` acts on that session. It still checks there *is* one — the
 *  action is a POST anyone can call, and without this it would be a way to
 *  probe for a logged-in session. */
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

/* ── One-time codes ────────────────────────────────────────────────────────
   Confirmation and password reset both arrive as a 6-digit code rather than a
   link. A link is single-use and fragile in ways a code is not: mail scanners
   prefetch links and spend the token before anyone clicks, and a link opened on
   a different device than the one that started the flow can fail outright. A
   code survives being read on a phone and typed on a laptop.

   Both go through the same `verifyOtp`; only `type` differs. The email template
   decides which of the two the person actually receives — `{{ .Token }}` for a
   code, `{{ .ConfirmationURL }}` for a link — so `/auth/callback` is kept alive
   alongside this, and either template works. */

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

/** Confirms a new account. On success the person is signed in, so this lands
 *  them inside rather than back at the login form. */
export async function verifySignupCode(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");

  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE, email };
  if (token.length < OTP_MIN || token.length > OTP_MAX)
    return { error: `Kodenya ${OTP_MIN}–${OTP_MAX} digit ya — salin lengkap dari email.`, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
  if (error) return { error: readableOtpError(error.message), email };

  revalidatePath("/", "layout");
  redirect("/");
}

/** Sends a reset code. Answers the same way whether or not the address exists —
 *  a form that distinguishes the two is a free tool for working out who has an
 *  account here. */
export async function sendRecoveryCode(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE, email };
  if (!email) return { error: "Email harus diisi.", email };

  const supabase = await createClient();
  /* `redirectTo` still matters: if the project's template is left on the link
     form, the mail carries a link and this is where it lands. */
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=/login/kata-sandi-baru`,
  });

  return { error: null, email, sent: true };
}

/** Trades a reset code for a session, then hands over to the form that sets the
 *  new password. */
export async function verifyRecoveryCode(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");

  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_MESSAGE, email };
  if (token.length < OTP_MIN || token.length > OTP_MAX)
    return { error: `Kodenya ${OTP_MIN}–${OTP_MAX} digit ya — salin lengkap dari email.`, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "recovery" });
  if (error) return { error: readableOtpError(error.message), email };

  revalidatePath("/", "layout");
  redirect("/login/kata-sandi-baru");
}

/* ── Picking a role ────────────────────────────────────────────────────────
   The email form asks up front and passes the answer as user metadata. Google
   sends nothing of ours, so those accounts arrive with no role at all and
   `handle_new_user` falls back to caregiver — a default, not a choice. This is
   where the choice actually gets made. */

/** Records the answer, and sends them into the right half of the app. */
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

  /* Written to both places, and both are load-bearing. `profiles.role` is what
     the application reads; the metadata copy is what marks the question as
     answered, so this screen never appears again. Metadata first — if the
     second write fails, the person is a caregiver who was asked once, which is
     recoverable. The other order leaves them being asked on every page load. */
  const { error: metaError } = await supabase.auth.updateUser({ data: { role: picked } });
  if (metaError) return { error: "Gagal menyimpan pilihanmu. Coba lagi sebentar lagi." };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: picked })
    .eq("id", user.id);

  if (profileError) return { error: "Gagal menyimpan pilihanmu. Coba lagi sebentar lagi." };

  /* A patient needs the record the signup trigger would have made for them had
     it known. Without it their first screen is "belum ada profil pasien" — a
     dead end for somebody who just told the app who they are. */
  if (picked === "patient") {
    const { error } = await supabase.rpc("ensure_my_patient_record");
    /* Not fatal. The record is also created the moment they pair with a
       caregiver, so a failure here costs them one awkward screen rather than
       the account. */
    if (error && process.env.NODE_ENV === "development") {
      console.error("[chooseRole] ensure_my_patient_record:", error.message);
    }
  }

  revalidatePath("/", "layout");

  /* A deep link that was interrupted by this question wins over the role's
     default home — they were already going somewhere specific. */
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

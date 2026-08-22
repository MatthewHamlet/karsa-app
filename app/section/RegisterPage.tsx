"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { ArrowLeft, Eye, EyeOff, MailCheck, RefreshCw, UserPlus } from "lucide-react";
import CodeForm from "../components/CodeForm";
import AuthShell from "./AuthShell";
import {
  resendConfirmation,
  signUp,
  verifySignupCode,
  type OtpState,
  type SignUpState,
} from "../login/actions";

/** Making an account.
 *
 *  The role picker is here rather than buried in settings because it decides
 *  which of the two products someone lands in — a pendamping and a pasien see
 *  different apps — and asking afterwards means guessing wrong first.
 *
 *  The value goes up as user metadata and the `handle_new_user` trigger copies
 *  it into `public.profiles`. It is checked again in the action and a third time
 *  by a `check` constraint on the column, because this is a Server Action: the
 *  POST is reachable by anyone and the radio buttons prove nothing. */
export default function RegisterPage() {
  const [visible, setVisible] = useState(false);
  const [signUpState, action, pending] = useActionState<SignUpState, FormData>(signUp, {
    error: null,
    check_email: false,
  });
  /* Seeded from the signup result rather than kept in its own state: the resend
     needs the address, and re-deriving it from a field the user has since left
     would break the moment they navigated back. */
  const [resendState, resendAction, resending] = useActionState<SignUpState, FormData>(
    resendConfirmation,
    signUpState,
  );

  /* Once a resend has been attempted its answer is the current one. */
  const state: SignUpState = resendState.resent || resendState.error ? resendState : signUpState;

  const [codeState, codeAction, verifying] = useActionState<OtpState, FormData>(verifySignupCode, {
    error: null,
    email: "",
  });

  const uid = useId();
  const nameField = `${uid}-name`;
  const idField = `${uid}-id`;
  const pwField = `${uid}-pw`;

  const field =
    "h-14 w-full rounded-2xl border-2 border-karsa-line bg-white text-[16px] text-neutral-900 outline-none transition-colors duration-200 placeholder:text-neutral-400 focus:border-karsa disabled:opacity-70";

  /* The account exists but cannot be used yet. Showing the form again here would
     invite a second signup that fails as "already registered". */
  if (state.check_email) {
    return (
      <AuthShell quiet>
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-karsa-soft text-karsa-dark">
            <MailCheck size={30} strokeWidth={2.2} aria-hidden />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-neutral-900">
            Masukkan kode
          </h1>
          <p className="mt-3 text-[17px] leading-6 text-neutral-600">
            Akunnya sudah dibuat. Kami kirim kode 6 digit ke{" "}
            <span className="font-bold text-neutral-800">{state.email ?? "email kamu"}</span>.
            Masukkan kodenya di bawah.
          </p>

          {codeState.error && (
            <p
              role="alert"
              className="mt-5 rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-left text-[14px] font-semibold leading-5 text-rose-800"
            >
              {codeState.error}
            </p>
          )}

          {state.email && (
            <CodeForm
              email={state.email}
              action={codeAction}
              pending={verifying}
              submitLabel="KONFIRMASI"
              pendingLabel="MEMERIKSA…"
            />
          )}

          {state.error && (
            <p
              role="alert"
              className="mt-5 rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 whitespace-pre-line text-left text-[14px] font-semibold leading-5 text-amber-900"
            >
              {state.error}
            </p>
          )}
          {state.resent && !state.error && (
            <p
              role="status"
              className="mt-5 rounded-2xl border-2 border-karsa-line bg-karsa-soft px-4 py-3 text-[14px] font-semibold leading-5 text-karsa-dark"
            >
              Kode barunya sudah dikirim.
            </p>
          )}

          {/* The link is single-use and easily lost — a spam filter, or a mail
              scanner that prefetched it and spent the token before anyone
              clicked. Without this the only way forward was another account on
              another address. */}
          {state.email && (
            <form action={resendAction}>
              <input type="hidden" name="email" value={state.email} />
              <button
                type="submit"
                disabled={resending}
                className="mt-3 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-karsa-line bg-white font-semibold text-neutral-800 outline-none transition-colors duration-200 hover:bg-karsa-soft focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={18} strokeWidth={2.6} aria-hidden />
                {resending ? "MENGIRIM…" : "KIRIM ULANG KODE"}
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-3 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-karsa-line bg-white font-semibold text-neutral-800 outline-none transition-colors duration-200 hover:bg-karsa-soft focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            <ArrowLeft size={18} strokeWidth={2.4} aria-hidden />
            Kembali ke halaman masuk
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Buat akun
        </h1>
        <p className="mt-2 text-[15px] text-neutral-500">Mulai pendampingan bareng Karsa</p>
      </header>

      {state.error && (
        <p
          role="alert"
          className="mt-6 rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 whitespace-pre-line text-[15px] font-semibold leading-5 text-rose-800"
        >
          {state.error}
        </p>
      )}

      <form action={action} className="mt-5">
        <label htmlFor={nameField} className="sr-only">
          Nama lengkap
        </label>
        <input
          id={nameField}
          name="full_name"
          type="text"
          autoComplete="name"
          required
          disabled={pending}
          placeholder="Nama lengkap"
          className={`${field} px-5`}
        />

        <label htmlFor={idField} className="sr-only">
          Email
        </label>
        <input
          id={idField}
          name="identifier"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          disabled={pending}
          placeholder="Email"
          className={`${field} mt-3 px-5`}
        />

        <label htmlFor={pwField} className="sr-only">
          Kata sandi
        </label>
        <div className="relative mt-3">
          <input
            id={pwField}
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending}
            placeholder="Kata sandi (min. 8 karakter)"
            className={`${field} pl-5 pr-14`}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="absolute inset-y-0 right-0 grid w-14 place-items-center rounded-r-2xl text-neutral-600 outline-none transition-colors duration-200 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            {visible ? (
              <EyeOff size={22} strokeWidth={2.2} aria-hidden />
            ) : (
              <Eye size={22} strokeWidth={2.2} aria-hidden />
            )}
          </button>
        </div>

        <fieldset className="mt-4" disabled={pending}>
          <legend className="text-[15px] font-semibold text-neutral-700">Kamu di sini sebagai</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {[
              { value: "pendamping", label: "Pendamping", hint: "Merawat orang lain" },
              { value: "pasien", label: "Pasien", hint: "Merawat diri sendiri" },
            ].map((option, i) => (
              /* The whole tile is the label, so the tap target is the card and
                 not a 20px circle beside it. */
              <label
                key={option.value}
                className="cursor-pointer rounded-2xl border-2 border-karsa-line bg-white p-3 transition-colors duration-200 hover:border-karsa/40 has-[:checked]:border-karsa has-[:checked]:bg-karsa-soft"
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  defaultChecked={i === 0}
                  className="sr-only"
                />
                <span className="block text-[16px] font-bold text-neutral-800">{option.label}</span>
                <span className="mt-0.5 block text-[13px] leading-4 text-neutral-500">
                  {option.hint}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={pending}
          className="mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#3f6b44] text-[17px] font-bold tracking-wide text-white outline-none transition-colors duration-200 hover:bg-[#345a39] focus-visible:ring-2 focus-visible:ring-[#3f6b44] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UserPlus size={22} strokeWidth={2.6} aria-hidden />
          {pending ? "SEDANG MENDAFTAR…" : "DAFTAR SEKARANG"}
        </button>
      </form>

      <p className="mt-5 text-center text-[14px] text-neutral-500">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="rounded font-bold text-karsa-dark underline outline-none transition-colors duration-200 hover:text-[#2f4a35] focus-visible:ring-2 focus-visible:ring-karsa/40"
        >
          Masuk di sini
        </Link>
      </p>
    </AuthShell>
  );
}

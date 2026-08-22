"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { ArrowLeft, RefreshCw, Send } from "lucide-react";
import AuthShell from "./AuthShell";
import CodeForm from "../components/CodeForm";
import { sendRecoveryCode, verifyRecoveryCode, type OtpState } from "../login/actions";

/** Two steps on one page: ask for the address, then take the code that arrives.
 *
 *  Kept on one page rather than two routes because the second step needs the
 *  address from the first, and carrying it through a URL would put it in
 *  browser history and server logs for no benefit.
 *
 *  `quiet`: two delighted robots is the wrong greeting for someone locked out.
 *
 *  The confirmation says "kalau terdaftar" rather than "terkirim", and the
 *  action answers identically either way. A form that distinguishes the two is
 *  a free tool for working out who has an account here. */
export default function ForgotPasswordPage() {
  const [sendState, sendAction, sending] = useActionState<OtpState, FormData>(sendRecoveryCode, {
    error: null,
    email: "",
  });
  const [verifyState, verifyAction, verifying] = useActionState<OtpState, FormData>(
    verifyRecoveryCode,
    { error: null, email: "" },
  );

  const uid = useId();
  const idField = `${uid}-id`;

  /* ── Step two ── */
  if (sendState.sent) {
    return (
      <AuthShell quiet>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Masukkan kode</h1>
          <p className="mt-3 text-[17px] leading-6 text-neutral-600">
            Kalau <span className="font-bold text-neutral-800">{sendState.email}</span> terdaftar,
            kode 6 digit sudah kami kirim ke sana.
          </p>

          {verifyState.error && (
            <p
              role="alert"
              className="mt-5 rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-left text-[14px] font-semibold leading-5 text-rose-800"
            >
              {verifyState.error}
            </p>
          )}

          <CodeForm
            email={sendState.email}
            action={verifyAction}
            pending={verifying}
            submitLabel="LANJUT"
            pendingLabel="MEMERIKSA…"
          />

          {/* Re-posts the first form, so a lost code costs one tap. */}
          <form action={sendAction}>
            <input type="hidden" name="email" value={sendState.email} />
            <button
              type="submit"
              disabled={sending}
              className="mt-3 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-karsa-line bg-white font-semibold text-neutral-800 outline-none transition-colors duration-200 hover:bg-karsa-soft focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={18} strokeWidth={2.4} aria-hidden />
              {sending ? "MENGIRIM…" : "KIRIM ULANG KODE"}
            </button>
          </form>

          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded text-[15px] font-semibold text-karsa-dark outline-none hover:underline focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            <ArrowLeft size={16} strokeWidth={2.4} aria-hidden />
            Kembali ke halaman masuk
          </Link>
        </div>
      </AuthShell>
    );
  }

  /* ── Step one ── */
  return (
    <AuthShell quiet>
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Lupa kata sandi</h1>
        <p className="mt-3 text-[17px] leading-6 text-neutral-500">
          Masukkan email akun kamu. Kami kirimkan kode 6 digit untuk membuat kata sandi baru.
        </p>
      </header>

      {sendState.error && (
        <p
          role="alert"
          className="mt-6 rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-[15px] font-semibold leading-5 text-rose-800"
        >
          {sendState.error}
        </p>
      )}

      <form action={sendAction} className="mt-7">
        <label htmlFor={idField} className="sr-only">
          Email
        </label>
        <input
          id={idField}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          disabled={sending}
          placeholder="Email"
          className="h-16 w-full rounded-2xl border-2 border-karsa-line bg-white px-5 text-[17px] text-neutral-900 outline-none transition-colors duration-200 placeholder:text-neutral-400 focus:border-karsa disabled:opacity-70"
        />

        <button
          type="submit"
          disabled={sending}
          className="mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#3f6b44] text-lg font-bold tracking-wide text-white outline-none transition-colors duration-200 hover:bg-[#345a39] focus-visible:ring-2 focus-visible:ring-[#3f6b44] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={20} strokeWidth={2.6} aria-hidden />
          {sending ? "MENGIRIM…" : "KIRIM KODE"}
        </button>
      </form>

      <p className="mt-8 text-center text-[15px] text-neutral-500">
        Ingat kata sandinya?{" "}
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

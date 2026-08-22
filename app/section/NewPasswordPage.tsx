"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import AuthShell from "./AuthShell";
import { updatePassword, type AuthState } from "../login/actions";

/** Where the reset email lands, once the callback has turned its token into a
 *  session. `quiet`: nobody arriving here wants to be beamed at. */
export default function NewPasswordPage() {
  const [visible, setVisible] = useState(false);
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {
    error: null,
  });

  const uid = useId();
  const pwField = `${uid}-pw`;
  const confirmField = `${uid}-confirm`;

  const field =
    "h-16 w-full rounded-2xl border-2 border-karsa-line bg-white text-[17px] text-neutral-900 outline-none transition-colors duration-200 placeholder:text-neutral-400 focus:border-karsa disabled:opacity-70";

  return (
    <AuthShell quiet>
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Kata sandi baru</h1>
        <p className="mt-3 text-[17px] leading-6 text-neutral-500">
          Buat kata sandi baru untuk akun kamu.
        </p>
      </header>

      {state.error && (
        <p
          role="alert"
          className="mt-6 rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-[15px] font-semibold leading-5 text-rose-800"
        >
          {state.error}
        </p>
      )}

      <form action={action} className="mt-7">
        <label htmlFor={pwField} className="sr-only">
          Kata sandi baru
        </label>
        <div className="relative">
          <input
            id={pwField}
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending}
            placeholder="Kata sandi baru (min. 8 karakter)"
            className={`${field} pl-5 pr-16`}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="absolute inset-y-0 right-0 grid w-16 place-items-center rounded-r-2xl text-neutral-600 outline-none transition-colors duration-200 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            {visible ? (
              <EyeOff size={22} strokeWidth={2.2} aria-hidden />
            ) : (
              <Eye size={22} strokeWidth={2.2} aria-hidden />
            )}
          </button>
        </div>

        <label htmlFor={confirmField} className="sr-only">
          Ulangi kata sandi baru
        </label>
        <input
          id={confirmField}
          name="confirm"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
          placeholder="Ulangi kata sandi baru"
          className={`${field} mt-4 px-5`}
        />

        <button
          type="submit"
          disabled={pending}
          className="mt-7 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#3f6b44] text-lg font-bold tracking-wide text-white outline-none transition-colors duration-200 hover:bg-[#345a39] focus-visible:ring-2 focus-visible:ring-[#3f6b44] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <KeyRound size={20} strokeWidth={2.6} aria-hidden />
          {pending ? "MENYIMPAN…" : "SIMPAN KATA SANDI"}
        </button>
      </form>

      <p className="mt-8 text-center text-[15px] text-neutral-500">
        <Link
          href="/login"
          className="rounded font-bold text-karsa-dark underline outline-none transition-colors duration-200 hover:text-[#2f4a35] focus-visible:ring-2 focus-visible:ring-karsa/40"
        >
          Kembali ke halaman masuk
        </Link>
      </p>
    </AuthShell>
  );
}

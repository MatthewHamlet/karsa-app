"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import GoogleMark from "../components/GoogleMark";
import AuthShell from "./AuthShell";
import { signIn, signInWithGoogle, type AuthState } from "../login/actions";

/** The way in.
 *
 *  The meadow, the pair of Karsas and the rounded card around this form all
 *  come from `AuthShell`, shared with the register and reset screens.
 *
 *  No emoji anywhere. They render as a different typeface at a different weight
 *  on every platform, and several of these arrived flat and grey on Windows.
 *  Icons are drawn instead: Lucide, plus Google's own mark on its button.
 *
 *  ── How it submits ────────────────────────────────────────────────────────
 *  The form posts to a Server Action rather than calling Supabase from the
 *  browser. The session cookies come back `httpOnly`, so no token is reachable
 *  from client-side JavaScript, and the password never sits in React state — the
 *  password field is uncontrolled and its value travels only in the `FormData`.
 *
 *  `initialError` carries failures that happened elsewhere and came back on the
 *  URL, which is how the Google callback reports a refusal. */
export default function LoginPage({
  next = "/",
  initialError = null,
}: {
  next?: string;
  initialError?: string | null;
}) {
  const [visible, setVisible] = useState(false);
  /* Controlled, unlike the password. React resets an uncontrolled field when a
     form action settles, so a failed attempt was wiping the email and making the
     user retype it to fix a typo in the password. */
  const [identifier, setIdentifier] = useState("");

  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, {
    error: initialError,
  });
  const [googleState, googleAction, goingToGoogle] = useActionState<AuthState, FormData>(
    signInWithGoogle,
    { error: null },
  );

  /* Whichever failed most recently wins. Two error slots at once would have the
     user reading a stale message beside a fresh one. */
  const error = googleState.error ?? signInState.error;
  const busy = signingIn || goingToGoogle;

  /* Ids rather than hardcoded strings: two of these on one page would otherwise
     share a label target. */
  const uid = useId();
  const idField = `${uid}-id`;
  const pwField = `${uid}-pw`;
  const rememberField = `${uid}-remember`;

  /* Solid white on the card, not the frosted wash this briefly used. Translucent
     fields worked while the form sat straight on the meadow; on a card they are
     one veil too many and the placeholder loses its contrast. */
  const field =
    "h-16 w-full rounded-2xl border-2 border-karsa-line bg-white text-[17px] text-neutral-900 outline-none transition-colors duration-200 placeholder:text-neutral-400 focus:border-karsa disabled:opacity-70";

  return (
    <AuthShell>
          <header>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              Welcome back!
            </h1>
            <p className="mt-3 text-[17px] text-neutral-700">
              Silakan masuk ke akun Karsa kamu
            </p>
          </header>

          {/* Above the fields it is about, so a screen reader meets it before
              the inputs rather than after the button. */}
          {error && (
            <p
              role="alert"
              className="mt-6 rounded-2xl border-2 border-rose-200 bg-rose-50/90 px-4 py-3 text-[15px] font-semibold leading-5 text-rose-800 backdrop-blur-md"
            >
              {error}
            </p>
          )}

          <form action={signInAction} className="mt-7">
            {/* Where to land afterwards, decided by the server and carried in
                the post rather than read from the URL on the client. */}
            <input type="hidden" name="next" value={next} />

            {/* Labels are screen-reader only: the design is placeholder-led,
                but a placeholder is not a label — it disappears the moment you
                type and is not announced as one. */}
            <label htmlFor={idField} className="sr-only">
              Email atau nomor HP
            </label>
            <input
              id={idField}
              name="identifier"
              type="text"
              inputMode="email"
              autoComplete="username"
              required
              disabled={busy}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Email atau No. HP"
              className={`${field} px-5`}
            />

            <label htmlFor={pwField} className="sr-only">
              Kata sandi atau PIN
            </label>
            {/* The toggle sits inside the field's box, so the input carries
                the padding that keeps the text clear of it rather than the
                button overlapping what you typed. */}
            <div className="relative mt-4">
              <input
                id={pwField}
                name="password"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                required
                disabled={busy}
                placeholder="Kata Sandi / PIN"
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

            <div className="mt-5 flex items-center justify-between gap-3">
              <label
                htmlFor={rememberField}
                className="flex cursor-pointer items-center gap-2.5 text-[15px] font-medium text-neutral-700"
              >
                <input
                  id={rememberField}
                  name="remember"
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 cursor-pointer rounded border-2 border-karsa-line bg-white accent-karsa outline-none focus-visible:ring-2 focus-visible:ring-karsa/40"
                />
                Remember me
              </label>

              <Link
                href="/login/lupa-password"
                className="rounded text-[15px] font-semibold text-karsa-dark underline-offset-2 outline-none transition-colors duration-200 hover:underline focus-visible:ring-2 focus-visible:ring-karsa/40"
              >
                Lupa Password?
              </Link>
            </div>

            {/* Deep leaf green, flat. It used to be the app's mid green under a
                large tinted shadow, which on a bright meadow read as a lit
                button rather than a solid one. */}
            <button
              type="submit"
              disabled={busy}
              className="mt-7 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#3f6b44] text-lg font-bold tracking-wide text-white outline-none transition-colors duration-200 hover:bg-[#345a39] focus-visible:ring-2 focus-visible:ring-[#3f6b44] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={22} strokeWidth={2.6} aria-hidden />
              {signingIn ? "SEDANG MASUK…" : "MASUK SEKARANG"}
            </button>
          </form>

          {/* A rule with the word sitting in it, rather than a word floating
              between two rules — the second reads as three separate things. */}
          <div className="my-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-karsa-line" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">
              atau
            </span>
            <span className="h-px flex-1 bg-karsa-line" />
          </div>

          {/* Its own form: a second action cannot share the first one's, and a
              form is what lets this keep working without JavaScript. */}
          <form action={googleAction}>
            <input type="hidden" name="next" value={next} />
            <button
              type="submit"
              disabled={busy}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-karsa-line bg-white text-[16px] font-semibold text-neutral-800 outline-none transition-colors duration-200 hover:bg-karsa-soft focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleMark className="h-5 w-5" />
              {goingToGoogle ? "Menghubungkan…" : "Continue with Google"}
            </button>
          </form>

          <p className="mt-8 text-center text-[15px] text-neutral-700">
            Belum punya akun?{" "}
            <Link
              href="/login/daftar"
              className="rounded font-bold text-karsa-dark underline outline-none transition-colors duration-200 hover:text-[#2f4a35] focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              Daftar sekarang
            </Link>
          </p>
    </AuthShell>
  );
}

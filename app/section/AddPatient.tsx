"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { ArrowLeft, Check, KeyRound, QrCode } from "lucide-react";
import PairingPanel from "../components/PairingPanel";
import { invitePatient, type CareResult } from "../lib/care/actions";

/** Connecting to the person you look after.
 *
 *  Two options and no form. There used to be a third — type their name, their
 *  date of birth, and get a profile for somebody who had never heard of Karsa —
 *  and it is gone: a record created that way belongs to nobody, consents to
 *  nothing, and the person it describes has no way to see or correct what is
 *  written about them. Every link now starts from a code that one of the two
 *  people involved chose to hand over.
 *
 *  The two that remain are the same handshake from either end:
 *
 *    · **Share** — you generate a code and a QR, and they enter it. This is the
 *      common direction, because the caregiver is the one driving and the
 *      person being cared for should have to do as little as possible.
 *    · **Enter** — they already gave you a code, and you type it in. Their
 *      account then shows the request and they approve it.
 *
 *  Share is the default for that reason. */
type Mode = "share" | "enter";

const FIELD =
  "h-14 w-full rounded-2xl border-2 border-karsa-line bg-white px-4 text-[16px] text-neutral-900 outline-none transition-colors duration-200 placeholder:text-neutral-400 focus:border-karsa disabled:opacity-70";

export default function AddPatient({ initialMode = "share" }: { initialMode?: Mode }) {
  /* Which door the caregiver came through. The onboarding screen links straight
     to one of the two — landing them on the first and making them press the
     tile they already pressed is the kind of small friction that reads as the
     app not listening. */
  const [mode, setMode] = useState<Mode>(initialMode);

  const [state, inviteAction, inviting] = useActionState<CareResult, FormData>(invitePatient, {
    error: null,
  });

  const uid = useId();

  if (state.ok) {
    return (
      <Shell>
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-karsa-soft text-karsa-dark">
            <Check size={30} strokeWidth={2.6} aria-hidden />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-neutral-900">
            Undangan terkirim
          </h1>
          <p className="mt-3 text-[16px] leading-6 text-neutral-600">
            Kamu akan bisa melihat datanya setelah dia menyetujui.
          </p>
          <Link
            href="/"
            className="mt-7 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#3f6b44] font-bold text-white outline-none transition-colors duration-200 hover:bg-[#345a39] focus-visible:ring-2 focus-visible:ring-[#3f6b44] focus-visible:ring-offset-2"
          >
            Kembali ke beranda
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Link
        href="/mulai"
        className="inline-flex items-center gap-2 rounded text-[14px] font-semibold text-neutral-500 outline-none transition-colors hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-karsa/40"
      >
        <ArrowLeft size={16} strokeWidth={2.4} aria-hidden />
        Kembali
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900">
        Tambahkan pasien
      </h1>
      <p className="mt-2 text-[15px] text-neutral-500">
        Hubungkan lewat kode undangan atau kode QR.
      </p>

      {/* The whole tile is the label, so the tap target is the card rather than
          a small circle beside it. */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {(
          [
            {
              value: "share" as Mode,
              icon: QrCode,
              title: "Bagikan kode saya",
              hint: "Buat kode & QR untuk dia",
            },
            {
              value: "enter" as Mode,
              icon: KeyRound,
              title: "Saya punya kode",
              hint: "Masukkan kode darinya",
            },
          ]
        ).map((option) => {
          const Icon = option.icon;
          const on = mode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              aria-pressed={on}
              className={`rounded-2xl border-2 p-4 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
                on
                  ? "border-karsa bg-karsa-soft"
                  : "border-karsa-line bg-white hover:border-karsa/40"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={2.2}
                aria-hidden
                className={on ? "text-karsa-dark" : "text-neutral-500"}
              />
              <span className="mt-2 block text-[15px] font-bold text-neutral-800">
                {option.title}
              </span>
              <span className="mt-0.5 block text-[13px] leading-4 text-neutral-500">
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>

      {state.error && mode === "enter" && (
        <p
          role="alert"
          className="mt-5 whitespace-pre-line rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-[14px] font-semibold leading-5 text-rose-800"
        >
          {state.error}
        </p>
      )}

      {mode === "share" ? (
        <div className="mt-7">
          <PairingPanel />
        </div>
      ) : (
        <form action={inviteAction} className="mt-6">
          <label
            htmlFor={`${uid}-code`}
            className="block text-[14px] font-semibold text-neutral-700"
          >
            Kode undangan dari pasien
          </label>
          <p className="mt-1 text-[13px] leading-5 text-neutral-500">
            Minta dia membuka Karsa dan membacakan kode 8 karakter di halaman
            &ldquo;Pendamping saya&rdquo;.
          </p>
          <input
            id={`${uid}-code`}
            name="share_code"
            type="text"
            required
            maxLength={8}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={inviting}
            placeholder="ABCD2345"
            className={`${FIELD} mt-2 text-center text-2xl font-bold uppercase tracking-widest`}
          />

          <label htmlFor={`${uid}-rel`} className="sr-only">
            Hubunganmu dengannya
          </label>
          <input
            id={`${uid}-rel`}
            name="relation"
            type="text"
            maxLength={40}
            disabled={inviting}
            placeholder="Hubunganmu — Ibu, Ayah, Nenek (opsional)"
            className={`${FIELD} mt-3`}
          />

          <button
            type="submit"
            disabled={inviting}
            className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#3f6b44] text-[17px] font-bold tracking-wide text-white outline-none transition-colors duration-200 hover:bg-[#345a39] focus-visible:ring-2 focus-visible:ring-[#3f6b44] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {inviting ? "MENGIRIM…" : "KIRIM UNDANGAN"}
          </button>
        </form>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl px-5 py-8 sm:px-6">
      <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_44px_-28px_rgba(24,32,24,0.4)] ring-1 ring-karsa-line sm:p-8">
        {children}
      </div>
    </div>
  );
}

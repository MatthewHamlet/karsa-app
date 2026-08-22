"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { ArrowLeft, Check, KeyRound, UserPlus } from "lucide-react";
import { createPatientProfile, invitePatient, type CareResult } from "../lib/care/actions";

/** Adding someone to look after.
 *
 *  Two doors, because there are genuinely two situations and pretending
 *  otherwise makes one of them awkward:
 *
 *    · the person already uses Karsa — ask them for access, and wait
 *    · the person has never heard of Karsa — write down what you know, and
 *      start caring for them today
 *
 *  The second is the common case for an elderly parent and the one most apps
 *  get wrong, by insisting the patient sign up first. Here the caregiver gets a
 *  working record immediately, and the patient can claim it whenever they are
 *  ready — or never.
 *
 *  Invitations go by **code**, never by email search. A form that finds people
 *  by address is a free way to test whether somebody has an account here. */
type Mode = "existing" | "new";

const FIELD =
  "h-14 w-full rounded-2xl border-2 border-karsa-line bg-white px-4 text-[16px] text-neutral-900 outline-none transition-colors duration-200 placeholder:text-neutral-400 focus:border-karsa disabled:opacity-70";

export default function AddPatient() {
  const [mode, setMode] = useState<Mode>("new");

  const [inviteState, inviteAction, inviting] = useActionState<CareResult, FormData>(
    invitePatient,
    { error: null },
  );
  const [createState, createAction, creating] = useActionState<CareResult, FormData>(
    createPatientProfile,
    { error: null },
  );

  const state = mode === "existing" ? inviteState : createState;
  const busy = inviting || creating;

  const uid = useId();

  if (state.ok) {
    return (
      <Shell>
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-karsa-soft text-karsa-dark">
            <Check size={30} strokeWidth={2.6} aria-hidden />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-neutral-900">
            {mode === "existing" ? "Undangan terkirim" : "Pasien ditambahkan"}
          </h1>
          <p className="mt-3 text-[16px] leading-6 text-neutral-600">
            {mode === "existing"
              ? "Kamu akan bisa melihat datanya setelah dia menyetujui."
              : "Profilnya sudah dibuat. Nanti dia bisa mengklaimnya sendiri kalau sudah punya akun Karsa."}
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
        href="/"
        className="inline-flex items-center gap-2 rounded text-[14px] font-semibold text-neutral-500 outline-none transition-colors hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-karsa/40"
      >
        <ArrowLeft size={16} strokeWidth={2.4} aria-hidden />
        Kembali
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900">
        Tambahkan pasien
      </h1>
      <p className="mt-2 text-[15px] text-neutral-500">Siapa yang kamu dampingi?</p>

      {/* The whole tile is the label, so the tap target is the card rather than
          a small circle beside it. */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {(
          [
            {
              value: "new" as Mode,
              icon: UserPlus,
              title: "Belum punya akun",
              hint: "Buat profilnya sekarang",
            },
            {
              value: "existing" as Mode,
              icon: KeyRound,
              title: "Sudah pakai Karsa",
              hint: "Minta kode undangannya",
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
                on ? "border-karsa bg-karsa-soft" : "border-karsa-line bg-white hover:border-karsa/40"
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

      {state.error && (
        <p
          role="alert"
          className="mt-5 whitespace-pre-line rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-[14px] font-semibold leading-5 text-rose-800"
        >
          {state.error}
        </p>
      )}

      {mode === "new" ? (
        <form action={createAction} className="mt-5">
          <label htmlFor={`${uid}-name`} className="sr-only">
            Nama pasien
          </label>
          <input
            id={`${uid}-name`}
            name="display_name"
            type="text"
            required
            maxLength={80}
            disabled={busy}
            placeholder="Nama pasien"
            className={FIELD}
          />

          <label htmlFor={`${uid}-rel`} className="sr-only">
            Hubunganmu dengannya
          </label>
          <input
            id={`${uid}-rel`}
            name="relation"
            type="text"
            maxLength={40}
            disabled={busy}
            placeholder="Hubunganmu — Ibu, Ayah, Nenek (opsional)"
            className={`${FIELD} mt-3`}
          />

          <label
            htmlFor={`${uid}-dob`}
            className="mt-4 block text-[14px] font-semibold text-neutral-700"
          >
            Tanggal lahir <span className="font-medium text-neutral-400">(opsional)</span>
          </label>
          <input
            id={`${uid}-dob`}
            name="date_of_birth"
            type="date"
            disabled={busy}
            className={`${FIELD} mt-2`}
          />

          <Submit busy={creating} label="TAMBAHKAN PASIEN" pending="MENYIMPAN…" />
        </form>
      ) : (
        <form action={inviteAction} className="mt-5">
          <label
            htmlFor={`${uid}-code`}
            className="block text-[14px] font-semibold text-neutral-700"
          >
            Kode undangan dari pasien
          </label>
          <p className="mt-1 text-[13px] leading-5 text-neutral-500">
            Minta dia membuka Karsa dan membacakan kode 8 karakter di profilnya.
          </p>
          <input
            id={`${uid}-code`}
            name="share_code"
            type="text"
            required
            maxLength={8}
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
            placeholder="ABCD2345"
            className={`${FIELD} mt-2 text-center font-mono text-[22px] font-bold uppercase tracking-[0.25em]`}
          />

          <label htmlFor={`${uid}-rel2`} className="sr-only">
            Hubunganmu dengannya
          </label>
          <input
            id={`${uid}-rel2`}
            name="relation"
            type="text"
            maxLength={40}
            disabled={busy}
            placeholder="Hubunganmu — Ibu, Ayah, Nenek (opsional)"
            className={`${FIELD} mt-3`}
          />

          <Submit busy={inviting} label="KIRIM UNDANGAN" pending="MENGIRIM…" />
        </form>
      )}
    </Shell>
  );
}

function Submit({ busy, label, pending }: { busy: boolean; label: string; pending: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#3f6b44] text-[17px] font-bold tracking-wide text-white outline-none transition-colors duration-200 hover:bg-[#345a39] focus-visible:ring-2 focus-visible:ring-[#3f6b44] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? pending : label}
    </button>
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

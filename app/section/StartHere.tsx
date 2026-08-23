"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Plus } from "lucide-react";
import Mascot from "../components/Mascot";
import RoomScene from "../components/RoomScene";
import PairingModal from "../components/PairingModal";
import { signOut } from "../login/actions";

/** The first screen a caregiver ever sees, and the only one they can reach
 *  until they are looking after somebody.
 *
 *  ── Why it is the whole screen ────────────────────────────────────────────
 *  Every card in this app divides by a patient: the tasks belong to a person,
 *  the ring counts their day, the feed is their history. Rendered with nobody
 *  behind them they are a grid of zeroes, and a grid of zeroes teaches the
 *  caregiver that Karsa is a set of empty boxes — while hiding the one action
 *  that would fill them. So the page *is* the action. Not a banner above the
 *  dashboard and not a modal over it; both of those leave the dead cards on
 *  screen competing with the thing worth pressing.
 *
 *  ── Layout, from the sketch ───────────────────────────────────────────────
 *  Desktop: mascot on the left, the greeting and both buttons in a column on
 *  the right, the pair centred in the viewport. Mobile: the same three things
 *  stacked — mascot, greeting, buttons — centred, full width.
 *
 *  One tree, two layouts. The mascot, the heading and the buttons are the same
 *  nodes at both sizes and only the flex direction changes, so nothing
 *  re-mounts across the breakpoint and the character never restarts its idle
 *  animation mid-resize. */
export default function StartHere({ name }: { name?: string }) {
  const [pairing, setPairing] = useState(false);

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center px-5 py-10 sm:px-8">
      {/* The mascot's room, dissolving at every edge, exactly as it does at the
          top of the dashboard — so this reads as the first screen of that page
          rather than an error state standing in for it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          WebkitMaskImage:
            "radial-gradient(120% 90% at 50% 42%, #000 0%, #000 45%, transparent 100%)",
          maskImage:
            "radial-gradient(120% 90% at 50% 42%, #000 0%, #000 45%, transparent 100%)",
        }}
      >
        <div className="absolute inset-0 bg-[#fdf8f0]" />
        <RoomScene />
      </div>

      <div className="relative flex w-full max-w-[420px] flex-col items-center gap-2 text-center lg:max-w-[860px] lg:flex-row lg:items-center lg:gap-14 lg:text-left">
        {/* Left on a desktop, top on a phone. `shrink-0` so the character keeps
            its size when the copy beside it is long. */}
        <Mascot className="h-44 w-44 shrink-0 sm:h-52 sm:w-52 lg:h-64 lg:w-64 xl:h-72 xl:w-72" />

        <div className="min-w-0 flex-1">
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-[36px] lg:text-[44px]">
            Halo, {name ?? "Pendamping"}!
          </h1>
          <p className="mx-auto mt-3 max-w-[30ch] text-[17px] leading-6 text-neutral-600 sm:text-[19px] lg:mx-0 lg:max-w-[34ch] lg:text-[21px] lg:leading-7">
            Yuk mulai dengan tambahkan pasien!
          </p>

          {/* The sketch's two buttons, and the app's only two ways in. Both are
              the same handshake from opposite ends: either you hand over a code
              and they enter it, or they hand you one and you do.

              The first opens the dialog rather than navigating — the code is
              minted the moment it is pressed and belongs beside the button that
              asked for it. The second navigates, because typing a code is a
              form and a form deserves a page. */}
          <div className="mt-7 flex w-full flex-col gap-3 lg:mt-8 lg:max-w-[420px]">
            <button
              type="button"
              onClick={() => setPairing(true)}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-karsa text-[16px] font-bold text-white shadow-[0_10px_28px_-14px_rgba(63,92,70,0.9)] outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa focus-visible:ring-offset-2 lg:h-16 lg:text-[17px]"
            >
              <Plus size={20} strokeWidth={2.8} aria-hidden />
              Tambahkan pasien
            </button>

            <Link
              href="/care/tambah-pasien?mode=enter"
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-white text-[15.5px] font-bold text-neutral-700 ring-1 ring-karsa-line outline-none transition-colors duration-200 hover:bg-karsa-soft hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40 lg:h-16 lg:text-[16.5px]"
            >
              <KeyRound size={19} strokeWidth={2.4} aria-hidden />
              Saya punya kode undangan
            </Link>
          </div>

          <p className="mx-auto mt-5 max-w-[38ch] text-[13.5px] leading-5 text-neutral-500 lg:mx-0">
            Dia perlu punya akun Karsa untuk terhubung. Kodenya berlaku 24 jam
            dan hanya bisa dipakai sekali.
          </p>

          {/* The way out. This screen has no rail and no bottom bar, and it is
              the only page this account can open — without this, somebody who
              signed in as the wrong person is stuck on it with nothing to press
              but two buttons that do not apply to them. */}
          <form action={signOut} className="mt-6">
            <button
              type="submit"
              className="rounded text-[13.5px] font-semibold text-neutral-500 underline underline-offset-4 outline-none transition-colors duration-200 hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              Keluar dari akun ini
            </button>
          </form>
        </div>
      </div>

      <PairingModal open={pairing} onClose={() => setPairing(false)} />
    </div>
  );
}

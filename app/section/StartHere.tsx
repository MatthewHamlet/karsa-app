"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Plus } from "lucide-react";
import Mascot from "../components/Mascot";
import RoomScene from "../components/RoomScene";
import PairingModal from "../components/PairingModal";
import { signOut } from "../login/actions";

export default function StartHere({ name }: { name?: string }) {
  const [pairing, setPairing] = useState(false);

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center px-5 py-10 sm:px-8">
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
        <Mascot className="h-44 w-44 shrink-0 sm:h-52 sm:w-52 lg:h-64 lg:w-64 xl:h-72 xl:w-72" />

        <div className="min-w-0 flex-1">
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-[36px] lg:text-[44px]">
            Halo, {name ?? "Pendamping"}!
          </h1>
          <p className="mx-auto mt-3 max-w-[30ch] text-[17px] leading-6 text-neutral-600 sm:text-[19px] lg:mx-0 lg:max-w-[34ch] lg:text-[21px] lg:leading-7">
            Yuk mulai dengan tambahkan pasien!
          </p>

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

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link
              href="/login/peran?ganti=1"
              className="rounded text-[13.5px] font-semibold text-neutral-500 underline underline-offset-4 outline-none transition-colors duration-200 hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              Sebenarnya saya pasien
            </Link>

            <span aria-hidden className="text-[13.5px] text-neutral-300">
              ·
            </span>

            <form action={signOut}>
              <button
                type="submit"
                className="rounded text-[13.5px] font-semibold text-neutral-500 underline underline-offset-4 outline-none transition-colors duration-200 hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-karsa/40"
              >
                Keluar dari akun ini
              </button>
            </form>
          </div>
        </div>
      </div>

      <PairingModal open={pairing} onClose={() => setPairing(false)} />
    </div>
  );
}

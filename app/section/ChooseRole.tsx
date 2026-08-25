"use client";

import { useActionState, useState } from "react";
import { HeartHandshake, UserRound } from "lucide-react";
import AuthShell from "./AuthShell";
import { chooseRole, type AuthState } from "../login/actions";


type Choice = "caregiver" | "patient";

const OPTIONS: {
  value: Choice;
  icon: typeof UserRound;
  title: string;
  body: string;
}[] = [
  {
    value: "caregiver",
    icon: HeartHandshake,
    title: "Saya mendampingi",
    body: "Saya merawat atau membantu orang lain seperti orang tua, kakek-nenek, atau keluarga.",
  },
  {
    value: "patient",
    icon: UserRound,
    title: "Saya yang didampingi",
    body: "Saya memakai Karsa untuk diri sendiri, dibantu keluarga atau pendamping.",
  },
];

export default function ChooseRole({
  name,
  next,
}: {
  name?: string;

  next?: string;
}) {
  const [picked, setPicked] = useState<Choice | null>(null);
  const [state, submit, busy] = useActionState<AuthState, FormData>(chooseRole, {
    error: null,
  });

  return (

    <AuthShell>
          <header>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Halo{name ? `, ${name}` : ""}! 👋
            </h1>
            <p className="mt-3 text-[17px] leading-6 text-neutral-700">
              Satu pertanyaan terakhir. Kamu memakai Karsa sebagai apa?
            </p>
          </header>


          {state.error && (
            <p
              role="alert"
              className="mt-6 rounded-2xl border-2 border-rose-200 bg-rose-50/90 px-4 py-3 text-[15px] font-semibold leading-5 text-rose-800 backdrop-blur-md"
            >
              {state.error}
            </p>
          )}

          <form action={submit} className="mt-7">

            <input type="hidden" name="role" value={picked ?? ""} />
            <input type="hidden" name="next" value={next ?? ""} />

            <div className="grid gap-3">
              {OPTIONS.map((option) => {
                const Icon = option.icon;
                const on = picked === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPicked(option.value)}
                    aria-pressed={on}
                    disabled={busy}
                    className={`flex items-start gap-4 rounded-2xl border-2 p-4 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:opacity-70 sm:p-5 ${
                      on
                        ? "border-karsa bg-karsa-soft"
                        : "border-karsa-line bg-white hover:border-karsa/40"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-colors duration-200 ${
                        on ? "bg-karsa text-white" : "bg-karsa-canvas text-neutral-500"
                      }`}
                    >
                      <Icon size={23} strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[17px] font-bold text-neutral-900">
                        {option.title}
                      </span>
                      <span className="mt-1 block text-[14px] leading-5 text-neutral-500">
                        {option.body}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={busy || !picked}
              className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-[#3f6b44] text-[16.5px] font-bold tracking-wide text-white outline-none transition-colors duration-200 hover:bg-[#345a39] focus-visible:ring-2 focus-visible:ring-[#3f6b44] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "MENYIMPAN…" : "LANJUTKAN"}
            </button>
          </form>


          <p className="mt-7 text-center text-[14px] leading-5 text-neutral-600">
            Pilihan ini menentukan tampilan Karsa untukmu. Kalau ternyata salah,
            kamu bisa mengubahnya nanti lewat Pengaturan.
          </p>
    </AuthShell>
  );
}

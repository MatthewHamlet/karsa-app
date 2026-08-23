"use client";

import { useActionState, useState } from "react";
import { HeartHandshake, UserRound } from "lucide-react";
import AuthShell from "./AuthShell";
import { chooseRole, type AuthState } from "../login/actions";

/** The question Google never asks.
 *
 *  The email signup form has a role picker on it, so an account made that way
 *  arrives already answered. Google hands back a name and an address and
 *  nothing else, and `handle_new_user` falls through to caregiver — which is a
 *  safe default but not an answer. This screen is where the answer is given,
 *  once, immediately after the callback.
 *
 *  ── Why it is a whole screen and not a dropdown in settings ───────────────
 *  This choice decides which of two products the person sees for the rest of
 *  their time here. Getting it wrong is not a preference to be corrected later;
 *  it is landing an elderly patient in a caregiver's compliance dashboard on
 *  their first ever visit. So it gets the full screen, two large targets, and
 *  no default selection — nothing is pre-picked, because a pre-picked answer to
 *  a question this consequential is just the old silent default wearing a
 *  radio button.
 *
 *  The wording avoids "caregiver" and "patient" as job titles. Somebody looking
 *  after their mother does not think of themselves as a caregiver; they think
 *  "I'm the one helping her". The sentences are written that way. */
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
    body: "Saya merawat atau membantu orang lain — orang tua, kakek-nenek, atau keluarga.",
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
  /** Where they were headed before the question interrupted them. Empty means
   *  "wherever this role's home is", which `chooseRole` decides. */
  next?: string;
}) {
  const [picked, setPicked] = useState<Choice | null>(null);
  const [state, submit, busy] = useActionState<AuthState, FormData>(chooseRole, {
    error: null,
  });

  return (
    /* The same frame as the login and register screens: meadow behind, the pair
       of Karsas and the quote holding the left half, the form on the right.
       This screen sits between those two in the flow, so building it its own
       centred card made it read as a different app for one step. */
    <AuthShell>
          <header>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Halo{name ? `, ${name}` : ""}! 👋
            </h1>
            <p className="mt-3 text-[17px] leading-6 text-neutral-700">
              Satu pertanyaan terakhir — kamu memakai Karsa sebagai apa?
            </p>
          </header>

          {/* Above the choice it is about, so a screen reader meets it before
              the options rather than after the button. */}
          {state.error && (
            <p
              role="alert"
              className="mt-6 rounded-2xl border-2 border-rose-200 bg-rose-50/90 px-4 py-3 text-[15px] font-semibold leading-5 text-rose-800 backdrop-blur-md"
            >
              {state.error}
            </p>
          )}

          <form action={submit} className="mt-7">
            {/* The value travels in a hidden field rather than on the button,
                so the choice and the submit are two separate acts. Tapping a
                card that submitted immediately would give somebody no moment to
                read the second option before the app moved on. */}
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

          {/* Deliberately not "you can change this later in Settings". The
              settings screen has a "Peran" field, but it is a different thing —
              a seniority label on mock data — and pointing at it would be a
              promise the app does not keep. Changing this properly means
              revisiting `/login/peran?ganti=1`, which is a link nothing offers
              yet; until something does, the honest line is the one that just
              helps them pick correctly now. */}
          <p className="mt-7 text-center text-[14px] leading-5 text-neutral-600">
            Pilihan ini menentukan tampilan Karsa untukmu. Pilih yang paling
            sesuai ya.
          </p>
    </AuthShell>
  );
}

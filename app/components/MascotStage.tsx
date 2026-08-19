"use client";

import { motion, useReducedMotion } from "framer-motion";
import MascotAvatar from "./MascotAvatar";
import CareActionCards from "./CareActionCards";
import type { ActionCard, MascotState } from "../data/mascot";

/** What the character is doing, in words, under the character doing it.
 *  A status line is also the accessible version of an animation. */
const CAPTION: Record<MascotState, { title: string; body: string }> = {
  idle: {
    title: "Karsa siap menemani",
    body: "Tanya apa saja tentang perawatan Meimei hari ini.",
  },
  thinking: {
    title: "Sedang menyiapkan…",
    body: "Aku sedang membaca catatan Meimei dulu.",
  },
  presenting: {
    title: "Ini yang bisa dilakukan",
    body: "Pilih satu di bawah untuk langsung mencatatnya.",
  },
};

/** The right-hand stage: the mascot, what it is doing, and whatever it is
 *  currently holding out. The mascot leans toward the cards when it has them,
 *  which is what ties the two halves of the panel together. */
export default function MascotStage({
  state,
  cards,
}: {
  state: MascotState;
  cards: ActionCard[];
}) {
  const reduce = useReducedMotion();
  const caption = CAPTION[state];

  return (
    <div className="flex min-h-0 flex-col">
      {/* ── Character ───────────────────────────────────────────────────── */}
      <div className="shrink-0 px-5 pt-6 xl:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/55 px-4 pb-5 pt-4 shadow-[0_18px_44px_-28px_rgba(24,32,24,0.5)] backdrop-blur-xl">
          {/* Gradient mesh. Two soft blooms, shifted by state, so the panel's
              light changes with the mood instead of the panel changing colour. */}
          <motion.span
            aria-hidden
            animate={{
              opacity: state === "thinking" ? 0.9 : 0.6,
              x: state === "presenting" ? "8%" : "0%",
            }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="pointer-events-none absolute -left-10 -top-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,#cfe0cb_0%,transparent_70%)] blur-2xl"
          />
          <motion.span
            aria-hidden
            animate={{ opacity: state === "idle" ? 0.45 : 0.75 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="pointer-events-none absolute -bottom-20 -right-12 h-56 w-56 rounded-full bg-[radial-gradient(circle,#efe0cb_0%,transparent_70%)] blur-2xl"
          />

          <div className="relative">
            {/* Leans and dips toward the cards while presenting — the pose is
                the pointing, so nothing has to grow an arm to do it. */}
            <motion.div
              animate={
                state === "presenting" && !reduce
                  ? { rotate: -7, y: 6, scale: 0.94 }
                  : { rotate: 0, y: 0, scale: 1 }
              }
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="mx-auto w-full max-w-[260px]"
            >
              <MascotAvatar state={state} className="aspect-square w-full" />
            </motion.div>

            {/* Keyed remount, deliberately not `AnimatePresence mode="wait"`:
                that holds the new caption back until the old one has finished
                leaving, so the status line would always describe the previous
                state for the length of an exit. */}
            <div className="mt-3 min-h-[64px] text-center">
              <motion.div
                key={state}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.2 }}
              >
                <p
                  role="status"
                  className="font-nohemi text-[15.5px] font-bold tracking-tight text-neutral-800"
                >
                  {caption.title}
                </p>
                <p className="mx-auto mt-1 max-w-[34ch] text-[12.5px] leading-4 text-neutral-600">
                  {caption.body}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cards ───────────────────────────────────────────────────────── */}
      {/* Plain conditional, for the same reason as the caption: the cards are
          the answer, and gating them behind the placeholder's exit would make
          the mascot point at an empty shelf. Each card animates itself in. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4 xl:px-6">
        {cards.length > 0 ? (
          <>
            <h3 className="mb-2.5 px-1 text-[11px] font-semibold uppercase leading-4 tracking-[0.16em] text-neutral-400">
              Tindakan
            </h3>
            <CareActionCards cards={cards} />
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-karsa-line px-4 py-6 text-center text-[12.5px] leading-5 text-neutral-500">
            Kartu tindakan akan muncul di sini begitu ada yang bisa dicatat.
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import MascotAvatar from "./MascotAvatar";
import MascotRoom, { RoomRug } from "./MascotRoom";
import type { MascotState } from "../data/mascot";

/** What the character is doing, in words, under the character doing it.
 *  A status line is also the accessible version of an animation. */
const CAPTION: Record<MascotState, { title: string; body: string }> = {
  idle: {
    title: "Karsa siap menemani",
    body: "Tanya apa saja tentang perawatan hari ini.",
  },
  thinking: {
    title: "Sedang menyiapkan…",
    body: "Aku sedang membaca catatannya dulu.",
  },
  presenting: {
    title: "Ini yang bisa dilakukan",
    body: "Pilih satu di bawah untuk langsung mencatatnya.",
  },
};

/** The right-hand stage, from `lg` up: Karsa in its room, and what it is doing.
 *  The action cards used to live down here; they belong under the answer that
 *  produced them, so they moved into the thread.
 *
 *  The column is bottom-aligned rather than centred, so the character stands in
 *  the lower part of the room instead of hovering in the middle of the wall.
 *  Exact alignment with the floor is not attempted and is not needed: the room's
 *  floor is a deep band and the rug travels with the mascot, so the feet land
 *  somewhere plausible at every panel height. See the note in `MascotRoom`.
 *
 *  The caption is frosted now. It used to be bare text on flat panel colour;
 *  over a drawing it needs its own ground to stay readable. */
export default function MascotStage({ state }: { state: MascotState }) {
  const reduce = useReducedMotion();
  const caption = CAPTION[state];

  return (
    /* `overflow-hidden` moved here from the card that used to hold it: the two
       gradient blooms are deliberately larger than their box and reach past its
       edges, and with the card gone they were pushing the page 24px sideways.
       The panel clips them now, which is what the card was doing all along. */
    <div className="relative flex min-h-0 flex-1 flex-col justify-end overflow-hidden">
      <MascotRoom />

      {/* The room's light, not the room's colour, is what carries the mood: a
          wash over the whole scene, warm while idle and cooler while it works.
          The panel used to change its own background for this, which the room
          now covers. */}
      <motion.span
        aria-hidden
        initial={false}
        animate={{
          backgroundColor:
            state === "thinking" ? "rgba(207,224,203,0.42)" : "rgba(255,244,222,0.22)",
        }}
        transition={reduce ? { duration: 0 } : { duration: 0.5 }}
        className="pointer-events-none absolute inset-0"
      />

      <div className="relative flex flex-col px-5 pb-7 pt-6 xl:px-6">
        {/* Gradient mesh. Two soft blooms, shifted by state, so the light in
            the room moves with the mood instead of the room changing colour. */}
        <motion.span
          aria-hidden
          animate={{
            opacity: state === "thinking" ? 0.8 : 0.5,
            x: state === "presenting" ? "8%" : "0%",
          }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="pointer-events-none absolute -left-10 bottom-10 h-52 w-52 rounded-full bg-[radial-gradient(circle,#cfe0cb_0%,transparent_70%)] blur-2xl"
        />
        <motion.span
          aria-hidden
          animate={{ opacity: state === "idle" ? 0.4 : 0.7 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="pointer-events-none absolute -right-12 bottom-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,#efe0cb_0%,transparent_70%)] blur-2xl"
        />

        {/* Leans and dips while presenting — the pose is the pointing, so
            nothing has to grow an arm to do it. The rug is inside the wrapper
            so it leans with the character rather than staying put under it. */}
        <motion.div
          animate={
            state === "presenting" && !reduce
              ? { rotate: -7, y: 6, scale: 0.94 }
              : { rotate: 0, y: 0, scale: 1 }
          }
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="relative mx-auto w-full max-w-[330px] xl:max-w-[370px]"
        >
          <RoomRug className="absolute inset-x-[-4%] bottom-[2%] h-auto" />
          <MascotAvatar state={state} className="relative aspect-square w-full" />
        </motion.div>

        {/* Keyed remount, deliberately not `AnimatePresence mode="wait"`: that
            holds the new caption back until the old one has finished leaving,
            so the status line would always describe the previous state for the
            length of an exit. */}
        <div className="relative mx-auto mt-3 min-h-[76px] w-full max-w-[19rem] rounded-2xl bg-white/70 px-4 py-3 text-center shadow-[0_14px_32px_-22px_rgba(24,32,24,0.5)] ring-1 ring-white/70 backdrop-blur-md">
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
  );
}

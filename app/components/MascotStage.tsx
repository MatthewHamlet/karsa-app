"use client";

import { motion, useReducedMotion } from "framer-motion";
import MascotAvatar from "./MascotAvatar";
import MascotRoom, { RoomRug } from "./MascotRoom";
import type { MascotState } from "../data/mascot";


const CAPTION: Record<MascotState, { title: string; body: string }> = {
  idle: {
    title: "Arsa siap menemani",
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


export default function MascotStage({ state }: { state: MascotState }) {
  const reduce = useReducedMotion();
  const caption = CAPTION[state];

  return (

    <div className="relative flex min-h-0 flex-1 flex-col justify-end overflow-hidden">
      <MascotRoom />


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

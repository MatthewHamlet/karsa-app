"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronRight, Pill, Siren, Stethoscope, SquarePen } from "lucide-react";
import { TONES } from "./tones";
import type { ActionCard, ActionCardKind } from "../data/mascot";

const ICON: Record<ActionCardKind, typeof Pill> = {
  medication: Pill,
  vitals: Stethoscope,
  emergency: Siren,
  note: SquarePen,
};

export default function CareActionCards({ cards }: { cards: ActionCard[] }) {
  const reduce = useReducedMotion();
  const [done, setDone] = useState<string[]>([]);

  return (
    <ul className="space-y-2.5">
      <AnimatePresence initial={false} mode="popLayout">
        {cards.map((card, i) => {
          const Icon = ICON[card.kind];
          const tone = TONES[card.tone];
          const isDone = done.includes(card.id);

          return (
            <motion.li
              key={card.id}
              initial={reduce ? false : { opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 340, damping: 30, delay: i * 0.08 }
              }
            >
              <div
                className={`rounded-2xl p-3.5 ring-1 ${tone.card} ${tone.ring} ${
                  isDone ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone.tile}`}
                  >
                    <Icon size={17} strokeWidth={2.1} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[14.5px] font-bold leading-5 text-neutral-800 ${
                        isDone ? "line-through decoration-neutral-400" : ""
                      }`}
                    >
                      {card.title}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-4 text-neutral-600">
                      {card.detail}
                    </p>
                    {card.meta && (
                      <p className="mt-1.5 text-[11.5px] leading-4 text-neutral-500">
                        {card.meta}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDone((prev) =>
                      prev.includes(card.id)
                        ? prev.filter((id) => id !== card.id)
                        : [...prev, card.id],
                    )
                  }
                  aria-pressed={isDone}
                  className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-white/80 py-2 text-[13px] font-bold outline-none ring-1 transition-colors duration-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-karsa/40 ${tone.inset} ${tone.ink}`}
                >
                  {isDone ? <Check size={15} strokeWidth={2.6} /> : null}
                  {isDone ? "Tercatat" : card.cta}
                  {isDone ? null : <ChevronRight size={15} strokeWidth={2.4} />}
                </button>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

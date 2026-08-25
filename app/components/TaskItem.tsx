"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "./List";

type TaskItemProps = {
  label: string;
  hint?: string;
  done: boolean;
  onToggle: () => void;
};

export default function TaskItem({ label, hint, done, onToggle }: TaskItemProps) {
  const reduce = useReducedMotion();
  const tick = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 600, damping: 24 };

  return (
    <motion.li
      layout
      exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.3, ease: EASE }}
      className="overflow-hidden"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        className="group/task flex w-full items-center gap-3.5 px-1 py-3 text-left outline-none transition-colors duration-200 hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40"
      >
        <motion.span
          animate={{
            backgroundColor: done ? "#56785d" : "rgba(255,255,255,0)",
            borderColor: done ? "#56785d" : "#cfc8b8",
          }}
          transition={reduce ? { duration: 0 } : { duration: 0.2, ease: EASE }}
          whileTap={reduce ? undefined : { scale: 0.85 }}
          className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border"
        >
          <motion.span
            initial={false}
            animate={{ scale: done ? 1 : 0, opacity: done ? 1 : 0 }}
            transition={tick}
            className="grid place-items-center text-white"
          >
            <Check size={13} strokeWidth={3.5} />
          </motion.span>
        </motion.span>

        <span className="relative min-w-0 flex-1">
          <span
            className={`relative inline-block truncate align-middle text-[14px] font-medium transition-colors duration-200 xl:text-[14.5px] ${
              done ? "text-neutral-400" : "text-neutral-700 group-hover/task:text-neutral-900"
            }`}
          >
            {label}
            <motion.span
              initial={false}
              animate={{ scaleX: done ? 1 : 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.28, ease: EASE }}
              className="absolute left-0 top-1/2 h-px w-full origin-left bg-current"
            />
          </span>
        </span>

        {hint && (
          <span
            className={`shrink-0 text-[12px] font-medium tabular-nums transition-colors duration-200 md:[[data-rail=open]_&]:hidden xl:text-[12.5px] ${
              done ? "text-neutral-300" : "text-neutral-400"
            }`}
          >
            {hint}
          </span>
        )}
      </button>
    </motion.li>
  );
}

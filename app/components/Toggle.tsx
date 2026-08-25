"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  const reduce = useReducedMotion();
  const spring = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 620, damping: 38, mass: 0.6 };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-full p-[3px] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 focus-visible:ring-offset-2 ${
        checked ? "bg-karsa" : "bg-neutral-300"
      }`}
    >
      <motion.span
        layout
        transition={spring}
        className="h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgba(24,32,24,0.28)]"
        style={{ marginLeft: checked ? 22 : 0 }}
      />
    </button>
  );
}

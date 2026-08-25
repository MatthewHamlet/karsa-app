"use client";

import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";


export const EASE = [0.32, 0.72, 0, 1] as const;


export const RAIL_SPRING = {
  type: "spring",
  stiffness: 420,
  damping: 42,
  mass: 0.9,
} as const;


export const PILL_SPRING = {
  type: "spring",
  stiffness: 520,
  damping: 44,
  mass: 0.7,
} as const;

type ListProps = {
  icon: LucideIcon;
  text: string;
  link: string;
  isOpen: boolean;

  railId: string;
  isActive?: boolean;
  badge?: number;
  onSelect?: (link: string) => void;
};

export default function List({
  icon: Icon,
  text,
  link,
  isOpen,
  railId,
  isActive = false,
  badge,
  onSelect,
}: ListProps) {
  const reduce = useReducedMotion();

  const pill = reduce ? { duration: 0 } : PILL_SPRING;
  const label = reduce
    ? { duration: 0 }
    : {
        width: { duration: 0.28, ease: EASE },
        x: { duration: 0.28, ease: EASE },


        opacity: { duration: isOpen ? 0.18 : 0.1, delay: isOpen ? 0.08 : 0 },
      };

  return (
    <li className="relative">
      <Link
        href={link}
        onClick={() => onSelect?.(link)}
        aria-current={isActive ? "page" : undefined}
        className={`group/item relative flex h-12 items-center rounded-xl px-3.5 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
          isActive
            ? "text-karsa-dark"
            : "text-neutral-600 hover:text-neutral-900"
        }`}
      >

        {isActive && (
          <motion.span
            layoutId={`${railId}-pill`}
            transition={pill}
            className="absolute inset-0 rounded-xl bg-white shadow-[0_1px_2px_rgba(24,32,24,0.06),0_4px_12px_-6px_rgba(24,32,24,0.18)] ring-1 ring-karsa-line"
          />
        )}


        {!isActive && (
          <span className="absolute inset-0 rounded-xl bg-neutral-900/0 transition-colors duration-200 group-hover/item:bg-neutral-900/[0.045]" />
        )}


        {isActive && (
          <motion.span
            layoutId={`${railId}-accent`}
            transition={pill}
            className="absolute -left-3.5 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-karsa"
          />
        )}

        <span className="relative z-10 grid w-7 shrink-0 place-items-center">
          <Icon
            size={22}
            strokeWidth={isActive ? 2.1 : 1.75}
            className="transition-transform duration-200 group-hover/item:scale-110 group-active/item:scale-95"
          />
          {badge ? (
            <motion.span
              animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.6 : 1 }}
              transition={reduce ? { duration: 0 } : { duration: 0.16 }}
              className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-karsa ring-2 ring-karsa-cream"
            />
          ) : null}
        </span>

        <motion.span
          animate={{
            width: isOpen ? "auto" : 0,
            opacity: isOpen ? 1 : 0,
            x: isOpen ? 0 : -8,
          }}
          transition={label}
          className="relative z-10 overflow-hidden whitespace-nowrap"
        >
          <span className="ml-3.5 block text-[15px] font-medium">{text}</span>
        </motion.span>

        {badge ? (
          <motion.span
            animate={{ opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0.8 }}
            transition={
              reduce ? { duration: 0 } : { duration: 0.18, delay: isOpen ? 0.08 : 0 }
            }
            className="relative z-10 ml-auto rounded-full bg-karsa px-2 py-1 text-[11px] font-bold leading-none text-white"
          >
            {badge}
          </motion.span>
        ) : null}


        {!isOpen && (
          <span
            role="tooltip"
            className="pointer-events-none absolute left-[calc(100%+16px)] top-1/2 z-50 -translate-y-1/2 -translate-x-1 scale-95 whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-2 text-[13px] font-medium text-white opacity-0 shadow-lg transition-all duration-150 ease-out group-hover/item:translate-x-0 group-hover/item:scale-100 group-hover/item:opacity-100"
          >
            {text}
          </span>
        )}
      </Link>
    </li>
  );
}

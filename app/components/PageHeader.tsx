"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** Every page owns a colour: a full-bleed field across the top with a deep
 *  curve on its bottom edge, running behind the page's own padding. */
const TONE = {
  sand: {
    wash: "#dcc7a8",
    ink: "text-neutral-900",
    sub: "text-neutral-700",
    eyebrow: "text-neutral-600",
    back: "bg-white/55 text-neutral-800 ring-black/10 hover:bg-white/75",
  },
  clay: {
    wash: "#6d5647",
    ink: "text-white",
    sub: "text-white/75",
    eyebrow: "text-white/60",
    back: "bg-white/15 text-white ring-white/25 hover:bg-white/25",
  },
  amber: {
    wash: "#c96a2e",
    ink: "text-white",
    sub: "text-white/80",
    eyebrow: "text-white/65",
    back: "bg-white/15 text-white ring-white/25 hover:bg-white/25",
  },
  plum: {
    wash: "#6f5a7d",
    ink: "text-white",
    sub: "text-white/78",
    eyebrow: "text-white/62",
    back: "bg-white/15 text-white ring-white/25 hover:bg-white/25",
  },
  forest: {
    wash: "#3d5a45",
    ink: "text-white",
    sub: "text-white/75",
    eyebrow: "text-white/60",
    back: "bg-white/15 text-white ring-white/25 hover:bg-white/25",
  },
} as const;

export type HeaderTone = keyof typeof TONE;

/** Cancels the page's own padding so the colour reaches the edges, then puts
 *  the padding back inside. Assumes the page root uses the standard
 *  `px-4 sm:px-6 md:px-8 xl:px-12` / `pt-20 md:pt-10 xl:pt-12`. */
const BLEED =
  "-mx-4 -mt-20 px-4 pt-20 sm:-mx-6 sm:px-6 md:-mx-8 md:-mt-10 md:px-8 md:pt-10 xl:-mx-12 xl:px-12 xl:-mt-12 xl:pt-12";

const CURVE = "rounded-b-[32px] sm:rounded-b-[44px]";

/** Texture, not pattern — soft shapes clipped by the curve. */
function Shapes() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 200"
      preserveAspectRatio="xMaxYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.13]"
    >
      <circle cx="512" cy="18" r="118" fill="white" />
      <circle cx="596" cy="164" r="86" fill="white" />
      <circle cx="392" cy="182" r="62" fill="white" />
    </svg>
  );
}

export default function PageHeader({
  tone,
  eyebrow,
  title,
  subtitle,
  backHref,
  onBack,
  backLabel = "Kembali",
  action,
}: {
  tone: HeaderTone;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** A link back, or a handler — whichever the page needs. */
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
  action?: ReactNode;
}) {
  const t = TONE[tone];
  const backClasses = `grid h-10 w-10 shrink-0 place-items-center rounded-full outline-none ring-1 transition-colors duration-200 focus-visible:ring-2 ${t.back}`;

  return (
    // In normal flow on purpose. A negative z-index would slip behind the
    // canvas background painted by an ancestor, and the colour would vanish.
    <header
      className={`relative mb-8 overflow-hidden pb-9 sm:pb-10 xl:mb-10 xl:pb-12 ${BLEED} ${CURVE}`}
      style={{ backgroundColor: t.wash }}
    >
      <Shapes />

      <div className="relative flex items-start gap-4">
        {(backHref || onBack) &&
          (onBack ? (
            <button type="button" onClick={onBack} aria-label={backLabel} className={backClasses}>
              <ChevronLeft size={19} strokeWidth={2.3} />
            </button>
          ) : (
            <Link href={backHref!} aria-label={backLabel} className={backClasses}>
              <ChevronLeft size={19} strokeWidth={2.3} />
            </Link>
          ))}

        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p
              className={`text-[11px] font-semibold uppercase leading-4 tracking-[0.18em] ${t.eyebrow}`}
            >
              {eyebrow}
            </p>
          )}
          <h1
            className={`mt-1.5 text-[28px] font-bold leading-none tracking-tight sm:text-[32px] xl:text-[38px] ${t.ink}`}
          >
            {title}
          </h1>
          {subtitle && (
            <p className={`mt-2.5 max-w-2xl text-[15px] leading-6 ${t.sub}`}>{subtitle}</p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}

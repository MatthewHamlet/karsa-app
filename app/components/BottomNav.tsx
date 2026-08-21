"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { HeartPulse, Home, LayoutGrid, PawPrint, ScanText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Phone navigation. A drawer costs a tap to open before it can be read; a bar
 *  keeps every destination one thumb-reach away and always visible, which is
 *  what a caregiver checking something between tasks actually needs.
 *
 *  The rail still owns the desktop — this replaces the hamburger, not the rail. */

/* Four destinations plus "Lainnya" is what fits a 375px bar at a legible label
   size. Komunitas moved behind "Lainnya" when Scan arrived: scanning a
   prescription is something you do standing in a clinic with one hand, and
   reading the forum is not. */
const ITEMS: { link: string; icon: LucideIcon; label: string }[] = [
  { link: "/", icon: Home, label: "Beranda" },
  { link: "/care", icon: HeartPulse, label: "Perawatan" },
  { link: "/scan", icon: ScanText, label: "Scan" },
  { link: "/mascot", icon: PawPrint, label: "Maskot" },
];

/** `/care` must not light up for `/careers`, and `/` must not light up for
 *  everything — so the root is matched exactly and the rest by segment. */
const isActive = (pathname: string, link: string) =>
  link === "/" ? pathname === "/" : pathname === link || pathname.startsWith(`${link}/`);

export default function BottomNav({
  pathname,
  onMore,
  moreOpen,
}: {
  pathname: string;
  onMore: () => void;
  moreOpen: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <nav
      aria-label="Navigasi utama"
      /* `pb-[env(safe-area-inset-bottom)]` keeps the labels off the home
         indicator on a notched phone; the bar's own background runs under it
         so there is no strip of page showing through. */
      className="fixed inset-x-0 bottom-0 z-40 border-t border-karsa-line bg-karsa-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.link) && !moreOpen;

          return (
            <li key={item.link}>
              <Link
                href={item.link}
                aria-current={active ? "page" : undefined}
                className="group/tab relative flex h-16 flex-col items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40"
              >
                {/* The pill sits behind the icon rather than under the label:
                    a bar this short has no room for an underline that reads. */}
                {active && (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    transition={
                      reduce ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 36 }
                    }
                    aria-hidden
                    className="absolute top-2 h-8 w-12 rounded-full bg-karsa-soft"
                  />
                )}

                <Icon
                  size={21}
                  strokeWidth={active ? 2.5 : 2}
                  className={`relative transition-colors duration-200 ${
                    active ? "text-karsa-dark" : "text-neutral-400 group-hover/tab:text-neutral-600"
                  }`}
                />
                <span
                  className={`relative text-[10.5px] leading-3 transition-colors duration-200 ${
                    active ? "font-bold text-karsa-dark" : "font-medium text-neutral-500"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}

        {/* Everything that isn't a destination — the profile and settings —
            behind one tab, the way the reference does it. */}
        <li>
          <button
            type="button"
            onClick={onMore}
            aria-expanded={moreOpen}
            className="group/tab relative flex h-16 w-full flex-col items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40"
          >
            {moreOpen && (
              <motion.span
                layoutId="bottom-nav-pill"
                transition={
                  reduce ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 36 }
                }
                aria-hidden
                className="absolute top-2 h-8 w-12 rounded-full bg-karsa-soft"
              />
            )}

            <LayoutGrid
              size={21}
              strokeWidth={moreOpen ? 2.5 : 2}
              className={`relative transition-colors duration-200 ${
                moreOpen ? "text-karsa-dark" : "text-neutral-400 group-hover/tab:text-neutral-600"
              }`}
            />
            <span
              className={`relative text-[10.5px] leading-3 transition-colors duration-200 ${
                moreOpen ? "font-bold text-karsa-dark" : "font-medium text-neutral-500"
              }`}
            >
              Lainnya
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

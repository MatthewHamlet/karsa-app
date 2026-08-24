"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  HeartPulse,
  Home,
  LayoutGrid,
  MessagesSquare,
  NotebookPen,
  PawPrint,
  ScanText,
  Sparkles,
  UserRound,
} from "lucide-react";
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
  { link: "/mascot", icon: PawPrint, label: "Arsa" },
];

/** The patient app's own bar. Five equal destinations, no raised disc and no
 *  "Lainnya": there is nothing here urgent enough to promote and little enough
 *  to hide. Kept in this file rather than a second component so both bars share
 *  one idea of what a tab looks like. */
const PATIENT_ITEMS: { link: string; icon: LucideIcon; label: string }[] = [
  { link: "/pasien", icon: Home, label: "Beranda" },
  { link: "/pasien/jurnal", icon: NotebookPen, label: "Jurnal" },
  { link: "/pasien/scan", icon: ScanText, label: "Scan" },
  { link: "/pasien/komunitas", icon: MessagesSquare, label: "Komunitas" },
  { link: "/pasien/maskot", icon: Sparkles, label: "Arsa" },
  { link: "/pasien/profil", icon: UserRound, label: "Profil" },
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

  /* The patient app is a different product on the same domain. It gets the same
     tab language and its own destinations — and a floating bar, because it is
     the only screen here a person sits in rather than passes through. */
  if (pathname.startsWith("/pasien")) {
    return (
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 rounded-[26px] bg-karsa-cream/95 shadow-[0_16px_40px_-12px_rgba(24,32,24,0.4)] ring-1 ring-karsa-line backdrop-blur-xl md:hidden"
      >
        <ul className="grid grid-cols-6">
          {PATIENT_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.link === "/pasien" ? pathname === "/pasien" : pathname.startsWith(item.link);

            return (
              <li key={item.link}>
                <Link
                  href={item.link}
                  aria-current={active ? "page" : undefined}
                  className="group/tab relative flex h-[70px] flex-col items-center justify-center gap-1 rounded-[26px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40"
                >
                  {active && (
                    <motion.span
                      layoutId="patient-nav-pill"
                      transition={
                        reduce ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 36 }
                      }
                      aria-hidden
                      className="absolute top-2.5 h-9 w-14 rounded-full bg-karsa-soft"
                    />
                  )}

                  <Icon
                    size={23}
                    strokeWidth={active ? 2.5 : 2}
                    className={`relative transition-colors duration-200 ${
                      active ? "text-karsa-dark" : "text-neutral-400"
                    }`}
                  />
                  <span
                    className={`relative text-[11px] leading-3 transition-colors duration-200 ${
                      active ? "font-bold text-karsa-dark" : "font-medium text-neutral-500"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

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
            /* Scan is not a fifth equal destination. It is the one thing done
               standing up, one-handed, in front of a pharmacist — so it leaves
               the row, sits in a filled disc that rises above the bar, and is
               the only coloured thing down here. The ring is the page's own
               canvas, which is what makes the disc read as punched through the
               bar rather than floating over it. */
            item.link === "/scan" ? (
              <li key={item.link} className="relative">
                <Link
                  href={item.link}
                  aria-current={active ? "page" : undefined}
                  className="group/scan flex h-[72px] flex-col items-center justify-end gap-1 pb-2.5 outline-none"
                >
                  <span
                    className={`absolute -top-5 grid h-[58px] w-[58px] place-items-center rounded-full ring-[5px] ring-karsa-canvas transition-transform duration-200 group-active/scan:scale-95 group-focus-visible/scan:ring-karsa ${
                      active
                        ? "bg-karsa-dark shadow-[0_10px_24px_-6px_rgba(63,92,70,0.75)]"
                        : "bg-karsa shadow-[0_8px_20px_-6px_rgba(63,92,70,0.6)]"
                    }`}
                  >
                    <Icon size={26} strokeWidth={2.3} className="text-white" />
                  </span>
                  <span
                    className={`text-[11.5px] leading-3 transition-colors duration-200 ${
                      active ? "font-bold text-karsa-dark" : "font-semibold text-karsa"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            ) : (
            <li key={item.link}>
              <Link
                href={item.link}
                aria-current={active ? "page" : undefined}
                className="group/tab relative flex h-[72px] flex-col items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40"
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
                    className="absolute top-2.5 h-9 w-14 rounded-full bg-karsa-soft"
                  />
                )}

                <Icon
                  size={23}
                  strokeWidth={active ? 2.5 : 2}
                  className={`relative transition-colors duration-200 ${
                    active ? "text-karsa-dark" : "text-neutral-400 group-hover/tab:text-neutral-600"
                  }`}
                />
                <span
                  className={`relative text-[11.5px] leading-3 transition-colors duration-200 ${
                    active ? "font-bold text-karsa-dark" : "font-medium text-neutral-500"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
            )
          );
        })}

        {/* Everything that isn't a destination — the profile and settings —
            behind one tab, the way the reference does it. */}
        <li>
          <button
            type="button"
            onClick={onMore}
            aria-expanded={moreOpen}
            className="group/tab relative flex h-[72px] w-full flex-col items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40"
          >
            {moreOpen && (
              <motion.span
                layoutId="bottom-nav-pill"
                transition={
                  reduce ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 36 }
                }
                aria-hidden
                className="absolute top-2.5 h-9 w-14 rounded-full bg-karsa-soft"
              />
            )}

            <LayoutGrid
              size={23}
              strokeWidth={moreOpen ? 2.5 : 2}
              className={`relative transition-colors duration-200 ${
                moreOpen ? "text-karsa-dark" : "text-neutral-400 group-hover/tab:text-neutral-600"
              }`}
            />
            <span
              className={`relative text-[11.5px] leading-3 transition-colors duration-200 ${
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

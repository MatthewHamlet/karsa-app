"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  HeartPulse,
  Home,
  LayoutGrid,
  NotebookPen,
  PawPrint,
  ScanText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Item = { link: string; icon: LucideIcon; label: string };

const CAREGIVER_ITEMS: Item[] = [
  { link: "/", icon: Home, label: "Beranda" },
  { link: "/care", icon: HeartPulse, label: "Perawatan" },
  { link: "/scan", icon: ScanText, label: "Scan" },
  { link: "/mascot", icon: PawPrint, label: "Arsa" },
];

const PATIENT_ITEMS: Item[] = [
  { link: "/pasien", icon: Home, label: "Beranda" },
  { link: "/pasien/jurnal", icon: NotebookPen, label: "Jurnal" },
  { link: "/pasien/scan", icon: ScanText, label: "Scan" },
  { link: "/pasien/maskot", icon: PawPrint, label: "Arsa" },
];

const isActive = (pathname: string, link: string, home: string) =>
  link === home ? pathname === home : pathname === link || pathname.startsWith(`${link}/`);

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
  const patientApp = pathname.startsWith("/pasien");
  const items = patientApp ? PATIENT_ITEMS : CAREGIVER_ITEMS;
  const home = patientApp ? "/pasien" : "/";
  const scanLink = patientApp ? "/pasien/scan" : "/scan";

  const spring = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 480, damping: 36 };

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-karsa-line bg-karsa-cream pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.link, home) && !moreOpen;

          if (item.link === scanLink) {
            return (
              <li key={item.link} className="relative">
                <Link
                  href={item.link}
                  aria-current={active ? "page" : undefined}
                  className="group/scan flex h-[72px] flex-col items-center justify-end gap-1 pb-2.5 outline-none active:scale-[0.96] motion-reduce:active:scale-100"
                >
                  <span
                    className={`absolute -top-3.5 grid h-[50px] w-[50px] place-items-center rounded-full ring-4 ring-karsa-canvas transition-transform duration-200 group-active/scan:scale-90 group-active/scan:shadow-[0_2px_8px_-2px_rgba(63,92,70,0.9)] group-focus-visible/scan:ring-karsa ${
                      active
                        ? "bg-karsa-dark shadow-[0_10px_24px_-6px_rgba(63,92,70,0.75)]"
                        : "bg-karsa shadow-[0_8px_20px_-6px_rgba(63,92,70,0.6)]"
                    }`}
                  >
                    <Icon size={23} strokeWidth={2.3} className="text-white" />
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
            );
          }

          return (
            <li key={item.link}>
              <Link
                href={item.link}
                aria-current={active ? "page" : undefined}
                className={`group/tab relative flex h-[72px] flex-col items-center justify-center gap-1 rounded-2xl outline-none transition-[transform,background-color] duration-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40 active:scale-[0.92] active:bg-karsa-soft/70 motion-reduce:active:scale-100`}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    transition={spring}
                    aria-hidden
                    className="absolute inset-y-1.5 w-[68px] rounded-[20px] bg-karsa-soft"
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
          );
        })}

        <li>
          <button
            type="button"
            onClick={onMore}
            aria-expanded={moreOpen}
            className={`group/tab relative flex h-[72px] w-full flex-col items-center justify-center gap-1 rounded-2xl outline-none transition-[transform,background-color] duration-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40 active:scale-[0.92] active:bg-karsa-soft/70 motion-reduce:active:scale-100`}
          >
            {moreOpen && (
              <motion.span
                layoutId="bottom-nav-pill"
                transition={spring}
                aria-hidden
                className="absolute inset-y-1.5 w-[68px] rounded-[20px] bg-karsa-soft"
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

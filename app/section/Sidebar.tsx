"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Home,
  UsersRound,
  Settings,
  PawPrint,
  HeartPulse,
  ChevronsLeft,
  Menu,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import List, { EASE, RAIL_SPRING } from "../components/List";

/** Collapsed width is not arbitrary: rail padding (14) + item padding (14)
 *  + half the icon cell (14) = 42, so every icon centreline lands exactly on
 *  RAIL_CLOSED / 2 and nothing shifts sideways when the rail collapses. */
const RAIL_OPEN = 288;
const RAIL_CLOSED = 84;
const DRAWER_WIDTH = 296;

/** Logo is a wide lockup; collapsed we crop to just the mark. */
const LOGO_OPEN = 84;
const LOGO_CLOSED = 34;

/** `badge` is optional — nothing carries one right now, but the rail still
 *  supports it. */
const NAV: { link: string; icon: LucideIcon; text: string; badge?: number }[] = [
  { link: "/", icon: Home, text: "Home" },
  { link: "/care", icon: HeartPulse, text: "Perawatan" },
  { link: "/community", icon: UsersRound, text: "Komunitas" },
  { link: "/#maskot", icon: PawPrint, text: "Maskot Karsa" },
];

type RailProps = {
  isOpen: boolean;
  railId: string;
  active: string;
  onSelect: (link: string) => void;
  onToggle?: () => void;
  onClose?: () => void;
};

function Rail({ isOpen, railId, active, onSelect, onToggle, onClose }: RailProps) {
  const reduce = useReducedMotion();
  const size = reduce ? { duration: 0 } : RAIL_SPRING;
  const fade = reduce ? { duration: 0 } : { duration: 0.2, ease: EASE };

  return (
    <div className="relative flex h-full flex-col bg-karsa-cream">
      {/* Brand */}
      <div className="flex h-[72px] shrink-0 items-center pl-[25px] pr-3.5">
        <motion.div
          initial={{ width: isOpen ? LOGO_OPEN : LOGO_CLOSED }}
          animate={{ width: isOpen ? LOGO_OPEN : LOGO_CLOSED }}
          transition={size}
          className="h-9 shrink-0 overflow-hidden"
        >
          <Image
            src="/logo.png"
            alt="Karsa"
            width={LOGO_OPEN}
            height={36}
            priority
            className="max-w-none"
          />
        </motion.div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="ml-auto grid h-10 w-10 place-items-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-900/[0.05] hover:text-neutral-900 md:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="mx-3.5 h-px bg-karsa-line" />

      {/* Profile */}
      <div className="px-3.5 pt-3.5">
        <Link
          href="/#user"
          onClick={() => onSelect("/#user")}
          className={`group/item relative flex h-14 items-center rounded-xl px-3.5 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
            active === "/#user"
              ? "bg-white shadow-[0_1px_2px_rgba(24,32,24,0.06)] ring-1 ring-karsa-line"
              : "hover:bg-neutral-900/[0.045]"
          }`}
        >
          <span className="relative grid w-7 shrink-0 place-items-center">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-karsa text-[11px] font-bold text-white transition-transform duration-200 group-hover/item:scale-110">
              M
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-karsa-cream" />
          </span>

          <motion.div
            animate={{
              width: isOpen ? "auto" : 0,
              opacity: isOpen ? 1 : 0,
              x: isOpen ? 0 : -8,
            }}
            transition={
              reduce
                ? { duration: 0 }
                : {
                    width: { duration: 0.28, ease: EASE },
                    x: { duration: 0.28, ease: EASE },
                    opacity: {
                      duration: isOpen ? 0.18 : 0.1,
                      delay: isOpen ? 0.08 : 0,
                    },
                  }
            }
            className="overflow-hidden whitespace-nowrap"
          >
            <p className="ml-3.5 text-[15px] font-semibold text-neutral-800">
              Meimei Tole tole
            </p>
            <p className="ml-3.5 text-xs text-neutral-500">Lihat profil</p>
          </motion.div>
        </Link>
      </div>

      {/* Section label — fades out when collapsed but keeps its slot,
          so the nav below never jumps. */}
      <div className="px-7 pb-2.5 pt-6">
        <motion.p
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={fade}
          className="text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-neutral-400"
        >
          Menu
        </motion.p>
      </div>

      <nav>
        <ul className="space-y-1.5 px-3.5">
          {NAV.map((item) => (
            <List
              key={item.link}
              link={item.link}
              icon={item.icon}
              text={item.text}
              badge={item.badge}
              isOpen={isOpen}
              railId={railId}
              isActive={active === item.link}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </nav>

      <div className="flex-1" />

      <div className="mx-3.5 h-px bg-karsa-line" />

      <ul className="space-y-1.5 px-3.5 py-3.5">
        <List
          link="/settings"
          icon={Settings}
          text="Pengaturan"
          isOpen={isOpen}
          railId={railId}
          isActive={active === "/settings"}
          onSelect={onSelect}
        />
      </ul>

      {/* Collapse handle, straddling the rail's edge. */}
      {onToggle && (
        <motion.button
          onClick={onToggle}
          aria-label={isOpen ? "Ciutkan sidebar" : "Lebarkan sidebar"}
          aria-expanded={isOpen}
          whileHover={reduce ? undefined : { scale: 1.14 }}
          whileTap={reduce ? undefined : { scale: 0.86 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 22 }}
          className="group/toggle absolute -right-4 top-[20px] z-50 hidden h-8 w-8 place-items-center rounded-full bg-white text-neutral-400 shadow-[0_2px_10px_-2px_rgba(24,32,24,0.22)] outline-none ring-1 ring-karsa-line transition-colors duration-200 hover:bg-karsa hover:text-white hover:ring-karsa focus-visible:ring-2 focus-visible:ring-karsa md:grid"
        >
          {/* Soft halo that blooms on hover. */}
          <span className="absolute inset-0 -z-10 scale-90 rounded-full bg-karsa/25 opacity-0 blur-[6px] transition-all duration-300 group-hover/toggle:scale-150 group-hover/toggle:opacity-100" />

          <motion.span
            animate={{ rotate: isOpen ? 0 : 180 }}
            transition={size}
            className="grid place-items-center"
          >
            <ChevronsLeft size={17} strokeWidth={2.5} />
          </motion.span>

          <span
            role="tooltip"
            className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 -translate-x-1 scale-95 whitespace-nowrap rounded-lg bg-neutral-900 px-2.5 py-1.5 text-[13px] font-medium text-white opacity-0 shadow-lg transition-all duration-150 ease-out group-hover/toggle:translate-x-0 group-hover/toggle:scale-100 group-hover/toggle:opacity-100"
          >
            {isOpen ? "Ciutkan" : "Lebarkan"}
            <kbd className="ml-1.5 rounded border border-white/25 bg-white/10 px-1.5 py-px font-sans text-[11px]">
              ⌘B
            </kbd>
          </span>
        </motion.button>
      )}
    </div>
  );
}

export default function Sidebar({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const [active, setActive] = useState(pathname);
  const reduce = useReducedMotion();

  /* The rail lives in the layout and survives navigation, so the highlight has
     to follow the route. Keyed on pathname only: in-page hash links leave it
     alone, which lets the local click state stand. */
  useEffect(() => {
    setActive(pathname);
  }, [pathname]);

  const size = reduce ? { duration: 0 } : RAIL_SPRING;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const handleSelect = (link: string) => {
    setActive(link);
    setMobileOpen(false);
  };

  return (
    <>
      <section id="sb">
        {/* Mobile trigger */}
        <motion.button
          onClick={() => setMobileOpen(true)}
          aria-label="Buka menu"
          aria-expanded={mobileOpen}
          whileTap={reduce ? undefined : { scale: 0.9 }}
          animate={{ opacity: mobileOpen ? 0 : 1, scale: mobileOpen ? 0.85 : 1 }}
          transition={reduce ? { duration: 0 } : { duration: 0.18, ease: EASE }}
          className="fixed left-4 top-4 z-30 grid h-11 w-11 place-items-center rounded-2xl bg-karsa-cream text-neutral-700 shadow-[0_2px_10px_-2px_rgba(24,32,24,0.22)] ring-1 ring-karsa-line md:hidden"
        >
          <Menu size={20} strokeWidth={2.2} />
        </motion.button>

        {/* Desktop rail */}
        <motion.aside
          initial={{ width: isOpen ? RAIL_OPEN : RAIL_CLOSED }}
          animate={{ width: isOpen ? RAIL_OPEN : RAIL_CLOSED }}
          transition={size}
          /* Above page chrome: the collapse handle straddles the rail's edge,
             so anything pinned in the content column would otherwise cover it. */
          className="fixed inset-y-0 left-0 z-50 hidden border-r border-karsa-line md:block"
        >
          <Rail
            isOpen={isOpen}
            railId="desktop"
            active={active}
            onSelect={handleSelect}
            onToggle={() => setIsOpen((v) => !v)}
          />
        </motion.aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                key="scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.2, ease: EASE }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40 bg-neutral-950/40 backdrop-blur-[2px] md:hidden"
              />
              <motion.aside
                key="drawer"
                initial={{ x: -DRAWER_WIDTH }}
                animate={{ x: 0 }}
                exit={{ x: -DRAWER_WIDTH }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 400, damping: 40, mass: 0.9 }
                }
                className="fixed inset-y-0 left-0 z-50 w-[296px] border-r border-karsa-line shadow-2xl md:hidden"
              >
                <Rail
                  isOpen
                  railId="mobile"
                  active={active}
                  onSelect={handleSelect}
                  onClose={() => setMobileOpen(false)}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </section>

      {/* Content area. The rail itself is fixed, so this spacer — and not a
          margin — is what keeps the page clear of it, and it animates with
          the same spring. On mobile the rail overlays, so there's no spacer. */}
      <div className="flex min-h-screen bg-karsa-canvas">
        <motion.div
          aria-hidden
          initial={{ width: isOpen ? RAIL_OPEN : RAIL_CLOSED }}
          animate={{ width: isOpen ? RAIL_OPEN : RAIL_CLOSED }}
          transition={size}
          className="hidden shrink-0 md:block"
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}

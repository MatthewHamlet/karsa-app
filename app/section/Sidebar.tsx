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
  NotebookPen,
  ScanText,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import List, { EASE, RAIL_SPRING } from "../components/List";
import BottomNav from "../components/BottomNav";
import { ACCOUNT } from "../data/settings";
import { PATIENT } from "../data/patient";

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
type NavItem = { link: string; icon: LucideIcon; text: string; badge?: number };

const NAV: NavItem[] = [
  { link: "/", icon: Home, text: "Home" },
  { link: "/care", icon: HeartPulse, text: "Perawatan" },
  { link: "/scan", icon: ScanText, text: "Scan Resep" },
  { link: "/community", icon: UsersRound, text: "Komunitas" },
  { link: "/mascot", icon: PawPrint, text: "Maskot Karsa" },
];

/** The same rail, pointed somewhere else.
 *
 *  `/pasien` is a different product for a different person, and the caregiver's
 *  destinations are meaningless there — a patient has no "Scan Resep" and no
 *  compliance page about themselves. What stays identical is the rail itself:
 *  the logo, the collapse handle, the pill, the row heights. Only the list of
 *  places changes, so someone who has seen one app can use the other. */
const PATIENT_NAV: NavItem[] = [
  { link: "/pasien", icon: Home, text: "Beranda" },
  { link: "/pasien/jurnal", icon: NotebookPen, text: "Jurnal" },
  { link: "/pasien/komunitas", icon: UsersRound, text: "Komunitas" },
  { link: "/pasien/maskot", icon: PawPrint, text: "Maskot Karsa" },
];

type RailProps = {
  isOpen: boolean;
  railId: string;
  active: string;
  onSelect: (link: string) => void;
  onToggle?: () => void;
  onClose?: () => void;
  /** Whether we are inside the patient app. Swaps the destinations and whose
   *  name is at the foot — not the rail's design. */
  patientApp?: boolean;
};

function Rail({ isOpen, railId, active, onSelect, onToggle, onClose, patientApp }: RailProps) {
  const reduce = useReducedMotion();
  const items = patientApp ? PATIENT_NAV : NAV;
  const settingsLink = patientApp ? "/pasien/pengaturan" : "/settings";
  const me = patientApp
    ? { name: PATIENT.greeting, role: "Pasien", initial: PATIENT.initial, href: "/pasien/profil" }
    : { name: ACCOUNT.name, role: ACCOUNT.role, initial: ACCOUNT.initial, href: "/settings?bagian=profile" };
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

      {/* The profile used to sit here, under the logo. It is at the foot of
          the rail now, directly above Pengaturan — see `RailProfile`. The top
          is the logo and the collapse handle, nothing else. */}

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
          {items.map((item) => (
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

      {/* The account, at the foot of the rail where an account belongs — and
          directly above Pengaturan, because "who am I" and "change how this
          works for me" are the same errand. It used to sit in the top-right of
          the dashboard, over a column of somebody else's numbers. */}
      <div className="px-3.5 pb-1 pt-3.5">
        <RailProfile isOpen={isOpen} onSelect={onSelect} {...me} />
      </div>

      <ul className="space-y-1.5 px-3.5 pb-3.5 pt-1.5">
        <List
          link={settingsLink}
          icon={Settings}
          text="Pengaturan"
          isOpen={isOpen}
          railId={railId}
          isActive={active === settingsLink}
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

/** The caregiver's own row. Built here rather than reusing `List` because that
 *  takes a line icon, and a person is a face — but the collapse behaviour is
 *  copied from it exactly, so the two rows shrink as one block. */
function RailProfile({
  isOpen,
  onSelect,
  name,
  role,
  initial,
  href,
}: {
  isOpen: boolean;
  onSelect?: (link: string) => void;
  name: string;
  role: string;
  initial: string;
  href: string;
}) {
  const reduce = useReducedMotion();

  const label = reduce
    ? { duration: 0 }
    : {
        width: { duration: 0.28, ease: EASE },
        x: { duration: 0.28, ease: EASE },
        opacity: { duration: isOpen ? 0.18 : 0.1, delay: isOpen ? 0.08 : 0 },
      };

  return (
    <Link
      href={href}
      onClick={() => onSelect?.(href)}
      className="group/me relative flex h-12 items-center rounded-xl px-3.5 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40"
    >
      <span className="absolute inset-0 rounded-xl bg-neutral-900/0 transition-colors duration-200 group-hover/me:bg-neutral-900/[0.045]" />

      <span className="relative z-10 grid w-7 shrink-0 place-items-center">
        <span className="relative">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-karsa text-[13px] font-bold text-white">
            {initial}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-karsa-cream" />
        </span>
      </span>

      <motion.span
        animate={{ width: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -8 }}
        transition={label}
        className="relative z-10 overflow-hidden whitespace-nowrap"
      >
        <span className="ml-3.5 block">
          <span className="block truncate text-[15px] font-semibold leading-5 text-neutral-800">
            {name}
          </span>
          <span className="block truncate text-[12.5px] leading-4 text-neutral-500">
            {role}
          </span>
        </span>
      </motion.span>

      {!isOpen && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-[calc(100%+16px)] top-1/2 z-50 -translate-x-1 -translate-y-1/2 scale-95 whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-2 text-[13px] font-medium text-white opacity-0 shadow-lg transition-all duration-150 ease-out group-hover/me:translate-x-0 group-hover/me:scale-100 group-hover/me:opacity-100"
        >
          {name}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const [active, setActive] = useState(pathname);
  const [seenPath, setSeenPath] = useState(pathname);
  const reduce = useReducedMotion();
  const patientApp = pathname.startsWith("/pasien");

  /* The rail lives in the layout and survives navigation, so the highlight has
     to follow the route. Keyed on pathname only: in-page hash links leave it
     alone, which lets the local click state stand.

     Adjusted during render rather than in an effect. A click sets `active`
     optimistically so the pill moves before the route does; the route then
     confirms it. Doing that in an effect means React commits the stale
     highlight, paints it, and only then corrects — one visible frame of the
     pill in the wrong place, plus the cascading-render lint. Comparing against
     the last pathname we handled is the documented way to derive state from a
     changing input. */
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    setActive(pathname);
  }

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
        {/* Phone navigation is a bar at the bottom, not a drawer behind a
            hamburger. The drawer survives as the "Lainnya" tab, which is where
            the profile and settings live. */}
        <BottomNav
          pathname={pathname}
          moreOpen={mobileOpen}
          onMore={() => setMobileOpen((open) => !open)}
        />

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
            patientApp={patientApp}
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
                  patientApp={patientApp}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </section>

      {/* Content area. The rail itself is fixed, so this spacer — and not a
          margin — is what keeps the page clear of it, and it animates with
          the same spring. On mobile the rail overlays, so there's no spacer. */}
      {/* The patient app is locked to the viewport from `lg` up: one screen, no
          page scrollbar, and only the task list scrolls inside itself. It is
          done here rather than inside the page because `h-full` needs a
          definite height to inherit, and `min-h-screen` is not one — a page
          asking for "the height of the window" would otherwise get "auto".
          Below `lg` it stays a normal scrolling column: seven tasks and a room
          do not fit on a phone, and forcing them to would mean shrinking the
          text for the one audience that cannot spare it. */}
      <div
        className={`flex bg-karsa-canvas ${
          patientApp ? "min-h-screen lg:h-screen lg:overflow-hidden" : "min-h-screen"
        }`}
      >
        <motion.div
          aria-hidden
          initial={{ width: isOpen ? RAIL_OPEN : RAIL_CLOSED }}
          animate={{ width: isOpen ? RAIL_OPEN : RAIL_CLOSED }}
          transition={size}
          className="hidden shrink-0 md:block"
        />
        {/* `--bottom-nav` is the bar's height (0 from `md` up — see globals).
            Pages that fill the viewport subtract it; everything else just needs
            its last row to clear the bar. */}
        <main
          className={`min-w-0 flex-1 pb-[var(--bottom-nav)] ${
            patientApp ? "lg:h-full lg:min-h-0 lg:pb-0" : ""
          }`}
        >
          {children}
        </main>
      </div>
    </>
  );
}

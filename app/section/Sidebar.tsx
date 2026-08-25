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
  LogOut,
  HeartHandshake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import List, { EASE, RAIL_SPRING } from "../components/List";
import BottomNav from "../components/BottomNav";
import UserAvatar from "../components/UserAvatar";
import { ACCOUNT } from "../data/settings";
import { ROLE_LABEL, type SessionProfile } from "../lib/roles";
import { signOut } from "../login/actions";
import { PATIENT } from "../data/patient";


const RAIL_OPEN = 288;
const RAIL_CLOSED = 84;
const DRAWER_WIDTH = 296;


const LOGO_OPEN = 84;
const LOGO_CLOSED = 34;


type NavItem = { link: string; icon: LucideIcon; text: string; badge?: number };

const NAV: NavItem[] = [
  { link: "/", icon: Home, text: "Home" },
  { link: "/care", icon: HeartPulse, text: "Perawatan" },
  { link: "/scan", icon: ScanText, text: "Scan Resep" },
  { link: "/community", icon: UsersRound, text: "Komunitas" },
  { link: "/mascot", icon: PawPrint, text: "Arsa" },
];


const PATIENT_NAV: NavItem[] = [
  { link: "/pasien", icon: Home, text: "Beranda" },
  { link: "/pasien/jurnal", icon: NotebookPen, text: "Jurnal" },
  { link: "/pasien/scan", icon: ScanText, text: "Scan Resep" },
  { link: "/pasien/pendamping", icon: HeartHandshake, text: "Pendamping" },
  { link: "/pasien/komunitas", icon: UsersRound, text: "Komunitas" },
  { link: "/pasien/maskot", icon: PawPrint, text: "Arsa" },
];

type RailProps = {
  isOpen: boolean;
  railId: string;
  active: string;
  onSelect: (link: string) => void;
  onToggle?: () => void;
  onClose?: () => void;

  patientApp?: boolean;

  profile?: SessionProfile | null;
};

function Rail({ isOpen, railId, active, onSelect, onToggle, onClose, patientApp, profile }: RailProps) {
  const reduce = useReducedMotion();
  const items = patientApp ? PATIENT_NAV : NAV;
  const settingsLink = patientApp ? "/pasien/pengaturan" : "/settings";

  const fallback = patientApp
    ? { name: PATIENT.greeting, role: "Pasien", initial: PATIENT.initial }
    : { name: ACCOUNT.name, role: ACCOUNT.role, initial: ACCOUNT.initial };
  const me = {
    name: profile?.fullName ?? fallback.name,
    role: profile ? ROLE_LABEL[profile.role] : fallback.role,
    initial: profile?.initial ?? fallback.initial,

    avatarUrl: profile?.avatarUrl ?? undefined,
  };
  const size = reduce ? { duration: 0 } : RAIL_SPRING;
  const fade = reduce ? { duration: 0 } : { duration: 0.2, ease: EASE };

  return (
    <div className="relative flex h-full flex-col bg-karsa-cream">

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


      <div className="px-3.5 pb-1 pt-3.5">
        <RailProfile isOpen={isOpen} {...me} />
      </div>

      <ul className="space-y-1.5 px-3.5 pt-1.5">
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


      {profile && (
        <form action={signOut} className="px-3.5 pb-3.5 pt-1.5">
          <button
            type="submit"
            title={isOpen ? undefined : "Keluar"}
            className="group/out relative flex h-12 w-full items-center rounded-xl px-3.5 text-left outline-none transition-colors duration-200 hover:bg-rose-500/[0.07] focus-visible:ring-2 focus-visible:ring-rose-400/50"
          >
            <span className="relative z-10 grid w-7 shrink-0 place-items-center text-neutral-500 transition-colors group-hover/out:text-rose-600">
              <LogOut size={20} strokeWidth={2.1} aria-hidden />
            </span>
            <motion.span
              animate={{ width: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -8 }}
              transition={fade}
              className="relative z-10 overflow-hidden whitespace-nowrap"
            >
              <span className="ml-3.5 block text-[15px] font-semibold text-neutral-600 transition-colors group-hover/out:text-rose-600">
                Keluar
              </span>
            </motion.span>
          </button>
        </form>
      )}


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


function RailProfile({
  isOpen,
  name,
  role,
  initial,
  avatarUrl,
}: {
  isOpen: boolean;
  name: string;
  role: string;
  initial: string;
  avatarUrl?: string;
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
    <div className="group/me relative flex h-12 items-center rounded-xl px-3.5">
      <span className="relative z-10 grid w-7 shrink-0 place-items-center">
        <span className="relative">
          <UserAvatar url={avatarUrl} initial={initial} className="h-8 w-8 text-[13px]" />
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
    </div>
  );
}

export default function Sidebar({
  children,
  profile,
}: {
  children?: React.ReactNode;
  profile?: SessionProfile | null;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const [active, setActive] = useState(pathname);
  const [seenPath, setSeenPath] = useState(pathname);
  const reduce = useReducedMotion();
  const patientApp = pathname.startsWith("/pasien");

  const patientHome = pathname === "/pasien";


  const bareShell =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/mulai" ||
    pathname === "/pair";


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


  if (bareShell) return <>{children}</>;

  return (
    <>
      <section id="sb">

        <BottomNav
          pathname={pathname}
          moreOpen={mobileOpen}
          onMore={() => setMobileOpen((open) => !open)}
        />


        <motion.aside
          initial={{ width: isOpen ? RAIL_OPEN : RAIL_CLOSED }}
          animate={{ width: isOpen ? RAIL_OPEN : RAIL_CLOSED }}
          transition={size}

          className="fixed inset-y-0 left-0 z-50 hidden border-r border-karsa-line md:block"
        >
          <Rail
            profile={profile}
            isOpen={isOpen}
            railId="desktop"
            active={active}
            onSelect={handleSelect}
            onToggle={() => setIsOpen((v) => !v)}
            patientApp={patientApp}
          />
        </motion.aside>


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
                  profile={profile}
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



      <div
        className={`flex min-h-screen bg-karsa-canvas ${
          patientHome ? "lg:h-screen lg:overflow-hidden" : ""
        }`}
      >
        <motion.div
          aria-hidden
          initial={{ width: isOpen ? RAIL_OPEN : RAIL_CLOSED }}
          animate={{ width: isOpen ? RAIL_OPEN : RAIL_CLOSED }}
          transition={size}
          className="hidden shrink-0 md:block"
        />

        <main
          data-rail={isOpen ? "open" : "closed"}
          className={`min-w-0 flex-1 pb-[var(--bottom-nav)] ${
            patientApp ? "patient-shell" : ""
          } ${
            patientHome ? "patient-home lg:h-full lg:min-h-0 lg:pb-0" : ""
          }`}
        >
          {children}
        </main>
      </div>
    </>
  );
}

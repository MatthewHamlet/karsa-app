"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, ChevronDown, MessageCircle, Settings, UserRoundPlus } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import MoodFace from "./MoodFace";
import CareStats from "./CareStats";
import PatientActivities from "./PatientActivities";
import ImportantInfo from "./ImportantInfo";
import TeamChat from "./TeamChat";
import { EASE } from "./List";
import { CARE_GROUP } from "../data/careStats";
import { MOOD_BY_KEY, MOOD_ENTRIES } from "../data/mood";
import type { CareContextType } from "../data/care";
import type { CareData } from "../lib/care/view";
import { colourFor } from "./avatarColour";

export type CareTab = "stats" | "chat";

const CLAY = "#6d5647";


const BLEED = "-mx-4 sm:-mx-6 md:-mx-8 xl:-mx-12";
const PAD = "px-4 sm:px-6 md:px-8 xl:px-12";

const RISE = "-mt-6 md:-mt-10 xl:-mt-12";


const MORPH_MS = 200;


const FULL_FLOOR = 96;

const SLIM_BAR = 56;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const TABS: { key: CareTab; label: string; icon: typeof BarChart3 }[] = [
  { key: "stats", label: "Aktivitas & Statistik", icon: BarChart3 },
  { key: "chat", label: "Obrolan Tim", icon: MessageCircle },
];




const MORPH =
  "transition-[height,width,padding,font-size,line-height,border-radius,color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none";


const REVEAL = "motion-safe:animate-[header-reveal_200ms_cubic-bezier(0.32,0.72,0,1)_both]";


const COLLAPSE_AT = 88;
const RESTORE_AT = 28;

function TabSwitcher({
  tab,
  onSelect,
  compact = false,
}: {
  tab: CareTab;
  onSelect: (next: CareTab) => void;
  compact?: boolean;
}) {

  return (
    <div
      role="tablist"
      aria-label="Tampilan perawatan"
      className="relative inline-grid grid-cols-2 rounded-full bg-white/15 p-1 ring-1 ring-white/20"
    >

      <span
        aria-hidden
        style={{ transform: `translateX(${tab === TABS[1].key ? "100%" : "0%"})` }}
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
      />

      {TABS.map((item) => {
        const Icon = item.icon;
        const active = tab === item.key;
        return (
          <button
            key={item.key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onSelect(item.key)}
            className={`relative inline-flex items-center justify-center gap-2 rounded-full font-semibold outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${MORPH} ${
              compact
                ? "px-3 py-1.5 text-[12.5px]"
                : "px-3 py-2 text-[12.5px] sm:px-5 sm:py-2.5 sm:text-[13.5px]"
            } ${active ? "" : "text-white/75 hover:text-white"}`}
            style={active ? { color: CLAY } : undefined}
          >
            <Icon size={compact ? 14 : 16} strokeWidth={2.2} />
            <span className={`whitespace-nowrap ${compact ? "hidden lg:inline" : ""}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}


function GroupIdentity({ slim = false, data }: { slim?: boolean; data?: CareData }) {

  const latest = data ? data.moods[0] : MOOD_ENTRIES[0];
  const mood = latest ? MOOD_BY_KEY[latest.mood] : null;
  const groupName = data ? `Pendamping ${data.patientName}` : CARE_GROUP.name;
  const members = data
    ? data.group.members.map((m) => ({
        id: m.id,
        name: m.name,
        initial: m.initial,
        color: colourFor(m.id),
      }))
    : CARE_GROUP.members;

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">

        <p
          className={`truncate font-bold tracking-tight text-white ${MORPH} ${
            slim
              ? "text-[15px] leading-[1.55]"
              : "text-[18px] leading-[1.35] sm:text-[22px] sm:leading-[1.3] xl:text-[26px]"
          }`}
        >
          {groupName}
        </p>

        {mood && latest && (
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold ${MORPH} ${
              slim ? "py-0.5 pl-0.5 pr-2 text-[11px]" : "py-1 pl-1 pr-3 text-[12.5px]"
            }`}
            style={{ backgroundColor: mood.soft, color: mood.ink }}
          >
            <MoodFace
              mood={latest.mood}
              className={`${MORPH} ${slim ? "h-4 w-4" : "h-5 w-5"}`}
            />
            {mood.label}
          </span>
        )}
      </div>


      {!slim && (
        <div className={`mt-2.5 hidden items-center gap-2.5 sm:flex ${REVEAL}`}>
          <div className="flex -space-x-2">
            {members.map((member) => (
              <span
                key={member.id}
                title={member.name}
                className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white ring-2"
                style={
                  { backgroundColor: member.color, "--tw-ring-color": CLAY } as CSSProperties
                }
              >
                {member.initial}
              </span>
            ))}
          </div>
          <span className="text-[13px] text-white/70">{members.length} anggota</span>
        </div>
      )}
    </div>
  );
}

function GroupActions() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13.5px] font-semibold outline-none transition-colors duration-200 hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70"
        style={{ color: CLAY }}
      >
        <UserRoundPlus size={16} strokeWidth={2.1} />
        <span className="hidden sm:inline">Tambah anggota</span>
      </button>
      <button
        type="button"
        aria-label="Pengaturan grup"
        className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white outline-none ring-1 ring-white/25 transition-colors duration-200 hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <Settings size={17} strokeWidth={2} />
      </button>
    </div>
  );
}

function ExpandToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  const reduce = useReducedMotion();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? "Ciutkan header grup" : "Tampilkan header grup"}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white outline-none ring-1 ring-white/25 transition-colors duration-200 hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <motion.span
        animate={{ rotate: open ? 180 : 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.22, ease: EASE }}
        className="grid place-items-center"
      >
        <ChevronDown size={16} strokeWidth={2.4} />
      </motion.span>
    </button>
  );
}


function HeaderBody({
  slim,
  tab,
  onSelect,
  toggle,
  data,
}: {
  slim: boolean;
  tab: CareTab;
  onSelect: (next: CareTab) => void;
  toggle?: ReactNode;
  data?: CareData;
}) {
  return (
    <div
      className={`flex ${
        slim
          ? "h-14 items-center gap-3"
          : "flex-wrap items-center gap-x-4 gap-y-3 sm:gap-x-6 sm:gap-y-4"
      }`}
    >
      {!slim && (
        <p
          className={`w-full text-[11px] font-semibold uppercase leading-4 tracking-[0.18em] text-white/60 ${REVEAL}`}
        >
          Perawatan
        </p>
      )}


      <div
        className={`flex min-w-0 items-center ${slim ? "gap-3" : "w-full gap-4 sm:gap-6"}`}
      >
        <ProfileAvatar
          className={`${MORPH} ${
            slim ? "h-9 w-9" : "h-12 w-12 sm:h-16 sm:w-16 xl:h-[72px] xl:w-[72px]"
          }`}
        />
        <h1 className="sr-only">
          {data ? `Pendamping ${data.patientName}` : CARE_GROUP.name}
        </h1>

        <GroupIdentity slim={slim} data={data} />

        {!slim && (
          <div className={`ml-auto flex shrink-0 items-center gap-2 ${REVEAL}`}>
            <GroupActions />
            {toggle}
          </div>
        )}
      </div>

      <div className={slim ? "ml-auto shrink-0" : "w-full"}>
        <TabSwitcher tab={tab} onSelect={onSelect} compact={slim} />
      </div>

      {slim && toggle}
    </div>
  );
}


const Blobs = ({ height }: { height?: number }) => (
  <svg
    aria-hidden
    viewBox="0 0 600 200"
    preserveAspectRatio="xMaxYMid slice"
    style={{ height: height || undefined }}
    className="pointer-events-none absolute inset-x-0 top-0 w-full opacity-[0.13]"
  >
    <circle cx="512" cy="18" r="118" fill="white" />
    <circle cx="596" cy="164" r="86" fill="white" />
    <circle cx="392" cy="182" r="62" fill="white" />
  </svg>
);

export default function CareShell({
  initialTab,
  context,
  data,
}: {
  initialTab: CareTab;
  context?: { type: CareContextType; label: string; detail?: string } | null;

  data?: CareData;
}) {
  const [tab, setTab] = useState<CareTab>(initialTab);
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fullH, setFullH] = useState(0);
  const [slimH, setSlimH] = useState(SLIM_BAR);
  const contentRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const fade = reduce ? { duration: 0 } : { duration: 0.24, ease: EASE };


  const pinned = collapsed || tab === "chat";


  const slim = pinned && !expanded;


  const settled = useRef(true);
  const measureRef = useRef<() => void>(undefined);

  useIsoLayoutEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const sync = () => {
      if (!settled.current) return;
      const height = node.offsetHeight;
      if (height >= FULL_FLOOR) setFullH(height);
      else if (height > 0) setSlimH(height);
    };

    measureRef.current = sync;
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);


  const wasSlim = useRef(slim);
  useIsoLayoutEffect(() => {
    if (wasSlim.current === slim) return;
    wasSlim.current = slim;

    settled.current = false;
    const done = window.setTimeout(() => {
      settled.current = true;
      measureRef.current?.();
    }, MORPH_MS + 60);

    return () => window.clearTimeout(done);
  }, [slim]);


  useEffect(() => {
    const measure = () => {
      const y = window.scrollY;
      setCollapsed((was) => (was ? y > RESTORE_AT : y > COLLAPSE_AT));

      setExpanded(false);
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);


  useEffect(() => setExpanded(false), [tab]);


  useEffect(() => {
    if (tab !== "chat") return;

    window.scrollTo({ top: 0 });
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [tab]);


  const hostH = tab === "chat" ? slimH : fullH;

  return (
    <div>

      <div
        className={`pointer-events-none sticky top-0 z-20 ${RISE} ${BLEED}`}
        style={{ height: hostH || undefined }}
      >

        <header
          className={`pointer-events-auto absolute inset-x-0 top-0 overflow-hidden ${MORPH} ${
            slim
              ? "shadow-[0_10px_26px_-18px_rgba(24,32,24,0.65)]"
              : "rounded-b-[32px] sm:rounded-b-[44px]"
          }`}
          style={{
            backgroundColor: CLAY,
            height: (slim ? slimH : fullH) || undefined,
          }}
        >
          <Blobs height={fullH} />
          <div
            ref={contentRef}
            className={`absolute inset-x-0 top-0 ${PAD} ${slim ? "" : "pb-5 pt-5 sm:pb-6 sm:pt-6 xl:pt-7"}`}
          >
            <HeaderBody
              slim={slim}
              tab={tab}
              onSelect={setTab}
              data={data}
              toggle={
                pinned ? (
                  <ExpandToggle open={expanded} onClick={() => setExpanded((v) => !v)} />
                ) : null
              }
            />
          </div>
        </header>
      </div>


      {tab === "stats" ? (
        <motion.div
          key="stats"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fade}
          className="mt-8 space-y-8 xl:mt-10 xl:space-y-10"
        >
          {data?.pending ? (

            <p className="rounded-3xl bg-amber-50 px-6 py-8 text-center text-[15px] leading-6 text-amber-800 ring-1 ring-amber-200">
              Menunggu persetujuan dari {data.patientName}.
              <br />
              Statistik dan catatannya terbuka setelah dia menyetujui.
            </p>
          ) : (
            <>
              <CareStats data={data} />
              <PatientActivities data={data} />
              <ImportantInfo data={data} />
            </>
          )}
        </motion.div>
      ) : (

        <div className={`-mb-10 xl:-mb-12 ${BLEED}`}>
          <TeamChat
            context={context}
            data={data}
            height={hostH ? `calc(100svh - ${hostH}px - var(--bottom-nav))` : undefined}
          />
        </div>
      )}
    </div>
  );
}

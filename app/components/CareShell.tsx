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

export type CareTab = "stats" | "chat";

const CLAY = "#6d5647";

/** The page's own padding, and the negative margins that cancel it. */
const BLEED = "-mx-4 sm:-mx-6 md:-mx-8 xl:-mx-12";
const PAD = "px-4 sm:px-6 md:px-8 xl:px-12";
/** The header's upward pull, into the page's top padding. */
const RISE = "-mt-20 md:-mt-10 xl:-mt-12";

/** Matches the reference navbar's feel: quick, with just enough overshoot. */
const SPRING = { type: "spring", stiffness: 330, damping: 30, mass: 0.7 } as const;

/** Anything shorter than this is the header mid-collapse, not its real size. */
const FULL_FLOOR = 96;
/** `h-14` — what the bar measures before it has been measured. */
const SLIM_BAR = 56;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const TABS: { key: CareTab; label: string; icon: typeof BarChart3 }[] = [
  { key: "stats", label: "Aktivitas & Statistik", icon: BarChart3 },
  { key: "chat", label: "Obrolan Tim", icon: MessageCircle },
];

/* Every piece the two sizes have in common carries a `layoutId`, and only one
   copy is ever mounted. That is what makes the collapse a movement instead of
   a cross-fade: the avatar, the name, the mood chip and the active tab pill
   are literally the same elements travelling to their smaller positions. */
const ID = {
  avatar: "care-avatar",
  title: "care-title",
  mood: "care-mood",
  pill: "care-tab-pill",
};

function TabSwitcher({
  tab,
  onSelect,
  compact = false,
}: {
  tab: CareTab;
  onSelect: (next: CareTab) => void;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    /* `layout` on every block the header re-shapes: without it they inherit the
       header's scale while it springs, and the text squashes with the box. */
    <motion.div
      layout
      transition={reduce ? { duration: 0 } : SPRING}
      role="tablist"
      aria-label="Tampilan perawatan"
      className="inline-flex rounded-full bg-white/15 p-1 ring-1 ring-white/20"
    >
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
            className={`relative inline-flex items-center gap-2 rounded-full font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/70 ${
              compact ? "px-3 py-1.5 text-[12.5px]" : "px-4 py-2.5 text-[13.5px] sm:px-5"
            } ${active ? "" : "text-white/75 hover:text-white"}`}
            style={active ? { color: CLAY } : undefined}
          >
            {active && (
              <motion.span
                layoutId={ID.pill}
                transition={
                  reduce ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 38 }
                }
                className="absolute inset-0 rounded-full bg-white"
              />
            )}
            <Icon size={compact ? 14 : 16} strokeWidth={2.2} className="relative" />
            <span className={`relative whitespace-nowrap ${compact ? "hidden lg:inline" : ""}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </motion.div>
  );
}

/** Name, mood and members — the identity block, at two sizes. */
function GroupIdentity({ slim = false }: { slim?: boolean }) {
  const mood = MOOD_BY_KEY[MOOD_ENTRIES[0].mood];
  const reduce = useReducedMotion();

  return (
    <motion.div layout transition={reduce ? { duration: 0 } : SPRING} className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {/* `leading-none` clipped the descenders of "Pendamping" against
            `truncate`'s overflow box — the line has to be taller than the glyphs. */}
        <motion.p
          layoutId={ID.title}
          transition={reduce ? { duration: 0 } : SPRING}
          className={`truncate font-bold tracking-tight text-white ${
            slim ? "text-[15px] leading-[1.55]" : "text-[22px] leading-[1.3] xl:text-[26px]"
          }`}
        >
          {CARE_GROUP.name}
        </motion.p>

        <motion.span
          layoutId={ID.mood}
          transition={reduce ? { duration: 0 } : SPRING}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold ${
            slim ? "py-0.5 pl-0.5 pr-2 text-[11px]" : "py-1 pl-1 pr-3 text-[12.5px]"
          }`}
          style={{ backgroundColor: mood.soft, color: mood.ink }}
        >
          <MoodFace mood={MOOD_ENTRIES[0].mood} className={slim ? "h-4 w-4" : "h-5 w-5"} />
          {mood.label}
        </motion.span>
      </div>

      {!slim && (
        <div className="mt-2.5 flex items-center gap-2.5">
          <div className="flex -space-x-2">
            {CARE_GROUP.members.map((member) => (
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
          <span className="text-[13px] text-white/70">
            {CARE_GROUP.members.length} anggota
          </span>
        </div>
      )}
    </motion.div>
  );
}

function GroupActions() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      layout
      transition={reduce ? { duration: 0 } : SPRING}
      className="flex shrink-0 items-center gap-2"
    >
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
    </motion.div>
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

/** One header, rendered at two sizes. The chevron is only handed in once the
 *  header is pilled — at full size there is nothing to expand into. */
function HeaderBody({
  slim,
  tab,
  onSelect,
  toggle,
}: {
  slim: boolean;
  tab: CareTab;
  onSelect: (next: CareTab) => void;
  toggle?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const spring = reduce ? { duration: 0 } : SPRING;

  if (slim) {
    return (
      <div className="flex h-14 items-center gap-3">
        <motion.div layoutId={ID.avatar} transition={spring} className="shrink-0">
          <ProfileAvatar className="h-9 w-9" />
        </motion.div>
        <GroupIdentity slim />
        <motion.div layout transition={spring} className="ml-auto flex shrink-0 items-center gap-2">
          <TabSwitcher tab={tab} onSelect={onSelect} compact />
          {toggle}
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.18em] text-white/60">
        Perawatan
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-4">
        <motion.div layoutId={ID.avatar} transition={spring} className="shrink-0">
          <ProfileAvatar className="h-16 w-16 xl:h-[72px] xl:w-[72px]" />
        </motion.div>
        <h1 className="sr-only">{CARE_GROUP.name}</h1>
        <GroupIdentity />
        <motion.div layout transition={spring} className="ml-auto flex items-center gap-2">
          <GroupActions />
          {toggle}
        </motion.div>
      </div>

      <motion.div layout transition={spring} className="mt-5">
        <TabSwitcher tab={tab} onSelect={onSelect} />
      </motion.div>
    </div>
  );
}

const Blobs = () => (
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

export default function CareShell({
  initialTab,
  context,
}: {
  initialTab: CareTab;
  context?: { type: CareContextType; label: string; detail?: string } | null;
}) {
  const [tab, setTab] = useState<CareTab>(initialTab);
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fullH, setFullH] = useState(0);
  const [slimH, setSlimH] = useState(SLIM_BAR);
  const headerRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const spring = reduce ? { duration: 0 } : SPRING;
  const fade = reduce ? { duration: 0 } : { duration: 0.24, ease: EASE };

  /* Chat owns the whole viewport, so the header starts out of its way: pilled
     from the first frame, and openable only through the chevron — the tab
     never scrolls, so scrolling can't collapse it back. */
  const pinned = collapsed || tab === "chat";

  /** The 56px bar, or the header at full size. */
  const slim = pinned && !expanded;

  /* The header is absolutely positioned, so its host has to hold its height
     for it. Both sizes are worth keeping: `h-14` is rem-based, so the bar isn't
     56px for a reader who has scaled their text up. */
  useIsoLayoutEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const sync = () => {
      const height = node.offsetHeight;
      if (height >= FULL_FLOOR) setFullH(height);
      else if (height > 0) setSlimH(height);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* Deliberately not rAF-throttled: rAF stops firing whenever the page isn't
     compositing, which would strand the header in whichever state it was in. */
  useEffect(() => {
    const measure = () => {
      setCollapsed(window.scrollY > 24);
      /* Scrolling again always returns the header to its bar — the expanded
         state is a peek, not a mode. */
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

  /* A peek doesn't survive the tab it was opened on. */
  useEffect(() => setExpanded(false), [tab]);

  /* A chat screen doesn't scroll — the thread inside it does. Locking the page
     is also what keeps the composer on the fold: the shell reserves its height
     in `vh` while this pane is measured in `dvh`, and on a phone the address
     bar makes those two differ. Left scrollable, that difference shows up as a
     strip of dead canvas under the composer. */
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

  /* Each tab reserves one height and never changes it, so nothing under the
     header ever resizes: the stats tab always holds the full header (collapsing
     on scroll must not shift the page), and chat always holds just the bar. Open
     the chat header and it drops *over* the thread — the conversation keeps its
     size, and the peek costs nothing to close. */
  const hostH = tab === "chat" ? slimH : fullH;

  return (
    <div>
      {/* ── Header ───────────────────────────────────────────────────────
          One element the whole way through — the page never swaps it for a
          second bar, it just changes shape, and `layout` springs between the
          two. The host is pinned and `pointer-events-none`, so the 224px of
          viewport it reserves never swallows a click meant for the page (or
          for the rail's collapse handle, which straddles the edge). */}
      <div
        className={`pointer-events-none sticky top-0 z-20 ${RISE} ${BLEED}`}
        style={{ height: hostH || undefined }}
      >
        <motion.header
          ref={headerRef}
          layout
          transition={spring}
          className={`pointer-events-auto absolute inset-x-0 top-0 overflow-hidden ${PAD} ${
            slim
              ? "shadow-[0_10px_26px_-18px_rgba(24,32,24,0.65)]"
              : "rounded-b-[32px] pb-6 pt-[72px] sm:rounded-b-[44px] md:pt-6 xl:pt-7"
          }`}
          style={{ backgroundColor: CLAY }}
        >
          <Blobs />
          <div className="relative">
            <HeaderBody
              slim={slim}
              tab={tab}
              onSelect={setTab}
              toggle={
                pinned ? (
                  <ExpandToggle open={expanded} onClick={() => setExpanded((v) => !v)} />
                ) : null
              }
            />
          </div>
        </motion.header>
      </div>

      {/* ── Panel ────────────────────────────────────────────────────────── */}
      {tab === "stats" ? (
        <motion.div
          key="stats"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fade}
          className="mt-8 space-y-8 xl:mt-10 xl:space-y-10"
        >
          <CareStats />
          <PatientActivities />
          <ImportantInfo />
        </motion.div>
      ) : (
        /* Chat is not a card on a page — it *is* the page. Full-bleed and flush
           against the header, so the wallpaper owns everything below it. The
           negative margin cancels the page's own bottom padding — keep the pair
           in step with `pb-10 xl:pb-12` in Care.tsx — so the composer lands on
           the fold. No gap either side of it: nothing here is a card. */
        <div className={`-mb-10 xl:-mb-12 ${BLEED}`}>
          <TeamChat context={context} height={hostH ? `calc(100dvh - ${hostH}px)` : undefined} />
        </div>
      )}
    </div>
  );
}

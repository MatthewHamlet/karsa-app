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
/** The header's upward pull, into the page's top padding. Matches the page
 *  root's `pt-6 md:pt-10 xl:pt-12` exactly — the phone figure used to be 80px
 *  of clearance for a floating hamburger that no longer exists. */
const RISE = "-mt-6 md:-mt-10 xl:-mt-12";

/** Kept in step with `duration-200` in MORPH — the measuring gate below waits
 *  this long before believing the header has stopped moving. */
const MORPH_MS = 200;

/** Anything shorter than this is the header mid-collapse, not its real size. */
const FULL_FLOOR = 96;
/** `h-14` — what the bar measures before it has been measured. */
const SLIM_BAR = 56;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const TABS: { key: CareTab; label: string; icon: typeof BarChart3 }[] = [
  { key: "stats", label: "Aktivitas & Statistik", icon: BarChart3 },
  { key: "chat", label: "Obrolan Tim", icon: MessageCircle },
];

/* Nothing in this header is framer-driven any more, including the tab pill.
   Framer runs its own clock and its own easing, so while the box morphed under
   CSS the pill was still projecting toward a box measured a frame ago — it
   visibly trailed its own button, which is most of the stutter that was left.

   Everything morphs with plain CSS transitions. Framer's `layout` measures
   viewport rectangles, and this header lives inside a sticky host, so any
   commit that changed the scroll position at the same time as the shape — a
   tab switch shortening the document, a scroll landing on the threshold — fed
   it a delta that was really the page moving, not the header. It answered with
   a transform: the bar stranded half-open, or slid 240px down the page, or
   projected the title to a stale box and left it invisible. CSS transitions
   have no notion of "before" and "after" boxes to get wrong. */

/** The shared morph.
 *
 *  200ms, not 420: this collapse travels 168px, and anything past ~250ms on a
 *  move that short stops reading as motion and starts reading as lag — long
 *  enough to catch a frame of it in a screenshot.
 *
 *  The property list is spelled out rather than `all`. Height changes here force
 *  layout on the whole header subtree every frame, so the browser should not
 *  also be diffing every other animatable property looking for work.
 *
 *  `box-shadow` is deliberately absent: tweening a blur radius repaints the
 *  whole blurred region every frame, and the shadow only exists on one side of
 *  the morph anyway — nobody sees it arrive. */
const MORPH =
  "transition-[height,width,padding,font-size,line-height,border-radius,color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none";

/** Blocks that only exist at full size. They mount into a box that is still
 *  opening, so without this they spend the whole transition half-clipped — the
 *  reveal lands them just behind the edge that uncovers them. */
const REVEAL = "motion-safe:animate-[header-reveal_200ms_cubic-bezier(0.32,0.72,0,1)_both]";

/* Hysteresis. A single 24px threshold sat exactly where a trackpad nudge
   lives, so the header re-triggered its morph every few pixels and kept
   getting stranded part-way. Collapsing and restoring now happen at different
   scroll depths, and the gap between them is wider than any stray scroll. */
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
  /* Two equal columns, so the indicator is describable in percentages and needs
     no measuring at all. The measured version re-ran its ResizeObserver on every
     frame of the collapse — each frame handing the pill a brand-new target while
     a 200ms transition toward the previous one was still running, which is
     exactly the stutter you could see. A grid cell cannot drift from its own
     column: the pill resizes with the container, in the same layout pass. */
  return (
    <div
      role="tablist"
      aria-label="Tampilan perawatan"
      className="relative inline-grid grid-cols-2 rounded-full bg-white/15 p-1 ring-1 ring-white/20"
    >
      {/* The offset is written out rather than reached through `translate-x-full`:
          that utility resolves through Tailwind's translate custom properties,
          and here it was computing to 0% — the pill kept its width but never
          left the first column. A plain transform has nothing to resolve. */}
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

/** Name, mood and members — the identity block, at two sizes. The name, the
 *  chip and the face are the *same* nodes in both, only re-sized: that is what
 *  a CSS transition needs, and it is why nothing here re-mounts. */
function GroupIdentity({ slim = false }: { slim?: boolean }) {
  const mood = MOOD_BY_KEY[MOOD_ENTRIES[0].mood];

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {/* `leading-none` clipped the descenders of "Pendamping" against
            `truncate`'s overflow box — the line has to be taller than the glyphs. */}
        <p
          className={`truncate font-bold tracking-tight text-white ${MORPH} ${
            slim
              ? "text-[15px] leading-[1.55]"
              : "text-[18px] leading-[1.35] sm:text-[22px] sm:leading-[1.3] xl:text-[26px]"
          }`}
        >
          {CARE_GROUP.name}
        </p>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold ${MORPH} ${
            slim ? "py-0.5 pl-0.5 pr-2 text-[11px]" : "py-1 pl-1 pr-3 text-[12.5px]"
          }`}
          style={{ backgroundColor: mood.soft, color: mood.ink }}
        >
          <MoodFace
            mood={MOOD_ENTRIES[0].mood}
            className={`${MORPH} ${slim ? "h-4 w-4" : "h-5 w-5"}`}
          />
          {mood.label}
        </span>
      </div>

      {/* Members are the first thing to go on a phone: squeezed beside the
          avatar and the action buttons, the name and the mood chip already wrap
          to two lines, and a third put the header back where it started. The
          count is still one tap away in the group's settings. */}
      {!slim && (
        <div className={`mt-2.5 hidden items-center gap-2.5 sm:flex ${REVEAL}`}>
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

/** One header at two sizes — and, crucially, *one* tree. The previous version
 *  returned a different subtree per size, so every element was destroyed and
 *  rebuilt on each collapse; that is what left framer animating from boxes that
 *  no longer meant anything. Here the avatar, the identity and the tab group
 *  keep their nodes and only change class, so the browser can tween them.
 *
 *  The rows come from `flex-wrap`: a `w-full` item claims a line to itself, so
 *  dropping the eyebrow and the actions is what folds three rows into one. */
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

      {/* Avatar, name and the actions share one line, and that line is the full
          width — which is what puts the buttons hard right on a desktop and, on
          a phone, stops them claiming a row of their own. Present in both sizes
          so the tree never changes shape. */}
      <div
        className={`flex min-w-0 items-center ${slim ? "gap-3" : "w-full gap-4 sm:gap-6"}`}
      >
        <ProfileAvatar
          className={`${MORPH} ${
            slim ? "h-9 w-9" : "h-12 w-12 sm:h-16 sm:w-16 xl:h-[72px] xl:w-[72px]"
          }`}
        />
        <h1 className="sr-only">{CARE_GROUP.name}</h1>

        <GroupIdentity slim={slim} />

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

/* Fixed to the full height rather than `h-full`. Tied to the box it would be
   re-rasterised at a new size on every frame of the collapse, which is exactly
   the kind of per-frame paint work that shows up as stutter. Drawn once at full
   size, the bar just clips it. */
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
}: {
  initialTab: CareTab;
  context?: { type: CareContextType; label: string; detail?: string } | null;
}) {
  const [tab, setTab] = useState<CareTab>(initialTab);
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fullH, setFullH] = useState(0);
  const [slimH, setSlimH] = useState(SLIM_BAR);
  const contentRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const fade = reduce ? { duration: 0 } : { duration: 0.24, ease: EASE };

  /* Chat owns the whole viewport, so the header starts out of its way: pilled
     from the first frame, and openable only through the chevron — the tab
     never scrolls, so scrolling can't collapse it back. */
  const pinned = collapsed || tab === "chat";

  /** The 56px bar, or the header at full size. */
  const slim = pinned && !expanded;

  /* Measure the *contents*, never the header. The header's height is set from
     this, so measuring the header would be reading back its own output — it
     could never discover that the full size had changed. Both sizes are worth
     keeping: `h-14` is rem-based, so the bar isn't 56px for a reader who has
     scaled their text up.

     Only ever at rest, though. The avatar and the name resize over the whole
     200ms, so the contents are a different height on every frame of it — and
     every one of those frames was being committed as the header's real size.
     That fed straight into the host's height, which is what everything below
     the header stands on, so the entire page juddered up and down for the
     length of the morph. One reading, once it has stopped moving. */
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

  /* Shut the tape off for the duration of a morph, then take one clean reading.
     Skips its own first run, so the size is known from the very first paint. */
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

  /* Deliberately not rAF-throttled: rAF stops firing whenever the page isn't
     compositing, which would strand the header in whichever state it was in. */
  useEffect(() => {
    const measure = () => {
      const y = window.scrollY;
      setCollapsed((was) => (was ? y > RESTORE_AT : y > COLLAPSE_AT));
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
        {/* Height is driven, not measured-and-animated: the contents are
            free-flowing and get measured, then the box is told to be that tall,
            so a plain CSS transition carries it between the two numbers.

            The contents are taken *out of flow* to do it. In normal flow they
            are the header's children, so every frame of a height change meant
            re-laying out the whole subtree — the flex rows, the wrapping, the
            text — which is what made a 168px slide stutter. Absolutely
            positioned, their layout is settled once and the animation is
            reduced to moving a clip edge. */}
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
              toggle={
                pinned ? (
                  <ExpandToggle open={expanded} onClick={() => setExpanded((v) => !v)} />
                ) : null
              }
            />
          </div>
        </header>
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
          <TeamChat
            context={context}
            height={hostH ? `calc(100dvh - ${hostH}px - var(--bottom-nav))` : undefined}
          />
        </div>
      )}
    </div>
  );
}

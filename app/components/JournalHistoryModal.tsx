"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import {
  HISTORY,
  MONTH_DAYS,
  MONTH_LABEL,
  MONTH_START_OFFSET,
  MOOD_BY_KEY,
  TODAY_DATE,
  WEEKDAYS,
  dayMetrics,
  mmss,
  type JournalDay,
} from "../data/journal";

/** Past days, at two very different sizes.
 *
 *  A desktop has room to show the month and one day's report at once, so it
 *  does: pick a date on the left, read it on the right, no navigation at all.
 *
 *  A phone does not, so the two become a pair of sheets that hand off. Tapping a
 *  date sends the calendar down and brings the report up; closing the report
 *  sends it down and brings the calendar back — you land where you were, ready
 *  to pick another date, rather than back at the start.
 *
 *  Both slides run 280ms on a shared curve. Springs were tempting and wrong: a
 *  spring's overshoot reads as bounce, and for this reader "did it settle yet?"
 *  is a question the interface should never make them ask. */

/** The handoff. Fast enough to feel immediate, slow enough to be followed. */
const SLIDE = { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const };

/** Past this many tiles the metric row gets arrows. */
const CAROUSEL_MIN = 3;

export default function JournalHistoryModal({
  open,
  onClose,
  selected,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  selected: number;
  onSelect: (date: number) => void;
}) {
  return (
    <AnimatePresence>
      {open && <Shell onClose={onClose} selected={selected} onSelect={onSelect} />}
    </AnimatePresence>
  );
}

function Shell({
  onClose,
  selected,
  onSelect,
}: {
  onClose: () => void;
  selected: number;
  onSelect: (date: number) => void;
}) {
  const reduce = useReducedMotion();
  const [pick, setPick] = useState(selected);
  /** Phone only. The desktop shows both panels at once and ignores this. */
  const [view, setView] = useState<"calendar" | "report">("calendar");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const choose = (date: number) => {
    setPick(date);
    onSelect(date);
    setView("report");
  };

  const day = HISTORY[pick];
  const slide = reduce ? { duration: 0 } : SLIDE;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-neutral-950/55"
      />

      {/* ── Desktop: one modal, two columns ──────────────────────────────── */}
      <motion.div
        ref={rootRef}
        role="dialog"
        aria-modal="true"
        aria-label="Riwayat kalender"
        tabIndex={-1}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
        transition={slide}
        className="fixed left-1/2 top-1/2 z-[61] hidden max-h-[88dvh] w-[min(92vw,1000px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_32px_80px_-24px_rgba(24,32,24,0.6)] outline-none lg:flex"
      >
        <header className="flex shrink-0 items-center gap-4 border-b-2 border-karsa-line px-6 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[22px] font-extrabold tracking-tight text-neutral-900">
              📜 Riwayat Kalender
            </h2>
            <p className="mt-0.5 text-[14.5px] text-neutral-500">
              Laporan {pick} {MONTH_LABEL}
            </p>
          </div>
          <CloseButton onClick={onClose} label="TUTUP" />
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-2 divide-x-2 divide-karsa-line">
          <div className="min-h-0 overflow-y-auto p-5 [contain:paint]">
            <CalendarPanel pick={pick} onPick={choose} />
          </div>
          <div className="min-h-0 overflow-y-auto p-5 [contain:paint]">
            <ReportPanel day={day} date={pick} />
          </div>
        </div>
      </motion.div>

      {/* ── Phone: two sheets that hand off ────────────────────────────────
          Both stay mounted, and `view` decides which one is up. They used to be
          swapped by a nested `AnimatePresence`, which looked identical while
          handing off — but a nested presence boundary does not pass the parent's
          exit down to its children, so closing the history killed the sheet
          outright with no slide at all. Driving `y` from state instead leaves
          each sheet a plain child of the outer presence, and its `exit` runs
          like everything else here.

          `max-h`, not `h`: 85dvh is the ceiling, not the target. A day with no
          story and two readings has no business reserving most of the screen
          and then leaving it blank. */}
      <div className="lg:hidden">
        <motion.div
          role="dialog"
          aria-modal={view === "calendar" ? true : undefined}
          aria-hidden={view !== "calendar"}
          aria-label="Riwayat kalender"
          initial={reduce ? { opacity: 0 } : { y: "100%" }}
          animate={reduce ? { opacity: 1 } : { y: view === "calendar" ? 0 : "100%" }}
          exit={reduce ? { opacity: 0 } : { y: "100%" }}
          transition={slide}
          style={{ pointerEvents: view === "calendar" ? "auto" : "none" }}
          className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[85dvh] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-16px_48px_-12px_rgba(24,32,24,0.55)] sm:mx-auto sm:max-w-lg"
        >
          <SheetHandle />
          <header className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-karsa-line px-5 pb-4">
            <h2 className="text-[20px] font-extrabold tracking-tight text-neutral-900">
              📜 Riwayat
            </h2>
            <CloseButton onClick={onClose} label="TUTUP" />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-4 [contain:paint]">
            <CalendarPanel pick={pick} onPick={choose} />
          </div>
        </motion.div>

        <motion.div
          role="dialog"
          aria-modal={view === "report" ? true : undefined}
          aria-hidden={view !== "report"}
          aria-label={`Laporan ${pick} ${MONTH_LABEL}`}
          initial={{ y: "100%" }}
          animate={reduce ? { opacity: view === "report" ? 1 : 0 } : { y: view === "report" ? 0 : "100%" }}
          exit={reduce ? { opacity: 0 } : { y: "100%" }}
          transition={slide}
          style={{ pointerEvents: view === "report" ? "auto" : "none" }}
          className="fixed inset-x-0 bottom-0 z-[62] flex max-h-[85dvh] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-16px_48px_-12px_rgba(24,32,24,0.55)] sm:mx-auto sm:max-w-lg"
        >
          <SheetHandle />
          {/* Back to the month, not out of the history — the caregiver almost
              always wants a second date after the first. */}
          <header className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-karsa-line px-5 pb-4">
            <div className="min-w-0">
              <p className="text-[12.5px] font-bold uppercase tracking-wide text-neutral-400">
                Laporan
              </p>
              <h2 className="truncate text-[19px] font-extrabold tracking-tight text-neutral-900">
                {pick} {MONTH_LABEL}
              </h2>
            </div>
            <CloseButton onClick={() => setView("calendar")} label="TUTUP" />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 [contain:paint]">
            <ReportPanel day={day} date={pick} />
          </div>
        </motion.div>
      </div>
    </>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

const SheetHandle = () => (
  <div className="flex shrink-0 justify-center pb-2 pt-3">
    <span aria-hidden className="h-1.5 w-12 rounded-full bg-neutral-300" />
  </div>
);

function CloseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-neutral-900 px-4 py-3 text-[15px] font-extrabold text-white outline-none transition-colors duration-200 hover:bg-neutral-700 focus-visible:ring-4 focus-visible:ring-neutral-400"
    >
      <X size={18} strokeWidth={3} aria-hidden />
      {label}
    </button>
  );
}

/** The month. Buttons move it, never a swipe — invisible, undiscoverable and
 *  easy to fire by accident with an unsteady hand. */
function CalendarPanel({ pick, onPick }: { pick: number; onPick: (date: number) => void }) {
  const cells = [
    ...Array.from({ length: MONTH_START_OFFSET }, () => null),
    ...Array.from({ length: MONTH_DAYS }, (_, i) => i + 1),
  ];

  const arrow =
    "grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-karsa-soft text-karsa-dark outline-none transition-colors duration-200 hover:bg-karsa hover:text-white focus-visible:ring-4 focus-visible:ring-karsa/40 disabled:opacity-35 disabled:hover:bg-karsa-soft disabled:hover:text-karsa-dark";

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <button type="button" disabled aria-label="Bulan sebelumnya" className={arrow}>
          <ChevronLeft size={28} strokeWidth={3} />
        </button>
        <p className="text-[19px] font-extrabold tracking-tight text-neutral-900">{MONTH_LABEL}</p>
        <button type="button" disabled aria-label="Bulan berikutnya" className={arrow}>
          <ChevronRight size={28} strokeWidth={3} />
        </button>
      </div>

      <div className="-mx-1 grid grid-cols-7 gap-1" role="row">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="pb-1 text-center text-[12px] font-bold uppercase tracking-wide text-neutral-400"
          >
            {wd}
          </div>
        ))}
      </div>

      <div className="-mx-1 mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (date === null) return <span key={`b-${i}`} className="h-[56px] w-full" aria-hidden />;

          const entry = HISTORY[date];
          const future = date > TODAY_DATE;
          const complete = entry ? entry.done === entry.total : false;
          const on = date === pick;

          return (
            <button
              key={date}
              type="button"
              onClick={() => onPick(date)}
              aria-pressed={on}
              aria-label={
                entry
                  ? `${date} ${MONTH_LABEL}, ${complete ? "semua obat selesai" : `${entry.done} dari ${entry.total} obat`}`
                  : `${date} ${MONTH_LABEL}, belum ada catatan`
              }
              className={`flex h-[56px] w-full flex-col items-center justify-center rounded-2xl outline-none transition-colors duration-150 focus-visible:ring-4 focus-visible:ring-karsa ${
                on
                  ? "bg-karsa text-white ring-2 ring-karsa"
                  : future
                    ? "bg-neutral-50 text-neutral-300"
                    : !entry
                      ? "bg-neutral-100 text-neutral-400"
                      : complete
                        ? "bg-act-100 text-act-600"
                        : "bg-info-100 text-info-600"
              }`}
            >
              <span className="text-lg font-bold leading-none">{date}</span>
              {!future && entry && (
                <span aria-hidden className="mt-0.5 text-[12px] leading-none">
                  {complete ? "✔️" : "⭕"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

/** One day, read out: the face, what they said, and what was measured. */
function ReportPanel({ day, date }: { day: JournalDay | undefined; date: number }) {
  if (!day) {
    return (
      <div className="grid h-full place-items-center rounded-3xl border-2 border-dashed border-karsa-line px-6 py-12 text-center">
        <p className="text-[16px] leading-6 text-neutral-500">
          Belum ada catatan untuk {date} {MONTH_LABEL}.
        </p>
      </div>
    );
  }

  const mood = MOOD_BY_KEY[day.mood];
  const metrics = dayMetrics(day);

  return (
    <div className="flex h-full flex-col">
      {/* Face and words, side by side — the bubble points back at who said it. */}
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="grid h-[84px] w-[84px] shrink-0 place-items-center rounded-full bg-karsa-canvas text-[46px] leading-none ring-2 ring-karsa-line"
        >
          {mood.emoji}
        </span>

        <div className="min-w-0 flex-1 pt-1">
          <p className="text-[13px] font-bold uppercase tracking-wide text-neutral-400">
            {mood.label}
          </p>
          {day.story ? (
            <div className="relative mt-1.5 rounded-2xl rounded-tl-md bg-karsa-soft px-4 py-3 ring-2 ring-karsa/15">
              <p className="text-[17px] font-bold leading-6 text-neutral-800">“{day.story}”</p>
            </div>
          ) : (
            <p className="mt-1.5 text-[15px] leading-6 text-neutral-500">
              Tidak ada cerita suara hari itu.
            </p>
          )}
        </div>
      </div>

      {/* The player sits under both columns rather than inside the right one:
          it belongs to the whole entry, and a play control the width of its own
          label is a small target for the reason it is a small button. */}
      {day.voice && (
        <button
          type="button"
          className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white p-2.5 text-left outline-none ring-2 ring-karsa-line transition-colors duration-200 hover:bg-karsa-soft/60 focus-visible:ring-4 focus-visible:ring-karsa/40"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-karsa text-white">
            <Play size={20} strokeWidth={2.8} className="ml-0.5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold text-neutral-800">Putar suara</span>
            <span className="block text-[13px] text-neutral-500">{mmss(day.voice)}</span>
          </span>
        </button>
      )}

      {/* On a phone the readings follow the player directly. `mt-auto` used to
          pin them to the floor of an 85dvh sheet, which on a short entry left a
          236px hole in the middle — and a hole in the middle reads as broken,
          where the same space at the bottom just reads as a tall sheet. The
          desktop column keeps the pin: there the grid sits under a fixed-height
          panel and anchoring it looks deliberate. */}
      <div className="mt-5 lg:mt-auto lg:pt-5">
        <MetricCarousel metrics={metrics} />
      </div>
    </div>
  );
}

/** The day's readings.
 *
 *  Two shapes. A phone gets a swipeable row with arrows past three tiles — below
 *  that the row fits, and a pair of controls that do nothing is two more things
 *  to read. A desktop has the width for a three-across grid, so it shows every
 *  reading at once and needs no controls at all. */
function MetricCarousel({ metrics }: { metrics: ReturnType<typeof dayMetrics> }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const many = metrics.length > CAROUSEL_MIN;

  if (metrics.length === 0) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-karsa-line px-4 py-5 text-center text-[14px] text-neutral-500">
        Tidak ada pengukuran hari itu.
      </p>
    );
  }

  const nudge = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    /* One tile plus its gap, so a press always lands on a tile edge. */
    const step = (track.firstElementChild as HTMLElement | null)?.offsetWidth ?? 160;
    track.scrollBy({ left: dir * (step + 12), behavior: "smooth" });
  };

  const arrow =
    "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-neutral-700 outline-none ring-2 ring-karsa-line transition-colors duration-200 hover:bg-karsa hover:text-white hover:ring-karsa focus-visible:ring-4 focus-visible:ring-karsa/40";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-[12.5px] font-bold uppercase tracking-wide text-neutral-400">
          Pengukuran
        </h3>
        {many && (
          <div className="flex gap-2 lg:hidden">
            <button type="button" onClick={() => nudge(-1)} aria-label="Geser ke kiri" className={arrow}>
              <ChevronLeft size={20} strokeWidth={3} />
            </button>
            <button type="button" onClick={() => nudge(1)} aria-label="Geser ke kanan" className={arrow}>
              <ChevronRight size={20} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>

      {/* `-mx-1 px-1` keeps the tiles' rings out of the scroller's clip. */}
      <div
        ref={trackRef}
        /* Room on every side, not three. The track clips at its padding box, so
           the tiles' `ring-2` needs clearance all round — it had none at the top
           and only 4px at the foot, where the scrollbar also sits. */
        /* `scroll-px-1` matters: snap points align to the *scrollport* edge, so
           without scroll padding the browser parks scrollLeft at 4 to seat the
           first tile — eating the very padding that was sheltering its ring. */
        className="scrollbar-slim -mx-1 -my-1 flex snap-x snap-mandatory scroll-px-1 gap-3 overflow-x-auto px-1 pb-2.5 pt-1 lg:mx-0 lg:my-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:p-0"
      >
        {metrics.map((m) => (
          /* Bigger on a phone than in the desktop grid: there they sit three
             across in a narrow column, here they get the width to be read at
             arm's length. */
          <div
            key={m.label}
            className="flex min-h-[152px] w-[168px] shrink-0 snap-start flex-col justify-between rounded-2xl bg-karsa-canvas p-4 ring-2 ring-karsa-line lg:min-h-0 lg:w-auto lg:p-3.5"
          >
            <p className="flex items-center gap-2 text-[14px] font-bold leading-5 text-neutral-600 lg:text-[12px] lg:text-neutral-500">
              <span aria-hidden className="text-[20px] leading-none lg:text-[15px]">
                {m.emoji}
              </span>
              {m.label}
            </p>
            <div className="mt-2">
              <p className="text-[38px] font-extrabold leading-none tabular-nums text-neutral-900 lg:text-[24px]">
                {m.value}
              </p>
              <p className="mt-1.5 text-[14px] font-bold text-neutral-400 lg:mt-1 lg:text-[12px]">
                {m.unit}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import MoodFace from "./MoodFace";
import StatArt from "./StatArt";
import {
  MONITOR_TONE,
  MOOD_BY_KEY,
  WEEKDAYS,
  dayMetrics,
  mmss,
} from "../data/journal";
import { loadJournalMonth } from "../lib/care/actions";
import type { JournalDayData, JournalMonth } from "../lib/care/queries";
import { lockScroll } from "../lib/scrollLock";




const SLIDE = { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const };


const CAROUSEL_MIN = 3;

export default function JournalHistoryModal({
  open,
  onClose,
  selected,
  onSelect,
  month,
  patientId,
}: {
  open: boolean;
  onClose: () => void;
  selected: number;
  onSelect: (date: number) => void;

  month: JournalMonth;

  patientId?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <Shell
          onClose={onClose}
          selected={selected}
          onSelect={onSelect}
          month={month}
          patientId={patientId}
        />
      )}
    </AnimatePresence>
  );
}

function Shell({
  onClose,
  selected,
  onSelect,
  month: initialMonth,
  patientId,
}: {
  onClose: () => void;
  selected: number;
  onSelect: (date: number) => void;
  month: JournalMonth;
  patientId?: string;
}) {
  const reduce = useReducedMotion();
  const [pick, setPick] = useState(selected);

  const [month, setMonth] = useState(initialMonth);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    setMonth((current) =>
      current.year === initialMonth.year && current.month === initialMonth.month
        ? initialMonth
        : current,
    );
  }, [initialMonth]);

  const shift = async (step: number) => {
    if (!patientId || loading) return;
    setLoading(true);
    try {
      const next = await loadJournalMonth(patientId, month.year, month.month + step);
      setMonth(next);

      setPick((d) => Math.min(d, next.days));
    } finally {
      setLoading(false);
    }
  };

  const [view, setView] = useState<"calendar" | "report">("calendar");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const unlock = lockScroll();

    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [onClose]);

  const choose = (date: number) => {
    setPick(date);
    onSelect(date);
    setView("report");
  };

  const day = month.entries[pick];
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
              <CalendarDays size={20} strokeWidth={2.6} aria-hidden className="mr-2 inline-block align-[-3px] text-karsa-dark" />
              Riwayat Kalender
            </h2>
            <p className="mt-0.5 text-[14.5px] text-neutral-500">
              Laporan {pick} {month.label}
            </p>
          </div>
          <CloseButton onClick={onClose} label="TUTUP" />
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-2 divide-x-2 divide-karsa-line">
          <div className="min-h-0 overflow-y-auto p-5 [contain:paint]">
            <CalendarPanel pick={pick} onPick={choose} month={month} onShift={shift} busy={loading} />
          </div>
          <div className="min-h-0 overflow-y-auto p-5 [contain:paint]">
            <ReportPanel day={day} date={pick} label={month.label} />
          </div>
        </div>
      </motion.div>


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
              <CalendarDays size={19} strokeWidth={2.6} aria-hidden className="mr-2 inline-block align-[-3px] text-karsa-dark" />
              Riwayat
            </h2>
            <CloseButton onClick={onClose} label="TUTUP" />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-4 [contain:paint]">
            <CalendarPanel pick={pick} onPick={choose} month={month} onShift={shift} busy={loading} />
          </div>
        </motion.div>

        <motion.div
          role="dialog"
          aria-modal={view === "report" ? true : undefined}
          aria-hidden={view !== "report"}
          aria-label={`Laporan ${pick} ${month.label}`}
          initial={{ y: "100%" }}
          animate={reduce ? { opacity: view === "report" ? 1 : 0 } : { y: view === "report" ? 0 : "100%" }}
          exit={reduce ? { opacity: 0 } : { y: "100%" }}
          transition={slide}
          style={{ pointerEvents: view === "report" ? "auto" : "none" }}
          className="fixed inset-x-0 bottom-0 z-[62] flex max-h-[85dvh] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-16px_48px_-12px_rgba(24,32,24,0.55)] sm:mx-auto sm:max-w-lg"
        >
          <SheetHandle />

          <header className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-karsa-line px-5 pb-4">
            <div className="min-w-0">
              <p className="text-[12.5px] font-bold uppercase tracking-wide text-neutral-400">
                Laporan
              </p>
              <h2 className="truncate text-[19px] font-extrabold tracking-tight text-neutral-900">
                {pick} {month.label}
              </h2>
            </div>
            <CloseButton onClick={() => setView("calendar")} label="TUTUP" />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 [contain:paint]">
            <ReportPanel day={day} date={pick} label={month.label} />
          </div>
        </motion.div>
      </div>
    </>
  );
}



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


function CalendarPanel({
  pick,
  onPick,
  month,
  onShift,
  busy,
}: {
  pick: number;
  onPick: (date: number) => void;
  month: JournalMonth;
  onShift: (step: number) => void;
  busy: boolean;
}) {
  const cells = [
    ...Array.from({ length: month.startOffset }, () => null),
    ...Array.from({ length: month.days }, (_, i) => i + 1),
  ];

  const arrow =
    "grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-karsa-soft text-karsa-dark outline-none transition-colors duration-200 hover:bg-karsa hover:text-white focus-visible:ring-4 focus-visible:ring-karsa/40 disabled:opacity-35 disabled:hover:bg-karsa-soft disabled:hover:text-karsa-dark";

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onShift(-1)}
          disabled={busy}
          aria-label="Bulan sebelumnya"
          className={arrow}
        >
          <ChevronLeft size={28} strokeWidth={3} />
        </button>
        <p className="text-[19px] font-extrabold tracking-tight text-neutral-900">{month.label}</p>

        <button
          type="button"
          onClick={() => onShift(1)}
          disabled={busy || month.today !== null}
          aria-label="Bulan berikutnya"
          className={arrow}
        >
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

          const entry = month.entries[date];

          const future = month.today !== null && date > month.today;

          const complete = entry ? entry.total > 0 && entry.done === entry.total : false;
          const on = date === pick;

          return (
            <button
              key={date}
              type="button"
              onClick={() => onPick(date)}
              aria-pressed={on}
              aria-label={
                entry
                  ? `${date} ${month.label}, ${complete ? "semua obat selesai" : `${entry.done} dari ${entry.total} obat`}`
                  : `${date} ${month.label}, belum ada catatan`
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


function ReportPanel({
  day,
  date,
  label,
}: {
  day: JournalDayData | undefined;
  date: number;
  label: string;
}) {
  if (!day) {
    return (
      <div className="grid h-full place-items-center rounded-3xl border-2 border-dashed border-karsa-line px-6 py-12 text-center">
        <p className="text-[16px] leading-6 text-neutral-500">
          Belum ada catatan untuk {date} {label}.
        </p>
      </div>
    );
  }


  const mood = day.mood ? MOOD_BY_KEY[day.mood] : null;
  const metrics = dayMetrics(day);

  return (
    <div className="flex h-full flex-col">

      <div className="flex items-start gap-4">

        {mood && day.mood && (
          <span
            aria-hidden
            className="grid h-[84px] w-[84px] shrink-0 place-items-center rounded-full ring-2"
            style={{ backgroundColor: mood.soft, borderColor: mood.color }}
          >
            <MoodFace mood={day.mood} className="h-[62px] w-[62px]" />
          </span>
        )}

        <div className="min-w-0 flex-1 pt-1">
          <p className="text-[13px] font-bold uppercase tracking-wide text-neutral-400">
            {mood ? mood.label : "Tidak ada catatan perasaan"}
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


      {day.voiceUrl && (
        <div className="mt-3 rounded-2xl bg-white p-3 ring-2 ring-karsa-line">
          <p className="mb-2 flex items-center gap-2 text-[13px] font-bold text-neutral-600">
            <Play size={14} strokeWidth={2.8} aria-hidden />
            Rekaman suara
            {day.voice ? (
              <span className="font-medium text-neutral-400">· {mmss(day.voice)}</span>
            ) : null}
          </p>
          <audio src={day.voiceUrl} controls preload="none" className="h-11 w-full" />
        </div>
      )}


      <div className="mt-5 lg:mt-auto lg:pt-5">
        <MetricCarousel metrics={metrics} />
      </div>
    </div>
  );
}


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


      <div
        ref={trackRef}


        className="scrollbar-none -mx-1 -my-1 flex snap-x snap-mandatory scroll-px-1 gap-3 overflow-x-auto px-1 pb-2.5 pt-1 lg:mx-0 lg:my-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:p-0"
      >
        {metrics.map((m) => (

          <div
            key={m.label}
            className="flex min-h-[152px] w-[168px] shrink-0 snap-start flex-col justify-between rounded-2xl bg-karsa-canvas p-4 ring-2 ring-karsa-line lg:min-h-0 lg:w-auto lg:p-3.5"
          >
            <p className="flex items-center gap-2 text-[14px] font-bold leading-5 text-neutral-600 lg:text-[12px] lg:text-neutral-500">
              <StatArt
                kind={m.monitor}
                tone={MONITOR_TONE[m.monitor]}
                className="h-5 w-5 lg:h-4 lg:w-4"
              />
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

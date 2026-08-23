"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  HeartPulse,
  Plus,
  Sparkles,
} from "lucide-react";

import Mascot from "../components/Mascot";
import MoodFace from "../components/MoodFace";
import ProgressRing from "../components/ProgressRing";
import TodayMood from "../components/TodayMood";
import RoomScene from "../components/RoomScene";
import Panel from "../components/Panel";
import TaskItem from "../components/TaskItem";
import ActivityItem from "../components/ActivityItem";
import Calendar, { type Selection } from "../components/Calendar";
import ScheduleItem from "../components/ScheduleItem";
import ScheduleForm from "../components/ScheduleForm";
import PatientSwitcher from "../components/PatientSwitcher";
import type { CarePatient } from "../lib/care/types";
import SlideOver from "../components/SlideOver";
import Confetti from "../components/Confetti";
import TasksDone from "../components/TasksDone";
import { ACTIVITIES, SUMMARY as DESIGN_SUMMARY, whenOf } from "../data/dashboard";
import { MOOD_ENTRIES as DESIGN_MOODS } from "../data/mood";
import { MONTHS, dayKey, longDateLabel, type CalendarDay } from "../lib/care/time";

import type {
  DailyTask,
  FeedItem,
  MoodEntryRow,
  ScheduleEntry,
} from "../lib/care/queries";
import type { DaySummary } from "../lib/care/stats";
import { toggleTask } from "../lib/care/actions";

/** How many pending tasks the card shows before deferring to the full list. */
const VISIBLE_TASKS = 3;
/** Long enough for the strike-through to finish drawing before the row goes. */
const STRIKE_MS = 520;

/** How the five feed kinds map onto the timeline's three icons. Duplicated from
 *  the query module rather than imported: that file reaches `next/headers`, and
 *  this one runs in the browser. */
const FEED_TONE = {
  task: "care",
  reading: "health",
  meal: "meal",
  medication: "health",
  mood: "care",
} as const;

/** The placeholder feed, in the row shape the component now takes. Used only
 *  when nobody is signed in — see the note on the props below. */
const DESIGN_ACTIVITIES = ACTIVITIES.map((a) => ({
  id: a.id,
  actor: a.actor,
  action: a.action,
  when: whenOf(a.at),
  tone: a.tone,
}));

/** The caregiver's dashboard.
 *
 *  Every prop below is optional, and that is what keeps two audiences working
 *  from one component: signed in, the page hands it real rows; signed out — the
 *  design pages, or a checkout with no Supabase keys — it falls back to the
 *  placeholder copy in `app/data`. What it never does is fabricate figures for
 *  a *real* person: a signed-in caregiver with no data logged sees empty
 *  states, because a made-up blood pressure with somebody's mother's name over
 *  it is worse than a blank card.
 *
 *  A caregiver with no patients at all never reaches here — the proxy sends
 *  them to `/mulai`, and `app/page.tsx` does the same again behind it. */
export default function Homepage({
  greeting,
  patients,
  activePatientId,
  pending: invitationPending = false,
  today,
  tasks = [],
  feed,
  schedule,
  moods,
  summary,
}: {
  /** First name, for the headline. */
  greeting?: string;
  patients?: CarePatient[];
  activePatientId?: string;
  /** The relationship has been requested but not accepted. Everything behind it
   *  is refused by RLS, so the page says why rather than showing empty cards
   *  that look like a broken app. */
  pending?: boolean;
  today: CalendarDay;
  tasks?: DailyTask[];
  feed?: FeedItem[];
  schedule?: Record<string, ScheduleEntry[]>;
  moods?: MoodEntryRow[];
  summary?: DaySummary | null;
}) {
  const [completed, setCompleted] = useState<string[]>(() =>
    tasks.filter((task) => task.done).map((task) => task.id),
  );
  /** Ticked, striking through, not yet removed. */
  const [striking, setStriking] = useState<string[]>([]);
  const [selected, setSelected] = useState<Selection>({ ...today });
  /** Phone only — from `lg` the same column is pinned beside the page. */
  const [scheduleOpen, setScheduleOpen] = useState(false);
  /** Bumped on every finish; the confetti keys off it. */
  const [burst, setBurst] = useState(0);
  const reduce = useReducedMotion();

  /** Completed tasks are hidden — the card is a list of what's left to do. */
  const remaining = tasks.filter((task) => !completed.includes(task.id));
  const done = completed.length + striking.length;
  /* Guarded: a patient added a minute ago can have no tasks, and `0/0` is a
     division that renders the ring as `NaN%`. */
  const progress = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);

  const byDay = schedule ?? {};
  const events = byDay[dayKey(selected.y, selected.m, selected.d)] ?? [];
  const markedDays = useMemo(() => new Set(Object.keys(byDay)), [byDay]);
  const isSelectedToday =
    selected.y === today.y && selected.m === today.m && selected.d === today.d;

  const activities =
    feed?.map((item) => ({
      id: item.id,
      actor: item.actor,
      action: item.action,
      when: item.when,
      tone: FEED_TONE[item.kind],
    })) ?? null;

  /* The most recent entry, and only if it is from today — an eight-day-old
     "senang" under a heading that says "hari ini" is a lie the card would tell
     every morning. */
  const todayMood = moods
    ? moods.find((m) => m.day.y === today.y && m.day.m === today.m && m.day.d === today.d)
    : DESIGN_MOODS[0];

  const recap = summary === undefined ? DESIGN_SUMMARY : summary;

  const complete = (id: string) => {
    if (striking.includes(id) || completed.includes(id)) return;

    setStriking((prev) => [...prev, id]);
    window.setTimeout(
      () => {
        setCompleted((prev) => [...prev, id]);
        setStriking((prev) => prev.filter((taskId) => taskId !== id));
        setBurst((n) => n + 1);

        /* Optimistic: the row is already struck through and gone, so the write
           is not awaited. It is also not rolled back if it fails — the next
           render reads the database and the row simply comes back, which is a
           truer correction than a toast nobody reads. */
        if (!activePatientId) return;
        const fd = new FormData();
        fd.set("task_id", id);
        fd.set("patient_id", activePatientId);
        void toggleTask({ error: null }, fd);
      },
      reduce ? 0 : STRIKE_MS,
    );
  };

  const todayLabel = longDateLabel(today);

  return (
    /* Same rest at the foot of the page as every other route — see Care. */
    <div className="w-full px-4 pb-10 pt-4 sm:px-6 md:px-8 md:pt-10 xl:pb-12 xl:pl-12 xl:pr-6 xl:pt-12">
      {/* No colour band on Home: the mascot's room is this page's colour, and
          stacking a second coloured field above it only crowded the top. */}
      {/* No max-width: the content owns the whole area beside the rail. The
          side column widens with the viewport so the left one never sprawls. */}
      {/* Every track is `minmax(0,…)`, never `1fr` or `auto`. Both of those are
          floored at the items' min-content width, so one unshrinkable child —
          here a fixed-size progress ring inside a flex row — widened the track
          past the page and gave the phone a sideways scroll. */}
      <div className="grid items-start gap-6 grid-cols-[minmax(0,1fr)] md:gap-8 lg:grid-cols-[minmax(0,1fr)_316px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_336px] xl:gap-12 2xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="@container min-w-0 space-y-6 md:space-y-7 xl:space-y-8">
          {/* The first screen: greeting and tasks together, sized to the fold.
              They coexist — the point of the height is only that "Aktivitas"
              below them never shows as a sliver. The greeting takes `flex-1`,
              so whatever the tasks don't need becomes room for the mascot
              rather than a gap; on a short window it simply gives it back. */}
          {/* Page padding off the top, then a little air under the tasks so the
              fold isn't sitting on their edge.

              That air has to stay *under* the gap to the next section (28px at
              `md`, 32 at `xl`), because the two subtract from the same place:
              take off more than the gap and Aktivitas is pulled back above the
              fold, which is the sliver this was meant to remove. 4px short of
              the gap leaves the next card just below the edge. */}
          <div className="flex flex-col gap-6 md:gap-7 xl:gap-8 lg:min-h-[calc(100dvh-2.5rem-1.5rem)] xl:min-h-[calc(100dvh-3rem-1.75rem)]">
            {/* Greeting — deliberately not a card. The room is its own warm
              background and melts into the page at the bottom, so the mascot
              reads as standing in the environment rather than inside a box.
              The mascot always sits left of the copy; it never stacks. */}
            {/* Padding kept small: `justify-center` inside `flex-1` already does
              the spacing, and on a short window every fixed pixel here is one
              the tasks lose. */}
            {/* 488px is everything that sits below the greeting on a phone, added
              up: the 72px nav bar, 16 of page padding, the 24 gap, the ~352 the
              tasks card measures, and the 24 that keeps Perasaan's top edge
              exactly at the nav rather than peeking above it. So the greeting
              takes what is left and no more — the air goes under the tasks
              card, where it reads as room, instead of over the mascot, where it
              read as the page starting late. Only below `sm`: from `lg` the
              wrapper's own `min-h` does this job for the whole column. */}
            <section className="relative flex min-h-[calc(100dvh-488px)] flex-1 flex-col justify-center pb-4 pt-1 sm:min-h-0 sm:pb-6 sm:pt-2 xl:pb-8">
              {/* A radial mask instead of a straight one: it softens the sides
                and top as well as the bottom, so the room has no edges at all
                and simply dissolves before the next section starts. The layer
                reaches past the column into the gutter, which puts the fade
                outside the mascot rather than across it. */}
              <div
                aria-hidden
                className="pointer-events-none absolute -left-10 right-0 -top-16 -bottom-4 overflow-hidden"
                style={{
                  // Two linear fades intersected: one top-to-bottom, one
                  // left-to-right. Both reach zero inside the layer, so every
                  // edge dissolves and none of them can show a cut.
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0%, #000 20%, #000 56%, transparent 100%), linear-gradient(to right, transparent 0%, #000 12%, #000 74%, transparent 99%)",
                  maskImage:
                    "linear-gradient(to bottom, transparent 0%, #000 20%, #000 56%, transparent 100%), linear-gradient(to right, transparent 0%, #000 12%, #000 74%, transparent 99%)",
                  WebkitMaskComposite: "source-in",
                  maskComposite: "intersect",
                }}
              >
                <div className="absolute inset-0 bg-[#fdf8f0]" />
                <RoomScene />
              </div>

              {/* The mascot sits left of the copy at every size and never
                stacks. That costs the heading width on a phone, which is why
                both are held to sizes that fit 343px on one line — a greeting
                that wraps after the comma is worse than a smaller one. */}
              <div className="relative flex items-center justify-center gap-4 text-left sm:gap-8 xl:gap-10">
                <Mascot className="h-40 w-40 shrink-0 sm:h-44 sm:w-44 lg:h-48 lg:w-48 xl:h-56 xl:w-56" />

                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-neutral-500 xl:text-[16px]">
                    {todayLabel}
                  </p>
                  <h1 className="mt-1 text-[30px] font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-[40px] lg:text-[46px] xl:text-[54px]">
                    Halo, {greeting ?? "Pendamping"}!
                  </h1>

                  {/* The two lines under the greeting are the day's state, so
                      they are read off it rather than written down. The first
                      counts what is left; the second is the most recent thing
                      that happened, which is the honest answer to "what is
                      going on" and the only one that cannot go stale. */}
                  <ul className="mt-4 space-y-2.5 xl:mt-6 xl:space-y-3">
                    <li className="flex items-center gap-2.5 text-[16px] text-neutral-600 sm:text-[17px] xl:text-[19px]">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 xl:h-9 xl:w-9">
                        <HeartPulse size={16} strokeWidth={2.6} />
                      </span>
                      <span className="font-semibold text-neutral-800">
                        {tasks.length === 0
                          ? "Belum ada tugas harian"
                          : remaining.length === 0
                            ? "Semua tugas hari ini selesai"
                            : `${remaining.length} tugas belum selesai`}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5 text-[16px] text-neutral-600 sm:text-[17px] xl:text-[19px]">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-karsa-soft text-karsa-dark xl:h-9 xl:w-9">
                        {activities?.length ? (
                          <Clock size={16} strokeWidth={2.6} />
                        ) : (
                          <Check size={16} strokeWidth={3} />
                        )}
                      </span>
                      <span className="min-w-0 truncate">
                        {activities?.length
                          ? `${activities[0].actor} ${activities[0].action}`
                          : "Belum ada catatan hari ini"}
                      </span>
                    </li>
                  </ul>

                  {invitationPending && (
                    /* The one case where the page is deliberately empty. Without
                       this, a caregiver whose invitation has not been answered
                       reads five blank cards as a broken app and tries again. */
                    <p className="mt-4 inline-flex rounded-xl bg-amber-50 px-3.5 py-2.5 text-[14px] font-semibold leading-5 text-amber-800 ring-1 ring-amber-200">
                      Menunggu persetujuan. Datanya muncul setelah dia menyetujui.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Tasks, with today's mood alongside — the sketch's pairing. */}
            <div className="grid gap-6 grid-cols-[minmax(0,1fr)] @3xl:grid-cols-[minmax(0,1.6fr)_minmax(0,0.85fr)]">
              <Panel
                eyebrow="Tugas harian"
                title="Tugas Kamu"
                tone="sand"
                className="flex flex-col"
                bodyClassName="flex flex-1 flex-col"
                action={
                  <Link
                    href="/care"
                    className="group/more inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[13px] font-medium text-neutral-500 outline-none transition-colors duration-200 hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
                  >
                    Lihat semua
                    <ArrowRight
                      size={13}
                      strokeWidth={2.4}
                      className="transition-transform duration-200 group-hover/more:translate-x-0.5"
                    />
                  </Link>
                }
              >
                {/* Asymmetric on purpose: the list reads left, the ring is the
                  card's headline statistic on the right. */}
                <div className="flex flex-1 items-center gap-4 sm:gap-5 @3xl:gap-7">
                  {/* Fixed to three rows so the card never resizes as tasks are
                    ticked off, and the ring keeps its size and its place.

                    On a phone that height was 236px for 146px of rows — 90px of
                    nothing, which is what left the rows sitting at the top-left
                    while the ring sat centred to their right, and gave the card
                    an empty tail. Sized to the rows now, and `justify-center`
                    keeps a shorter list in the middle of the box instead of
                    hanging from the top of it. */}
                  <ul className="flex h-[152px] min-w-0 flex-1 flex-col justify-center divide-y divide-edge-sand border-y border-edge-sand sm:h-[147px]">
                    <AnimatePresence initial={false}>
                      {remaining.slice(0, VISIBLE_TASKS).map((task) => (
                        <TaskItem
                          key={task.id}
                          label={task.label}
                          hint={task.hint ?? undefined}
                          done={striking.includes(task.id)}
                          onToggle={() => complete(task.id)}
                        />
                      ))}
                    </AnimatePresence>

                    {/* The list keeps its fixed height, so this lands in the space
                      the rows left behind rather than resizing the card.

                      Two different empty lists: nothing left to do today is a
                      celebration, no tasks at all is a blank plan and needs a
                      way out of itself. */}
                    {remaining.length === 0 && (
                      <li className="grid h-full place-items-center px-4 text-center">
                        {tasks.length > 0 ? (
                          <TasksDone size="sm" />
                        ) : (
                          <span className="text-[13.5px] leading-5 text-neutral-500">
                            Belum ada tugas harian.
                            <Link
                              href="/care"
                              className="ml-1 font-bold text-karsa-dark underline underline-offset-2"
                            >
                              Atur sekarang
                            </Link>
                          </span>
                        )}
                      </li>
                    )}
                  </ul>

                  <ProgressRing
                    value={progress}
                    label={`${done}/${tasks.length}`}
                    className="h-[148px] w-[148px] @md:h-[136px] @md:w-[136px] @3xl:h-[168px] @3xl:w-[168px]"
                  />
                </div>
              </Panel>

              <TodayMood
                entry={
                  todayMood && {
                    mood: todayMood.mood,
                    when: todayMood.when,
                    note: todayMood.note,
                  }
                }
              />
            </div>
          </div>

          {/* Activity */}
          <Panel
            eyebrow="Sudah terjadi"
            title="Aktivitas"
            tone="sky"
            action={
              <button
                type="button"
                className="group/all inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-karsa-dark outline-none transition-colors hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-karsa/40"
              >
                Lihat semua
                <ArrowRight
                  size={15}
                  strokeWidth={2.5}
                  className="transition-transform duration-200 group-hover/all:translate-x-0.5"
                />
              </button>
            }
          >
            {activities && activities.length === 0 ? (
              <p className="rounded-2xl bg-white/60 px-4 py-8 text-center text-[14.5px] leading-5 text-neutral-500">
                Belum ada aktivitas tercatat.
                <br />
                Setiap tugas yang dicentang dan catatan yang ditambahkan muncul di sini.
              </p>
            ) : (
              <ul>
                {(activities ?? DESIGN_ACTIVITIES).map((activity, i, all) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    isLast={i === all.length - 1}
                  />
                ))}
              </ul>
            )}
          </Panel>

          {/* Yesterday, recapped. Counted from the logs rather than generated —
              see `getDaySummary`. Hidden entirely when there is nothing to
              recap, because an empty version of this card is the loudest thing
              on the page saying nothing. */}
          {recap && (
            <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-karsa to-karsa-dark p-7 text-white shadow-[0_14px_32px_-22px_rgba(63,92,70,0.85)] sm:p-8 xl:p-10">
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"
              />

              <header className="relative mb-4 flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70 xl:text-xs">
                  <Sparkles size={15} strokeWidth={2.4} />
                  Ringkasan
                </p>
                <span className="rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-bold text-white/90">
                  {recap.label}
                </span>
              </header>

              <h2 className="relative text-[22px] font-bold leading-7 xl:text-[26px] xl:leading-8">
                {recap.headline}
              </h2>

              {/* The two faces from the sketch, sitting in the corner. */}
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-3 right-5 hidden items-end gap-2 sm:flex xl:bottom-4 xl:right-8"
              >
                <MoodFace
                  mood={todayMood?.mood ?? "good"}
                  className="h-16 w-16 xl:h-20 xl:w-20"
                />
                <Mascot className="h-32 w-32 xl:h-40 xl:w-40" />
              </div>

              <ul className="relative mt-4 max-w-[calc(100%-13rem)] space-y-2.5 xl:max-w-[calc(100%-16rem)]">
                {recap.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 text-[15.5px] leading-6 text-white/85 xl:text-[17px]"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-karsa-sand" />
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── Right column ────────────────────────────────────────────── */}
        {/* Pinned and full-height so the month and the day's schedule are both
            on screen at once — picking a date never means scrolling to find
            out what's on it. `min-h` is the floor the calendar actually needs:
            on a short window the page scrolls rather than clipping the grid.
            Below `lg` it is gone from the flow entirely and lives in the
            slide-over instead — see the trigger at the foot of this file. */}
        <aside className="sched-col hidden min-w-0 flex-col gap-5 md:gap-6 lg:sticky lg:top-8 lg:flex lg:h-[calc(100vh-4rem)] lg:min-h-[730px] xl:top-10 xl:h-[calc(100vh-5rem)] xl:min-h-[790px] xl:gap-7">
          <ScheduleColumn
            patients={patients}
            activePatientId={activePatientId}
            selected={selected}
            onSelect={setSelected}
            events={events}
            today={today}
            marked={markedDays}
            isSelectedToday={isSelectedToday}
          />
        </aside>
      </div>

      {/* ── Schedule, on a phone ─────────────────────────────────────────
          The same column, reached from a button instead of three screens of
          scrolling. `lg:hidden` on both, so only one of the two ever exists. */}
      <button
        type="button"
        onClick={() => setScheduleOpen(true)}
        aria-label="Buka jadwal"
        className="fixed bottom-[calc(var(--bottom-nav)+1rem)] right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-karsa text-white shadow-[0_10px_28px_-8px_rgba(63,92,70,0.7)] outline-none transition-transform duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-karsa focus-visible:ring-offset-2 lg:hidden"
      >
        <CalendarDays size={23} strokeWidth={2.2} />
      </button>

      <SlideOver
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Jadwal"
      >
        <div className="flex flex-col gap-5">
          <ScheduleColumn
            patients={patients}
            activePatientId={activePatientId}
            selected={selected}
            onSelect={setSelected}
            events={events}
            today={today}
            marked={markedDays}
            isSelectedToday={isSelectedToday}
          />
        </div>
      </SlideOver>

      <Confetti fire={burst} />
    </div>
  );
}

/** The patient card and the month, in that order. Rendered twice — pinned in
 *  the right column from `lg`, and inside the slide-over below it — so the two
 *  can never drift apart. Every height rule in here is `lg:`-only: in the sheet
 *  the content simply flows, and the sheet does the scrolling. */
function ScheduleColumn({
  selected,
  onSelect,
  events,
  isSelectedToday,
  patients,
  activePatientId,
  today,
  marked,
}: {
  selected: Selection;
  onSelect: (next: Selection) => void;
  events: ScheduleEntry[];
  isSelectedToday: boolean;
  /** Threaded down from the page. `undefined` means signed out, which is what
   *  keeps the design placeholder alive; an empty array is a real caregiver
   *  with nobody yet. */
  patients?: CarePatient[];
  activePatientId?: string;
  today: CalendarDay;
  marked: Set<string>;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <>
      {/* Who this column is about, and the bell. The caregiver's own name
          used to sit here; it lives at the foot of the rail now. */}
      <PatientSwitcher patients={patients} activeId={activePatientId} />

      {/* Scheduling */}
      <Panel
        eyebrow="Penjadwalan"
        title="Jadwal"
        tone="lilac"
        className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"
        bodyClassName="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"
        action={
          <button
            type="button"
            aria-label="Tambah jadwal"
            onClick={() => setAdding(true)}
            /* Disabled without a patient rather than hidden: signed out, this
               column is a design placeholder and the button belongs in the
               picture — it just has nothing to write to. */
            disabled={!activePatientId}
            className="grid h-9 w-9 place-items-center rounded-lg bg-white/80 text-karsa-dark ring-1 ring-edge-lilac outline-none transition-all duration-200 hover:bg-karsa hover:text-white hover:ring-karsa focus-visible:ring-2 focus-visible:ring-karsa/40 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus size={18} strokeWidth={2.6} />
          </button>
        }
      >
        {/* The month grid takes whatever height is going spare; the day
            list under it keeps its own scroll so it's always in view. */}
        <Calendar
          selected={selected}
          onSelect={onSelect}
          today={today}
          marked={marked}
          className="shrink-0"
        />

        {/* Bleeds to the card edge, so the divider matches the padding. */}
        <div
          data-divider
          className="-mx-6 my-6 h-px shrink-0 bg-edge-lilac sm:-mx-7 xl:-mx-8"
        />

        <p
          data-day-label
          className="mb-3.5 shrink-0 px-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400 xl:text-xs"
        >
          {isSelectedToday ? "Hari ini" : `${selected.d} ${MONTHS[selected.m]}`}
        </p>

        {/* Gutters so the cards' hover shadow isn't clipped by the scroll box. */}
        <div className="-mx-2 px-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          {events.length > 0 ? (
            <ul data-schedule-list className="flex flex-col gap-3">
              {events.map((event) => (
                <ScheduleItem key={event.id} event={event} />
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl bg-white/60 px-4 py-6 text-center text-sm text-neutral-500">
              Tidak ada jadwal di tanggal ini.
            </p>
          )}
        </div>

        <button
          type="button"
          data-more
          onClick={() => setAdding(true)}
          disabled={!activePatientId}
          className="group/more mt-4 flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-semibold text-karsa-dark underline underline-offset-4 outline-none transition-colors hover:text-karsa focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:pointer-events-none disabled:opacity-40 xl:text-sm"
        >
          Tambah jadwal baru
          <ArrowRight
            size={15}
            strokeWidth={2.5}
            className="transition-transform duration-200 group-hover/more:translate-x-0.5"
          />
        </button>
      </Panel>

      {activePatientId && (
        <ScheduleForm
          open={adding}
          onClose={() => setAdding(false)}
          patientId={activePatientId}
          day={selected}
        />
      )}
    </>
  );
}

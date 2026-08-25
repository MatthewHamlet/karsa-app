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
  SlidersHorizontal,
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
import DailyTaskManager from "../components/DailyTaskManager";
import TasksDone from "../components/TasksDone";
import { ACTIVITIES, SUMMARY as DESIGN_SUMMARY, whenOf } from "../data/dashboard";
import { MOOD_ENTRIES as DESIGN_MOODS } from "../data/mood";
import { MONTHS, dayKey, longDateLabel, type CalendarDay } from "../lib/care/time";

import type {
  CareGroupMember,
  DailyTask,
  FeedItem,
  MoodEntryRow,
  ScheduleEntry,
} from "../lib/care/queries";
import type { DaySummary } from "../lib/care/stats";
import { toggleTask } from "../lib/care/actions";


const VISIBLE_TASKS = 3;

const STRIKE_MS = 520;


const FEED_TONE = {
  task: "care",
  reading: "health",
  meal: "meal",
  medication: "health",
  mood: "care",
} as const;


const DESIGN_ACTIVITIES = ACTIVITIES.map((a) => ({
  id: a.id,
  actor: a.actor,
  action: a.action,
  when: whenOf(a.at),
  tone: a.tone,
}));


export default function Homepage({
  greeting,
  patients,
  activePatientId,
  pending: invitationPending = false,
  today,
  tasks = [],
  members = [],
  meId,
  feed,
  schedule,
  moods,
  summary,
}: {

  greeting?: string;
  patients?: CarePatient[];
  activePatientId?: string;

  pending?: boolean;
  today: CalendarDay;
  tasks?: DailyTask[];

  members?: CareGroupMember[];

  meId?: string;
  feed?: FeedItem[];
  schedule?: Record<string, ScheduleEntry[]>;
  moods?: MoodEntryRow[];
  summary?: DaySummary | null;
}) {
  const [completed, setCompleted] = useState<string[]>(() =>
    tasks.filter((task) => task.done).map((task) => task.id),
  );

  const [striking, setStriking] = useState<string[]>([]);
  const [selected, setSelected] = useState<Selection>({ ...today });

  const [scheduleOpen, setScheduleOpen] = useState(false);

  const [burst, setBurst] = useState(0);

  const [planOpen, setPlanOpen] = useState(false);
  const reduce = useReducedMotion();


  const mine = useMemo(
    () => tasks.filter((task) => !task.assigneeId || task.assigneeId === meId),
    [tasks, meId],
  );


  const remaining = mine.filter((task) => !completed.includes(task.id));
  const done = mine.filter((task) => completed.includes(task.id) || striking.includes(task.id))
    .length;

  const progress = mine.length === 0 ? 0 : Math.round((done / mine.length) * 100);

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

    <div className="w-full px-4 pb-10 pt-4 sm:px-6 md:px-8 md:pt-10 xl:pb-12 xl:pl-12 xl:pr-6 xl:pt-12">



      <div className="grid items-start gap-6 grid-cols-[minmax(0,1fr)] md:gap-8 lg:grid-cols-[minmax(0,1fr)_316px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_336px] xl:gap-12 2xl:grid-cols-[minmax(0,1fr)_360px]">

        <div className="@container min-w-0 space-y-6 md:space-y-7 xl:space-y-8">


          <div className="flex flex-col gap-6 md:gap-7 xl:gap-8 lg:min-h-[calc(100svh-2.5rem-1.5rem)] xl:min-h-[calc(100svh-3rem-1.75rem)]">



            <section className="relative flex min-h-[calc(100svh-488px)] flex-1 flex-col justify-center pb-4 pt-1 sm:min-h-0 sm:pb-6 sm:pt-2 xl:pb-8">

              <div
                aria-hidden
                className="pointer-events-none absolute -left-10 right-0 -top-16 -bottom-4 overflow-hidden"
                style={{



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


              <div className="relative flex items-center justify-center gap-4 text-left sm:gap-8 xl:gap-10">
                <Mascot className="h-40 w-40 shrink-0 sm:h-44 sm:w-44 lg:h-48 lg:w-48 xl:h-56 xl:w-56" />

                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-neutral-500 xl:text-[16px]">
                    {todayLabel}
                  </p>
                  <h1 className="mt-1 text-[30px] font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-[40px] lg:text-[46px] xl:text-[54px]">
                    Halo, {greeting ?? "Pendamping"}!
                  </h1>


                  <ul className="mt-4 space-y-2.5 xl:mt-6 xl:space-y-3">
                    <li className="flex items-center gap-2.5 text-[16px] text-neutral-600 sm:text-[17px] xl:text-[19px]">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 xl:h-9 xl:w-9">
                        <HeartPulse size={16} strokeWidth={2.6} />
                      </span>
                      <span className="font-semibold text-neutral-800">
                        {mine.length === 0
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

                    <p className="mt-4 inline-flex rounded-xl bg-amber-50 px-3.5 py-2.5 text-[14px] font-semibold leading-5 text-amber-800 ring-1 ring-amber-200">
                      Menunggu persetujuan. Datanya muncul setelah dia menyetujui.
                    </p>
                  )}
                </div>
              </div>
            </section>


            <div className="grid gap-6 grid-cols-[minmax(0,1fr)] @3xl:grid-cols-[minmax(0,1.6fr)_minmax(0,0.85fr)]">
              <Panel
                eyebrow="Tugas harian"
                title="Tugas Kamu"
                tone="sand"
                className="flex flex-col"
                bodyClassName="flex flex-1 flex-col"
                action={
                  <span className="inline-flex items-center gap-1">

                    {activePatientId && (
                      <button
                        type="button"
                        onClick={() => setPlanOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[13px] font-medium text-neutral-500 outline-none transition-colors duration-200 hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
                      >
                        <SlidersHorizontal size={13} strokeWidth={2.4} aria-hidden />
                        Atur
                      </button>
                    )}

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
                  </span>
                }
              >

                <div className="flex flex-1 items-center gap-4 sm:gap-5 @3xl:gap-7">

                  <ul className="flex h-[152px] min-w-0 flex-1 flex-col justify-center divide-y divide-edge-sand border-y border-edge-sand sm:h-[147px]">
                    <AnimatePresence initial={false}>
                      {remaining.slice(0, VISIBLE_TASKS).map((task) => (
                        <TaskItem
                          key={task.id}
                          label={task.label}

                          hint={task.atTime ?? task.hint ?? undefined}
                          done={striking.includes(task.id)}
                          onToggle={() => complete(task.id)}
                        />
                      ))}
                    </AnimatePresence>


                    {remaining.length === 0 && (
                      <li className="grid h-full place-items-center px-4 text-center">
                        {mine.length > 0 ? (
                          <TasksDone size="sm" />
                        ) : (
                          <span className="text-[13.5px] leading-5 text-neutral-500">
                            Belum ada tugas harian.

                            <button
                              type="button"
                              onClick={() => setPlanOpen(true)}
                              disabled={!activePatientId}
                              className="ml-1 font-bold text-karsa-dark underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:no-underline disabled:opacity-60"
                            >
                              Atur sekarang
                            </button>
                          </span>
                        )}
                      </li>
                    )}
                  </ul>

                  <ProgressRing
                    value={progress}
                    label={`${done}/${mine.length}`}
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


      {activePatientId && (
        <DailyTaskManager
          open={planOpen}
          onClose={() => setPlanOpen(false)}
          tasks={tasks}
          patientId={activePatientId}
          members={members}
          meId={meId}
        />
      )}

      <Confetti fire={burst} />
    </div>
  );
}


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

  patients?: CarePatient[];
  activePatientId?: string;
  today: CalendarDay;
  marked: Set<string>;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <>

      <PatientSwitcher patients={patients} activeId={activePatientId} />


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

            disabled={!activePatientId}
            className="grid h-9 w-9 place-items-center rounded-lg bg-white/80 text-karsa-dark ring-1 ring-edge-lilac outline-none transition-all duration-200 hover:bg-karsa hover:text-white hover:ring-karsa focus-visible:ring-2 focus-visible:ring-karsa/40 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus size={18} strokeWidth={2.6} />
          </button>
        }
      >

        <Calendar
          selected={selected}
          onSelect={onSelect}
          today={today}
          marked={marked}
          className="shrink-0"
        />


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

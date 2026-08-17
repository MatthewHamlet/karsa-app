"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  BedDouble,
  Check,
  ChevronDown,
  Droplets,
  Gauge,
  HeartPulse,
  Pill,
  Plus,
  Scale,
  Thermometer,
  Utensils,
  X,
} from "lucide-react";
import Modal from "./Modal";
import MoodFace from "./MoodFace";
import { EASE } from "./List";
import {
  FIXED_STATS,
  FIXED_TONES,
  MONITOR_STATS,
  PERIODS,
  type MonitorKey,
  type Period,
  type StatTone,
  type StatValue,
} from "../data/careStats";
import { MOOD_ENTRIES } from "../data/mood";

const MONITOR_ICON = {
  bloodPressure: Gauge,
  bloodSugar: Droplets,
  oxygen: Activity,
  heartRate: HeartPulse,
  temperature: Thermometer,
  weight: Scale,
} as const;

/** The shell every stat card shares: its own colour, an icon, a title. */
function StatCard({
  tone,
  icon,
  title,
  children,
  onRemove,
  removeLabel,
}: {
  tone: StatTone;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  return (
    <article
      className="group/stat relative flex flex-col rounded-3xl p-5 xl:p-6"
      style={{ backgroundColor: tone.bg, boxShadow: `inset 0 0 0 1px ${tone.edge}` }}
    >
      <header className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: tone.tile, color: tone.ink }}
        >
          {icon}
        </span>
        <h3 className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight text-neutral-900">
          {title}
        </h3>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            title={removeLabel}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-neutral-400 opacity-0 outline-none transition-all duration-200 hover:bg-white/70 hover:text-neutral-700 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-karsa/40 group-hover/stat:opacity-100"
          >
            <X size={14} strokeWidth={2.6} />
          </button>
        )}
      </header>

      <div className="mt-4 flex flex-1 flex-col justify-end">{children}</div>
    </article>
  );
}

/** Headline figure plus its caption, and a fill bar when there's a target. */
function StatFigure({ data, tone }: { data: StatValue; tone: StatTone }) {
  return (
    <>
      <p className="text-[26px] font-extrabold leading-none tracking-tight text-neutral-900 xl:text-[28px]">
        {data.value}
      </p>
      <p className="mt-1.5 text-[13px] leading-5 text-neutral-500">{data.caption}</p>

      {typeof data.progress === "number" && (
        <div
          className="mt-4 h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: `${tone.ink}1f` }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${data.progress}%`, backgroundColor: tone.ink }}
          />
        </div>
      )}
    </>
  );
}

export default function CareStats() {
  const [period, setPeriod] = useState<Period>("daily");
  const [menuOpen, setMenuOpen] = useState(false);
  const [added, setAdded] = useState<MonitorKey[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const reduce = useReducedMotion();

  const todayMood = MOOD_ENTRIES[0];
  const periodLabel = PERIODS.find((p) => p.key === period)!.label;
  const available = MONITOR_STATS.filter((stat) => !added.includes(stat.key));

  const fade = reduce ? { duration: 0 } : { duration: 0.22, ease: EASE };

  return (
    <section>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.18em] text-neutral-400">
            Statistik
          </p>
          <h2 className="mt-1.5 text-[21px] font-bold leading-7 tracking-tight text-neutral-900 xl:text-[23px]">
            Kondisi Meimei
          </h2>
        </div>

        {/* Period switch — the "Daily ∨" control from the sketch. */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="listbox"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-semibold text-neutral-800 outline-none ring-1 ring-karsa-line transition-colors duration-200 hover:bg-karsa-cream focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            {periodLabel}
            <motion.span
              animate={{ rotate: menuOpen ? 180 : 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.2, ease: EASE }}
              className="grid place-items-center text-neutral-400"
            >
              <ChevronDown size={16} strokeWidth={2.4} />
            </motion.span>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                {/* Click-away catcher, so the menu closes like a menu should. */}
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <motion.ul
                  role="listbox"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={fade}
                  className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_18px_40px_-20px_rgba(24,32,24,0.5)] ring-1 ring-karsa-line"
                >
                  {PERIODS.map((option) => (
                    <li key={option.key}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={option.key === period}
                        onClick={() => {
                          setPeriod(option.key);
                          setMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[14px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
                          option.key === period
                            ? "bg-karsa-soft font-semibold text-karsa-dark"
                            : "font-medium text-neutral-600 hover:bg-karsa-canvas"
                        }`}
                      >
                        {option.label}
                        {option.key === period && <Check size={15} strokeWidth={2.6} />}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Three across, exactly as sketched: fluids · meals · medication, then
          mood · sleep · the add button. Added stats extend the same grid. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
        <StatCard
          tone={FIXED_TONES.fluid}
          icon={<Droplets size={19} strokeWidth={2.1} />}
          title={FIXED_STATS.fluid.title}
        >
          <StatFigure data={FIXED_STATS.fluid.byPeriod[period]} tone={FIXED_TONES.fluid} />
        </StatCard>

        {/* Meals are the patient's own record — shown, never edited here. */}
        <StatCard
          tone={FIXED_TONES.meals}
          icon={<Utensils size={19} strokeWidth={2.1} />}
          title={FIXED_STATS.meals.title}
        >
          {period === "daily" ? (
            <ul className="space-y-2">
              {FIXED_STATS.meals.byPeriod.daily.meals!.map((meal) => (
                <li key={meal.label} className="flex items-center gap-2.5">
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
                    style={{
                      backgroundColor: meal.done ? FIXED_TONES.meals.ink : "transparent",
                      boxShadow: meal.done ? "none" : `inset 0 0 0 1.5px ${FIXED_TONES.meals.edge}`,
                      color: "#ffffff",
                    }}
                  >
                    {meal.done && <Check size={12} strokeWidth={3.4} />}
                  </span>
                  <span
                    className={`text-[14.5px] ${
                      meal.done ? "font-semibold text-neutral-800" : "text-neutral-500"
                    }`}
                  >
                    {meal.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <StatFigure data={FIXED_STATS.meals.byPeriod[period]} tone={FIXED_TONES.meals} />
          )}
        </StatCard>

        <StatCard
          tone={FIXED_TONES.medication}
          icon={<Pill size={19} strokeWidth={2.1} />}
          title={FIXED_STATS.medication.title}
        >
          <StatFigure
            data={FIXED_STATS.medication.byPeriod[period]}
            tone={FIXED_TONES.medication}
          />
        </StatCard>

        <StatCard
          tone={FIXED_TONES.mood}
          icon={<MoodFace mood={todayMood.mood} className="h-6 w-6" />}
          title={FIXED_STATS.mood.title}
        >
          <div className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <StatFigure data={FIXED_STATS.mood.byPeriod[period]} tone={FIXED_TONES.mood} />
            </div>
            <MoodFace mood={todayMood.mood} className="h-14 w-14 shrink-0 xl:h-16 xl:w-16" />
          </div>
        </StatCard>

        <StatCard
          tone={FIXED_TONES.sleep}
          icon={<BedDouble size={19} strokeWidth={2.1} />}
          title={FIXED_STATS.sleep.title}
        >
          <StatFigure data={FIXED_STATS.sleep.byPeriod[period]} tone={FIXED_TONES.sleep} />
        </StatCard>

        {/* Added monitoring stats sit in the same grid as the fixed ones. */}
        <AnimatePresence initial={false}>
          {added.map((key) => {
            const stat = MONITOR_STATS.find((s) => s.key === key)!;
            const Icon = MONITOR_ICON[key];
            return (
              <motion.div
                key={key}
                layout
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                transition={fade}
              >
                <StatCard
                  tone={stat.tone}
                  icon={<Icon size={19} strokeWidth={2.1} />}
                  title={stat.title}
                  onRemove={() => setAdded((prev) => prev.filter((k) => k !== key))}
                  removeLabel={`Hapus ${stat.title}`}
                >
                  <StatFigure data={stat.byPeriod[period]} tone={stat.tone} />
                </StatCard>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* The "more" button from the sketch. */}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="group/add flex min-h-[168px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-karsa-line bg-white/40 p-5 text-center outline-none transition-colors duration-200 hover:border-karsa/40 hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-karsa/40"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-karsa-dark ring-1 ring-karsa-line transition-transform duration-200 group-hover/add:scale-110">
            <Plus size={20} strokeWidth={2.4} />
          </span>
          <span className="text-[14px] font-semibold text-neutral-700">Tambah statistik</span>
          <span className="text-[12.5px] leading-4 text-neutral-500">
            Pantau hal lain yang penting
          </span>
        </button>
      </div>

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Tambah statistik"
        description="Pilih yang ingin dipantau. Kartunya langsung muncul di atas."
        size="lg"
      >
        {available.length === 0 ? (
          <p className="rounded-2xl bg-white px-5 py-8 text-center text-[14.5px] text-neutral-500 ring-1 ring-karsa-line">
            Semua statistik sudah ditambahkan.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {available.map((stat) => {
              const Icon = MONITOR_ICON[stat.key];
              return (
                <li key={stat.key}>
                  <button
                    type="button"
                    onClick={() => setAdded((prev) => [...prev, stat.key])}
                    className="group/pick flex w-full items-start gap-3.5 rounded-2xl p-4 text-left outline-none transition-transform duration-200 hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-karsa/40"
                    style={{
                      backgroundColor: stat.tone.bg,
                      boxShadow: `inset 0 0 0 1px ${stat.tone.edge}`,
                    }}
                  >
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                      style={{ backgroundColor: stat.tone.tile, color: stat.tone.ink }}
                    >
                      <Icon size={19} strokeWidth={2.1} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold text-neutral-900">
                        {stat.title}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] leading-4 text-neutral-500">
                        {stat.description}
                      </span>
                    </span>
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/70"
                      style={{ color: stat.tone.ink }}
                    >
                      <Plus size={15} strokeWidth={2.6} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </section>
  );
}

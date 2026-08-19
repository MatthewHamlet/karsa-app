"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import Modal from "./Modal";
import MoodFace from "./MoodFace";
import StatArt from "./StatArt";
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

/** The card shell. The icon is the headline — big, bare, in the stat's own
 *  colour — and the content spans the full width underneath it, which is what
 *  keeps these from going hollow. No printed title: the icon is the label, and
 *  `aria-label` carries the name for anyone who can't see it. */
function StatCard({
  tone,
  art,
  label,
  children,
  backdrop,
  onRemove,
  removeLabel,
  className = "",
}: {
  tone: StatTone;
  /** The card's illustration — upper-left, above the statistic. */
  art: ReactNode;
  label: string;
  children: ReactNode;
  /** Painted behind the card's content, sized against the card itself. */
  backdrop?: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
}) {
  return (
    <article
      aria-label={label}
      className={`group/stat relative flex min-h-[176px] flex-col overflow-hidden rounded-3xl p-5 xl:p-6 ${className}`}
      style={{ backgroundColor: tone.bg, boxShadow: `inset 0 0 0 1px ${tone.edge}` }}
    >
      {backdrop}

      <div className="relative z-10">{art}</div>

      <div className="relative z-10 mt-4 flex flex-1 flex-col justify-end">{children}</div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          title={removeLabel}
          className="absolute right-3 top-3 z-20 grid h-7 w-7 place-items-center rounded-full text-neutral-400 opacity-0 outline-none transition-all duration-200 hover:bg-white/80 hover:text-neutral-700 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-karsa/40 group-hover/stat:opacity-100"
        >
          <X size={14} strokeWidth={2.6} />
        </button>
      )}
    </article>
  );
}

/** Headline figure, its caption, and a fill bar when there's a target. */
function StatFigure({ data, tone }: { data: StatValue; tone: StatTone }) {
  return (
    <>
      <p className="text-[26px] font-extrabold leading-none tracking-tight text-neutral-900 xl:text-[28px]">
        {data.value}
      </p>
      <p className="mt-1.5 text-[13px] leading-5 text-neutral-600">{data.caption}</p>

      {typeof data.progress === "number" && (
        <div
          className="mt-4 h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: `${tone.ink}22` }}
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

  const fluid = FIXED_STATS.fluid.byPeriod[period];
  const meals = FIXED_STATS.meals.byPeriod[period];

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
        {/* Water keeps its liquid: the card is the glass, filled to the level
            the figure states. No bar underneath — the fill is the bar. */}
        <StatCard
          tone={FIXED_TONES.fluid}
          art={<StatArt kind="fluid" tone={FIXED_TONES.fluid} />}
          label={`${FIXED_STATS.fluid.title}: ${fluid.value} ${fluid.caption}`}
          backdrop={
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-0 opacity-40"
              style={{ height: `${fluid.progress ?? 0}%` }}
            >
              {/* One opacity on the wrapper: fading the crest and the body
                  separately drew a line where the two layers met. */}
              <svg
                viewBox="0 0 400 20"
                preserveAspectRatio="none"
                className="absolute -top-[11px] left-0 h-[12px] w-full"
              >
                <path
                  d="M0 12 Q25 2 50 12 T100 12 T150 12 T200 12 T250 12 T300 12 T350 12 T400 12 V20 H0 Z"
                  fill={FIXED_TONES.fluid.ink}
                />
              </svg>
              <div className="h-full w-full" style={{ backgroundColor: FIXED_TONES.fluid.ink }} />
            </div>
          }
        >
          <StatFigure
            data={{ value: fluid.value, caption: fluid.caption }}
            tone={FIXED_TONES.fluid}
          />
        </StatCard>

        {/* Meals are the patient's own record — shown, never edited here. */}
        <StatCard
          tone={FIXED_TONES.meals}
          art={<StatArt kind="meals" tone={FIXED_TONES.meals} />}
          label={`${FIXED_STATS.meals.title}: ${meals.value} ${meals.caption}`}
        >
          {period === "daily" ? (
            <ul className="space-y-2.5">
              {meals.meals!.map((meal) => (
                <li key={meal.label} className="flex items-center gap-2.5">
                  <span
                    className="grid h-[21px] w-[21px] shrink-0 place-items-center rounded-full text-white"
                    style={{
                      backgroundColor: meal.done ? FIXED_TONES.meals.ink : "transparent",
                      boxShadow: meal.done
                        ? "none"
                        : `inset 0 0 0 1.5px ${FIXED_TONES.meals.ink}55`,
                    }}
                  >
                    {meal.done && <Check size={12} strokeWidth={3.4} />}
                  </span>
                  <span
                    className={`text-[15px] ${
                      meal.done ? "font-semibold text-neutral-800" : "text-neutral-500"
                    }`}
                  >
                    {meal.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <StatFigure data={meals} tone={FIXED_TONES.meals} />
          )}
        </StatCard>

        <StatCard
          tone={FIXED_TONES.medication}
          art={<StatArt kind="medication" tone={FIXED_TONES.medication} />}
          label={`${FIXED_STATS.medication.title}: ${FIXED_STATS.medication.byPeriod[period].value}`}
        >
          <StatFigure
            data={FIXED_STATS.medication.byPeriod[period]}
            tone={FIXED_TONES.medication}
          />
        </StatCard>

        {/* The face is this card's icon, so it stands in for the glyph. */}
        <article
          aria-label={`${FIXED_STATS.mood.title}: ${FIXED_STATS.mood.byPeriod[period].value}`}
          className="relative flex min-h-[176px] flex-col overflow-hidden rounded-3xl p-5 xl:p-6"
          style={{
            backgroundColor: FIXED_TONES.mood.bg,
            boxShadow: `inset 0 0 0 1px ${FIXED_TONES.mood.edge}`,
          }}
        >
          <MoodFace mood={todayMood.mood} className="h-11 w-11 shrink-0 xl:h-12 xl:w-12" />
          <div className="mt-4 flex flex-1 flex-col justify-end">
            <StatFigure data={FIXED_STATS.mood.byPeriod[period]} tone={FIXED_TONES.mood} />
          </div>
        </article>

        <StatCard
          tone={FIXED_TONES.sleep}
          art={<StatArt kind="sleep" tone={FIXED_TONES.sleep} />}
          label={`${FIXED_STATS.sleep.title}: ${FIXED_STATS.sleep.byPeriod[period].value}`}
        >
          <StatFigure data={FIXED_STATS.sleep.byPeriod[period]} tone={FIXED_TONES.sleep} />
        </StatCard>

        {/* Added monitoring stats sit in the same grid as the fixed ones. */}
        <AnimatePresence initial={false}>
          {added.map((key) => {
            const stat = MONITOR_STATS.find((s) => s.key === key)!;
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
                  art={<StatArt kind={stat.key} tone={stat.tone} />}
                  label={`${stat.title}: ${stat.byPeriod[period].value}`}
                  onRemove={() => setAdded((prev) => prev.filter((k) => k !== key))}
                  removeLabel={`Hapus ${stat.title}`}
                  className="h-full"
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
          className="group/add flex min-h-[176px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-karsa-line bg-white/40 p-5 text-center outline-none transition-colors duration-200 hover:border-karsa/40 hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-karsa/40"
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
            {available.map((stat) => (
                <li key={stat.key}>
                  <button
                    type="button"
                    onClick={() => setAdded((prev) => [...prev, stat.key])}
                    className="flex w-full items-start gap-3.5 rounded-2xl p-4 text-left outline-none transition-transform duration-200 hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-karsa/40"
                    style={{
                      backgroundColor: stat.tone.bg,
                      boxShadow: `inset 0 0 0 1px ${stat.tone.edge}`,
                    }}
                  >
                    <StatArt kind={stat.key} tone={stat.tone} className="h-11 w-11 shrink-0" />
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
            ))}
          </ul>
        )}
      </Modal>
    </section>
  );
}

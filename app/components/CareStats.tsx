"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import Modal from "./Modal";
import MoodFace from "./MoodFace";
import StatArt from "./StatArt";
import StatPeriodBody from "./StatPeriod";
import { EASE } from "./List";
import { TRENDS } from "../data/careTrends";
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
import type { CareData } from "../lib/care/view";

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
  swapKey,
  tall = false,
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
  /** Changing this swaps the body: the old one leaves, the card resizes, the
   *  new one arrives. The card itself never unmounts, so the illustration and
   *  the colour stay put and only the statistic moves. */
  swapKey?: string;
  /** One fixed height for every card in a period view. A chart, a donut and a
   *  month of days all want different amounts of room, and letting each take
   *  what it wants is what broke the grid's rows — so they all get the same
   *  and distribute inside it. A day's cards stay compact. */
  tall?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      layout={!reduce}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 34 }}
      aria-label={label}
      className={`group/stat relative flex flex-col overflow-hidden rounded-3xl p-5 xl:p-6 ${
        tall ? "h-[292px] xl:h-[304px]" : "min-h-[176px]"
      } ${className}`}
      style={{ backgroundColor: tone.bg, boxShadow: `inset 0 0 0 1px ${tone.edge}` }}
    >
      {backdrop}

      <div className="relative z-10 shrink-0">{art}</div>

      <div className="relative z-10 mt-4 flex min-h-0 flex-1 flex-col">
        {/* `popLayout`, deliberately not `wait`. Under `wait` the incoming body
            is held back until the outgoing one finishes animating away — which
            makes what the card *says* depend on an animation completing. Switch
            period and background the tab and rAF stops: the old statistic stays
            on screen under the new card's label, with no error anywhere. Here
            the new body mounts at once and the old one is pulled out of layout
            while it leaves, so the card resizes cleanly and never lies. */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={swapKey ?? "static"}
            layout={!reduce}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={reduce ? { duration: 0 } : { duration: 0.16, ease: EASE }}
            /* Fills the card so a body can distribute itself top-to-bottom;
               `justify-end` keeps a day's short body sitting on the floor of
               the card the way it always has. */
            className="flex min-h-0 flex-1 flex-col justify-end"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

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
    </motion.article>
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

export default function CareStats({ data }: { data?: CareData }) {
  const [period, setPeriod] = useState<Period>("daily");
  const [menuOpen, setMenuOpen] = useState(false);
  const [added, setAdded] = useState<MonitorKey[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const reduce = useReducedMotion();

  const todayMood = data ? data.moods[0] : MOOD_ENTRIES[0];
  const periodLabel = PERIODS.find((p) => p.key === period)!.label;
  const available = MONITOR_STATS.filter((stat) => !added.includes(stat.key));
  const fade = reduce ? { duration: 0 } : { duration: 0.22, ease: EASE };

  /* The figures come from the database; the titles, colours and descriptions
     stay where they are. That split is deliberate — "Tekanan darah" and its
     pink are facts about the design, not about the patient, and putting them in
     a table would mean a migration to change a shade. Only the numbers, which
     *are* facts about the patient, are read from it. */
  const fixed = (key: keyof typeof FIXED_STATS): StatValue =>
    data ? data.stats[period].fixed[key] : FIXED_STATS[key].byPeriod[period];

  const monitor = (stat: (typeof MONITOR_STATS)[number]): StatValue =>
    data ? data.stats[period].monitor[stat.key] : stat.byPeriod[period];

  const fluid = fixed("fluid");
  const meals = fixed("meals");

  /** Null on a day, and the whole period's detail otherwise. Narrowed once
   *  here so every card below can just ask whether there is a trend to draw.
   *
   *  Also null whenever the figures are real, and that is the important half.
   *  `TRENDS` is a hand-written fortnight of readings — the charts, the day
   *  labels, the highs and lows. Drawn beside a headline figure computed from
   *  the database it would make one card half true, which is worse than a card
   *  that is plainly a placeholder: nobody can tell which half to believe.
   *
   *  So a signed-in caregiver gets the real figure at every period and no
   *  chart, and the chart returns when there is a query behind it. Rolling the
   *  logs up per day is a straightforward addition to `lib/care/stats` — it is
   *  left out here rather than faked. */
  const trend = period === "daily" || data ? null : TRENDS[period];

  return (
    <section>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.18em] text-neutral-400">
            Statistik
          </p>
          <h2 className="mt-1.5 text-[21px] font-bold leading-7 tracking-tight text-neutral-900 xl:text-[23px]">
            Kondisi {data?.patientName ?? "pasien"}
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

      {/* The grid itself never re-keys. Switching period used to remount the
          whole thing, which read as the page blinking; now each card keeps its
          colour and its illustration and swaps only the statistic inside. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
        {/* Water keeps its liquid: the card is the glass, filled to the level
            the figure states. No bar underneath — the fill is the bar. */}
        <StatCard
          swapKey={period}
          tall={Boolean(trend)}
          tone={FIXED_TONES.fluid}
          art={<StatArt kind="fluid" tone={FIXED_TONES.fluid} />}
          label={`${FIXED_STATS.fluid.title}: ${fluid.value} ${fluid.caption}`}
          backdrop={
            /* The glass fills only on a day. A week is seven glasses, and a
               single level behind a chart of them would be a second, quieter
               claim about the same numbers. */
            trend ? undefined : (
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
            )
          }
        >
          {trend ? (
            <StatPeriodBody
              detail={trend.fluid}
              tone={FIXED_TONES.fluid}
              title={FIXED_STATS.fluid.title}
            />
          ) : (
            <StatFigure
              data={{ value: fluid.value, caption: fluid.caption }}
              tone={FIXED_TONES.fluid}
            />
          )}
        </StatCard>

        {/* Meals are the patient's own record — shown, never edited here. */}
        <StatCard
          swapKey={period}
          tall={Boolean(trend)}
          tone={FIXED_TONES.meals}
          art={<StatArt kind="meals" tone={FIXED_TONES.meals} />}
          label={`${FIXED_STATS.meals.title}: ${meals.value} ${meals.caption}`}
        >
          {trend ? (
            <StatPeriodBody
              detail={trend.meals}
              tone={FIXED_TONES.meals}
              title={FIXED_STATS.meals.title}
              unit="porsi makan"
            />
          ) : (
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
          )}
        </StatCard>

        <StatCard
          swapKey={period}
          tall={Boolean(trend)}
          tone={FIXED_TONES.medication}
          art={<StatArt kind="medication" tone={FIXED_TONES.medication} />}
          label={`${FIXED_STATS.medication.title}: ${fixed("medication").value}`}
        >
          {trend ? (
            <StatPeriodBody
              detail={trend.medication}
              tone={FIXED_TONES.medication}
              title={FIXED_STATS.medication.title}
              unit="dosis"
            />
          ) : (
            <StatFigure
              data={fixed("medication")}
              tone={FIXED_TONES.medication}
            />
          )}
        </StatCard>

        {/* The face is this card's icon, so it stands in for the glyph — which
            is the only reason this one used to be a hand-built article. It is a
            StatCard like the rest now, so it swaps its body the same way. */}
        <StatCard
          swapKey={period}
          tall={Boolean(trend)}
          tone={FIXED_TONES.mood}
          art={
            <MoodFace
              /* `okay` is the neutral face, and it is only ever reached when
                 there is nothing logged at all — the card beside it says so in
                 words, so the face is a placeholder rather than a claim. */
              mood={trend ? trend.mood.mood!.dominant : (todayMood?.mood ?? "okay")}
              className="h-11 w-11 shrink-0 xl:h-12 xl:w-12"
            />
          }
          label={`${FIXED_STATS.mood.title}: ${fixed("mood").value}`}
        >
          {trend ? (
            <StatPeriodBody
              detail={trend.mood}
              tone={FIXED_TONES.mood}
              title={FIXED_STATS.mood.title}
            />
          ) : (
            <StatFigure data={fixed("mood")} tone={FIXED_TONES.mood} />
          )}
        </StatCard>

        <StatCard
          swapKey={period}
          tall={Boolean(trend)}
          tone={FIXED_TONES.sleep}
          art={<StatArt kind="sleep" tone={FIXED_TONES.sleep} />}
          label={`${FIXED_STATS.sleep.title}: ${fixed("sleep").value}`}
        >
          {trend ? (
            <StatPeriodBody
              detail={trend.sleep}
              tone={FIXED_TONES.sleep}
              title={FIXED_STATS.sleep.title}
            />
          ) : (
            <StatFigure data={fixed("sleep")} tone={FIXED_TONES.sleep} />
          )}
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
                  swapKey={period}
                  tall={Boolean(trend)}
                  tone={stat.tone}
                  art={<StatArt kind={stat.key} tone={stat.tone} />}
                  label={`${stat.title}: ${monitor(stat).value}`}
                  onRemove={() => setAdded((prev) => prev.filter((k) => k !== key))}
                  removeLabel={`Hapus ${stat.title}`}
                  className="h-full"
                >
                  {trend ? (
                    <StatPeriodBody
                      detail={trend[stat.key]}
                      tone={stat.tone}
                      title={stat.title}
                    />
                  ) : (
                    <StatFigure data={monitor(stat)} tone={stat.tone} />
                  )}
                </StatCard>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* The "more" button from the sketch. */}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          /* Matches whatever the cards are doing, so it sits on the same
             baseline instead of leaving a short tile at the end of the row. */
          className={`group/add flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-karsa-line bg-white/40 p-5 text-center outline-none transition-colors duration-200 hover:border-karsa/40 hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
            trend ? "h-[292px] xl:h-[304px]" : "min-h-[176px]"
          }`}
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

"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Mic,
  PenLine,
  Plus,
  Save,
} from "lucide-react";
import JournalHistoryModal from "../components/JournalHistoryModal";
import Confetti from "../components/Confetti";
import MoodFace from "../components/MoodFace";
import StatArt from "../components/StatArt";
import { logHealthReading, logMood } from "../lib/care/actions";
import {
  ADDABLE_METRICS,
  DEFAULT_METRICS,
  METRICS,
  MONITOR_TONE,
  MONTH_LABEL,
  MOODS,
  TODAY_DATE,
  mmss,
  type MetricKind,
  type MetricSpec,
  type MoodKey,
} from "../data/journal";
import { PATIENT } from "../data/patient";

/** The patient's journal, as a wizard.
 *
 *  Three questions, one per screen, each one the only thing on it. A single
 *  form with mood, a recorder and a note stacked down it asks this reader to
 *  hold three tasks at once and to scroll to find the end of them; one question
 *  at a time asks for nothing but the answer in front of them.
 *
 *  Nothing behind the sheet scrolls, and nothing on this page does either. The
 *  screen is a fixed frame: header, the calendar button, the step. */

const STEPS = 3;

/** The journal's names for its metrics, and the database's.
 *
 *  The two lists differ because they answer to different things: `bp` and
 *  `glucose` are what fits on a stepper's label, while `blood_pressure` and
 *  `blood_sugar` are the values `health_readings.kind` is constrained to
 *  (migration 0005). Mapped explicitly rather than renamed on either side — the
 *  UI names are load-bearing in `METRICS`, and the column's check constraint is
 *  load-bearing everywhere else. */
const READING_KIND: Record<MetricKind, string> = {
  bp: "blood_pressure",
  glucose: "blood_sugar",
  weight: "weight",
  temp: "temperature",
  hr: "heart_rate",
};

/** Spoken or written — the same answer, two ways of giving it. */
type NoteMode = "voice" | "text";

export default function PatientJournalPage({
  patientId,
  patientName,
  initial,
  filledToday = false,
}: {
  /** Absent when signed out, which is the design-preview case: the wizard still
   *  runs, it simply has nowhere to write to. */
  patientId?: string;
  patientName?: string;
  initial?: string;
  /** Whether today's entry already exists. Opens the "done" screen instead of
   *  the wizard — see the note where it is rendered. */
  filledToday?: boolean;
} = {}) {
  const reduce = useReducedMotion();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState<number | null>(null);
  /** Step 2 offers both ways of telling it. */
  const [noteMode, setNoteMode] = useState<NoteMode>("voice");
  const [note, setNote] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [date, setDate] = useState(TODAY_DATE);
  const [saved, setSaved] = useState(filledToday);
  const [burst, setBurst] = useState(0);

  /* Step 3. Which metrics are on the card, and what they read. */
  const [metrics, setMetrics] = useState<MetricKind[]>(DEFAULT_METRICS);
  const [bp, setBp] = useState({ sys: "", dia: "" });
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      Object.values(METRICS)
        .filter((m) => m.initial !== undefined)
        .map((m) => [m.kind, m.initial as number]),
    ),
  );
  const [addOpen, setAddOpen] = useState(false);

  /** What the add button still has to offer. Computed once, up here, because
   *  both the button's caption and the sheet's list read from it. */
  const remaining = ADDABLE_METRICS.filter((k) => !metrics.includes(k));

  const stepMetric = (kind: MetricKind, delta: number) =>
    setValues((prev) => ({
      ...prev,
      /* Rounded to the metric's own step: 36.6 + 0.1 in binary floating point
         is 36.699999999999996, and that is what would be printed. */
      [kind]: Math.max(0, Math.round((prev[kind] + delta) * 10) / 10),
    }));

  /** Writes the day down: the mood, the note, and whatever was measured.
   *
   *  Each reading is its own row in `health_readings` rather than one "journal
   *  entry" record, because that is the table the caregiver's charts and stat
   *  cards already read — a journal that stored its numbers somewhere else
   *  would be a second, quieter source of truth for the same blood pressure.
   *
   *  Sent together, and a failure anywhere is reported rather than swallowed.
   *  This is the one screen where a silent failure is worst: the person has
   *  just told the app how they feel, and being lied to with a tick is worse
   *  than being asked to try again. */
  const save = async () => {
    if (!patientId) {
      /* Design preview with no session. The confetti still fires so the flow
         can be walked through, but nothing pretends to have been stored. */
      setSaved(true);
      setBurst((n) => n + 1);
      return;
    }

    setSaving(true);
    setSaveError(null);

    const reading = (kind: string, value: number, secondary?: number) => {
      const fd = new FormData();
      fd.set("patient_id", patientId);
      fd.set("kind", kind);
      fd.set("value", String(value));
      if (secondary !== undefined) fd.set("value_secondary", String(secondary));
      return logHealthReading({ error: null }, fd);
    };

    const jobs: Promise<{ error: string | null }>[] = [];

    if (mood) {
      const fd = new FormData();
      fd.set("patient_id", patientId);
      fd.set("mood", mood);
      if (note.trim()) fd.set("note", note.trim());
      jobs.push(logMood({ error: null }, fd));
    }

    for (const kind of metrics) {
      if (kind === "bp") {
        const sys = Number(bp.sys);
        const dia = Number(bp.dia);
        /* Both or neither — a systolic on its own is stored as a bare number
           that the activity feed then prints as a whole blood pressure. */
        if (Number.isFinite(sys) && Number.isFinite(dia) && sys > 0 && dia > 0) {
          jobs.push(reading("blood_pressure", sys, dia));
        }
        continue;
      }
      const value = values[kind];
      if (!Number.isFinite(value)) continue;
      jobs.push(reading(READING_KIND[kind], value));
    }

    const results = await Promise.all(jobs);
    setSaving(false);

    const failed = results.find((r) => r.error);
    if (failed?.error) {
      setSaveError(failed.error);
      return;
    }

    setSaved(true);
    setBurst((n) => n + 1);
  };

  return (
    /* Fixed frame. The page ends where the bottom bar begins — `--bottom-nav`
       carries that height — so nothing here can ever slide under it. */
    <div className="flex h-[calc(100dvh-var(--bottom-nav))] flex-col overflow-hidden px-4 pb-3 pt-4 sm:px-6">
      {/* ── Header ───────────────────────────────────────────────────────────
          The app's own header: a full-bleed colour field with the deep curve
          along its bottom, running back up behind the page's padding. Plum
          here — every route owns a hue, and this is the only one not yet spoken
          for. The negative margins cancel the page's own padding; keep the pair
          in step if that padding ever changes.

          The connection badge is gone. A status light earns its corner when it
          can be off, and this one never was. */}
      <header
        className="relative -mx-4 -mt-4 mb-4 shrink-0 overflow-hidden rounded-b-[28px] px-4 pb-5 pt-4 sm:-mx-6 sm:px-6"
        style={{ backgroundColor: "#6f5a7d" }}
      >
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

        <div className="relative flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/20 text-[18px] font-extrabold text-white ring-1 ring-white/30">
            {initial ?? PATIENT.initial}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[22px] font-extrabold tracking-tight text-white">
              Jurnal Sehat
            </h1>
            <p className="truncate text-[14px] text-white/70">{patientName ?? PATIENT.greeting}</p>
          </div>
        </div>
      </header>

      {/* ── Calendar trigger ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setCalendarOpen(true)}
        /* No top margin: the header already carries the gap below its curve. */
        className="flex shrink-0 items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 text-left outline-none ring-2 ring-karsa-line transition-colors duration-200 hover:bg-karsa-soft/60 focus-visible:ring-4 focus-visible:ring-karsa/40"
      >
        <span className="inline-flex items-center gap-2.5 text-[16px] font-extrabold text-neutral-900">
          <CalendarDays size={20} strokeWidth={2.6} className="text-karsa-dark" aria-hidden />
          BUKA KALENDER SEHAT
        </span>
        <span className="flex shrink-0 items-center gap-2 text-[13px] font-bold text-neutral-500">
          {date} {MONTH_LABEL.split(" ")[0]}
          <ChevronDown size={20} strokeWidth={3} aria-hidden />
        </span>
      </button>

      {saved ? (
        /* Today is already written. The wizard is not re-opened by default:
           the question it asks — "hari ini kamu merasa apa?" — has an answer on
           file, and asking again as if it did not is how an app makes somebody
           doubt whether the first one saved.

           It is a screen, not a lock. `Catat lagi` is right there, because a
           mood is a reading taken at a moment: somebody who felt awful this
           morning and better tonight has two true things to record, and
           `mood_entries` is insert-only precisely so both survive. */
        <div className="mt-4 flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center">
          <span
            aria-hidden
            className="grid h-24 w-24 place-items-center rounded-full bg-act-50 ring-2 ring-act-edge"
          >
            <Check size={52} strokeWidth={3} className="text-act-600" />
          </span>

          <h2 className="mt-5 text-[24px] font-extrabold tracking-tight text-neutral-900">
            Kamu sudah mengisi untuk hari ini!
          </h2>
          <p className="mx-auto mt-2 max-w-[30ch] text-[15.5px] leading-6 text-neutral-500">
            Catatanmu sudah tersimpan dan bisa dilihat pendampingmu. Sampai
            besok ya.
          </p>

          <div className="mt-7 flex w-full max-w-sm flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setCalendarOpen(true)}
              className="h-14 w-full rounded-2xl bg-karsa text-[16px] font-extrabold text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-4 focus-visible:ring-karsa focus-visible:ring-offset-2"
            >
              Lihat kalender sehat
            </button>
            <button
              type="button"
              onClick={() => {
                setSaved(false);
                setStep(1);
                setMood(null);
                setNote("");
                setRecorded(null);
                setSaveError(null);
              }}
              className="h-14 w-full rounded-2xl bg-white text-[15.5px] font-extrabold text-neutral-700 outline-none ring-2 ring-karsa-line transition-colors duration-200 hover:bg-karsa-soft/60 focus-visible:ring-4 focus-visible:ring-karsa/40"
            >
              Catat lagi
            </button>
          </div>
        </div>
      ) : (
        <>

        {/* ── Progress ─────────────────────────────────────────────────────── */}
        <div className="mt-4 shrink-0">
          <p className="mb-2 text-[14px] font-bold text-neutral-600">
            Langkah {step} dari {STEPS}
          </p>
          <div
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={STEPS}
            aria-label={`Langkah ${step} dari ${STEPS}`}
            className="h-4 overflow-hidden rounded-full bg-karsa/15"
          >
            <div
              style={{ width: `${(step / STEPS) * 100}%` }}
              className="h-full rounded-full bg-karsa transition-[width] duration-500 ease-out motion-reduce:transition-none"
            />
          </div>
        </div>

        {/* ── Step ─────────────────────────────────────────────────────────── */}
        {/* Padding, then the same amount back off as margin: the box keeps its
            place and gains 4px of clip room on every side. Without it this
            scroller — and `contain: paint` with it — cuts at exactly the line the
            cards' `ring-2` paints on, which is why every card lost its border and
            the heading lost its top. */}
        {/* `overflow-x-clip`, not `hidden`. The step slides in from `x: 24`, and a
            transform that ends past the right edge counts toward scrollable
            overflow — so a horizontal scrollbar flashed for the length of every
            transition. `clip` refuses to scroll on that axis instead of offering
            to, and unlike `hidden` it leaves the vertical axis alone rather than
            turning it into a second scroll container.

            It clips at the padding box, so the 4px below still shelters the
            cards' `ring-2` — the reason that padding is here at all. */}
        <div className="-mx-1 -my-1 mt-4 min-h-0 flex-1 overflow-y-auto overflow-x-clip overscroll-contain p-1 [contain:paint]">
          {/* Keyed remount, not `AnimatePresence mode="wait"`: waiting for the old
              step to leave puts a delay on every Lanjut for no gain. */}
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="flex min-h-full flex-col"
          >
            {step === 1 && <MoodStep mood={mood} onPick={setMood} name={patientName} />}

            {step === 2 && (
              <VoiceStep
                recording={recording}
                recorded={recorded}
                onToggle={() => {
                  if (recording) {
                    setRecording(false);
                    setRecorded(23);
                  } else {
                    setRecording(true);
                  }
                }}
                mode={noteMode}
                onMode={setNoteMode}
                text={note}
                onText={setNote}
              />
            )}

            {step === 3 && (
              <MetricsStep
                active={metrics}
                values={values}
                bp={bp}
                onBp={setBp}
                onStep={stepMetric}
                remaining={remaining}
                onOpenAdd={() => setAddOpen(true)}
              />
            )}
          </motion.div>
        </div>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <div className="mt-3 flex shrink-0 gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-4 text-[16px] font-extrabold text-neutral-700 outline-none ring-2 ring-karsa-line transition-colors duration-200 hover:bg-karsa-soft/60 focus-visible:ring-4 focus-visible:ring-karsa/40"
            >
              <ArrowLeft size={20} strokeWidth={3} aria-hidden />
              Kembali
            </button>
          )}

          {step < STEPS && (
            /* Same width as Kembali. Weighting the primary wider made the pair
               look misaligned rather than emphasised; the colour already says
               which one is the way forward. */
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && mood === null}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-karsa py-4 text-[16px] font-extrabold text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-4 focus-visible:ring-karsa focus-visible:ring-offset-2 disabled:bg-neutral-300"
            >
              Lanjut
              <ArrowRight size={20} strokeWidth={3} aria-hidden />
            </button>
          )}

          {/* The last step's action is not a sibling of Kembali in the way Lanjut
              was — it is the end of the whole wizard, and it takes the room its
              label needs. */}
          {step === STEPS &&
            (saved ? (
              <p
                role="status"
                className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-act-50 py-4 text-[16px] font-extrabold text-act-600 ring-2 ring-act-edge"
              >
                <Check size={22} strokeWidth={3} aria-hidden />
                Tersimpan!
              </p>
            ) : (
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-karsa px-3 py-4 text-center text-[15.5px] font-extrabold leading-tight text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-4 focus-visible:ring-karsa focus-visible:ring-offset-2 disabled:bg-neutral-300"
              >
                <Save size={22} strokeWidth={2.6} className="shrink-0" aria-hidden />
                {saving ? "MENYIMPAN…" : "SIMPAN JURNAL SEHAT"}
              </button>
            ))}
        </div>

        </>
      )}


      {saveError && (
        <p
          role="alert"
          className="mt-2 shrink-0 rounded-2xl bg-rose-50 px-4 py-3 text-[14px] font-bold leading-5 text-rose-800 ring-2 ring-rose-200"
        >
          {saveError}
        </p>
      )}

      <JournalHistoryModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selected={date}
        onSelect={setDate}
      />

      {/* Rendered here, at the page root, and not inside the step that opens it.
          `position: fixed` is relative to the viewport only until an ancestor
          has a transform or paint containment — and the step has both: framer's
          slide-in sets a transform, and the scroller carries `contain: paint`.
          Inside them the sheet was being positioned against the step box, which
          is why it surfaced halfway up the page instead of over it. */}
      <AddMetricSheet
        open={addOpen}
        options={remaining}
        onClose={() => setAddOpen(false)}
        onPick={(kind) => {
          setMetrics((prev) => [...prev, kind]);
          setAddOpen(false);
        }}
      />

      <Confetti fire={burst} />
    </div>
  );
}

/* ── Step 1 ───────────────────────────────────────────────────────────────── */

function MoodStep({
  mood,
  onPick,
  name,
}: {
  mood: MoodKey | null;
  onPick: (m: MoodKey) => void;
  name?: string;
}) {
  return (
    <>
      <h2 className="shrink-0 text-[22px] font-extrabold tracking-tight text-neutral-900">
        {name ? `Hari ini ${name} merasa apa?` : "Hari ini kamu merasa apa?"}
      </h2>

      {/* `MoodFace`, the same drawing the caregiver reads on their side — not
          emoji. Two reasons, and the second is the one that matters: emoji
          render as a different typeface at a different weight on every
          platform (several of these arrived flat and grey on Windows), and
          more importantly the caregiver's dashboard draws these five faces, so
          a patient tapping a yellow emoji here would have their answer shown
          to their family as a different picture with a different name.

          Two columns, and the fifth spans the pair so the grid has no hole in
          it. Large targets throughout — this is a hand that does not aim well. */}
      <div className="mt-3 grid flex-1 grid-cols-2 gap-3">
        {MOODS.map((m, i) => {
          const on = mood === m.key;
          const last = i === MOODS.length - 1;
          const odd = MOODS.length % 2 === 1;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => onPick(m.key)}
              aria-pressed={on}
              className={`flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-3xl outline-none ring-2 transition-colors duration-200 focus-visible:ring-4 focus-visible:ring-karsa ${
                last && odd ? "col-span-2" : ""
              } ${
                on
                  ? "bg-karsa-soft ring-karsa"
                  : "bg-white ring-karsa-line hover:bg-karsa-soft/50"
              }`}
            >
              <MoodFace mood={m.key} className="h-14 w-14" />
              <span
                className={`text-[17px] font-extrabold ${on ? "text-karsa-dark" : "text-neutral-700"}`}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ── Step 2 ───────────────────────────────────────────────────────────────── */

function VoiceStep({
  recording,
  recorded,
  onToggle,
  mode,
  onMode,
  text,
  onText,
}: {
  recording: boolean;
  recorded: number | null;
  onToggle: () => void;
  mode: NoteMode;
  onMode: (next: NoteMode) => void;
  text: string;
  onText: (next: string) => void;
}) {
  const reduce = useReducedMotion();

  const tab = (on: boolean) =>
    `flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-[15.5px] font-extrabold outline-none transition-colors duration-200 focus-visible:ring-4 focus-visible:ring-karsa/40 ${
      on ? "bg-karsa text-white" : "bg-white text-neutral-600 ring-2 ring-karsa-line hover:bg-karsa-soft/60"
    }`;

  return (
    <>
      <h2 className="shrink-0 text-[22px] font-extrabold tracking-tight text-neutral-900">
        Mau cerita sedikit?
      </h2>
      <p className="mt-1 shrink-0 text-[15px] text-neutral-500">
        Boleh dilewati kalau sedang tidak ingin bercerita.
      </p>

      {/* Speaking is not always the easy option — a sore throat, a quiet room, a
          person who simply prefers writing. Two ways in, both the same size. */}
      <div className="mt-3 flex shrink-0 gap-2.5">
        <button type="button" onClick={() => onMode("voice")} aria-pressed={mode === "voice"} className={tab(mode === "voice")}>
          <Mic size={19} strokeWidth={2.6} aria-hidden />
          Bicara
        </button>
        <button type="button" onClick={() => onMode("text")} aria-pressed={mode === "text"} className={tab(mode === "text")}>
          <PenLine size={19} strokeWidth={2.6} aria-hidden />
          Tulis
        </button>
      </div>

      {mode === "voice" ? (
        <div className="mt-3 flex flex-1 flex-col items-center justify-center rounded-3xl bg-white p-6 ring-2 ring-karsa-line">
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={recording}
            aria-label={recording ? "Berhenti merekam" : "Tekan dan bicara"}
            className={`relative grid h-[136px] w-[136px] place-items-center rounded-full outline-none transition-colors duration-200 focus-visible:ring-4 focus-visible:ring-karsa focus-visible:ring-offset-4 ${
              recording ? "bg-rose-600" : "bg-karsa hover:bg-karsa-dark"
            }`}
          >
            {recording && !reduce && (
              <motion.span
                aria-hidden
                animate={{ scale: [1, 1.35], opacity: [0.55, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-rose-500"
              />
            )}
            <Mic size={60} strokeWidth={2.2} className="relative text-white" aria-hidden />
          </button>

          <p className="mt-5 text-center text-[19px] font-extrabold text-neutral-900">
            {recording ? "🔴 SEDANG MEREKAM…" : "🎙️ TEKAN & BICARA"}
          </p>

          {recorded !== null && !recording && (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-act-50 px-4 py-2 text-[14px] font-bold text-act-600 ring-1 ring-act-edge">
              <Check size={15} strokeWidth={3} aria-hidden />
              Tersimpan · {mmss(recorded)}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-3 flex flex-1 flex-col rounded-3xl bg-white p-4 ring-2 ring-karsa-line">
          <label htmlFor="journal-note" className="sr-only">
            Tulis cerita hari ini
          </label>
          <textarea
            id="journal-note"
            value={text}
            onChange={(e) => onText(e.target.value)}
            placeholder="Tulis di sini… misalnya: hari ini enak, sempat jalan pagi."
            className="min-h-[160px] w-full flex-1 resize-none rounded-2xl bg-karsa-canvas p-4 text-[18px] leading-7 text-neutral-900 outline-none ring-2 ring-karsa-line placeholder:text-neutral-400 focus-visible:ring-4 focus-visible:ring-karsa"
          />
          {text.trim() && (
            <p className="mt-2.5 inline-flex w-fit items-center gap-2 rounded-full bg-act-50 px-4 py-2 text-[14px] font-bold text-act-600 ring-1 ring-act-edge">
              <Check size={15} strokeWidth={3} aria-hidden />
              {text.trim().length} huruf tertulis
            </p>
          )}
        </div>
      )}
    </>
  );
}

/* ── Step 3 ───────────────────────────────────────────────────────────────── */

function MetricsStep({
  active,
  values,
  bp,
  onBp,
  onStep,
  remaining,
  onOpenAdd,
}: {
  active: MetricKind[];
  values: Record<string, number>;
  bp: { sys: string; dia: string };
  onBp: (next: { sys: string; dia: string }) => void;
  onStep: (kind: MetricKind, delta: number) => void;
  remaining: MetricKind[];
  onOpenAdd: () => void;
}) {
  return (
    <>
      <h2 className="shrink-0 text-[21px] font-extrabold leading-7 tracking-tight text-neutral-900">
        Catat Metrik Kesehatan Hari Ini
      </h2>
      <p className="mt-1 shrink-0 text-[14.5px] leading-5 text-neutral-500">
        Isi jika ada pengecekan hari ini (Opsional)
      </p>

      {/* `auto-rows-fr` is what makes the add button the same size as the cards
          without anyone measuring anything: every row in the grid takes the
          height of the tallest, and every row is the full width. Hard-coding a
          height would drift the moment a card gains a line. */}
      <div className="mt-3 grid auto-rows-fr gap-3 pb-1">
        {active.map((kind) =>
          kind === "bp" ? (
            <BloodPressureCard key={kind} bp={bp} onChange={onBp} />
          ) : (
            <StepperCard
              key={kind}
              spec={METRICS[kind]}
              value={values[kind]}
              onStep={(delta) => onStep(kind, delta)}
            />
          ),
        )}

        {remaining.length > 0 && (
          <button
            type="button"
            onClick={onOpenAdd}
            className="flex flex-col items-center justify-center gap-1.5 rounded-3xl border-[3px] border-dashed border-neutral-300 bg-neutral-50/60 p-5 text-center outline-none transition-colors duration-200 hover:border-karsa hover:bg-karsa-soft/40 focus-visible:ring-4 focus-visible:ring-karsa/40"
          >
            <span className="text-[17px] font-extrabold text-neutral-700">
              ➕ TAMBAH METRIK LAINNYA
            </span>
            <span className="text-[13px] font-medium text-neutral-500">
              ({remaining.map((k) => METRICS[k].label).join(", ")})
            </span>
          </button>
        )}
      </div>
    </>
  );
}

/** Two typed numbers, because a blood pressure reading is copied off a machine
 *  rather than nudged to — stepping from 110 to 138 one tap at a time is not a
 *  kindness. */
function BloodPressureCard({
  bp,
  onChange,
}: {
  bp: { sys: string; dia: string };
  onChange: (next: { sys: string; dia: string }) => void;
}) {
  const field =
    "w-full rounded-2xl bg-karsa-canvas py-3 text-center text-[34px] font-extrabold tabular-nums text-neutral-900 outline-none ring-2 ring-karsa-line placeholder:text-neutral-300 focus-visible:ring-4 focus-visible:ring-karsa";

  return (
    <section className="rounded-3xl bg-white p-5 ring-2 ring-karsa-line">
      <div className="flex items-center gap-2">
        <StatArt
          kind={METRICS.bp.monitor}
          tone={MONITOR_TONE[METRICS.bp.monitor]}
          className="h-7 w-7"
        />
        <h3 className="flex-1 text-[17px] font-extrabold text-neutral-900">
          {METRICS.bp.label}
        </h3>
        <span className="text-[14px] font-bold text-neutral-500">{METRICS.bp.unit}</span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-[12.5px] font-bold uppercase tracking-wide text-neutral-400">
            Sistolik
          </span>
          <input
            inputMode="numeric"
            value={bp.sys}
            onChange={(e) => onChange({ ...bp, sys: e.target.value.replace(/\D/g, "").slice(0, 3) })}
            placeholder="120"
            aria-label="Tekanan darah sistolik"
            className={field}
          />
        </label>

        <span aria-hidden className="mt-5 text-[28px] font-extrabold text-neutral-300">
          /
        </span>

        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-[12.5px] font-bold uppercase tracking-wide text-neutral-400">
            Diastolik
          </span>
          <input
            inputMode="numeric"
            value={bp.dia}
            onChange={(e) => onChange({ ...bp, dia: e.target.value.replace(/\D/g, "").slice(0, 3) })}
            placeholder="80"
            aria-label="Tekanan darah diastolik"
            className={field}
          />
        </label>
      </div>
    </section>
  );
}

/** One number, moved by two very large buttons. */
function StepperCard({
  spec,
  value,
  onStep,
}: {
  spec: MetricSpec;
  value: number;
  onStep: (delta: number) => void;
}) {
  const key =
    "grid h-[60px] w-[60px] shrink-0 place-items-center rounded-2xl bg-karsa-soft text-[30px] font-extrabold leading-none text-karsa-dark outline-none transition-colors duration-200 hover:bg-karsa hover:text-white focus-visible:ring-4 focus-visible:ring-karsa/40 active:scale-95";

  return (
    <section className="rounded-3xl bg-white p-5 ring-2 ring-karsa-line">
      <div className="flex items-center gap-2">
        <StatArt kind={spec.monitor} tone={MONITOR_TONE[spec.monitor]} className="h-7 w-7" />
        <h3 className="flex-1 text-[17px] font-extrabold text-neutral-900">{spec.label}</h3>
        <span className="text-[14px] font-bold text-neutral-500">{spec.unit}</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onStep(-(spec.step ?? 1))}
          aria-label={`Kurangi ${spec.label}`}
          className={key}
        >
          −
        </button>

        <p className="min-w-0 flex-1 text-center text-[34px] font-extrabold tabular-nums leading-none text-neutral-900">
          {value.toFixed(spec.decimals ?? 0)}
        </p>

        <button
          type="button"
          onClick={() => onStep(spec.step ?? 1)}
          aria-label={`Tambah ${spec.label}`}
          className={key}
        >
          +
        </button>
      </div>
    </section>
  );
}

function AddMetricSheet({
  open,
  options,
  onClose,
  onPick,
}: {
  open: boolean;
  options: MetricKind[];
  onClose: () => void;
  onPick: (kind: MetricKind) => void;
}) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-neutral-950/50 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Tambah metrik"
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={
              reduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 40 }
            }
            className="fixed inset-x-0 bottom-0 z-[61] rounded-t-[28px] bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_48px_-12px_rgba(24,32,24,0.5)] sm:mx-auto sm:max-w-lg"
          >
            <div className="mb-3 flex justify-center">
              <span aria-hidden className="h-1.5 w-12 rounded-full bg-neutral-300" />
            </div>

            <h3 className="text-[19px] font-extrabold tracking-tight text-neutral-900">
              Tambah metrik
            </h3>

            <div className="mt-3 space-y-2.5">
              {options.map((kind) => {
                const spec = METRICS[kind];
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => onPick(kind)}
                    className="flex w-full items-center gap-4 rounded-2xl bg-karsa-canvas p-4 text-left outline-none ring-2 ring-karsa-line transition-colors duration-200 hover:bg-karsa-soft focus-visible:ring-4 focus-visible:ring-karsa/40"
                  >
                    <StatArt
                      kind={spec.monitor}
                      tone={MONITOR_TONE[spec.monitor]}
                      className="h-9 w-9"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[17px] font-extrabold text-neutral-900">
                        {spec.label}
                      </span>
                      <span className="block text-[13.5px] text-neutral-500">{spec.unit}</span>
                    </span>
                    <Plus size={24} strokeWidth={3} className="shrink-0 text-karsa" aria-hidden />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full rounded-2xl bg-neutral-100 py-4 text-[16px] font-extrabold text-neutral-700 outline-none transition-colors hover:bg-neutral-200 focus-visible:ring-4 focus-visible:ring-karsa/40"
            >
              Batal
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

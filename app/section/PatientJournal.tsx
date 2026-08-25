"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Mic,
  MicOff,
  PenLine,
  Plus,
  Save,
} from "lucide-react";
import JournalHistoryModal from "../components/JournalHistoryModal";
import Confetti from "../components/Confetti";
import MoodFace from "../components/MoodFace";
import StatArt from "../components/StatArt";
import { useSpeechToText } from "../components/useSpeechToText";
import { createClient as createSupabaseClient } from "../lib/supabase/client";
import { logHealthReading, logMood } from "../lib/care/actions";
import type { JournalMonth } from "../lib/care/queries";


const EMPTY_MONTH: JournalMonth = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  label: "",
  days: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
  startOffset: (new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() + 6) % 7,
  today: new Date().getDate(),
  entries: {},
};
import {
  ADDABLE_METRICS,
  DEFAULT_METRICS,
  METRICS,
  MONITOR_TONE,
  MOODS,
  mmss,
  type MetricKind,
  type MetricSpec,
  type MoodKey,
} from "../data/journal";
import { PATIENT } from "../data/patient";



const STEPS = 3;


const READING_KIND: Record<MetricKind, string> = {
  bp: "blood_pressure",
  glucose: "blood_sugar",
  weight: "weight",
  temp: "temperature",
  hr: "heart_rate",
};


type NoteMode = "voice" | "text";

export default function PatientJournalPage({
  patientId,
  patientName,
  initial,
  filledToday = false,
  month,
}: {

  patientId?: string;
  patientName?: string;
  initial?: string;

  filledToday?: boolean;

  month: JournalMonth;
} = { month: EMPTY_MONTH }) {
  const reduce = useReducedMotion();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState<MoodKey | null>(null);

  const [noteMode, setNoteMode] = useState<NoteMode>("voice");
  const [note, setNote] = useState("");
  const [clip, setClip] = useState<{ path: string; seconds: number; url: string } | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [date, setDate] = useState(month.today ?? 1);
  const [saved, setSaved] = useState(filledToday);
  const [burst, setBurst] = useState(0);


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


  const remaining = ADDABLE_METRICS.filter((k) => !metrics.includes(k));

  const stepMetric = (kind: MetricKind, delta: number) =>
    setValues((prev) => ({
      ...prev,

      [kind]: Math.max(0, Math.round((prev[kind] + delta) * 10) / 10),
    }));


  const save = async () => {
    if (!patientId) {

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
      if (clip) {
        fd.set("voice_path", clip.path);
        fd.set("voice_seconds", String(clip.seconds));
      }
      jobs.push(logMood({ error: null }, fd));
    }

    for (const kind of metrics) {
      if (kind === "bp") {
        const sys = Number(bp.sys);
        const dia = Number(bp.dia);

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

    <div className="flex h-[calc(100dvh-var(--bottom-nav))] flex-col overflow-hidden px-4 pb-3 pt-4 sm:px-6">

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


      <button
        type="button"
        onClick={() => setCalendarOpen(true)}

        className="flex shrink-0 items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 text-left outline-none ring-2 ring-karsa-line transition-colors duration-200 hover:bg-karsa-soft/60 focus-visible:ring-4 focus-visible:ring-karsa/40"
      >
        <span className="inline-flex items-center gap-2.5 text-[16px] font-extrabold text-neutral-900">
          <CalendarDays size={20} strokeWidth={2.6} className="text-karsa-dark" aria-hidden />
          BUKA KALENDER SEHAT
        </span>

        <ChevronDown size={20} strokeWidth={3} className="shrink-0 text-neutral-500" aria-hidden />
      </button>

      {saved ? (

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
                setClip(null);
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




        <div className="-mx-1 -my-1 mt-4 min-h-0 flex-1 overflow-y-auto overflow-x-clip overscroll-contain p-1 [contain:paint]">

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
                patientId={patientId}
                onClip={setClip}
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
        month={month}
        patientId={patientId}
      />


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



function VoiceStep({
  mode,
  onMode,
  text,
  onText,
  patientId,
  onClip,
}: {
  mode: NoteMode;
  onMode: (next: NoteMode) => void;
  text: string;
  onText: (next: string) => void;
  patientId?: string;
  onClip: (clip: { path: string; seconds: number; url: string } | null) => void;
}) {
  const reduce = useReducedMotion();
  const [uploading, setUploading] = useState(false);
  const [clipUrl, setClipUrl] = useState<string | null>(null);

  const speech = useSpeechToText(
    (chunk) => {
      const clean = chunk.trim();
      if (!clean) return;
      onText(text ? `${text} ${clean}`.replace(/\s+/g, " ") : clean);
    },
    patientId
      ? async ({ blob, seconds }) => {
          setUploading(true);
          const local = URL.createObjectURL(blob);
          setClipUrl(local);

          const supabase = createSupabaseClient();
          const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
          const path = `${patientId}/${crypto.randomUUID()}.${ext}`;

          const { error } = await supabase.storage
            .from("voices")
            .upload(path, blob, { contentType: blob.type || "audio/webm", upsert: false });

          setUploading(false);
          if (error) {
            onClip(null);
            return;
          }
          onClip({ path, seconds, url: local });
        }
      : undefined,
  );

  useEffect(() => {
    if (mode !== "voice" && speech.listening) speech.stop();
  }, [mode, speech]);

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
        <div className="mt-3 flex flex-1 flex-col items-center rounded-3xl bg-white p-6 ring-2 ring-karsa-line">
          {!speech.supported ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <span aria-hidden className="grid h-20 w-20 place-items-center rounded-full bg-karsa-canvas text-neutral-400">
                <MicOff size={40} strokeWidth={2.2} />
              </span>
              <p className="mt-4 max-w-[30ch] text-[16px] leading-6 text-neutral-600">
                Browser ini belum bisa mengubah suara jadi teks.
              </p>
              <button
                type="button"
                onClick={() => onMode("text")}
                className="mt-5 h-13 rounded-2xl bg-karsa px-6 py-3.5 text-[15.5px] font-extrabold text-white outline-none transition-colors hover:bg-karsa-dark focus-visible:ring-4 focus-visible:ring-karsa/40"
              >
                Tulis saja
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => (speech.listening ? speech.stop() : speech.start())}
                aria-pressed={speech.listening}
                aria-label={speech.listening ? "Berhenti bicara" : "Tekan dan bicara"}
                className={`relative grid h-[120px] w-[120px] shrink-0 place-items-center rounded-full outline-none transition-colors duration-200 focus-visible:ring-4 focus-visible:ring-karsa focus-visible:ring-offset-4 ${
                  speech.listening ? "bg-rose-600" : "bg-karsa hover:bg-karsa-dark"
                }`}
              >
                {speech.listening && !reduce && (
                  <motion.span
                    aria-hidden
                    animate={{ scale: [1, 1.35], opacity: [0.55, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-rose-500"
                  />
                )}
                <Mic size={54} strokeWidth={2.2} className="relative text-white" aria-hidden />
              </button>

              <p className="mt-4 shrink-0 text-center text-[18px] font-extrabold text-neutral-900">
                {speech.listening ? `SEDANG MENDENGARKAN · ${mmss(speech.seconds)}` : "TEKAN & BICARA"}
              </p>

              {speech.error && (
                <p role="alert" className="mt-2 shrink-0 rounded-2xl bg-rose-50 px-4 py-2.5 text-center text-[13.5px] font-bold leading-5 text-rose-800 ring-1 ring-rose-200">
                  {speech.error}
                </p>
              )}

              <div className="mt-4 min-h-0 w-full flex-1 overflow-y-auto rounded-2xl bg-karsa-canvas p-4">
                {text || speech.interim ? (
                  <p className="text-[17px] leading-7 text-neutral-900">
                    {text}
                    {speech.interim && (
                      <span className="text-neutral-400">{text ? " " : ""}{speech.interim}</span>
                    )}
                  </p>
                ) : (
                  <p className="text-[15px] leading-6 text-neutral-400">
                    Ceritanya akan muncul di sini sambil kamu bicara.
                  </p>
                )}
              </div>

              {clipUrl && !speech.listening && (
                <div className="mt-3 w-full shrink-0">
                  <audio src={clipUrl} controls className="h-11 w-full" />
                  {uploading && (
                    <p className="mt-1.5 text-[12.5px] text-neutral-500">Menyimpan rekaman…</p>
                  )}
                </div>
              )}

              {(text.trim() || clipUrl) && !speech.listening && (
                <div className="mt-3 flex w-full shrink-0 items-center gap-2.5">
                  {text.trim() && (
                    <p className="inline-flex items-center gap-2 rounded-full bg-act-50 px-4 py-2 text-[14px] font-bold text-act-600 ring-1 ring-act-edge">
                      <Check size={15} strokeWidth={3} aria-hidden />
                      {text.trim().length} huruf
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onText("");
                      setClipUrl(null);
                      onClip(null);
                    }}
                    className="ml-auto rounded-xl px-3 py-2 text-[14px] font-bold text-neutral-500 outline-none transition-colors hover:bg-karsa-canvas hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-karsa/40"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </>
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

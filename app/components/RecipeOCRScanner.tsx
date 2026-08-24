"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Clock,
  Image as ImageIcon,
  Lightbulb,
  Maximize2,
  Pencil,
  Pill,
  Plus,
  ScanLine,
  Trash2,
  TriangleAlert,
  X,
  Zap,
  ZapOff,
} from "lucide-react";
import { SCAN_TIPS, type Medicine } from "../data/prescriptions";
import { useCameraOcr, type OcrResult } from "./useCameraOcr";
import { lockScroll } from "../lib/scrollLock";

type Stage = "camera" | "review";

/** Bright emerald, not the app's sage: this is the one surface in Karsa that is
 *  black, and the sage green disappears against it. Everything outside the
 *  viewport goes back to the app's own palette. */
const BEAM = "#059669";

/** Open/closed only. Every piece of scanner state lives in the sheet below,
 *  which exists only while it is open — so "start at the camera again" is a
 *  fresh mount rather than an effect resetting six values, and reopening can
 *  never land on last week's review screen. */
export default function RecipeOCRScanner({
  open,
  onClose,
  onSave,
  from = "camera",
  initialFile,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (medicines: Medicine[], result: OcrResult | null) => void;
  from?: "camera" | "gallery";
  initialFile?: File | null;
}) {
  return (
    <AnimatePresence>
      {open && (
        <ScannerSheet
          onClose={onClose}
          onSave={onSave}
          initialStage="camera"
          initialFile={initialFile ?? null}
        />
      )}
    </AnimatePresence>
  );
}

function ScannerSheet({
  onClose,
  onSave,
  initialStage,
  initialFile,
}: {
  onClose: () => void;
  onSave: (medicines: Medicine[], result: OcrResult | null) => void;
  initialStage: Stage;
  initialFile: File | null;
}) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>(initialStage);
  const [reading, setReading] = useState(false);
  const [flash, setFlash] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [nothingFound, setNothingFound] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ocr = useCameraOcr();

  useEffect(() => {
    sheetRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    /* The page behind must not scroll under a full-height sheet. */
    const unlock = lockScroll();

    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [onClose]);

  const accept = (next: OcrResult | null) => {
    if (!next) return;
    setResult(next);
    setMedicines(
      next.medicines.map((m) => ({
        id: m.id,
        name: m.name,
        dose: m.dose,
        rule: m.rule,
        times: m.times,
        confident: m.confident,
      })),
    );
    setNothingFound(next.medicines.length === 0);
    setStage("review");
  };

  const startedRef = useRef(false);

  useEffect(() => {
    if (!initialFile || startedRef.current) return;
    startedRef.current = true;
    void fromFile(initialFile);
    /* `fromFile` is recreated every render but the guard above makes this run
       exactly once per mounted sheet. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  const capture = async () => {
    if (ocr.busy) return;
    setReading(true);
    try {
      accept(await ocr.capture());
    } finally {
      setReading(false);
    }
  };

  const fromFile = async (file: File | null) => {
    if (!file || ocr.busy) return;
    setReading(true);
    try {
      accept(await ocr.readBlob(file));
    } finally {
      setReading(false);
    }
  };

  const patch = (id: string, next: Partial<Medicine>) =>
    setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, ...next } : m)));

  const addManual = () =>
    setMedicines((prev) => {
      const id = `m-${Date.now()}`;
      setEditing(id);
      return [
        ...prev,
        { id, name: "Obat baru", dose: "", rule: "1x sehari", times: ["08:00"], confident: true },
      ];
    });

  return (
    <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-neutral-950/55 backdrop-blur-[2px]"
          />

          {/* ── Sheet ───────────────────────────────────────────────────────
              Capped below the viewport and column-flexed, so the shutter bar
              and the save button are always on screen and only the middle
              scrolls. A sheet that grows past the fold puts its own primary
              action out of reach. */}
          <motion.div
            key="sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Scan resep dokter"
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={
              reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 38, mass: 0.9 }
            }
            className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[94dvh] flex-col overflow-hidden rounded-t-3xl bg-[#FDFBF7] shadow-[0_-12px_44px_-16px_rgba(24,32,24,0.5)] outline-none sm:mx-auto sm:max-w-lg"
          >
            {/* Drag handle. Decorative — the scrim and the X are what close it,
                and a handle that looks draggable but isn't would be worse. */}
            <div className="flex shrink-0 justify-center pb-1 pt-2.5">
              <span aria-hidden className="h-1.5 w-10 rounded-full bg-slate-300" />
            </div>

            <Header
              stage={stage}
              flash={flash}
              onFlash={() => setFlash((v) => !v)}
              onClose={onClose}
              /* Coming from the gallery there is no viewfinder to go back to,
                 so the leading button closes instead of stranding the sheet on
                 a camera the caregiver never opened. */
              onBack={initialStage === "review" ? onClose : () => setStage("camera")}
              backLabel={initialStage === "review" ? "Batal" : "Kembali ke kamera"}
            />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [contain:paint]">
              {stage === "camera" ? (
                <CameraStage
                  reading={reading}
                  flash={flash}
                  reduce={Boolean(reduce)}
                  attach={ocr.attach}
                  cameraError={ocr.cameraError}
                  progress={ocr.progress}
                  onPickFile={() => fileRef.current?.click()}
                />
              ) : (
                <ReviewStage
                  nothingFound={nothingFound}
                  previewUrl={result?.previewUrl ?? null}
                  medicines={medicines}
                  editing={editing}
                  onEdit={setEditing}
                  onPatch={patch}
                  onRemove={(id) =>
                    setMedicines((prev) => prev.filter((m) => m.id !== id))
                  }
                  onAdd={addManual}
                  onViewPhoto={() => setPhotoOpen(true)}
                />
              )}
            </div>

            {/* ── Action bar ───────────────────────────────────────────── */}
            <div className="shrink-0 border-t border-slate-200/80 bg-white/80 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
              {stage === "camera" ? (
                <ShutterBar
                  reading={reading || ocr.busy}
                  onCapture={capture}
                  onTips={() => setTipsOpen(true)}
                  onGallery={() => fileRef.current?.click()}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onSave(medicines, result)}
                  disabled={medicines.length === 0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-karsa py-3.5 text-[15px] font-bold text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa focus-visible:ring-offset-2"
                >
                  <Check size={18} strokeWidth={2.6} aria-hidden />
                  Simpan &amp; Pasang ke Jadwal Perawatan
                </button>
              )}
            </div>
          </motion.div>

          <TipsSheet open={tipsOpen} onClose={() => setTipsOpen(false)} />
          <PhotoViewer open={photoOpen} onClose={() => setPhotoOpen(false)} url={result?.previewUrl ?? null} />
    </>
  );
}

/* ── Header ───────────────────────────────────────────────────────────────── */

function Header({
  stage,
  flash,
  onFlash,
  onClose,
  onBack,
  backLabel,
}: {
  stage: Stage;
  flash: boolean;
  onFlash: () => void;
  onClose: () => void;
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-1">
      <button
        type="button"
        onClick={stage === "camera" ? onClose : onBack}
        aria-label={stage === "camera" ? "Batal" : backLabel}
        className="grid h-9 w-9 place-items-center rounded-full text-slate-500 outline-none transition-colors duration-200 hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-karsa/40"
      >
        <X size={19} strokeWidth={2.4} />
      </button>

      <p className="font-nohemi text-[15.5px] font-bold tracking-tight text-slate-800">
        {stage === "camera" ? "Scan Resep Dokter" : "Periksa Hasil Scan"}
      </p>

      {stage === "camera" ? (
        <button
          type="button"
          onClick={onFlash}
          aria-pressed={flash}
          aria-label={flash ? "Matikan lampu kilat" : "Nyalakan lampu kilat"}
          className={`grid h-9 w-9 place-items-center rounded-full outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
            flash ? "bg-amber-100 text-amber-700" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {flash ? <Zap size={18} strokeWidth={2.4} /> : <ZapOff size={18} strokeWidth={2.2} />}
        </button>
      ) : (
        /* Keeps the title centred once the flash button is gone. */
        <span aria-hidden className="h-9 w-9" />
      )}
    </header>
  );
}

/* ── State 1: camera ──────────────────────────────────────────────────────── */

function CameraStage({
  reading,
  flash,
  reduce,
  attach,
  cameraError,
  progress,
  onPickFile,
}: {
  reading: boolean;
  flash: boolean;
  reduce: boolean;
  attach: (node: HTMLVideoElement | null) => void;
  cameraError: string | null;
  progress: number;
  onPickFile: () => void;
}) {
  return (
    <div className="px-5 pb-5">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-slate-900">
        {cameraError ? (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div>
              <p className="text-[15px] leading-6 text-white/80">{cameraError}</p>
              <button
                type="button"
                onClick={onPickFile}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14.5px] font-bold text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ImageIcon size={17} strokeWidth={2.3} aria-hidden />
                Pilih foto resep
              </button>
            </div>
          </div>
        ) : (
          <video
            ref={attach}
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div
          aria-hidden
          className={`absolute inset-0 transition-opacity duration-300 ${
            flash ? "opacity-100" : "opacity-0"
          } bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.22),transparent_60%)]`}
        />

        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[74%] w-[84%] -translate-x-1/2 -translate-y-1/2">
            <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-[3px] border-t-[3px]" style={{ borderColor: BEAM }} />
            <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-[3px] border-t-[3px]" style={{ borderColor: BEAM }} />
            <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-[3px] border-l-[3px]" style={{ borderColor: BEAM }} />
            <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-[3px] border-r-[3px]" style={{ borderColor: BEAM }} />

            {reading && !reduce && (
              <motion.span
                aria-hidden
                initial={{ top: "0%" }}
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-x-0 h-[3px]"
                style={{ backgroundColor: BEAM, boxShadow: `0 0 18px 4px ${BEAM}` }}
              />
            )}
          </div>
        </div>

        {reading && (
          <div className="absolute inset-x-0 bottom-0 bg-slate-950/75 px-5 py-4 text-center">
            <p className="text-[14.5px] font-bold text-white">
              Membaca resep… {progress > 0 ? `${progress}%` : ""}
            </p>
            <div className="mx-auto mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${Math.max(6, progress)}%`, backgroundColor: BEAM }}
              />
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-[13.5px] leading-5 text-slate-500">
        Letakkan resep di dalam bingkai, pastikan tulisannya terbaca jelas.
      </p>
    </div>
  );
}
function ShutterBar({
  reading,
  onCapture,
  onTips,
  onGallery,
}: {
  reading: boolean;
  onCapture: () => void;
  onTips: () => void;
  onGallery: () => void;
}) {
  const side =
    "flex w-[72px] shrink-0 flex-col items-center gap-1 rounded-2xl py-1.5 text-[11.5px] font-semibold text-slate-600 outline-none transition-colors duration-200 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-karsa/40";

  return (
    <div className="flex items-center justify-between">
      <button type="button" onClick={onGallery} className={side}>
        <ImageIcon size={20} strokeWidth={2.1} aria-hidden />
        File
      </button>

      <button
        type="button"
        onClick={onCapture}
        disabled={reading}
        aria-label="Ambil foto resep"
        className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full outline-none ring-4 ring-karsa/20 transition-transform duration-150 focus-visible:ring-4 focus-visible:ring-karsa active:scale-95 disabled:opacity-70"
        style={{ backgroundColor: BEAM }}
      >
        <span className="grid h-14 w-14 place-items-center rounded-full ring-[3px] ring-white/80">
          {reading ? (
            <span
              aria-hidden
              className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/40 border-t-white motion-reduce:animate-none"
            />
          ) : (
            <span aria-hidden className="h-9 w-9 rounded-full bg-white/90" />
          )}
        </span>
      </button>

      <button type="button" onClick={onTips} className={side}>
        <Lightbulb size={20} strokeWidth={2.1} aria-hidden />
        Tips
      </button>
    </div>
  );
}

/* ── State 2: review ──────────────────────────────────────────────────────── */

function ReviewStage({
  nothingFound,
  previewUrl,
  medicines,
  editing,
  onEdit,
  onPatch,
  onRemove,
  onAdd,
  onViewPhoto,
}: {
  nothingFound: boolean;
  previewUrl: string | null;
  medicines: Medicine[];
  editing: string | null;
  onEdit: (id: string | null) => void;
  onPatch: (id: string, next: Partial<Medicine>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onViewPhoto: () => void;
}) {
  return (
    <div className="space-y-4 px-5 pb-5">
      {nothingFound && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3.5 text-[13.5px] leading-5 text-amber-800 ring-1 ring-amber-200">
          Tidak ada obat yang terbaca dari foto ini. Coba foto ulang lebih dekat
          dan terang, atau tambahkan obatnya manual di bawah.
        </p>
      )}
      {/* Thumbnail. Small on purpose — the photo is evidence to check against,
          not the subject of this screen. */}
      <div className="flex items-center gap-3 rounded-2xl bg-white p-2.5 ring-1 ring-slate-200">
        <span
          aria-hidden
          className="relative grid h-14 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-900"
        >
          {previewUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="h-[62%] w-[62%] rounded-sm bg-slate-600/60" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold leading-5 text-slate-800">Foto resep</p>
          <p className="text-[12px] leading-4 text-slate-500">Baru saja dipindai</p>
        </div>
        <button
          type="button"
          onClick={onViewPhoto}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-semibold text-slate-700 outline-none transition-colors duration-200 hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-karsa/40"
        >
          <Maximize2 size={13} strokeWidth={2.4} aria-hidden />
          Lihat Foto Full
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 px-0.5">
        <h3 className="text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-slate-400">
          Obat terdeteksi
        </h3>
        <span className="text-[12px] font-semibold tabular-nums text-slate-500">
          {medicines.length} obat
        </span>
      </div>

      <ul className="space-y-2.5">
        <AnimatePresence initial={false}>
          {medicines.map((med) => (
            <motion.li
              key={med.id}
              layout={false}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <MedicineCard
                med={med}
                editing={editing === med.id}
                onEdit={() => onEdit(editing === med.id ? null : med.id)}
                onPatch={(next) => onPatch(med.id, next)}
                onRemove={() => onRemove(med.id)}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-3 text-[13.5px] font-semibold text-slate-600 outline-none transition-colors duration-200 hover:border-karsa hover:bg-karsa-soft/50 hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
      >
        <Plus size={16} strokeWidth={2.6} aria-hidden />
        Tambah Obat Manual
      </button>
    </div>
  );
}

function MedicineCard({
  med,
  editing,
  onEdit,
  onPatch,
  onRemove,
}: {
  med: Medicine;
  editing: boolean;
  onEdit: () => void;
  onPatch: (next: Partial<Medicine>) => void;
  onRemove: () => void;
}) {
  const field =
    "w-full rounded-lg bg-slate-50 px-2.5 py-2 text-[13.5px] text-slate-800 outline-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-karsa/40";

  return (
    <div className="rounded-2xl bg-white p-3.5 ring-1 ring-slate-200">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-karsa-soft text-karsa-dark">
          <Pill size={17} strokeWidth={2.2} aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={med.name}
                  onChange={(e) => onPatch({ name: e.target.value })}
                  aria-label="Nama obat"
                  className={field}
                />
                <input
                  value={med.dose}
                  onChange={(e) => onPatch({ dose: e.target.value })}
                  aria-label="Dosis"
                  placeholder="500 mg"
                  className={`${field} max-w-[96px]`}
                />
              </div>
              <input
                value={med.rule}
                onChange={(e) => onPatch({ rule: e.target.value })}
                aria-label="Aturan minum"
                className={field}
              />
              <input
                value={med.times.join(", ")}
                onChange={(e) =>
                  onPatch({
                    times: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                aria-label="Jam jadwal, pisahkan dengan koma"
                className={field}
              />
            </div>
          ) : (
            <>
              <p className="text-[14.5px] font-bold leading-5 text-slate-900">
                {med.name} {med.dose && <span className="text-slate-600">{med.dose}</span>}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-4 text-slate-500">{med.rule}</p>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {med.times.map((time) => (
                  <span
                    key={time}
                    className="inline-flex items-center gap-1 rounded-full bg-karsa-soft px-2 py-1 text-[11.5px] font-semibold tabular-nums text-karsa-dark"
                  >
                    <Clock size={11} strokeWidth={2.6} aria-hidden />
                    {time}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-pressed={editing}
            aria-label={editing ? `Selesai mengubah ${med.name}` : `Ubah ${med.name}`}
            className={`grid h-8 w-8 place-items-center rounded-lg outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
              editing
                ? "bg-karsa text-white hover:bg-karsa-dark"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {editing ? <Check size={15} strokeWidth={2.8} /> : <Pencil size={14} strokeWidth={2.4} />}
          </button>

          {editing && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Hapus ${med.name}`}
              className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 outline-none transition-colors duration-200 hover:bg-rose-100 focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              <Trash2 size={14} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>

      {/* The reader's own doubt, said out loud. A dose it guessed wrong is the
          one error this screen exists to catch. */}
      {med.confident === false && !editing && (
        <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[12px] font-medium leading-4 text-amber-800 ring-1 ring-amber-100">
          <TriangleAlert size={13} strokeWidth={2.4} className="mt-0.5 shrink-0" aria-hidden />
          Tulisan kurang jelas — mohon periksa dosisnya.
        </p>
      )}
    </div>
  );
}

/* ── Secondary sheets ─────────────────────────────────────────────────────── */

function TipsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[62] bg-neutral-950/40"
          />
          <motion.div
            role="dialog"
            aria-label="Tips memindai resep"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="fixed inset-x-0 bottom-0 z-[63] rounded-t-3xl bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 sm:mx-auto sm:max-w-lg"
          >
            <div className="mb-3 flex justify-center">
              <span aria-hidden className="h-1.5 w-10 rounded-full bg-slate-300" />
            </div>
            <h3 className="font-nohemi text-[16px] font-bold tracking-tight text-slate-800">
              Tips hasil scan yang baik
            </h3>
            <ul className="mt-3 space-y-2">
              {SCAN_TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2.5 text-[13.5px] leading-5 text-slate-600">
                  <Lightbulb size={15} strokeWidth={2.2} className="mt-0.5 shrink-0 text-amber-500" aria-hidden />
                  {tip}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-full bg-slate-100 py-3 text-[14px] font-bold text-slate-700 outline-none transition-colors hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              Mengerti
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PhotoViewer({
  open,
  onClose,
  url,
}: {
  open: boolean;
  onClose: () => void;
  url: string | null;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="Foto resep"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[64] flex items-center justify-center bg-neutral-950/90 p-6"
        >
          {url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={url}
              alt="Foto resep"
              className="max-h-full w-auto max-w-full rounded-xl object-contain"
            />
          ) : (
            <div aria-hidden className="aspect-[3/4] w-full max-w-sm rounded-xl bg-slate-800">
              <div className="grid h-full place-items-center text-[13px] text-slate-400">
                Belum ada foto
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup foto"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X size={20} strokeWidth={2.4} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

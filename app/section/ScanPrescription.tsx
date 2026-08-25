"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera, Check, ChevronRight, History, Image as ImageIcon, Upload, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Mascot from "../components/Mascot";
import RecipeOCRScanner from "../components/RecipeOCRScanner";
import RecipeHistory from "../components/RecipeHistory";
import type { Medicine } from "../data/prescriptions";
import { useRouter } from "next/navigation";
import { createClient as createSupabaseClient } from "../lib/supabase/client";
import { savePrescription } from "../lib/scan/actions";
import type { ScannedPrescription } from "../lib/scan/queries";
import type { OcrResult } from "../components/useCameraOcr";

type Source = "camera" | "gallery";

export default function ScanPrescriptionPage({
  patientId,
  patientName,
  history = [],
}: {
  patientId?: string;
  patientName?: string;
  history?: ScannedPrescription[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [source, setSource] = useState<Source | null>(null);
  const [saved, setSaved] = useState<Medicine[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const router = useRouter();

  const persist = async (medicines: Medicine[], result: OcrResult | null) => {
    if (!patientId) {
      setSaved(medicines);
      setSource(null);
      return;
    }

    setSaving(true);
    setSaveError(null);

    let imagePath = "";
    if (result?.blob) {
      const supabase = createSupabaseClient();
      const path = `${patientId}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage
        .from("prescriptions")
        .upload(path, result.blob, { contentType: "image/jpeg", upsert: false });
      if (!error) imagePath = path;
    }

    const fd = new FormData();
    fd.set("patient_id", patientId);
    fd.set("raw_text", result?.rawText ?? "");
    fd.set("image_path", imagePath);
    fd.set(
      "medicines",
      JSON.stringify(
        medicines.map((m) => ({ name: m.name, dose: m.dose, rule: m.rule, times: m.times })),
      ),
    );

    const outcome = await savePrescription({ error: null }, fd);
    setSaving(false);

    if (outcome.error) {
      setSaveError(outcome.error);
      return;
    }

    setSaved(medicines);
    setSource(null);
    router.refresh();
  };

  const fileRef = useRef<HTMLInputElement>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);

  const start = (next: Source) => {
    setPickerOpen(false);
    if (next === "gallery") {
      fileRef.current?.click();
      return;
    }
    setPickedFile(null);
    setSource(next);
  };

  const closeScanner = () => {
    setSource(null);
    setPickedFile(null);
  };

  const [historyOpen, setHistoryOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

  const acceptImage = useCallback((file: File | null | undefined) => {
    if (!file) return false;
    if (!file.type.startsWith("image/")) {
      setDropError("Filenya harus berupa gambar resep (JPG, PNG, atau WebP).");
      return false;
    }
    setDropError(null);
    setPickedFile(file);
    setSource("gallery");
    return true;
  }, []);

  useEffect(() => {
    if (source !== null) return;

    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;

      const item = Array.from(event.clipboardData?.items ?? []).find((entry) =>
        entry.type.startsWith("image/"),
      );
      const file = item?.getAsFile();
      if (file && acceptImage(file)) event.preventDefault();
    };

    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [source, acceptImage]);

  return (

    <div className="flex min-h-[calc(100dvh-var(--bottom-nav))] w-full flex-col px-4 pb-6 pt-6 sm:px-6 md:px-8 md:pt-10 lg:block lg:min-h-0 lg:pb-10 xl:px-12 xl:pb-12 xl:pt-12">
      <PageHeader
        tone="amber"
        eyebrow="Karsa"
        title="Scan Resep"
        subtitle={
          patientName
            ? `Foto resep ${patientName}, dan Karsa membaca obat serta jadwalnya.`
            : "Foto resep dokter, dan Karsa membaca obat serta jadwalnya untukmu."
        }
      />

      <div className="grid min-h-0 flex-1 items-stretch gap-6 lg:flex-none lg:items-start lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-10">

        <div className="flex min-w-0 flex-col lg:block">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node)) return;
              setDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              acceptImage(event.dataTransfer.files?.[0]);
            }}
            className={`group/scan relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed lg:flex-none bg-white/70 px-6 py-12 text-center outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa focus-visible:ring-offset-2 sm:py-14 lg:min-h-[32rem] lg:py-24 xl:min-h-[36rem] ${
              dragging
                ? "border-karsa bg-karsa-soft/60"
                : "border-karsa/35 hover:border-karsa hover:bg-karsa-soft/40"
            }`}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-karsa/10 blur-3xl"
            />

            <Mascot className="relative h-32 w-32 sm:h-36 sm:w-36 lg:h-52 lg:w-52 xl:h-60 xl:w-60" />

            <span className="relative mt-5 block font-nohemi text-[22px] font-bold tracking-tight text-neutral-900 sm:text-[24px] lg:mt-7 lg:text-[34px] xl:text-[38px]">
              {dragging ? "Lepaskan fotonya di sini" : "Klik untuk mulai scan"}
            </span>
            <span className="relative mt-2 block max-w-[34ch] text-[13.5px] leading-5 text-neutral-500 sm:text-[14.5px] lg:mt-3 lg:max-w-[42ch] lg:text-[16.5px] lg:leading-7">
              Foto resep dokter — obat, dosis, dan jam minumnya dibaca untukmu.
            </span>

            <span className="relative mt-4 hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-[12.5px] font-semibold text-neutral-500 ring-1 ring-karsa-line lg:mt-7 lg:inline-flex lg:px-5 lg:py-2.5 lg:text-[13.5px]">
              <Upload size={14} strokeWidth={2.3} aria-hidden />
              Seret file ke sini, atau tempel dengan Ctrl&nbsp;+&nbsp;V
            </span>
          </button>




          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="mt-4 flex w-full shrink-0 items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 text-left outline-none ring-1 ring-karsa-line transition-colors duration-200 hover:bg-karsa-soft/50 focus-visible:ring-2 focus-visible:ring-karsa/40 lg:hidden"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-karsa-soft text-karsa-dark">
                <History size={18} strokeWidth={2.2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold leading-5 text-neutral-900">
                  Riwayat Scan
                </span>
                <span className="block text-[12.5px] leading-4 text-neutral-500">
                  {history.length > 0
                    ? `${history.length} resep tersimpan`
                    : "Belum ada resep tersimpan"}
                </span>
              </span>
            </span>
            <ChevronRight size={18} strokeWidth={2.2} aria-hidden className="shrink-0 text-neutral-300" />
          </button>
        </div>


        <aside className="hidden min-w-0 lg:block">
          <h2 className="mb-3 font-nohemi text-[19px] font-bold tracking-tight text-neutral-800 xl:text-[22px]">
            Riwayat Scan
          </h2>
          <RecipeHistory prescriptions={history} />
        </aside>
      </div>


      <Toast
        reduce={Boolean(reduce)}
        saving={saving}
        error={saveError ?? dropError}
        savedCount={saved?.length ?? null}
        onDismiss={() => {
          setSaved(null);
          setSaveError(null);
          setDropError(null);
        }}
      />

      <HistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        reduce={Boolean(reduce)}
      />

      <SourcePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={start}
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          event.target.value = "";
          if (!file) return;
          setPickedFile(file);
          setSource("gallery");
        }}
      />

      <RecipeOCRScanner
        open={source !== null}
        from={source ?? "camera"}
        initialFile={pickedFile}
        onClose={closeScanner}
        onSave={(medicines, result) => void persist(medicines, result)}
      />
    </div>
  );
}

function HistorySheet({
  open,
  onClose,
  history,
  reduce,
}: {
  open: boolean;
  onClose: () => void;
  history: ScannedPrescription[];
  reduce: boolean;
}) {
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
            className="fixed inset-0 z-[60] bg-neutral-950/50 backdrop-blur-[2px] lg:hidden"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Riwayat scan"
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={
              reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 38, mass: 0.9 }
            }
            className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[85dvh] flex-col overflow-hidden rounded-t-3xl bg-[#FDFBF7] shadow-[0_-12px_44px_-16px_rgba(24,32,24,0.5)] sm:mx-auto sm:max-w-lg lg:hidden"
          >
            <div className="flex shrink-0 justify-center pb-1 pt-2.5">
              <span aria-hidden className="h-1.5 w-10 rounded-full bg-slate-300" />
            </div>

            <header className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-1">
              <h2 className="font-nohemi text-[18px] font-bold tracking-tight text-neutral-900">
                Riwayat Scan
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup riwayat"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-500 outline-none transition-colors duration-200 hover:bg-white hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-karsa/40"
              >
                <X size={18} strokeWidth={2.4} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] [contain:paint]">
              <RecipeHistory prescriptions={history} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


function Toast({
  reduce,
  saving,
  error,
  savedCount,
  onDismiss,
}: {
  reduce: boolean;
  saving: boolean;
  error: string | null;
  savedCount: number | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (savedCount === null && !error) return;
    const id = window.setTimeout(onDismiss, error ? 7000 : 5000);
    return () => window.clearTimeout(id);
  }, [savedCount, error, onDismiss]);

  const shown = saving || Boolean(error) || savedCount !== null;

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          role="status"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          transition={reduce ? { duration: 0 } : { duration: 0.22 }}
          className="fixed bottom-[calc(var(--bottom-nav)+1rem)] left-1/2 z-[70] w-[min(92vw,26rem)] -translate-x-1/2 lg:left-auto lg:right-6 lg:translate-x-0"
        >
          {saving ? (
            <p className="flex items-center gap-3 rounded-2xl bg-neutral-900 px-4 py-3.5 text-[14px] font-bold text-white shadow-[0_18px_40px_-16px_rgba(24,32,24,0.6)]">
              <span
                aria-hidden
                className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none"
              />
              Menyimpan resep…
            </p>
          ) : error ? (
            <p className="whitespace-pre-line rounded-2xl bg-rose-600 px-4 py-3.5 text-[14px] font-semibold leading-5 text-white shadow-[0_18px_40px_-16px_rgba(24,32,24,0.6)]">
              {error}
            </p>
          ) : (
            <p className="flex items-start gap-3 rounded-2xl bg-act-600 px-4 py-3.5 text-[14px] leading-5 text-white shadow-[0_18px_40px_-16px_rgba(24,32,24,0.6)]">
              <Check size={17} strokeWidth={2.8} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                <span className="font-bold">{savedCount} obat dipasang ke jadwal.</span>{" "}
                Pengingatnya muncul di halaman Perawatan.
              </span>
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}


function SourcePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (source: Source) => void;
}) {
  const reduce = useReducedMotion();

  const row =
    "flex w-full items-center gap-3.5 rounded-2xl bg-white p-4 text-left outline-none ring-1 ring-karsa-line transition-colors duration-200 hover:bg-karsa-soft/50 focus-visible:ring-2 focus-visible:ring-karsa/40 sm:gap-4 sm:p-5";

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
            aria-label="Pilih sumber foto"
            initial={reduce ? { opacity: 0 } : { y: "100%", opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: "100%", opacity: 0 }}
            transition={
              reduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 40 }
            }
            className="fixed inset-x-0 bottom-0 z-[61] rounded-t-3xl bg-[#FDFBF7] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_44px_-16px_rgba(24,32,24,0.5)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,30rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:p-7 sm:shadow-[0_32px_80px_-24px_rgba(24,32,24,0.55)]"
          >
            <div className="mb-3 flex justify-center sm:hidden">
              <span aria-hidden className="h-1.5 w-10 rounded-full bg-slate-300" />
            </div>

            <h3 className="mb-3 font-nohemi text-[16px] font-bold tracking-tight text-neutral-800 sm:mb-5 sm:text-[22px]">
              Ambil foto resep dari
            </h3>

            <div className="space-y-2.5">
              <button type="button" onClick={() => onPick("camera")} className={row}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-karsa-soft text-karsa-dark">
                  <Camera size={20} strokeWidth={2.2} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold leading-5 text-neutral-900">
                    Kamera
                  </span>
                  <span className="block text-[12.5px] leading-4 text-neutral-500">
                    Foto resepnya sekarang
                  </span>
                </span>
              </button>

              <button type="button" onClick={() => onPick("gallery")} className={row}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-med-100 text-med-600">
                  <ImageIcon size={20} strokeWidth={2.2} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold leading-5 text-neutral-900">
                    File
                  </span>
                  <span className="block text-[12.5px] leading-4 text-neutral-500">
                    Pilih foto resep dari perangkat
                  </span>
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full rounded-full bg-slate-100 py-3 text-[14px] font-bold text-slate-700 outline-none transition-colors hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              Batal
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

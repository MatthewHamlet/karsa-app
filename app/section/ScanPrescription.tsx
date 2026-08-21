"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera, Check, Image as ImageIcon } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Mascot from "../components/Mascot";
import RecipeOCRScanner from "../components/RecipeOCRScanner";
import RecipeHistory from "../components/RecipeHistory";
import type { Medicine } from "../data/prescriptions";

type Source = "camera" | "gallery";

export default function ScanPrescriptionPage() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [source, setSource] = useState<Source | null>(null);
  const [saved, setSaved] = useState<Medicine[] | null>(null);
  const reduce = useReducedMotion();

  const start = (next: Source) => {
    setPickerOpen(false);
    setSource(next);
  };

  return (
    /* A phone gets a fixed-height column so the scanner can sit in the middle
       of what is left between the Riwayat button and the drawer. The bottom
       scanner fills it. The drawer and the slide-over that used to share this
       screen are gone, so nothing is reserved at the bottom any more and the
       card simply takes what is there. From `lg` none of this applies: the page
       goes back to flowing and the history is a column, not a drawer. */
    <div className="flex min-h-[calc(100dvh-var(--bottom-nav))] w-full flex-col px-4 pb-6 pt-6 sm:px-6 md:px-8 md:pt-10 lg:block lg:min-h-0 lg:pb-10 xl:px-12 xl:pb-12 xl:pt-12">
      <PageHeader
        tone="amber"
        eyebrow="Karsa"
        title="Scan Resep"
        subtitle="Foto resep dokter, dan Karsa membaca obat serta jadwalnya untukmu."
      />


      <div className="grid min-h-0 flex-1 items-stretch gap-6 lg:flex-none lg:items-start lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-10">
        {/* ── The one thing this page does ─────────────────────────────────
            The whole panel is the button. A card with a small action inside it
            makes the caregiver aim; this way the target is the size of the
            screen. */}
        <div className="flex min-w-0 flex-col lg:block">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="group/scan relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed lg:flex-none border-karsa/35 bg-white/70 px-6 py-12 text-center outline-none transition-colors duration-200 hover:border-karsa hover:bg-karsa-soft/40 focus-visible:ring-2 focus-visible:ring-karsa focus-visible:ring-offset-2 sm:py-14 lg:py-20"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-karsa/10 blur-3xl"
            />

            <Mascot className="relative h-32 w-32 sm:h-36 sm:w-36 lg:h-40 lg:w-40" />

            <span className="relative mt-5 block font-nohemi text-[22px] font-bold tracking-tight text-neutral-900 sm:text-[24px] lg:text-[28px]">
              Klik untuk mulai scan
            </span>
            <span className="relative mt-2 block max-w-[34ch] text-[13.5px] leading-5 text-neutral-500 sm:text-[14.5px]">
              Foto resep dokter — obat, dosis, dan jam minumnya dibaca untukmu.
            </span>
          </button>

          {/* Confirmation, then it gets out of the way. A banner that stays
              would still be claiming success three scans later. */}
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={reduce ? { duration: 0 } : { duration: 0.25 }}
                role="status"
                className="mt-4 flex items-start gap-3 rounded-2xl bg-act-50 p-4 ring-1 ring-act-edge"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-act-100 text-act-600">
                  <Check size={16} strokeWidth={2.8} aria-hidden />
                </span>
                <p className="text-[13.5px] leading-5 text-neutral-700">
                  <span className="font-bold text-neutral-900">
                    {saved.length} obat dipasang ke jadwal perawatan.
                  </span>{" "}
                  Pengingatnya akan muncul di halaman Perawatan sesuai jam yang kamu setujui.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── History, as a column ────────────────────────────────────────
            From `lg` there is width for it to sit beside the scanner; below
            that the same list is what the slide-over shows. */}
        <aside className="hidden min-w-0 lg:block">
          <h2 className="mb-3 font-nohemi text-[19px] font-bold tracking-tight text-neutral-800 xl:text-[22px]">
            Riwayat Scan
          </h2>
          <RecipeHistory />
        </aside>
      </div>


      <SourcePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={start}
      />

      <RecipeOCRScanner
        open={source !== null}
        from={source ?? "camera"}
        onClose={() => setSource(null)}
        onSave={(medicines) => {
          setSaved(medicines);
          setSource(null);
        }}
      />
    </div>
  );
}

/** Where the photo comes from. Two rows, because a caregiver standing at the
 *  pharmacy counter and one clearing out their camera roll are doing the same
 *  task from different places. */
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
    "flex w-full items-center gap-3.5 rounded-2xl bg-white p-4 text-left outline-none ring-1 ring-karsa-line transition-colors duration-200 hover:bg-karsa-soft/50 focus-visible:ring-2 focus-visible:ring-karsa/40";

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
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={
              reduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 40 }
            }
            className="fixed inset-x-0 bottom-0 z-[61] rounded-t-3xl bg-[#FDFBF7] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_44px_-16px_rgba(24,32,24,0.5)] sm:mx-auto sm:max-w-sm"
          >
            <div className="mb-3 flex justify-center">
              <span aria-hidden className="h-1.5 w-10 rounded-full bg-slate-300" />
            </div>

            <h3 className="mb-3 font-nohemi text-[16px] font-bold tracking-tight text-neutral-800">
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
                    Galeri
                  </span>
                  <span className="block text-[12.5px] leading-4 text-neutral-500">
                    Pilih foto yang sudah ada
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

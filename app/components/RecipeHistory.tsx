"use client";

import { useState } from "react";
import { CalendarDays, ChevronRight, Clock, Pill, Stethoscope, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ScannedPrescription as Prescription } from "../lib/scan/queries";

/** Every sheet scanned before, newest first.
 *
 *  A row says the three things worth scanning for: when, who wrote it, and
 *  whether it is still being taken. The drugs are chips rather than a list —
 *  you are looking for a name you half-remember, not reading a label. */
export default function RecipeHistory({
  prescriptions = [],
}: {
  prescriptions?: Prescription[];
}) {
  const [open, setOpen] = useState<Prescription | null>(null);

  if (prescriptions.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-karsa-line px-5 py-10 text-center text-[13.5px] leading-6 text-neutral-500">
        Belum ada resep yang dipindai.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {prescriptions.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setOpen(item)}
              className="group/row w-full rounded-2xl bg-white p-4 text-left shadow-[0_1px_2px_rgba(24,32,24,0.03),0_14px_30px_-26px_rgba(24,32,24,0.28)] outline-none ring-1 ring-karsa-line transition-shadow duration-200 hover:shadow-[0_1px_2px_rgba(24,32,24,0.04),0_20px_36px_-24px_rgba(24,32,24,0.38)] focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-karsa-soft text-karsa-dark">
                  <Stethoscope size={18} strokeWidth={2.2} aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-500">
                      <CalendarDays size={13} strokeWidth={2.2} aria-hidden />
                      {item.date}
                    </p>
                    <StatusTag status={item.status} />
                  </div>

                  <p className="mt-1 truncate text-[14.5px] font-bold leading-5 text-neutral-900">
                    {item.clinic}
                  </p>
                  <p className="truncate text-[12.5px] leading-4 text-neutral-500">
                    {item.doctor}
                  </p>
                </div>

                <ChevronRight
                  size={18}
                  strokeWidth={2.2}
                  aria-hidden
                  className="mt-2 shrink-0 text-neutral-300 transition-transform duration-200 group-hover/row:translate-x-0.5"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.medicines.map((med) => (
                  <span
                    key={med.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-med-50 px-2.5 py-1 text-[11.5px] font-semibold text-med-600 ring-1 ring-med-edge"
                  >
                    <Pill size={12} strokeWidth={2.4} aria-hidden />
                    {med.name} {med.dose}
                  </span>
                ))}
              </div>
            </button>
          </li>
        ))}
      </ul>

      <DetailSheet prescription={open} onClose={() => setOpen(null)} />
    </>
  );
}

function StatusTag({ status }: { status: Prescription["status"] }) {
  const active = status === "aktif";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${
        active
          ? "bg-act-50 text-act-600 ring-act-edge"
          : "bg-neutral-100 text-neutral-500 ring-neutral-200"
      }`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-act-600" : "bg-neutral-400"}`}
      />
      {active ? "Aktif" : "Selesai"}
    </span>
  );
}

/** Tapping a row opens the sheet the row summarised: the original photo, and
 *  every drug on it with its hours. */
function DetailSheet({
  prescription,
  onClose,
}: {
  prescription: Prescription | null;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {prescription && (
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
            aria-label={`Resep ${prescription.date}`}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={
              reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 38, mass: 0.9 }
            }
            className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[88dvh] flex-col overflow-hidden rounded-t-3xl bg-[#FDFBF7] shadow-[0_-12px_44px_-16px_rgba(24,32,24,0.5)] sm:mx-auto sm:max-w-lg"
          >
            <div className="flex shrink-0 justify-center pb-1 pt-2.5">
              <span aria-hidden className="h-1.5 w-10 rounded-full bg-slate-300" />
            </div>

            <header className="flex shrink-0 items-start gap-3 px-5 pb-3 pt-1">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-medium text-neutral-500">{prescription.date}</p>
                  <StatusTag status={prescription.status} />
                </div>
                <h2 className="mt-0.5 truncate font-nohemi text-[16.5px] font-bold tracking-tight text-neutral-900">
                  {prescription.clinic}
                </h2>
                <p className="truncate text-[12.5px] text-neutral-500">{prescription.doctor}</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup detail resep"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-500 outline-none transition-colors duration-200 hover:bg-white hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-karsa/40"
              >
                <X size={18} strokeWidth={2.4} />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] [contain:paint]">
              {/* The original sheet. Kept because a caregiver checking a dose
                  months later trusts the paper, not the transcription. */}
              <div>
                <h3 className="mb-2 text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-neutral-400">
                  Foto resep asli
                </h3>
                {prescription.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={prescription.imageUrl}
                    alt="Foto resep asli"
                    className="w-full rounded-2xl bg-slate-800 object-contain"
                  />
                ) : (
                  <div
                    aria-hidden
                    className="grid aspect-[4/3] w-full place-items-center rounded-2xl bg-slate-800 px-6 text-center text-[13px] text-slate-400"
                  >
                    Resep ini disimpan tanpa foto.
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-neutral-400">
                  Daftar obat
                </h3>
                <ul className="space-y-2.5">
                  {prescription.medicines.map((med) => (
                    <li
                      key={med.id}
                      className="flex items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-karsa-line"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-med-100 text-med-600">
                        <Pill size={17} strokeWidth={2.2} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14.5px] font-bold leading-5 text-neutral-900">
                          {med.name} <span className="text-neutral-600">{med.dose}</span>
                        </p>
                        <p className="mt-0.5 text-[12.5px] leading-4 text-neutral-500">
                          {med.rule}
                        </p>
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
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, History, Info, Pencil, Plus, Trash2 } from "lucide-react";
import Modal from "./Modal";
import { EASE } from "./List";
import { IMPORTANT_INFO, INFO_HISTORY } from "../data/careStats";
import { saveCareNotes, type CareResult } from "../lib/care/actions";
import type { CareData } from "../lib/care/view";


const PREVIEW = 4;


type Draft = { id: string | null; body: string };

function List({ lines }: { lines: Draft[] }) {
  return (
    <ol className="space-y-3">
      {lines.map((line, i) => (
        <li key={line.id ?? `${line.body}-${i}`} className="flex items-start gap-3.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-info-100 text-[12px] font-bold tabular-nums text-info-600">
            {i + 1}
          </span>
          <p className="min-w-0 flex-1 pt-0.5 text-[14.5px] leading-6 text-neutral-700">
            {line.body}
          </p>
        </li>
      ))}
    </ol>
  );
}

export default function ImportantInfo({ data }: { data?: CareData }) {
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);

  const [draft, setDraft] = useState<Draft[]>([]);
  const reduce = useReducedMotion();

  const [state, save, saving] = useActionState<CareResult, FormData>(saveCareNotes, {
    error: null,
  });


  const items: Draft[] = data
    ? data.notes.map((n) => ({ id: n.id, body: n.body }))
    : IMPORTANT_INFO.map((body) => ({ id: null, body }));

  const history = data
    ? data.notes.map((n) => ({
        id: n.id,
        date: n.updatedLabel,
        text: n.body,
        by: n.updatedBy,
      }))
    : INFO_HISTORY;

  useEffect(() => {
    if (state.ok) setEditOpen(false);
  }, [state.ok]);

  const openEditor = () => {
    setDraft(items);
    setEditOpen(true);
  };

  const move = (index: number, step: number) =>
    setDraft((prev) => {
      const next = [...prev];
      const target = index + step;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <section className="rounded-3xl bg-info-50 p-6 ring-1 ring-info-edge sm:p-7 xl:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-info-100 text-info-600">
            <Info size={20} strokeWidth={2.1} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[21px] font-bold leading-7 tracking-tight text-neutral-900 xl:text-[23px]">
              Informasi penting
            </h2>
            <p className="mt-1 text-[13.5px] leading-5 text-neutral-500">
              Berlaku setiap hari, untuk semua yang merawat.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={openEditor}
            aria-label="Ubah informasi penting"
            title="Ubah"
            className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 outline-none transition-colors duration-200 hover:bg-white/70 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            <Pencil size={16} strokeWidth={2.1} />
          </button>

          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="group/hist inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-neutral-500 outline-none transition-colors duration-200 hover:bg-white/70 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            <History size={15} strokeWidth={2.1} />
            Riwayat
          </button>
        </div>
      </header>

      <div className="rounded-2xl bg-white/70 p-5 ring-1 ring-info-edge/70 xl:p-6">
        {items.length === 0 ? (
          <p className="py-3 text-center text-[14px] leading-5 text-neutral-500">
            Belum ada instruksi. Tambahkan yang perlu diingat semua pendamping.
          </p>
        ) : (
          <List lines={items.slice(0, PREVIEW)} />
        )}

        {items.length > PREVIEW && (
          <button
            type="button"
            onClick={() => setAllOpen(true)}
            className="mt-4 rounded-lg text-[13px] font-semibold text-info-600 outline-none transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            Lihat semua ({items.length})
          </button>
        )}
      </div>


      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Ubah informasi penting"
        description="Tambah, susun ulang, atau hapus instruksi."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            {state.error && (
              <p role="alert" className="mr-auto text-[13px] font-medium text-rose-700">
                {state.error}
              </p>
            )}
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-full px-4 py-2.5 text-[14px] font-semibold text-neutral-600 outline-none transition-colors hover:bg-karsa-canvas focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              Batal
            </button>

            <form action={save}>
              <input type="hidden" name="patient_id" value={data?.activePatientId ?? ""} />
              <input type="hidden" name="notes" value={JSON.stringify(draft)} />
              <button
                type="submit"
                disabled={saving || !data}
                title={data ? undefined : "Masuk untuk menyimpan"}
                className="rounded-full bg-karsa px-5 py-2.5 text-[14px] font-semibold text-white outline-none transition-colors hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40 focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {saving ? "Menyimpan…" : "Simpan"}
              </button>
            </form>
          </div>
        }
      >
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {draft.map((line, i) => (
              <motion.li
                key={line.id ?? `new-${i}`}
                layout
                exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.22, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-3 rounded-2xl bg-white p-3 ring-1 ring-karsa-line">
                  <span className="mt-2 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-info-100 text-[12px] font-bold tabular-nums text-info-600">
                    {i + 1}
                  </span>

                  <textarea
                    value={line.body}
                    rows={2}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev.map((v, index) =>
                          index === i ? { ...v, body: e.target.value } : v,
                        ),
                      )
                    }
                    aria-label={`Instruksi ${i + 1}`}
                    className="min-w-0 flex-1 resize-none rounded-xl bg-karsa-canvas/60 px-3 py-2 text-[14.5px] leading-6 text-neutral-800 outline-none ring-1 ring-karsa-line focus-visible:ring-2 focus-visible:ring-karsa/40"
                  />

                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Naikkan"
                      className="grid h-7 w-7 place-items-center rounded-lg text-neutral-400 outline-none transition-colors hover:bg-karsa-canvas hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowUp size={14} strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === draft.length - 1}
                      aria-label="Turunkan"
                      className="grid h-7 w-7 place-items-center rounded-lg text-neutral-400 outline-none transition-colors hover:bg-karsa-canvas hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowDown size={14} strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft((prev) => prev.filter((_, index) => index !== i))}
                      aria-label="Hapus"
                      className="grid h-7 w-7 place-items-center rounded-lg text-neutral-400 outline-none transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-300"
                    >
                      <Trash2 size={14} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <button
          type="button"
          onClick={() => setDraft((prev) => [...prev, { id: null, body: "" }])}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13.5px] font-semibold text-karsa-dark outline-none ring-1 ring-karsa-line transition-colors hover:bg-karsa-soft focus-visible:ring-2 focus-visible:ring-karsa/40"
        >
          <Plus size={15} strokeWidth={2.5} />
          Tambah instruksi
        </button>
      </Modal>


      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Riwayat perubahan"
        description="Perubahan pada informasi dan rencana perawatan."
      >
        <ol className="space-y-2">
          {history.map((change) => (
            <li
              key={change.id}
              className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-karsa-line"
            >
              <time className="w-14 shrink-0 text-[12.5px] font-bold uppercase leading-5 tracking-[0.06em] text-neutral-400">
                {change.date}
              </time>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold leading-5 text-neutral-800">
                  {change.text}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-4 text-neutral-500">
                  oleh {change.by}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Modal>


      <Modal
        open={allOpen}
        onClose={() => setAllOpen(false)}
        title="Informasi penting"
        description={`${items.length} instruksi yang berlaku.`}
      >
        <div className="rounded-2xl bg-white p-5 ring-1 ring-karsa-line">
          <List lines={items} />
        </div>
      </Modal>
    </section>
  );
}

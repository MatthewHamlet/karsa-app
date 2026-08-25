"use client";

import { useActionState, useEffect, useId } from "react";
import Modal from "./Modal";
import { addScheduleEvent, type CareResult } from "../lib/care/actions";
import { MONTHS, type CalendarDay } from "../lib/care/time";

const KINDS = [
  { value: "appointment", label: "Janji temu" },
  { value: "checkup", label: "Kontrol rutin" },
  { value: "therapy", label: "Terapi" },
  { value: "meds", label: "Obat" },
] as const;

const FIELD =
  "h-12 w-full rounded-xl border-2 border-karsa-line bg-white px-3.5 text-[15px] text-neutral-900 outline-none transition-colors duration-200 focus:border-karsa disabled:opacity-70";
const LABEL = "block text-[13px] font-semibold text-neutral-600";

const isoDate = (day: CalendarDay) =>
  `${day.y}-${String(day.m + 1).padStart(2, "0")}-${String(day.d).padStart(2, "0")}`;

export default function ScheduleForm({
  open,
  onClose,
  patientId,
  day,
}: {
  open: boolean;
  onClose: () => void;
  patientId: string;
  day: CalendarDay;
}) {
  const [state, action, busy] = useActionState<CareResult, FormData>(addScheduleEvent, {
    error: null,
  });
  const uid = useId();

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah jadwal"
      description={`${day.d} ${MONTHS[day.m]} ${day.y}`}
    >
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="patient_id" value={patientId} />

        <div>
          <label className={LABEL} htmlFor={`${uid}-title`}>
            Judul
          </label>
          <input
            id={`${uid}-title`}
            name="title"
            required
            maxLength={120}
            placeholder="Janji temu dokter"
            className={`${FIELD} mt-1.5`}
            disabled={busy}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor={`${uid}-kind`}>
            Jenis
          </label>
          <select id={`${uid}-kind`} name="kind" className={`${FIELD} mt-1.5`} disabled={busy}>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL} htmlFor={`${uid}-date`}>
            Tanggal
          </label>
          <input
            id={`${uid}-date`}
            name="date"
            type="date"
            required
            defaultValue={isoDate(day)}
            className={`${FIELD} mt-1.5`}
            disabled={busy}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL} htmlFor={`${uid}-start`}>
              Mulai
            </label>
            <input
              id={`${uid}-start`}
              name="start"
              type="time"
              required
              defaultValue="09:00"
              className={`${FIELD} mt-1.5`}
              disabled={busy}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor={`${uid}-end`}>
              Selesai <span className="font-normal text-neutral-400">(opsional)</span>
            </label>
            <input
              id={`${uid}-end`}
              name="end"
              type="time"
              className={`${FIELD} mt-1.5`}
              disabled={busy}
            />
          </div>
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[14px] font-medium leading-5 text-rose-700 ring-1 ring-rose-200"
          >
            {state.error}
          </p>
        )}

        <div className="mt-1 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl bg-white text-[15px] font-bold text-neutral-600 ring-1 ring-karsa-line outline-none transition-colors duration-200 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={busy}
            className="h-12 flex-1 rounded-xl bg-karsa text-[15px] font-bold text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {busy ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

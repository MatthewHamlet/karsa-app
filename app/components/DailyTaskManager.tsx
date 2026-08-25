"use client";

import { useActionState, useEffect, useState } from "react";
import { Clock, Pencil, Plus, StickyNote, Trash2, UserRound, X } from "lucide-react";
import Modal from "./Modal";
import { colourFor } from "./avatarColour";
import {
  createDailyTask,
  deleteDailyTask,
  updateDailyTask,
  type CareResult,
} from "../lib/care/actions";
import type { DailyTask, CareGroupMember } from "../lib/care/queries";

const FIELD =
  "w-full rounded-2xl bg-white px-4 py-3 text-[14.5px] leading-5 text-neutral-800 outline-none ring-1 ring-karsa-line transition-shadow duration-200 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-karsa/50";

const LABEL = "block text-[12.5px] font-semibold text-neutral-600";


export default function DailyTaskManager({
  open,
  onClose,
  tasks,
  patientId,
  members,
  meId,
}: {
  open: boolean;
  onClose: () => void;
  tasks: DailyTask[];
  patientId: string;

  members: CareGroupMember[];
  meId?: string;
}) {

  const [editing, setEditing] = useState<DailyTask | "new" | null>(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tugas harian"
      description="Tugas di sini berulang setiap hari. Centangnya kembali kosong tiap tengah malam."
      size="lg"
    >
      <div className="flex flex-col gap-3">
        {tasks.length === 0 && editing === null && (
          <p className="rounded-2xl bg-white px-5 py-8 text-center text-[14px] leading-6 text-neutral-500 ring-1 ring-karsa-line">
            Belum ada tugas harian. Tambahkan yang pertama — misalnya “Obat pagi” pukul 07:00.
          </p>
        )}

        {tasks.length > 0 && (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                members={members}
                patientId={patientId}
                meId={meId}
                editing={editing === task}
                onEdit={() => setEditing(task)}
                onDone={() => setEditing(null)}
              />
            ))}
          </ul>
        )}

        {editing === "new" ? (
          <TaskForm
            patientId={patientId}
            members={members}
            meId={meId}
            onDone={() => setEditing(null)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="group/add flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-karsa-line bg-white/40 px-4 py-3.5 text-[14px] font-semibold text-neutral-700 outline-none transition-colors duration-200 hover:border-karsa/40 hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-karsa-dark ring-1 ring-karsa-line transition-transform duration-200 group-hover/add:scale-110">
              <Plus size={15} strokeWidth={2.6} />
            </span>
            Tambah tugas harian
          </button>
        )}
      </div>
    </Modal>
  );
}

function TaskRow({
  task,
  members,
  patientId,
  meId,
  editing,
  onEdit,
  onDone,
}: {
  task: DailyTask;
  members: CareGroupMember[];
  patientId: string;
  meId?: string;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
}) {
  const [removeState, remove, removing] = useActionState<CareResult, FormData>(deleteDailyTask, {
    error: null,
  });

  if (editing) {
    return (
      <li>
        <TaskForm task={task} patientId={patientId} members={members} meId={meId} onDone={onDone} />
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-karsa-line">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-karsa-soft text-[11.5px] font-bold tabular-nums text-karsa-dark">
        {task.atTime ?? <Clock size={15} strokeWidth={2.2} />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-semibold leading-5 text-neutral-800">
          {task.label}
        </span>


        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          {task.assigneeName ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-neutral-600">
              <span
                aria-hidden
                className="grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold text-white"
                style={{ backgroundColor: colourFor(task.assigneeId!) }}
              >
                {task.assigneeInitial}
              </span>
              {task.assigneeId === meId ? "Kamu" : task.assigneeName}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-neutral-400">
              <UserRound size={12} strokeWidth={2.2} />
              Siapa saja
            </span>
          )}

          {!task.atTime && task.hint && (
            <span className="text-[12px] text-neutral-500">{task.hint}</span>
          )}

          {task.note && (
            <span className="inline-flex items-start gap-1.5 text-[12px] leading-4 text-neutral-500">
              <StickyNote size={12} strokeWidth={2.2} className="mt-0.5 shrink-0" />
              {task.note}
            </span>
          )}
        </span>

        {removeState.error && (
          <span role="alert" className="mt-1.5 block text-[12px] font-semibold text-rose-700">
            {removeState.error}
          </span>
        )}
      </span>

      <span className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Ubah ${task.label}`}
          className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 outline-none transition-colors duration-200 hover:bg-karsa-canvas hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
        >
          <Pencil size={15} strokeWidth={2.2} />
        </button>

        <form action={remove}>
          <input type="hidden" name="task_id" value={task.id} />
          <button
            type="submit"
            disabled={removing}
            aria-label={`Hapus ${task.label}`}
            className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 outline-none transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-300 disabled:opacity-50"
          >
            <Trash2 size={15} strokeWidth={2.2} />
          </button>
        </form>
      </span>
    </li>
  );
}


function TaskForm({
  task,
  patientId,
  members,
  meId,
  onDone,
}: {

  task?: DailyTask;
  patientId: string;
  members: CareGroupMember[];
  meId?: string;
  onDone: () => void;
}) {
  const [state, submit, saving] = useActionState<CareResult, FormData>(
    task ? updateDailyTask : createDailyTask,
    { error: null },
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);


  const assignable = members;

  return (
    <form
      action={submit}
      className="rounded-2xl bg-karsa-canvas/60 p-4 ring-1 ring-karsa-line"
    >
      <input type="hidden" name="patient_id" value={patientId} />
      {task && <input type="hidden" name="task_id" value={task.id} />}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-bold text-neutral-800">
          {task ? "Ubah tugas" : "Tugas harian baru"}
        </p>
        <button
          type="button"
          onClick={onDone}
          aria-label="Batal"
          className="grid h-7 w-7 place-items-center rounded-full text-neutral-400 outline-none transition-colors hover:bg-white hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-karsa/40"
        >
          <X size={14} strokeWidth={2.6} />
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
        <label className="block">
          <span className={LABEL}>Nama tugas</span>
          <input
            name="label"
            defaultValue={task?.label ?? ""}
            required
            maxLength={80}
            placeholder="Obat pagi"
            className={`mt-1.5 ${FIELD}`}
          />
        </label>

        <label className="block">
          <span className={LABEL}>Jam</span>
          <input
            type="time"
            name="at_time"
            defaultValue={task?.atTime ?? ""}
            className={`mt-1.5 ${FIELD}`}
          />
          <span className="mt-1 block text-[11.5px] leading-4 text-neutral-500">
            Kosongkan kalau sepanjang hari.
          </span>
        </label>
      </div>

      <label className="mt-3 block">
        <span className={LABEL}>Catatan (opsional)</span>
        <textarea
          name="note"
          rows={2}
          defaultValue={task?.note ?? ""}
          maxLength={300}
          placeholder="Setelah makan, jangan saat perut kosong."
          className={`mt-1.5 resize-none ${FIELD}`}
        />
      </label>


      {assignable.length > 1 ? (
        <label className="mt-3 block">
          <span className={LABEL}>Ditugaskan ke</span>
          <select
            name="assignee_id"
            defaultValue={task?.assigneeId ?? ""}
            className={`mt-1.5 ${FIELD}`}
          >
            <option value="">Siapa saja di tim</option>
            {assignable.map((member) => (
              <option key={member.id} value={member.id}>
                {member.id === meId ? `${member.name} (kamu)` : member.name}
                {member.active ? "" : " · belum bergabung"}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[11.5px] leading-4 text-neutral-500">
            Satu tugas hanya untuk satu orang, jadi tidak ada yang mengerjakannya dua kali.
          </span>
        </label>
      ) : (
        <input type="hidden" name="assignee_id" value={task?.assigneeId ?? ""} />
      )}

      {state.error && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-semibold leading-4 text-rose-800 ring-1 ring-rose-200"
        >
          {state.error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-karsa px-5 py-2.5 text-[13.5px] font-bold text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : task ? "Simpan" : "Tambah"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-full bg-white px-5 py-2.5 text-[13.5px] font-semibold text-neutral-700 outline-none ring-1 ring-karsa-line transition-colors duration-200 hover:bg-karsa-canvas focus-visible:ring-2 focus-visible:ring-karsa/40"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

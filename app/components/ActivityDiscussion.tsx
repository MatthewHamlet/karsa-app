"use client";

import { useActionState, useEffect, useMemo, useOptimistic, useRef, useState } from "react";
import { Send } from "lucide-react";
import Modal from "./Modal";
import HealthPattern from "./HealthPattern";
import { colourFor } from "./avatarColour";
import { sendCareMessage, type CareResult } from "../lib/care/actions";
import type { CareData } from "../lib/care/view";

const WALLPAPER = "#f1ede3";


export type ActivityContext = {
  id: string;
  label: string;
  detail?: string | null;
};

type Line = {
  id: string;
  authorId: string;
  author: string;
  initial: string;
  body: string;
  when: string;
};


export default function ActivityDiscussion({
  context,
  data,
  onClose,
}: {

  context: ActivityContext | null;
  data?: CareData;
  onClose: () => void;
}) {
  return (
    <Modal
      open={Boolean(context)}
      onClose={onClose}
      title="Diskusikan aktivitas"
      description={context?.label}
      size="lg"
    >

      {context && <Thread key={context.label} context={context} data={data} />}
    </Modal>
  );
}

function Thread({ context, data }: { context: ActivityContext; data?: CareData }) {
  const [draft, setDraft] = useState("");
  const streamRef = useRef<HTMLDivElement>(null);

  const [state, send] = useActionState<CareResult, FormData>(sendCareMessage, { error: null });

  const [pending, addPending] = useOptimistic<Line[], Line>([], (list, line) => [...list, line]);

  const unsent = useRef("");

  useEffect(() => {
    if (state.error && unsent.current) {
      setDraft(unsent.current);
      unsent.current = "";
    }
    if (state.ok) unsent.current = "";
  }, [state.error, state.ok]);

  const me = data?.me;


  const thread = useMemo<Line[]>(() => {
    if (!data) return [];
    return data.messages
      .filter((m) => m.context?.label === context.label)
      .map((m) => ({
        id: m.id,
        authorId: m.authorId,
        author: m.author,
        initial: m.initial,
        body: m.body,
        when: m.when,
      }));
  }, [data, context]);

  const lines = useMemo(() => [...thread, ...pending], [thread, pending]);

  useEffect(() => {
    const node = streamRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines.length]);

  const submit = (formData: FormData) => {
    const body = String(formData.get("body") ?? "").trim();
    if (!body || !me) return;

    unsent.current = draft;
    addPending({
      id: `pending:${Date.now()}`,
      authorId: me.id,
      author: me.name,
      initial: me.initial,
      body,
      when: "",
    });
    setDraft("");
    send(formData);
  };

  return (
        <div className="flex flex-col">

          <div className="rounded-2xl bg-karsa-canvas/70 px-4 py-3 ring-1 ring-karsa-line">
            <p className="text-[10.5px] font-semibold uppercase leading-4 tracking-[0.16em] text-neutral-500">
              Aktivitas
            </p>
            <p className="mt-1 text-[14.5px] font-semibold leading-5 text-neutral-800">
              {context.label}
            </p>
            {context.detail && (
              <p className="mt-0.5 text-[12.5px] text-neutral-500">{context.detail}</p>
            )}
          </div>

          <div
            ref={streamRef}
            className="scrollbar-none relative mt-3 max-h-[42vh] min-h-[180px] overflow-y-auto overscroll-contain rounded-2xl px-3 py-4"
            style={{ backgroundColor: WALLPAPER }}
          >
            <HealthPattern className="text-[#6d5647]" opacity={0.13} />

            {lines.length === 0 && (
              <p className="relative mx-auto max-w-[34ch] py-8 text-center text-[14px] leading-6 text-neutral-500">
                Belum ada yang membahas ini. Tulis pertanyaan atau catatan pertamanya.
              </p>
            )}

            <ul className="relative">
              {lines.map((line, i) => {
                const mine = line.authorId === me?.id;
                const head = i === 0 || lines[i - 1].authorId !== line.authorId;

                return (
                  <li
                    key={line.id}
                    className={`flex gap-2 ${mine ? "flex-row-reverse" : ""} ${
                      head ? "mt-2.5" : "mt-[3px]"
                    }`}
                  >
                    {!mine &&
                      (head ? (
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center self-start rounded-full text-[12px] font-bold text-white"
                          style={{ backgroundColor: colourFor(line.authorId) }}
                        >
                          {line.initial}
                        </span>
                      ) : (
                        <span aria-hidden className="w-8 shrink-0" />
                      ))}

                    <div
                      className={`max-w-[82%] rounded-2xl px-3 py-1.5 shadow-[0_1px_2px_rgba(24,32,24,0.06)] sm:max-w-[68%] ${
                        mine
                          ? `bg-karsa text-white ${head ? "rounded-tr-md" : ""}`
                          : `bg-white text-neutral-800 ring-1 ring-karsa-line ${head ? "rounded-tl-md" : ""}`
                      }`}
                    >
                      {head && !mine && (
                        <p className="text-[12px] font-bold text-karsa-dark">{line.author}</p>
                      )}
                      <p className="whitespace-pre-line text-[14.5px] leading-6">{line.body}</p>
                      {line.when && (
                        <p
                          className={`mt-0.5 text-right text-[11px] ${
                            mine ? "text-white/65" : "text-neutral-400"
                          }`}
                        >
                          {line.when}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {state.error && (
            <p role="alert" className="mt-3 text-[13px] font-semibold text-rose-700">
              {state.error}
            </p>
          )}

          <form action={submit} className="mt-3 flex items-end gap-2">
            <input type="hidden" name="patient_id" value={data?.activePatientId ?? ""} />

            <input type="hidden" name="context_type" value="record" />
            <input type="hidden" name="context_label" value={context.label} />
            <input type="hidden" name="context_detail" value={context.detail ?? ""} />

            <label htmlFor="activity-draft" className="sr-only">
              Tulis pesan tentang aktivitas ini
            </label>
            <textarea
              id="activity-draft"
              name="body"
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={me ? "Tulis pesan untuk tim…" : "Masuk untuk mengobrol"}
              className="min-h-[48px] flex-1 resize-none rounded-2xl bg-white px-4 py-3 text-[14.5px] leading-5 text-neutral-800 outline-none ring-1 ring-karsa-line placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-karsa/40"
            />
            <button
              type="submit"
              disabled={!me || !draft.trim()}
              aria-label="Kirim pesan"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-karsa text-white outline-none transition-colors hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:opacity-50"
            >
              <Send size={18} strokeWidth={2.2} className="-ml-0.5" />
            </button>
          </form>
        </div>
  );
}

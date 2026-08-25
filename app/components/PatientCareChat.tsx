"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
} from "react";
import { Send } from "lucide-react";
import HealthPattern from "./HealthPattern";
import { colourFor } from "./avatarColour";
import { useCareChannel } from "./useCareChannel";
import { loadCareMessages, sendCareMessage, type CareResult } from "../lib/care/actions";
import type { CareMessage } from "../lib/care/queries";

const WALLPAPER = "#f1ede3";

type Me = { id: string; name: string; initial: string };

export default function PatientCareChat({
  patientId,
  me,
  initial,
}: {
  patientId: string | null;
  me: Me | null;
  initial: CareMessage[];
}) {
  const [messages, setMessages] = useState<CareMessage[]>(initial);
  const [draft, setDraft] = useState("");
  const streamRef = useRef<HTMLDivElement>(null);
  const unsent = useRef("");

  const [state, send] = useActionState<CareResult, FormData>(sendCareMessage, { error: null });
  const [pending, addPending] = useOptimistic<CareMessage[], CareMessage>(
    [],
    (list, line) => [...list, line],
  );

  const refetch = useCallback(async () => {
    if (!patientId) return;
    setMessages(await loadCareMessages(patientId));
  }, [patientId]);

  useCareChannel(patientId, refetch);

  useEffect(() => {
    if (state.error && unsent.current) {
      setDraft(unsent.current);
      unsent.current = "";
    }
    if (state.ok) {
      unsent.current = "";
      void refetch();
    }
  }, [state.error, state.ok, refetch]);

  const lines = useMemo(() => {
    const ids = new Set(messages.map((m) => m.id));
    return [...messages, ...pending.filter((p) => !ids.has(p.id))];
  }, [messages, pending]);

  useEffect(() => {
    const node = streamRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines.length]);

  const submit = (formData: FormData) => {
    const body = String(formData.get("body") ?? "").trim();
    if (!body || !me || !patientId) return;

    unsent.current = draft;
    addPending({
      id: `pending:${Date.now()}`,
      authorId: me.id,
      author: me.name,
      initial: me.initial,
      body,
      when: "",
      at: new Date().toISOString(),
      context: null,
    });
    setDraft("");
    send(formData);
  };

  if (!patientId) return null;

  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-karsa-line sm:p-6">
      <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
        Pesan dari pendamping
      </h2>
      <p className="mt-1 text-[14px] leading-6 text-neutral-500">
        Semua obrolan dengan tim yang merawatmu, di satu tempat.
      </p>

      <div
        ref={streamRef}
        className="scrollbar-none relative mt-4 max-h-[46vh] min-h-[200px] overflow-y-auto overscroll-contain rounded-2xl px-3 py-4"
        style={{ backgroundColor: WALLPAPER }}
      >
        <HealthPattern className="text-[#6d5647]" opacity={0.13} />

        {lines.length === 0 && (
          <p className="relative mx-auto max-w-[34ch] py-10 text-center text-[14px] leading-6 text-neutral-500">
            Belum ada pesan. Sapa pendampingmu duluan juga boleh.
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

                  {line.context?.label && (
                    <p
                      className={`mt-0.5 mb-1 rounded-lg px-2 py-1 text-[11.5px] font-semibold leading-4 ${
                        mine ? "bg-white/15 text-white/85" : "bg-karsa-soft text-karsa-dark"
                      }`}
                    >
                      {line.context.label}
                    </p>
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
        <input type="hidden" name="patient_id" value={patientId} />

        <label htmlFor="patient-chat-draft" className="sr-only">
          Tulis pesan untuk pendamping
        </label>
        <textarea
          id="patient-chat-draft"
          name="body"
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={me ? "Tulis pesan untuk pendamping…" : "Masuk untuk mengobrol"}
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
    </section>
  );
}

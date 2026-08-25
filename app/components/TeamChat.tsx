"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BedDouble,
  Droplets,
  Gauge,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Pill,
  Play,
  Send,
  Utensils,
  X,
} from "lucide-react";
import HealthPattern from "./HealthPattern";
import { EASE } from "./List";
import { CHAT_DAY, ME, MESSAGES, SENDERS, type ChatMessage } from "../data/chat";
import { CONTEXT_LABEL, type CareContextType } from "../data/care";
import { sendCareMessage, type CareResult } from "../lib/care/actions";
import type { CareData } from "../lib/care/view";
import { colourFor } from "./avatarColour";


const LOG_ICON = {
  medication: Pill,
  meal: Utensils,
  fluid: Droplets,
  sleep: BedDouble,
  vital: Gauge,
} as const;

const mmss = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;


const WALLPAPER = "#f1ede3";

const WALLPAPER_INK = "text-[#6d5647]";


function Stamp({ time, mine }: { time: string; mine: boolean }) {
  return (
    <span
      className={`shrink-0 translate-y-[1px] text-[11px] tabular-nums ${
        mine ? "text-white/65" : "text-neutral-400"
      }`}
    >
      {time}
    </span>
  );
}


function LogEntry({ message }: { message: Extract<ChatMessage, { kind: "system" }> }) {
  const Icon = LOG_ICON[message.icon];

  return (
    <li className="flex justify-center px-6 py-2.5">
      <p
        className="max-w-[85%] text-balance text-center text-[12px] leading-[1.55] sm:max-w-[68%]"
        style={{ color: "rgba(92,76,60,0.62)" }}
      >
        <Icon
          size={12}
          strokeWidth={2.2}
          className="mr-1.5 inline-block align-[-1.5px] opacity-75"
        />
        <span className="font-semibold">{message.text}</span>
        {message.detail && <span className="opacity-80"> · {message.detail}</span>}
        <span className="tabular-nums opacity-70"> · {message.time}</span>
      </p>
    </li>
  );
}


function Bubble({
  message,
  head,
  senders,
  me,
}: {
  message: Exclude<ChatMessage, { kind: "system" }>;
  head: boolean;
  senders: typeof SENDERS;

  me: string;
}) {

  const sender = senders[message.from] ?? {
    id: message.from,
    name: "Seseorang",
    initial: "?",
    color: "#8b8b8b",
  };
  const mine = message.from === me;

  return (
    <li className={`flex gap-2 ${mine ? "flex-row-reverse" : ""} ${head ? "mt-2.5" : "mt-[3px]"}`}>
      {!mine &&
        (head ? (
          <span
            className="grid h-8 w-8 shrink-0 place-items-center self-start rounded-full text-[12px] font-bold text-white"
            style={{ backgroundColor: sender.color }}
          >
            {sender.initial}
          </span>
        ) : (

          <span aria-hidden className="w-8 shrink-0" />
        ))}

      <div
        className={`max-w-[82%] rounded-2xl px-3 py-1.5 shadow-[0_1px_2px_rgba(24,32,24,0.06)] sm:max-w-[68%] md:max-w-[56%] xl:max-w-[46%] ${
          mine
            ? `bg-karsa text-white ${head ? "rounded-tr-md" : ""}`
            : `bg-white text-neutral-800 ring-1 ring-karsa-line ${head ? "rounded-tl-md" : ""}`
        }`}
      >
        {head && !mine && (
          <p
            className="mb-0.5 text-[12.5px] font-semibold leading-4"
            style={{ color: sender.color }}
          >
            {sender.name}
          </p>
        )}

        {message.kind === "text" ? (

          <div className="flex items-end gap-2">
            <p className="min-w-0 text-[14.5px] leading-[1.45]">{message.text}</p>
            <Stamp time={message.time} mine={mine} />
          </div>
        ) : (
          <div className="flex items-end gap-3 py-0.5">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                mine ? "bg-white/20 text-white" : "bg-karsa-soft text-karsa-dark"
              }`}
            >
              <Play size={15} strokeWidth={2.4} className="ml-0.5" />
            </span>


            <span aria-hidden className="flex h-7 items-center gap-[3px]">
              {message.wave.map((height, i) => (
                <span
                  key={i}
                  className={`w-[3px] rounded-full ${mine ? "bg-white/55" : "bg-karsa/35"}`}
                  style={{ height: `${Math.max(15, height * 100)}%` }}
                />
              ))}
            </span>

            <span
              className={`shrink-0 text-[12px] tabular-nums ${
                mine ? "text-white/75" : "text-neutral-500"
              }`}
            >
              {mmss(message.length)}
            </span>
            <Stamp time={message.time} mine={mine} />
          </div>
        )}
      </div>
    </li>
  );
}


const PAD = "px-3 sm:px-4 md:px-6";

export default function TeamChat({
  context,
  height,
  data,
}: {

  context?: { type: CareContextType; label: string; detail?: string } | null;

  height?: string;
  data?: CareData;
}) {
  const [draft, setDraft] = useState("");
  const [attached, setAttached] = useState(context ?? null);
  const streamRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();


  const [state, send] = useActionState<CareResult, FormData>(sendCareMessage, {
    error: null,
  });

  useEffect(() => setAttached(context ?? null), [context]);


  const [pending, addPending] = useOptimistic<ChatMessage[], ChatMessage>(
    [],
    (list, message) => [...list, message],
  );


  const unsent = useRef("");

  useEffect(() => {
    if (state.error && unsent.current) {
      setDraft(unsent.current);
      unsent.current = "";
    }
    if (state.ok) unsent.current = "";
  }, [state.error, state.ok]);


  const messages: ChatMessage[] = useMemo(() => {
    if (!data) return MESSAGES;
    return data.messages.map((m) => ({
      kind: "text" as const,
      id: m.id,
      from: m.authorId,
      time: m.when,
      text: m.context ? `[${m.context.label}] ${m.body}` : m.body,
    }));
  }, [data]);


  const senders = useMemo(() => {
    if (!data) return SENDERS;
    return Object.fromEntries(
      data.group.members.map((m) => [
        m.id,
        { id: m.id, name: m.name, initial: m.initial, color: colourFor(m.id) },
      ]),
    ) as typeof SENDERS;
  }, [data]);

  const me = data?.me.id ?? ME;


  const submit = (formData: FormData) => {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return;

    unsent.current = draft;
    addPending({
      kind: "text",
      id: `pending:${Date.now()}`,
      from: me,

      time: "",
      text: attached ? `[${attached.label}] ${body}` : body,
    });

    setDraft("");
    setAttached(null);
    send(formData);
  };


  const thread = useMemo(() => [...messages, ...pending], [messages, pending]);

  const rows = useMemo(
    () =>
      thread.map((message, i) => {
        const previous = thread[i - 1];
        const head =
          message.kind === "system" ||
          !previous ||
          previous.kind === "system" ||
          previous.from !== message.from;
        return { message, head };
      }),
    [thread],
  );


  useEffect(() => {
    const stream = streamRef.current;
    if (stream) stream.scrollTop = stream.scrollHeight;
  }, [height, thread.length]);

  return (
    <section
      className="relative flex h-[calc(100svh-16rem-var(--bottom-nav))] min-h-[320px] flex-col"
      style={{ backgroundColor: WALLPAPER, ...(height ? { height } : null) }}
    >

      <HealthPattern className={WALLPAPER_INK} opacity={0.13} />


      <div
        ref={streamRef}
        className={`relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain py-4 ${PAD}`}
      >
        <p className="mx-auto mb-3 w-fit rounded-full bg-white/85 px-3.5 py-1 text-[12px] font-semibold text-neutral-500 shadow-[0_1px_2px_rgba(24,32,24,0.05)] ring-1 ring-karsa-line">
          {CHAT_DAY}
        </p>

        <ul>
          {rows.map(({ message, head }) =>
            message.kind === "system" ? (
              <LogEntry key={message.id} message={message} />
            ) : (
              <Bubble
                key={message.id}
                message={message}
                head={head}
                senders={senders}
                me={me}
              />
            ),
          )}
        </ul>

        {data && messages.length === 0 && (
          <p className="mx-auto mt-8 max-w-[34ch] text-balance text-center text-[14px] leading-6 text-neutral-500">
            Belum ada percakapan. Tulis pesan pertama untuk tim perawatan.
          </p>
        )}
      </div>


      <div
        className={`relative shrink-0 border-t border-karsa-line bg-karsa-cream pb-7 pt-2.5 sm:py-3 ${PAD}`}
      >
        {attached && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.2, ease: EASE }}
            className="mb-2.5 flex items-center gap-3 rounded-2xl bg-tint-sand px-4 py-3 ring-1 ring-edge-sand"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-karsa-dark ring-1 ring-edge-sand">
              <Paperclip size={16} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-karsa/70">
                {CONTEXT_LABEL[attached.type]}
              </p>
              <p className="truncate text-[14px] font-semibold text-neutral-800">
                {attached.label}
              </p>
              {attached.detail && (
                <p className="truncate text-[12.5px] text-neutral-500">{attached.detail}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setAttached(null)}
              aria-label="Lepas lampiran"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-neutral-400 outline-none transition-colors hover:bg-white hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              <X size={15} strokeWidth={2.4} />
            </button>
          </motion.div>
        )}

        {state.error && (
          <p role="alert" className="mb-2 text-[13px] font-medium text-rose-700">
            {state.error}
          </p>
        )}

        <form action={submit} className="flex items-end gap-2">
          <input type="hidden" name="patient_id" value={data?.activePatientId ?? ""} />

          <input type="hidden" name="context_type" value={attached?.type ?? ""} />
          <input type="hidden" name="context_label" value={attached?.label ?? ""} />
          <input type="hidden" name="context_detail" value={attached?.detail ?? ""} />
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Kirim foto"
              className="grid h-10 w-10 place-items-center rounded-full text-neutral-500 outline-none transition-colors hover:bg-karsa-canvas hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              <ImageIcon size={19} strokeWidth={1.9} />
            </button>
            <button
              type="button"
              aria-label="Lampirkan dokumen"
              className="grid h-10 w-10 place-items-center rounded-full text-neutral-500 outline-none transition-colors hover:bg-karsa-canvas hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              <Paperclip size={19} strokeWidth={1.9} />
            </button>
          </div>

          <label htmlFor="chat-draft" className="sr-only">
            Tulis pesan
          </label>
          <textarea
            id="chat-draft"
            name="body"
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}

            placeholder={data ? "Tulis pesan untuk tim…" : "Masuk untuk mengobrol"}
            className="min-h-[44px] flex-1 resize-none rounded-2xl bg-white px-4 py-3 text-[14.5px] leading-5 text-neutral-800 outline-none ring-1 ring-karsa-line placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:opacity-70"
          />


          {draft.trim() ? (
            <button
              type="submit"
              aria-label="Kirim pesan"
              disabled={!data}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-karsa text-white outline-none transition-colors hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              <Send size={18} strokeWidth={2.2} className="-ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Rekam pesan suara"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-karsa-dark outline-none ring-1 ring-karsa-line transition-colors hover:bg-karsa-soft focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              <Mic size={18} strokeWidth={2.1} />
            </button>
          )}
        </form>
      </div>
    </section>
  );
}

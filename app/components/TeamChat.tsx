"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BedDouble,
  CircleAlert,
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
import { EASE } from "./List";
import { CHAT_DAY, ME, MESSAGES, SENDERS, type ChatMessage } from "../data/chat";
import { FIXED_TONES } from "../data/careStats";
import { CONTEXT_LABEL, type CareContextType } from "../data/care";

/** Activity icons reuse the stat palette, so a dose in the thread looks like
 *  the same dose on the statistics tab. */
const LOG_ICON = {
  medication: { icon: Pill, bg: "#e6e0f7", ink: "#6a58ae" },
  meal: { icon: Utensils, bg: "#f9e2cb", ink: "#b06c34" },
  fluid: { icon: Droplets, bg: "#d5e5f4", ink: "#3f6a95" },
  sleep: { icon: BedDouble, bg: "#dcdef4", ink: "#4a4f8f" },
  vital: { icon: Gauge, bg: "#f9dde3", ink: "#a4495c" },
} as const;

const mmss = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** The patient's own log, dropped into the conversation. Deliberately not a
 *  bubble — nobody said it, so it shouldn't look like speech. */
function LogCard({ message }: { message: Extract<ChatMessage, { kind: "system" }> }) {
  const { icon: Icon, bg, ink } = LOG_ICON[message.icon];

  return (
    <li className="flex justify-center px-2">
      <div className="flex w-full max-w-md items-center gap-3.5 rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-karsa-line">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: bg, color: ink }}
        >
          <Icon size={17} strokeWidth={2.1} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold leading-5 text-neutral-800">
            {message.text}
          </p>
          {message.detail && (
            <p className="text-[12px] leading-4 text-neutral-500">{message.detail}</p>
          )}
        </div>
        <time className="shrink-0 text-[11.5px] tabular-nums text-neutral-400">
          {message.time}
        </time>
      </div>
    </li>
  );
}

function Bubble({ message }: { message: Exclude<ChatMessage, { kind: "system" }> }) {
  const sender = SENDERS[message.from];
  const mine = message.from === ME;

  return (
    <li className={`flex gap-2.5 px-2 ${mine ? "flex-row-reverse" : ""}`}>
      {!mine && (
        <span
          className="mt-auto grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white"
          style={{ backgroundColor: sender.color }}
        >
          {sender.initial}
        </span>
      )}

      <div className={`max-w-[76%] sm:max-w-[62%] ${mine ? "items-end" : ""}`}>
        {!mine && (
          <p className="mb-1 px-1 text-[12px] font-semibold" style={{ color: sender.color }}>
            {sender.name}
          </p>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 shadow-[0_1px_2px_rgba(24,32,24,0.05)] ${
            mine
              ? "rounded-br-md bg-karsa text-white"
              : "rounded-bl-md bg-white text-neutral-800 ring-1 ring-karsa-line"
          }`}
        >
          {message.kind === "text" ? (
            <p className="text-[14.5px] leading-6">{message.text}</p>
          ) : (
            <div className="flex items-center gap-3 py-0.5">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                  mine ? "bg-white/20 text-white" : "bg-karsa-soft text-karsa-dark"
                }`}
              >
                <Play size={15} strokeWidth={2.4} className="ml-0.5" />
              </span>

              {/* A drawn waveform — it stands for audio, it doesn't analyse it. */}
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
            </div>
          )}

          <p
            className={`mt-0.5 text-right text-[11px] tabular-nums ${
              mine ? "text-white/70" : "text-neutral-400"
            }`}
          >
            {message.time}
          </p>
        </div>
      </div>
    </li>
  );
}

/** The page's padding, so the thread lines up with everything above it even
 *  though the cream runs edge to edge. */
const PAD = "px-4 sm:px-6 md:px-8 xl:px-12";
/** Wide enough to feel like a room, narrow enough that a one-line message
 *  isn't stretched across a 1700px monitor. */
const COLUMN = "mx-auto w-full max-w-[980px]";

export default function TeamChat({
  context,
  height,
}: {
  /** Carried in from a "Diskusikan" link, pre-attached to the composer. */
  context?: { type: CareContextType; label: string; detail?: string } | null;
  /** Set by the shell to whatever is left of the viewport under the header. */
  height?: string;
}) {
  const [draft, setDraft] = useState("");
  const [attached, setAttached] = useState(context ?? null);
  const streamRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => setAttached(context ?? null), [context]);

  /** Open at the newest message, the way a chat should. Re-run when the shell
   *  hands down its measured height — the first pass lands before the pane has
   *  been sized, so there is nothing to scroll yet. */
  useEffect(() => {
    const stream = streamRef.current;
    if (stream) stream.scrollTop = stream.scrollHeight;
  }, [height]);

  return (
    <section
      className="flex h-[calc(100dvh-16rem)] min-h-[320px] flex-col bg-[#fbf9f1]"
      style={height ? { height } : undefined}
    >
      {/* The patient's live numbers, pinned above the thread — the context you
          need while talking about her, without leaving the tab. */}
      <div
        className={`flex h-10 shrink-0 items-center gap-2 overflow-x-auto border-b border-karsa-line/70 ${PAD}`}
      >
        <div className={`flex items-center gap-2 ${COLUMN}`}>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]"
            style={{
              backgroundColor: FIXED_TONES.fluid.bg,
              boxShadow: `inset 0 0 0 1px ${FIXED_TONES.fluid.edge}`,
            }}
          >
            <Droplets size={13} strokeWidth={2.2} style={{ color: FIXED_TONES.fluid.ink }} />
            <span className="text-neutral-500">Cairan</span>
            <span className="font-bold tabular-nums text-neutral-800">1.500 ml</span>
          </span>

          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]"
            style={{
              backgroundColor: FIXED_TONES.medication.bg,
              boxShadow: `inset 0 0 0 1px ${FIXED_TONES.medication.edge}`,
            }}
          >
            <Pill size={13} strokeWidth={2.2} style={{ color: FIXED_TONES.medication.ink }} />
            <span className="text-neutral-500">Obat</span>
            <span className="font-bold tabular-nums text-neutral-800">2/3</span>
          </span>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-info-50 px-2.5 py-1 text-[12px] ring-1 ring-info-edge">
            <CircleAlert size={13} strokeWidth={2.2} className="text-info-600" />
            <span className="font-semibold text-neutral-700">
              Obat diminum setelah makan
            </span>
          </span>
        </div>
      </div>

      <div ref={streamRef} className={`min-h-0 flex-1 overflow-y-auto py-6 ${PAD}`}>
        <div className={COLUMN}>
          <p className="mx-auto mb-5 w-fit rounded-full bg-white/80 px-3.5 py-1.5 text-[12px] font-semibold text-neutral-500 ring-1 ring-karsa-line">
            {CHAT_DAY}
          </p>

          <ul className="space-y-3.5">
            {MESSAGES.map((message) =>
              message.kind === "system" ? (
                <LogCard key={message.id} message={message} />
              ) : (
                <Bubble key={message.id} message={message} />
              ),
            )}
          </ul>
        </div>
      </div>

      {/* ── Composer ──────────────────────────────────────────────────── */}
      <div className={`shrink-0 border-t border-karsa-line bg-white/70 py-3 sm:py-4 ${PAD}`}>
        {attached && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.2, ease: EASE }}
            className={`mb-3 flex items-center gap-3 rounded-2xl bg-tint-sand px-4 py-3 ring-1 ring-edge-sand ${COLUMN}`}
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

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setDraft("");
          }}
          className={`flex items-end gap-2 ${COLUMN}`}
        >
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
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Tulis pesan untuk tim…"
            className="min-h-[44px] flex-1 resize-none rounded-2xl bg-white px-4 py-3 text-[14.5px] leading-5 text-neutral-800 outline-none ring-1 ring-karsa-line placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-karsa/40"
          />

          {/* Mic when there's nothing to send, send button once there is. */}
          {draft.trim() ? (
            <button
              type="submit"
              aria-label="Kirim pesan"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-karsa text-white outline-none transition-colors hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40 focus-visible:ring-offset-2"
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

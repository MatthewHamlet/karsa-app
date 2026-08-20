"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

/** Uncoloured on purpose — the log line is meant to recede, so the glyph is
 *  only there to say which kind of entry it is at a glance. */
const LOG_ICON = {
  medication: Pill,
  meal: Utensils,
  fluid: Droplets,
  sleep: BedDouble,
  vital: Gauge,
} as const;

const mmss = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** The room the thread sits in. The floor is a shade under the page's canvas so
 *  the white bubbles lift off it; the scattered health glyphs on top are the
 *  same wallpaper the assistant screen uses, in clay instead of green — this is
 *  a room in the same house, talking about the same person. */
const WALLPAPER = "#f1ede3";
/** Written out rather than built from a constant: Tailwind reads the source as
 *  text, so an interpolated class name compiles to nothing at all. */
const WALLPAPER_INK = "text-[#6d5647]";

/** The clock in the corner of a bubble. Sits on the last line of the text, so
 *  a two-word message stays two words wide. */
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

/** The patient's own log, dropped into the conversation. Nobody said it, so it
 *  isn't a bubble — and it isn't a card either: a card competes with the thread
 *  for attention it doesn't deserve. It's a faint line the eye can skip, warm
 *  grey so it belongs to the wallpaper rather than to the conversation. */
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

/** `head` marks the first message of a run from one sender. Only the head
 *  carries the avatar, the name and the tail — everything after it is the same
 *  person still talking, so it stacks tight and unlabelled. */
function Bubble({
  message,
  head,
}: {
  message: Exclude<ChatMessage, { kind: "system" }>;
  head: boolean;
}) {
  const sender = SENDERS[message.from];
  const mine = message.from === ME;

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
          /* Holds the avatar's column so the run stays in one line. */
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
          /* Text and clock share the last line — `items-end` keeps the stamp on
             the baseline of however many lines the message ran to. */
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
            <Stamp time={message.time} mine={mine} />
          </div>
        )}
      </div>
    </li>
  );
}

/** Deliberately tighter than the page's own padding: the thread is a room, not
 *  an article, so the bubbles run out to the edges and the width is spent on
 *  the conversation instead of on gutters. Line length is held by the bubbles'
 *  own max-widths, not by a centred column. */
const PAD = "px-3 sm:px-4 md:px-6";

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

  /* A log card between two of Sinta's messages breaks the run — she has to
     re-introduce herself on the other side of it, same as in any chat. */
  const rows = useMemo(
    () =>
      MESSAGES.map((message, i) => {
        const previous = MESSAGES[i - 1];
        const head =
          message.kind === "system" ||
          !previous ||
          previous.kind === "system" ||
          previous.from !== message.from;
        return { message, head };
      }),
    [],
  );

  /** Open at the newest message, the way a chat should. Re-run when the shell
   *  hands down its measured height — the first pass lands before the pane has
   *  been sized, so there is nothing to scroll yet. */
  useEffect(() => {
    const stream = streamRef.current;
    if (stream) stream.scrollTop = stream.scrollHeight;
  }, [height]);

  return (
    <section
      className="relative flex h-[calc(100dvh-16rem)] min-h-[320px] flex-col"
      style={{ backgroundColor: WALLPAPER, ...(height ? { height } : null) }}
    >
      {/* Pinned to the room, not to the thread: it sits outside the scroller,
          so the wallpaper stays put while the messages travel over it. */}
      <HealthPattern className={WALLPAPER_INK} opacity={0.13} />

      {/* `overscroll-contain` stops the bounce at the ends of the thread from
          being handed to the page behind it. */}
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
              <Bubble key={message.id} message={message} head={head} />
            ),
          )}
        </ul>
      </div>

      {/* ── Composer ──────────────────────────────────────────────────── */}
      <div
        className={`relative shrink-0 border-t border-karsa-line bg-karsa-cream py-2.5 sm:py-3 ${PAD}`}
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

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setDraft("");
          }}
          className="flex items-end gap-2"
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

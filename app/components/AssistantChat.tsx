"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Mic, Send, Sparkles } from "lucide-react";
import { GREETING, QUICK_ACTIONS, type Intent, type MascotState } from "../data/mascot";

export type ChatTurn = { id: string; from: "me" | "karsa"; text: string };

/** The conversation canvas. Owns no state of its own — the page runs the turn
 *  loop, this renders it, so the mascot on the right can never disagree with
 *  what the thread on the left says is happening. */
export default function AssistantChat({
  turns,
  draft,
  onDraft,
  onSend,
  onQuickAction,
  state,
}: {
  turns: ChatTurn[];
  draft: string;
  onDraft: (next: string) => void;
  onSend: (text: string) => void;
  onQuickAction: (intent: Intent) => void;
  state: MascotState;
}) {
  const reduce = useReducedMotion();
  const streamRef = useRef<HTMLDivElement>(null);
  const empty = turns.length === 0;

  /** Follow the conversation down as it grows, and while it is being answered. */
  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.scrollTo({ top: stream.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [turns, state, reduce]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || state === "thinking") return;
    onSend(text);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="Percakapan dengan Karsa">
      {/* ── Stream ──────────────────────────────────────────────────────── */}
      <div ref={streamRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 xl:px-8">
        <div className="mx-auto w-full max-w-[760px] space-y-5">
          {/* Greeting. Not a bubble — nobody sent it, and dressing it as a
              message would start the thread with a turn that never happened.
              No mascot here either: it lives on the stage, and two of it on one
              screen would be two characters, not one. */}
          <div className="pb-1">
            <h2 className="font-nohemi text-[21px] font-bold tracking-tight text-neutral-800 sm:text-[24px]">
              Ada yang bisa kubantu?
            </h2>
            <p className="mt-2 max-w-[52ch] text-[14.5px] leading-6 text-neutral-600">
              {GREETING}
            </p>
          </div>

          <AnimatePresence initial={false}>
            {turns.map((turn) => (
              <motion.div
                key={turn.id}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }
                }
                className={`flex gap-2.5 ${turn.from === "me" ? "flex-row-reverse" : ""}`}
              >
                {turn.from === "karsa" && (
                  <span className="mt-auto grid h-8 w-8 shrink-0 place-items-center rounded-full bg-karsa-soft text-karsa-dark ring-1 ring-karsa/15">
                    <Sparkles size={15} strokeWidth={2.2} />
                  </span>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-[14.5px] leading-6 sm:max-w-[72%] ${
                    turn.from === "me"
                      ? "rounded-br-md bg-karsa text-white"
                      : "rounded-bl-md bg-white text-neutral-800 ring-1 ring-karsa-line"
                  }`}
                >
                  {turn.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing. Same shape as a reply so the answer doesn't jump when it
              lands — only the dots are replaced by words. */}
          <AnimatePresence>
            {state === "thinking" && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.2 }}
                className="flex gap-2.5"
              >
                <span className="mt-auto grid h-8 w-8 shrink-0 place-items-center rounded-full bg-karsa-soft text-karsa-dark ring-1 ring-karsa/15">
                  <Sparkles size={15} strokeWidth={2.2} />
                </span>
                <div
                  role="status"
                  aria-label="Karsa sedang menyiapkan jawaban"
                  className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-white px-4 py-4 ring-1 ring-karsa-line"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={reduce ? {} : { opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { duration: 1.1, repeat: Infinity, delay: i * 0.15 }
                      }
                      className="h-1.5 w-1.5 rounded-full bg-karsa"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Composer ────────────────────────────────────────────────────────
          Floating and glassy: it sits over the thread rather than closing it
          off, so the last message stays legible as it scrolls under. */}
      <div className="shrink-0 px-4 pb-4 sm:px-6 sm:pb-5 xl:px-8">
        <div className="mx-auto w-full max-w-[760px] rounded-3xl border border-white/70 bg-white/70 p-2 shadow-[0_18px_44px_-24px_rgba(24,32,24,0.5)] backdrop-blur-xl">
          <form onSubmit={submit} className="flex items-end gap-2">
            <label htmlFor="karsa-draft" className="sr-only">
              Tulis pesan untuk Karsa
            </label>
            <textarea
              id="karsa-draft"
              rows={1}
              value={draft}
              onChange={(event) => onDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) submit(event);
              }}
              placeholder="Tanya apa saja tentang perawatan Meimei…"
              className="min-h-[44px] flex-1 resize-none bg-transparent px-3 py-3 text-[14.5px] leading-5 text-neutral-800 outline-none placeholder:text-neutral-400"
            />

            <button
              type="button"
              aria-label="Bicara dengan Karsa"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-karsa-dark outline-none ring-1 ring-karsa-line transition-colors duration-200 hover:bg-karsa-soft focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              <Mic size={18} strokeWidth={2.1} />
            </button>

            <button
              type="submit"
              disabled={!draft.trim() || state === "thinking"}
              aria-label="Kirim pesan"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-karsa text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              <Send size={18} strokeWidth={2.2} className="-ml-0.5" />
            </button>
          </form>

          {/* Quick actions live with the input, and only until the thread has
              somewhere to go — once a conversation exists they are clutter. */}
          <AnimatePresence initial={false}>
            {empty && (
              <motion.div
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 px-1 pb-1 pt-2.5">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.intent}
                      type="button"
                      onClick={() => onQuickAction(action.intent)}
                      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold outline-none ring-1 transition-colors duration-200 focus-visible:ring-2 ${
                        action.urgent
                          ? "bg-rose-600 text-white ring-rose-600 hover:bg-rose-700 focus-visible:ring-rose-300"
                          : "bg-white/80 text-neutral-700 ring-karsa-line hover:bg-white focus-visible:ring-karsa/40"
                      }`}
                    >
                      <span aria-hidden>{action.emoji}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

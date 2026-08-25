"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Mic, Send } from "lucide-react";
import MascotAvatar from "./MascotAvatar";
import CareActionCards from "./CareActionCards";
import {
  QUICK_ACTIONS,
  type ActionCard,
  type Intent,
  type MascotState,
} from "../data/mascot";


export type ChatTurn = {
  id: string;
  from: "me" | "karsa";
  text: string;
  cards?: ActionCard[];
};


function KarsaMark() {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center self-end rounded-full bg-karsa-soft ring-1 ring-karsa/15">
      <MascotAvatar state="idle" className="h-6 w-6" />
    </span>
  );
}


export default function AssistantChat({
  turns,
  draft,
  onDraft,
  onSend,
  onQuickAction,
  state,
  greeting,
}: {
  turns: ChatTurn[];
  draft: string;
  onDraft: (next: string) => void;
  onSend: (text: string) => void;
  onQuickAction: (intent: Intent) => void;
  state: MascotState;
  greeting: string;
}) {
  const reduce = useReducedMotion();
  const streamRef = useRef<HTMLDivElement>(null);
  const empty = turns.length === 0;


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

    <section
      className="relative flex min-h-0 flex-1 flex-col"
      aria-label="Percakapan dengan Arsa"
    >

      <div
        ref={streamRef}
        className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-none px-4 pb-32 pt-5 sm:px-6 xl:px-8"
      >

        <div
          className={`mx-auto w-full max-w-[760px] ${
            empty ? "flex min-h-full flex-col items-center justify-center text-center" : "space-y-5"
          }`}
        >

          {empty && (
            <div className="pb-1">

              <MascotAvatar
                state={state}
                className="mx-auto mb-3 h-28 w-28 sm:h-32 sm:w-32 lg:hidden"
              />
              <h2 className="font-nohemi text-[21px] font-bold tracking-tight text-neutral-800 sm:text-[24px]">
                Ada yang bisa kubantu?
              </h2>
              <p className="mx-auto mt-2 max-w-[52ch] text-[14.5px] leading-6 text-neutral-600">
                {greeting}
              </p>
            </div>
          )}

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
                {turn.from === "karsa" && <KarsaMark />}

                <div className={`min-w-0 max-w-[80%] ${turn.from === "me" ? "" : "flex-1"}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-[14.5px] font-medium leading-6 ${
                      turn.from === "me"
                        ? "rounded-br-md bg-karsa text-white"
                        : "rounded-bl-md bg-white text-neutral-900 ring-1 ring-karsa-line"
                    }`}
                  >
                    {turn.text}
                  </div>


                  {turn.cards && turn.cards.length > 0 && (
                    <div className="mt-2.5">
                      <CareActionCards cards={turn.cards} />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>


          <AnimatePresence initial={false}>
            {state === "thinking" && (
              <motion.div
                key="thinking"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.97 }}
                transition={reduce ? { duration: 0 } : { duration: 0.2 }}
                className="flex gap-2.5"
              >
                <KarsaMark />


                <div role="status" aria-label="Arsa sedang berpikir" className="flex items-center gap-1.5 self-end pb-2">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      aria-hidden
                      animate={
                        reduce
                          ? {}
                          : {

                              opacity: [0.18, i <= 0 ? 1 : 0.18, i <= 1 ? 1 : 0.18, 1, 0.18],
                              scale: [0.85, i <= 0 ? 1 : 0.85, i <= 1 ? 1 : 0.85, 1, 0.85],
                            }
                      }
                      transition={
                        reduce
                          ? { duration: 0 }
                          : {
                              duration: 1.4,
                              times: [0, 0.25, 0.5, 0.75, 1],
                              repeat: Infinity,
                              ease: "easeOut",
                            }
                      }
                      className="h-2 w-2 rounded-full bg-karsa"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>


      <div className="absolute inset-x-0 bottom-3 z-10 px-4 sm:px-6 xl:px-8">
        <div className="mx-auto w-full max-w-[760px] rounded-[28px] border border-white/70 bg-white/90 p-1.5 shadow-[0_8px_20px_-8px_rgba(24,32,24,0.18),0_24px_48px_-24px_rgba(24,32,24,0.45)] backdrop-blur-xl">
          <form onSubmit={submit} className="flex items-end gap-1.5">
            <label htmlFor="karsa-draft" className="sr-only">
              Tulis pesan untuk Arsa
            </label>
            <textarea
              id="karsa-draft"
              rows={1}
              value={draft}
              onChange={(event) => onDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) submit(event);
              }}
              placeholder="Tanya apa saja tentang perawatan hari ini…"
              className="min-h-[44px] flex-1 resize-none rounded-full bg-transparent px-4 py-3 text-[14.5px] leading-5 text-neutral-800 outline-none placeholder:text-neutral-400"
            />

            <button
              type="button"
              aria-label="Bicara dengan Arsa"
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

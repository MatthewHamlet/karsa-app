"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle, ShieldAlert, Sparkles, Wifi } from "lucide-react";
import AssistantChat, { type ChatTurn } from "../components/AssistantChat";
import MascotStage from "../components/MascotStage";
import {
  PATIENT,
  PROMPT_FOR,
  REPLIES,
  type ActionCard,
  type Intent,
  type MascotState,
} from "../data/mascot";

/** How long the mascot spends thinking, and how long it holds its pointing pose
 *  before settling back. Both are stand-ins for a real request. */
const THINKING_MS = 1500;
const PRESENTING_MS = 4200;

/** Which canned answer a free-typed message gets. Keyword matching, not
 *  understanding — enough for the page to behave believably while it is
 *  designed, and the one place to replace when a model goes behind it. */
function intentFor(text: string): Intent {
  const t = text.toLowerCase();
  if (/(darurat|gawat|sesak|pingsan|jatuh|ambulan|nyeri dada|119)/.test(t)) return "urgent";
  if (/(obat|dosis|minum obat|amlodipine|metformin)/.test(t)) return "meds";
  if (/(tensi|tekanan darah|detak|jantung|vital|suhu|bpm)/.test(t)) return "vitals";
  return "general";
}

type MobileView = "chat" | "stage";

export default function MascotAssistant() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<MascotState>("idle");
  const [cards, setCards] = useState<ActionCard[]>([]);
  const [view, setView] = useState<MobileView>("chat");
  const reduce = useReducedMotion();

  /* One turn is two timers deep, and either can outlive the component if the
     caregiver navigates away mid-answer. */
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const ask = (text: string, intent: Intent) => {
    if (state === "thinking") return;

    timers.current.forEach(window.clearTimeout);
    timers.current = [];

    setTurns((prev) => [...prev, { id: `me-${Date.now()}`, from: "me", text }]);
    setDraft("");
    setCards([]);
    setState("thinking");

    timers.current.push(
      window.setTimeout(() => {
        const reply = REPLIES[intent];
        setTurns((prev) => [
          ...prev,
          { id: `karsa-${Date.now()}`, from: "karsa", text: reply.text },
        ]);
        setCards(reply.cards);
        setState("presenting");

        /* The pose is a gesture, not a mode: it hands the cards over and then
           goes back to waiting. The cards stay. */
        timers.current.push(
          window.setTimeout(() => setState("idle"), PRESENTING_MS),
        );
      }, THINKING_MS),
    );
  };

  const send = (text: string) => ask(text, intentFor(text));

  const quickAction = (intent: Intent) => {
    ask(PROMPT_FOR[intent], intent);
    /* On a phone the answer arrives on the other tab, so go with it. */
    setView("stage");
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-karsa-canvas">
      <PatientBanner />

      {/* Below `lg` the two panels are one at a time — a 40% stage on a phone is
          a strip, and a chat you cannot read is worse than a chat you switch to. */}
      <div className="shrink-0 border-b border-karsa-line bg-white/60 px-4 py-2 backdrop-blur-sm lg:hidden">
        <div
          role="tablist"
          aria-label="Tampilan asisten"
          className="relative grid grid-cols-2 rounded-full bg-karsa-soft p-1"
        >
          <span
            aria-hidden
            style={{ transform: `translateX(${view === "stage" ? "100%" : "0%"})` }}
            className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-[0_1px_3px_rgba(24,32,24,0.12)] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
          />
          {(
            [
              { key: "chat", label: "Percakapan", icon: MessageCircle },
              { key: "stage", label: "Karsa & Tindakan", icon: Sparkles },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setView(item.key)}
                className={`relative inline-flex items-center justify-center gap-2 rounded-full py-2 text-[13px] font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
                  active ? "text-karsa-dark" : "text-neutral-500"
                }`}
              >
                <Icon size={15} strokeWidth={2.2} />
                {item.label}
                {item.key === "stage" && cards.length > 0 && !active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-karsa" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Split stage ──────────────────────────────────────────────────── */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className={`min-h-0 ${view === "chat" ? "flex" : "hidden"} flex-col lg:flex`}>
          <AssistantChat
            turns={turns}
            draft={draft}
            onDraft={setDraft}
            onSend={send}
            onQuickAction={quickAction}
            state={state}
          />
        </div>

        <motion.aside
          aria-label="Karsa dan kartu tindakan"
          initial={false}
          animate={{
            backgroundColor: state === "thinking" ? "#f0f4ee" : "#f7f5ee",
          }}
          transition={reduce ? { duration: 0 } : { duration: 0.5 }}
          className={`min-h-0 ${view === "stage" ? "flex" : "hidden"} flex-col border-karsa-line lg:flex lg:border-l`}
        >
          <MascotStage state={state} cards={cards} />
        </motion.aside>
      </div>
    </div>
  );
}

/** Who this is about, and the two facts that change what is safe to suggest.
 *  Kept to one line so it can stay on screen the whole session. */
function PatientBanner() {
  return (
    <header className="shrink-0 border-b border-karsa-line bg-white/70 px-4 py-3 backdrop-blur-sm sm:px-6 xl:px-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="font-nohemi text-[16px] font-bold tracking-tight text-neutral-800">
            Maskot Karsa
          </h1>
          <span className="hidden h-4 w-px bg-karsa-line sm:block" />
          <p className="truncate text-[13px] text-neutral-600">
            Merawat{" "}
            <span className="font-semibold text-neutral-800">
              {PATIENT.name}, {PATIENT.age}
            </span>
          </p>
        </div>

        <ul className="flex min-w-0 flex-wrap items-center gap-1.5">
          {PATIENT.alerts.map((alert) => (
            <li
              key={alert}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11.5px] font-semibold text-rose-700 ring-1 ring-rose-100"
            >
              <ShieldAlert size={12} strokeWidth={2.4} />
              {alert}
            </li>
          ))}
        </ul>

        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-act-50 px-2.5 py-1 text-[11.5px] font-semibold text-act-600 ring-1 ring-act-edge">
          <Wifi size={12} strokeWidth={2.4} />
          Terhubung
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-act-600 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-act-600" />
          </span>
        </span>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { History, MessageCircle, ShieldAlert } from "lucide-react";
import AssistantChat, { type ChatTurn } from "../components/AssistantChat";
import HealthPattern from "../components/HealthPattern";
import MascotStage from "../components/MascotStage";
import { THINK_SEQUENCE_MS } from "../components/MascotAvatar";
import Modal from "../components/Modal";
import {
  HISTORY,
  PATIENT,
  PROMPT_FOR,
  REPLIES,
  type HistorySession,
  type Intent,
  type MascotState,
} from "../data/mascot";

/** How long the mascot spends thinking, and how long it holds its pointing pose
 *  before settling back. Both are stand-ins for a real request. */
/** Long enough for the whole thinking sequence to land — equations, the bulb,
 *  then the jolt. Shorter and the answer arrives on top of the punchline.
 *  `THINK_SEQUENCE_MS` is what the mascot actually needs; the extra beat lets
 *  the shock read before the cards slide in. */
const THINKING_MS = THINK_SEQUENCE_MS + 300;
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

export default function MascotAssistant() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<MascotState>("idle");
  const [historyOpen, setHistoryOpen] = useState(false);

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
    setState("thinking");

    timers.current.push(
      window.setTimeout(() => {
        const reply = REPLIES[intent];
        /* The cards ride on the reply. Past answers keep theirs, so scrolling
           back up finds the whole exchange intact rather than a bare sentence
           whose buttons were replaced by the next question's. */
        setTurns((prev) => [
          ...prev,
          {
            id: `karsa-${Date.now()}`,
            from: "karsa",
            text: reply.text,
            cards: reply.cards,
          },
        ]);
        setState("presenting");

        /* The pose is a gesture, not a mode: it hands the cards over and then
           goes back to waiting. */
        timers.current.push(
          window.setTimeout(() => setState("idle"), PRESENTING_MS),
        );
      }, THINKING_MS),
    );
  };

  const send = (text: string) => ask(text, intentFor(text));

  /** Reopening a past session restores its whole thread. Any answer still in
     flight is cancelled first — otherwise a reply from the conversation the
     caregiver just left would land on top of the one they opened. */
  const openSession = (session: HistorySession) => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];

    setTurns(session.turns.map((turn, i) => ({ id: `${session.id}-${i}`, ...turn })));
    setState("idle");
    setDraft("");
    setHistoryOpen(false);
  };

  const quickAction = (intent: Intent) => ask(PROMPT_FOR[intent], intent);

  return (
    <div className="flex h-[calc(100dvh-var(--bottom-nav))] flex-col bg-karsa-canvas">
      <PatientBanner onHistory={() => setHistoryOpen(true)} />

      {/* ── Stage ────────────────────────────────────────────────────────
          One column on a phone. The tab switcher that used to sit here paid a
          row of chrome for a second panel, and the only thing on that panel a
          caregiver needed — the action cards — now arrives in the thread under
          the answer that produced it. Nothing left to switch to. */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* The thread's room. The wallpaper is scattered rather than tiled-
            looking on purpose: this is the one screen a caregiver sits inside
            for a while, and a bare canvas made it read like a form. */}
        <div className="relative flex min-h-0 flex-col">
          <HealthPattern className="text-karsa-dark" opacity={0.14} />

          <AssistantChat
            turns={turns}
            draft={draft}
            onDraft={setDraft}
            onSend={send}
            onQuickAction={quickAction}
            state={state}
          />
        </div>

        {/* Karsa keeps a presence beside the thread from `lg` — where there is
            width going spare — and nowhere else. The state-driven tint used to
            live on this element's background; the room fills the panel now, so
            it moved inside as a wash over the scene. */}
        <aside
          aria-label="Karsa"
          className="hidden min-h-0 flex-col border-karsa-line lg:flex lg:border-l"
        >
          <MascotStage state={state} />
        </aside>
      </div>

      <HistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onOpenSession={openSession}
      />
    </div>
  );
}

/** Past sessions, newest first, grouped by the day they happened on.
 *
 *  Each entry shows the caregiver's own opening line rather than a generated
 *  title — you recognise a conversation by what you asked, not by what it was
 *  filed as. Picking one loads the whole thread back into the page. */
function HistoryModal({
  open,
  onClose,
  onOpenSession,
}: {
  open: boolean;
  onClose: () => void;
  onOpenSession: (session: HistorySession) => void;
}) {
  const days = HISTORY.reduce<{ day: string; sessions: HistorySession[] }[]>((acc, session) => {
    const last = acc[acc.length - 1];
    if (last && last.day === session.day) last.sessions.push(session);
    else acc.push({ day: session.day, sessions: [session] });
    return acc;
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Riwayat percakapan"
      description="Percakapan sebelumnya dengan Karsa. Pilih satu untuk membukanya kembali."
      size="lg"
    >
      <div className="space-y-6">
        {days.map((group) => (
          <section key={group.day}>
            <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-neutral-400">
              {group.day}
            </h3>

            <ul className="divide-y divide-karsa-line/70 overflow-hidden rounded-2xl bg-white ring-1 ring-karsa-line">
              {group.sessions.map((session) => {
                const opener = session.turns.find((turn) => turn.from === "me");

                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      onClick={() => onOpenSession(session)}
                      className="group/row flex w-full items-start gap-3.5 px-4 py-3.5 text-left outline-none transition-colors duration-200 hover:bg-karsa-canvas/60 focus-visible:bg-karsa-canvas/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40"
                    >
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-karsa-soft text-karsa-dark">
                        <MessageCircle size={16} strokeWidth={2.2} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-bold leading-5 text-neutral-800">
                          {session.title}
                        </span>
                        {opener && (
                          <span className="mt-0.5 block truncate text-[13px] leading-5 text-neutral-500">
                            {opener.text}
                          </span>
                        )}
                        <span className="mt-1 block text-[12px] tabular-nums text-neutral-400">
                          {session.time} · {session.turns.length} pesan
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}

/** Who this is about, and the two facts that change what is safe to suggest.
 *  Kept to one line so it can stay on screen the whole session. */
function PatientBanner({ onHistory }: { onHistory: () => void }) {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!alertsOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAlertsOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!alertsRef.current?.contains(event.target as Node)) setAlertsOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [alertsOpen]);

  return (
    /* One line, always. The alerts used to sit out here as two full pills and
       wrapped to a second row on a phone, which cost the thread a chunk of the
       screen to say something that doesn't change all day. They live behind the
       count now — present, and one tap from being read in full. */
    <header className="shrink-0 border-b border-karsa-line bg-white/70 px-4 py-2 backdrop-blur-sm sm:px-6 xl:px-8">
      <div className="flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-nohemi text-[15px] font-bold leading-5 tracking-tight text-neutral-800">
            Maskot Karsa
          </h1>
          <p className="truncate text-[12px] leading-4 text-neutral-500">
            Merawat{" "}
            <span className="font-semibold text-neutral-700">
              {PATIENT.name}, {PATIENT.age}
            </span>
          </p>
        </div>

        <div ref={alertsRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setAlertsOpen((open) => !open)}
            aria-expanded={alertsOpen}
            aria-label={`Peringatan medis (${PATIENT.alerts.length})`}
            className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1.5 text-[12px] font-bold text-rose-700 outline-none ring-1 ring-rose-100 transition-colors duration-200 hover:bg-rose-100 focus-visible:ring-2 focus-visible:ring-rose-300"
          >
            <ShieldAlert size={14} strokeWidth={2.4} aria-hidden />
            <span className="tabular-nums">{PATIENT.alerts.length}</span>
          </button>

          {alertsOpen && (
            <div
              role="dialog"
              aria-label="Peringatan medis"
              className="absolute right-0 z-40 mt-2 w-[15rem] rounded-2xl bg-white p-2.5 shadow-[0_1px_2px_rgba(24,32,24,0.04),0_20px_44px_-24px_rgba(24,32,24,0.45)] ring-1 ring-karsa-line"
            >
              <p className="px-1 pb-2 text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-neutral-400">
                Perlu diperhatikan
              </p>
              <ul className="space-y-1.5">
                {PATIENT.alerts.map((alert) => (
                  <li
                    key={alert}
                    className="flex items-start gap-2 rounded-xl bg-rose-50 px-2.5 py-2 text-[13px] font-semibold leading-5 text-rose-700 ring-1 ring-rose-100"
                  >
                    <ShieldAlert size={14} strokeWidth={2.4} className="mt-0.5 shrink-0" />
                    {alert}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Was a "Terhubung" status pill. A connection light is only worth the
            corner when it is off, and this one never is — so the space goes to
            the thing a caregiver actually reaches for: what Karsa said before. */}
        <button
          type="button"
          onClick={onHistory}
          aria-label="Riwayat percakapan"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[12px] font-semibold text-neutral-700 outline-none ring-1 ring-karsa-line transition-colors duration-200 hover:bg-karsa-soft hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40 sm:px-3"
        >
          <History size={14} strokeWidth={2.4} aria-hidden />
          <span className="hidden sm:inline">Riwayat</span>
        </button>
      </div>
    </header>
  );
}

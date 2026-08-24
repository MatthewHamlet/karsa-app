"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { History, MessageCircle, ShieldAlert, Trash2 } from "lucide-react";
import { clearAssistantHistory, deleteAssistantThread } from "../lib/assistant/actions";
import AssistantChat, { type ChatTurn } from "../components/AssistantChat";
import HealthPattern from "../components/HealthPattern";
import MascotStage from "../components/MascotStage";
import Modal from "../components/Modal";
import {
  greetingFor,
  promptFor,
  type HistorySession,
  type Intent,
  type MascotState,
} from "../data/mascot";

const PRESENTING_MS = 2400;

export type MascotAssistantProps = {
  patientName: string;
  patientAge: number | null;
  viewerName: string;
  alerts: string[];
  history: HistorySession[];
  ready: boolean;
};

export default function MascotAssistant({
  patientName,
  patientAge,
  viewerName,
  alerts,
  history,
  ready,
}: MascotAssistantProps) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<MascotState>("idle");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [threads, setThreads] = useState(history);

  useEffect(() => setThreads(history), [history]);

  const threadRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const settleRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (settleRef.current !== null) window.clearTimeout(settleRef.current);
    },
    [],
  );

  const ask = async (text: string) => {
    if (state === "thinking") return;

    if (settleRef.current !== null) window.clearTimeout(settleRef.current);
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    const replyId = `karsa-${Date.now()}`;
    setTurns((prev) => [...prev, { id: `me-${Date.now()}`, from: "me", text }]);
    setDraft("");
    setState("thinking");

    const settle = (message: string) => {
      setTurns((prev) => [...prev, { id: replyId, from: "karsa", text: message }]);
      setState("idle");
    };

    try {
      const response = await fetch("/api/mascot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, threadId: threadRef.current }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        settle(
          (payload as { error?: string } | null)?.error ??
            "Maskot sedang tidak bisa dihubungi. Coba lagi sebentar lagi.",
        );
        return;
      }

      threadRef.current = response.headers.get("X-Thread-Id") ?? threadRef.current;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let started = false;

      /* The bubble is created by the first chunk, not before it: an empty
         bubble sitting under the thinking dots reads as a failed answer. */
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const piece = decoder.decode(value, { stream: true });
        if (!piece) continue;
        full += piece;

        if (!started) {
          started = true;
          setState("presenting");
          setTurns((prev) => [...prev, { id: replyId, from: "karsa", text: full }]);
        } else {
          setTurns((prev) =>
            prev.map((turn) => (turn.id === replyId ? { ...turn, text: full } : turn)),
          );
        }
      }

      if (!started) {
        settle("Maaf, aku belum punya jawaban untuk itu. Coba tanya dengan cara lain ya.");
        return;
      }

      settleRef.current = window.setTimeout(() => setState("idle"), PRESENTING_MS);
    } catch (error) {
      if ((error as { name?: string })?.name === "AbortError") return;
      settle("Koneksi terputus. Coba tanya lagi ya.");
    }
  };

  const openSession = (session: HistorySession) => {
    abortRef.current?.abort();
    if (settleRef.current !== null) window.clearTimeout(settleRef.current);

    threadRef.current = session.id;
    setTurns(session.turns.map((turn, i) => ({ id: `${session.id}-${i}`, ...turn })));
    setState("idle");
    setDraft("");
    setHistoryOpen(false);
  };

  const quickAction = (intent: Intent) => {
    const prompt = promptFor(intent, patientName);
    if (prompt) void ask(prompt);
  };

  return (
    <div className="flex h-[calc(100dvh-var(--bottom-nav))] flex-col bg-karsa-canvas">
      <PatientBanner
        patientName={patientName}
        patientAge={patientAge}
        alerts={alerts}
        onHistory={() => setHistoryOpen(true)}
      />

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

          {ready ? (
            <AssistantChat
              turns={turns}
              draft={draft}
              onDraft={setDraft}
              onSend={(text) => void ask(text)}
              onQuickAction={quickAction}
              state={state}
              greeting={greetingFor(patientName, viewerName)}
            />
          ) : (
            <NotReady />
          )}
        </div>

        {/* Karsa keeps a presence beside the thread from `lg` — where there is
            width going spare — and nowhere else. The state-driven tint used to
            live on this element's background; the room fills the panel now, so
            it moved inside as a wash over the scene. */}
        <aside
          aria-label="Arsa"
          className="hidden min-h-0 flex-col border-karsa-line lg:flex lg:border-l"
        >
          <MascotStage state={state} />
        </aside>
      </div>

      <HistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onOpenSession={openSession}
        history={threads}
        onForget={(ids) => {
          setThreads((prev) => prev.filter((t) => !ids.includes(t.id)));
          if (threadRef.current && ids.includes(threadRef.current)) {
            threadRef.current = null;
            setTurns([]);
            setState("idle");
          }
        }}
      />
    </div>
  );
}

/** The mascot answers from the patient's own record. Without one there is
 *  nothing to personalise against, and a general chatbot on a care page is
 *  worse than an honest empty state. */
function NotReady() {
  return (
    <div className="relative grid flex-1 place-items-center px-6 text-center">
      <div className="max-w-[38ch]">
        <h2 className="font-nohemi text-[20px] font-bold tracking-tight text-neutral-800">
          Maskot belum bisa dimulai
        </h2>
        <p className="mt-2 text-[14.5px] leading-6 text-neutral-600">
          Hubungkan satu pasien dulu lewat kode undangan atau QR. Setelah itu Arsa
          bisa menjawab berdasarkan catatan perawatan yang sebenarnya.
        </p>
      </div>
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
  history,
  onForget,
}: {
  open: boolean;
  onClose: () => void;
  onOpenSession: (session: HistorySession) => void;
  history: HistorySession[];
  onForget: (ids: string[]) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setConfirmId(null);
      setConfirmAll(false);
      setError(null);
    }
  }, [open]);

  const removeOne = (id: string) =>
    startTransition(async () => {
      const result = await deleteAssistantThread(id);
      if (result.error) return setError(result.error);
      setConfirmId(null);
      setError(null);
      onForget([id]);
    });

  const removeAll = () =>
    startTransition(async () => {
      const result = await clearAssistantHistory();
      if (result.error) return setError(result.error);
      setConfirmAll(false);
      setError(null);
      onForget(history.map((s) => s.id));
    });

  const days = history.reduce<{ day: string; sessions: HistorySession[] }[]>((acc, session) => {
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
      description="Percakapan sebelumnya dengan Arsa. Pilih satu untuk membukanya kembali."
      size="lg"
    >
      {days.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-8 text-center text-[14px] leading-6 text-neutral-500 ring-1 ring-karsa-line">
          Belum ada percakapan. Yang kamu tanyakan hari ini akan tersimpan di sini.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12.5px] leading-5 text-neutral-500">
              {history.length} percakapan tersimpan
            </p>

            {confirmAll ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[12.5px] font-semibold text-rose-700">
                  Hapus semua?
                </span>
                <button
                  type="button"
                  onClick={removeAll}
                  disabled={pending}
                  className="rounded-full bg-rose-600 px-3 py-1.5 text-[12.5px] font-bold text-white outline-none transition-colors duration-200 hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-300 disabled:opacity-60"
                >
                  Ya, hapus
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAll(false)}
                  disabled={pending}
                  className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-neutral-600 outline-none transition-colors duration-200 hover:bg-karsa-canvas focus-visible:ring-2 focus-visible:ring-karsa/40"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setConfirmAll(true);
                  setConfirmId(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-rose-700 outline-none ring-1 ring-rose-100 transition-colors duration-200 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-300"
              >
                <Trash2 size={13} strokeWidth={2.3} aria-hidden />
                Hapus semua
              </button>
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-[12.5px] font-semibold text-rose-700 ring-1 ring-rose-100">
              {error}
            </p>
          )}

          {days.map((group) => (
            <section key={group.day}>
              <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-neutral-400">
                {group.day}
              </h3>

              <ul className="divide-y divide-karsa-line/70 overflow-hidden rounded-2xl bg-white ring-1 ring-karsa-line">
                {group.sessions.map((session) => {
                  const opener = session.turns.find((turn) => turn.from === "me");

                  return (
                    <li key={session.id} className="flex items-stretch">
                      <button
                        type="button"
                        onClick={() => onOpenSession(session)}
                        className="group/row flex min-w-0 flex-1 items-start gap-3.5 py-3.5 pl-4 pr-2 text-left outline-none transition-colors duration-200 hover:bg-karsa-canvas/60 focus-visible:bg-karsa-canvas/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40"
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

                      {confirmId === session.id ? (
                        <span className="flex shrink-0 items-center gap-1 pr-2.5">
                          <button
                            type="button"
                            onClick={() => removeOne(session.id)}
                            disabled={pending}
                            className="rounded-full bg-rose-600 px-2.5 py-1.5 text-[12px] font-bold text-white outline-none transition-colors duration-200 hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-300 disabled:opacity-60"
                          >
                            Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            disabled={pending}
                            className="rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-neutral-600 outline-none transition-colors duration-200 hover:bg-karsa-canvas focus-visible:ring-2 focus-visible:ring-karsa/40"
                          >
                            Batal
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmId(session.id);
                            setConfirmAll(false);
                          }}
                          aria-label={`Hapus percakapan ${session.title}`}
                          className="grid w-11 shrink-0 place-items-center text-neutral-400 outline-none transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-300"
                        >
                          <Trash2 size={15} strokeWidth={2.2} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Modal>
  );
}

/** Who this is about, and the two facts that change what is safe to suggest.
 *  Kept to one line so it can stay on screen the whole session. */
function PatientBanner({
  patientName,
  patientAge,
  alerts,
  onHistory,
}: {
  patientName: string;
  patientAge: number | null;
  alerts: string[];
  onHistory: () => void;
}) {
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
    <header className="relative z-30 shrink-0 border-b border-karsa-line bg-white/70 px-4 py-2 backdrop-blur-sm sm:px-6 xl:px-8">
      <div className="flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-nohemi text-[15px] font-bold leading-5 tracking-tight text-neutral-800">
            Arsa
          </h1>
          {patientName && (
            <p className="truncate text-[12px] leading-4 text-neutral-500">
              Merawat{" "}
              <span className="font-semibold text-neutral-700">
                {patientName}
                {patientAge !== null ? `, ${patientAge}` : ""}
              </span>
            </p>
          )}
        </div>

        {alerts.length > 0 && (
          <div ref={alertsRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setAlertsOpen((open) => !open)}
              aria-expanded={alertsOpen}
              aria-label={`Catatan penting (${alerts.length})`}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1.5 text-[12px] font-bold text-rose-700 outline-none ring-1 ring-rose-100 transition-colors duration-200 hover:bg-rose-100 focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              <ShieldAlert size={14} strokeWidth={2.4} aria-hidden />
              <span className="tabular-nums">{alerts.length}</span>
            </button>

            {alertsOpen && (
              <div
                role="dialog"
                aria-label="Catatan penting"
                className="absolute right-0 z-40 mt-2 w-[15rem] rounded-2xl bg-white p-2.5 shadow-[0_1px_2px_rgba(24,32,24,0.04),0_20px_44px_-24px_rgba(24,32,24,0.45)] ring-1 ring-karsa-line"
              >
                <p className="px-1 pb-2 text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-neutral-400">
                  Perlu diperhatikan
                </p>
                <ul className="space-y-1.5">
                  {alerts.map((alert) => (
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
        )}

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

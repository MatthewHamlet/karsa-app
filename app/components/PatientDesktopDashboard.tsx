"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, MessageSquareHeart, Mic, Square, Zap } from "lucide-react";
import Mascot, { type Mood } from "./Mascot";
import ParkScene, { ParkBench } from "./ParkScene";
import Confetti from "./Confetti";
import TasksDone from "./TasksDone";
import { EASE } from "./List";
import {
  AFFIRMATION,
  ENERGY_TARGET as DESIGN_TARGET,
  PATIENT_TASKS,
  type PatientTask,
} from "../data/patient";
import { useSpeechToText } from "./useSpeechToText";
import { toggleTask } from "../lib/care/actions";
import type { PatientHome } from "../lib/care/queries";


function ThinkingDots() {
  const reduce = useReducedMotion();

  return (
    <span aria-hidden className="flex items-center justify-center gap-2 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2.5 w-2.5 rounded-full bg-karsa"
          animate={
            reduce
              ? { opacity: 0.5 }
              : {
                  opacity: [0.2, i <= 0 ? 1 : 0.2, i <= 1 ? 1 : 0.2, 1, 0.2],
                  y: [0, i <= 0 ? -3 : 0, i <= 1 ? -3 : 0, -3, 0],
                }
          }
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 1.4, times: [0, 0.25, 0.5, 0.75, 1], repeat: Infinity, ease: "easeOut" }
          }
        />
      ))}
    </span>
  );
}


const STRIKE_MS = 560;



export default function PatientDesktopDashboard({ home }: { home?: PatientHome | null }) {
  const reduce = useReducedMotion();
  const [tasks, setTasks] = useState<PatientTask[]>(home?.tasks ?? PATIENT_TASKS);

  const [striking, setStriking] = useState<string[]>([]);

  const [burst, setBurst] = useState(0);
  const timers = useRef<number[]>([]);


  const [phase, setPhase] = useState<"off" | "listening" | "thinking" | "reply">("off");
  const [reply, setReply] = useState("");
  const threadRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ask = useCallback(async (question: string) => {
    const said = question.trim();
    if (!said) {
      setPhase("off");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("thinking");
    setReply("");

    try {
      const response = await fetch("/api/mascot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ message: said, threadId: threadRef.current, brief: true }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        setReply((payload as { error?: string } | null)?.error ?? "Maaf, aku belum bisa menjawab.");
        setPhase("reply");
        return;
      }

      threadRef.current = response.headers.get("X-Thread-Id") ?? threadRef.current;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setReply(full);
        setPhase("reply");
      }

      if (!full.trim()) {
        setReply("Maaf, aku belum bisa menjawab.");
        setPhase("reply");
      }
    } catch (error) {
      if ((error as { name?: string })?.name === "AbortError") return;
      setReply("Koneksi terputus. Coba tanya lagi ya.");
      setPhase("reply");
    }
  }, []);


  const heardRef = useRef("");

  const voice = useSpeechToText((chunk) => {
    heardRef.current = `${heardRef.current} ${chunk}`.trim();
  });


  const stopVoice = voice.stop;
  useEffect(() => {
    if (phase !== "listening") stopVoice();
  }, [phase, stopVoice]);


  useEffect(() => {
    if (phase !== "reply" || !reply) return;
    const t = window.setTimeout(() => setPhase("off"), 9000);
    return () => window.clearTimeout(t);
  }, [phase, reply]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );


  const bubble =
    phase === "listening"
      ? voice.interim.trim() || "Mendengar…"
      : phase === "thinking"
        ? ""
        : phase === "reply"
          ? reply
          : null;

  const talk = () => {
    if (phase === "listening") {
      voice.stop();
      const said = heardRef.current.trim();
      heardRef.current = "";
      if (said) void ask(said);
      else setPhase("off");
      return;
    }
    if (phase === "thinking") return;

    heardRef.current = "";
    setReply("");
    setPhase("listening");
    voice.start();
  };

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const energy = useMemo(
    () => tasks.reduce((sum, task) => (task.done ? sum + task.points : sum), 0),
    [tasks],
  );
  const energyTarget = home?.energyTarget ?? DESIGN_TARGET;
  const pct = Math.min(100, Math.round((energy / energyTarget) * 100));
  const affirmation = home ? home.affirmation : AFFIRMATION;


  const visible = tasks.filter((task) => !task.done);

  const left = visible.filter((task) => !striking.includes(task.id)).length;


  const mood: Mood = pct >= 34 ? "normal" : "tired";


  const complete = (id: string) => {
    if (striking.includes(id)) {
      setStriking((prev) => prev.filter((taskId) => taskId !== id));
      return;
    }

    setStriking((prev) => [...prev, id]);

    timers.current.push(
      window.setTimeout(
        () => {
          setTasks((prev) =>
            prev.map((task) => (task.id === id ? { ...task, done: true } : task)),
          );
          setStriking((prev) => prev.filter((taskId) => taskId !== id));
          setBurst((n) => n + 1);


          if (!home) return;
          const fd = new FormData();
          fd.set("task_id", id);
          fd.set("patient_id", home.patientId);
          void toggleTask({ error: null }, fd);
        },
        reduce ? 0 : STRIKE_MS,
      ),
    );
  };

  return (
    <div className="relative w-full px-4 pb-10 pt-6 sm:px-6 lg:h-full lg:min-h-0 lg:overflow-hidden lg:px-8 lg:pb-8 lg:pt-8 xl:px-10">

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 bottom-[calc(var(--bottom-nav)*-1)] overflow-hidden bg-gradient-to-b from-[#6fb86a] from-40% to-[#5c9f59] lg:bottom-0"
      >
        <ParkScene />
      </div>


      <div className="relative grid gap-6 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)] lg:gap-8 xl:gap-10">

        <section className="relative flex min-h-[calc((100dvh-var(--bottom-nav))*0.6)] min-w-0 flex-col lg:min-h-0 lg:h-full lg:justify-between">

          <div className="relative flex flex-1 flex-col items-center justify-center pb-2 pt-4 lg:min-h-0">

            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-4">
              <AnimatePresence>
                {bubble !== null && (
                  <motion.div
                    role="status"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.94 }}
                    transition={
                      reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 26 }
                    }
                    className="max-w-md rounded-[28px] rounded-bl-lg bg-white/85 px-7 py-5 text-center text-[20px] font-bold leading-7 text-neutral-800 shadow-[0_18px_40px_-18px_rgba(24,32,24,0.55)] ring-1 ring-white/70 backdrop-blur-md sm:text-[22px]"
                  >
                    {phase === "thinking" ? <ThinkingDots /> : bubble}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            <div className="flex min-h-0 flex-1 items-end justify-center">
              <div className="relative flex h-60 items-end sm:h-72 lg:h-full lg:max-h-[19rem]">

                <ParkBench className="absolute bottom-0 left-1/2 h-auto w-[172%] -translate-x-1/2" />
                <Mascot
                  className="relative h-full w-auto"
                  mood={mood}
                  celebrate={burst}
                  thinking={phase === "thinking"}
                />
              </div>
            </div>
          </div>


          <div className="relative mt-6 w-full max-w-md shrink-0 self-center lg:mt-4 lg:max-w-lg">


            {affirmation && (
              <div className="rounded-3xl bg-white/70 p-4 shadow-[0_1px_2px_rgba(24,32,24,0.04),0_18px_36px_-24px_rgba(24,32,24,0.45)] ring-1 ring-white/70 backdrop-blur-md lg:p-5">
                <div className="flex items-center gap-3.5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-nut-100 text-nut-600 lg:h-14 lg:w-14">
                    <MessageSquareHeart size={24} strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                      Pesan dari {affirmation.relation} — {affirmation.from}
                    </span>
                    <span className="mt-1 block text-[16px] font-bold leading-6 text-neutral-800 lg:text-[17px]">
                      {affirmation.text}
                    </span>
                  </span>
                </div>
              </div>
            )}


            <button
              type="button"
              onClick={talk}
              aria-pressed={phase !== "off"}
              disabled={phase === "thinking"}
              className="mt-3 flex w-full items-center justify-center gap-3 rounded-3xl bg-karsa px-6 py-4 text-[19px] font-bold text-white shadow-[0_18px_40px_-18px_rgba(63,92,70,0.9)] outline-none transition-[background-color,transform] duration-200 hover:bg-karsa-dark hover:scale-[1.015] focus-visible:ring-2 focus-visible:ring-karsa focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 lg:py-5 lg:text-[21px]"
            >
              {phase === "listening" ? (
                <Square size={22} strokeWidth={2.8} aria-hidden />
              ) : (
                <Mic size={24} strokeWidth={2.5} aria-hidden />
              )}
              {phase === "listening"
                ? "SELESAI BICARA"
                : phase === "thinking"
                  ? "SEBENTAR YA…"
                  : "TALK TO MASCOT"}
            </button>
          </div>
        </section>




        <section className="flex min-w-0 flex-col rounded-[28px] bg-[#FBF7EE]/80 p-4 shadow-[0_28px_64px_-34px_rgba(18,44,22,0.7)] ring-1 ring-white/70 backdrop-blur-2xl sm:p-5 lg:h-full lg:min-h-0">
          <div className="shrink-0">
            <h1 className="text-[24px] font-bold tracking-tight text-neutral-900 xl:text-[27px]">
              Tugas Hari Ini
            </h1>


            {left > 0 && <p className="mt-1 text-[16px] text-neutral-500">{left} lagi hari ini</p>}

            <div className="mt-4 rounded-3xl bg-white/70 p-4 ring-1 ring-white/70 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Zap size={20} strokeWidth={2.6} className="text-karsa" aria-hidden />
                <span className="flex-1 text-[15px] font-bold text-neutral-800">
                  Energi Sehat Hari Ini
                </span>
                <span className="text-[16px] font-extrabold tabular-nums text-karsa-dark">
                  {energy} / {energyTarget}
                </span>
              </div>

              <div
                role="progressbar"
                aria-valuenow={energy}
                aria-valuemin={0}
                aria-valuemax={energyTarget}
                aria-label="Energi sehat hari ini"
                className="mt-2.5 h-4 overflow-hidden rounded-full bg-karsa/15"
              >

                <div
                  style={{ width: `${pct}%` }}
                  className="h-full rounded-full bg-karsa transition-[width] duration-500 ease-out motion-reduce:transition-none"
                />
              </div>
            </div>
          </div>




          <ul className="scrollbar-none -mx-1 mt-4 flex flex-col px-1 pt-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-1">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((task) => {
                const going = striking.includes(task.id);

                return (
                  <motion.li
                    key={task.id}
                    layout

                    exit={
                      reduce
                        ? { opacity: 0 }
                        : { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0 }
                    }
                    transition={reduce ? { duration: 0 } : { duration: 0.3, ease: EASE }}

                    className="-mx-1 -mt-0.5 shrink-0 overflow-hidden px-1 pb-3.5 pt-0.5"
                  >
                    <div
                      className={`flex items-center justify-between gap-3 rounded-3xl px-5 py-4 ring-1 transition-colors duration-200 ${
                        going
                          ? "bg-karsa-soft/60 ring-act-edge"
                          : "bg-white ring-karsa-line hover:ring-karsa/40"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-karsa-canvas text-[26px]">
                          {task.emoji}
                        </span>
                        <div className="min-w-0">

                          <p
                            className={`relative inline-block text-[17px] font-bold leading-6 transition-colors duration-200 ${
                              going ? "text-neutral-400" : "text-neutral-900"
                            }`}
                          >
                            {task.title}
                            <motion.span
                              aria-hidden
                              initial={false}
                              animate={{ scaleX: going ? 1 : 0 }}
                              transition={
                                reduce ? { duration: 0 } : { duration: 0.3, ease: EASE }
                              }
                              className="absolute left-0 top-1/2 h-[2px] w-full origin-left rounded-full bg-current"
                            />
                          </p>
                          <p className="mt-0.5 truncate text-[14.5px] text-neutral-500">
                            {task.detail}
                          </p>
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-karsa-soft px-2.5 py-0.5 text-[12.5px] font-bold text-karsa-dark">
                            +{task.points} ⚡
                          </span>
                        </div>
                      </div>


                      <button
                        type="button"
                        onClick={() => complete(task.id)}
                        aria-pressed={going}
                        aria-label={`${going ? "Batalkan" : "Selesaikan"} ${task.title}`}
                        className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-[0_6px_16px_-8px_rgba(24,32,24,0.4)] outline-none transition-[background-color,color,transform] duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-karsa focus-visible:ring-offset-2 active:scale-90 motion-reduce:transition-none motion-reduce:hover:scale-100 ${
                          going
                            ? "bg-karsa text-white"
                            : "bg-karsa-soft text-karsa-dark hover:bg-karsa hover:text-white"
                        }`}
                      >
                        <Check size={26} strokeWidth={3} aria-hidden />
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>

            {visible.length === 0 && (

              <li className="flex flex-1 items-center justify-center">
                <TasksDone />
              </li>
            )}
          </ul>
        </section>
      </div>

      <Confetti fire={burst} />
    </div>
  );
}

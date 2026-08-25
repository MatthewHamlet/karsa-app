"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechResultList = {
  length: number;
  [index: number]: { isFinal: boolean; 0: { transcript: string } };
};

type SpeechEvent = { resultIndex: number; results: SpeechResultList };

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionCtor = new () => Recognition;

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const MESSAGE: Record<string, string> = {
  "not-allowed": "Izin mikrofon ditolak. Aktifkan dulu di pengaturan browser.",
  "service-not-allowed": "Izin mikrofon ditolak. Aktifkan dulu di pengaturan browser.",
  "no-speech": "Tidak ada suara yang terdengar. Coba bicara lebih dekat ke mikrofon.",
  "audio-capture": "Mikrofonnya tidak ditemukan.",
  network: "Butuh koneksi internet untuk mengubah suara jadi teks.",
};

export type VoiceClip = { blob: Blob; seconds: number };

export function useSpeechToText(
  onFinal: (chunk: string) => void,
  onClip?: (clip: VoiceClip) => void,
) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const ref = useRef<Recognition | null>(null);
  const finalRef = useRef(onFinal);
  const clipRef = useRef(onClip);
  const wantedRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);

  finalRef.current = onFinal;
  clipRef.current = onClip;

  const stopRecorder = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;
    if (recorder.state !== "inactive") recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => setSupported(Boolean(ctor())), []);

  useEffect(() => {
    if (!listening) return;
    const id = window.setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [listening]);

  const stop = useCallback(() => {
    wantedRef.current = false;
    ref.current?.stop();
    stopRecorder();
    setListening(false);
    setInterim("");
  }, [stopRecorder]);

  useEffect(() => {
    if (!listening) return;

    const bail = () => stop();
    const onVisibility = () => {
      if (document.hidden) stop();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", bail);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", bail);
    };
  }, [listening, stop]);

  const startRecorder = useCallback(async () => {
    if (!clipRef.current || typeof MediaRecorder === "undefined") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        chunksRef.current = [];
        const elapsed = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        if (blob.size > 0) clipRef.current?.({ blob, seconds: elapsed });
      };

      recorder.start();
      recorderRef.current = recorder;
    } catch {

    }
  }, []);

  const start = useCallback(() => {
    const Ctor = ctor();
    if (!Ctor) return;

    setError(null);
    setInterim("");
    setSeconds(0);
    void startRecorder();

    const recognition = new Ctor();
    recognition.lang = "id-ID";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let pending = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) finalRef.current(text);
        else pending += text;
      }
      setInterim(pending);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      setError(MESSAGE[event.error] ?? "Suaranya tidak terbaca. Coba lagi ya.");
      wantedRef.current = false;
      stopRecorder();
      setListening(false);
      setInterim("");
    };

    recognition.onend = () => {
      if (wantedRef.current) {
        try {
          recognition.start();
          return;
        } catch {

        }
      }
      setListening(false);
      setInterim("");
    };

    ref.current = recognition;
    wantedRef.current = true;

    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Mikrofonnya sedang dipakai. Coba lagi sebentar lagi.");
      wantedRef.current = false;
      stopRecorder();
    }
  }, [startRecorder, stopRecorder]);

  useEffect(
    () => () => {
      wantedRef.current = false;
      ref.current?.abort();
      stopRecorder();
    },
    [stopRecorder],
  );

  return { supported, listening, interim, error, seconds, start, stop };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parsePrescription, type ParsedMedicine } from "../lib/scan/parse";
import { preprocess } from "../lib/scan/preprocess";

export type OcrResult = {
  medicines: ParsedMedicine[];
  rawText: string;
  blob: Blob | null;
  previewUrl: string | null;
};

export function useCameraOcr() {
  const [ready, setReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  const attach = useCallback(async (node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (!node || streamRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
      });
      streamRef.current = stream;
      node.srcObject = stream;
      await node.play();
      setReady(true);
      setCameraError(null);
    } catch (error) {
      const name = (error as { name?: string })?.name;
      setCameraError(
        name === "NotAllowedError"
          ? "Izin kamera ditolak. Aktifkan di pengaturan browser, atau unggah foto resep."
          : name === "NotFoundError"
            ? "Kamera tidak ditemukan. Unggah foto resep saja."
            : "Kamera tidak bisa dibuka. Unggah foto resep saja.",
      );
    }
  }, []);

  useEffect(() => stop, [stop]);

  const readBlob = useCallback(async (blob: Blob): Promise<OcrResult> => {
    setBusy(true);
    setProgress(0);

    try {
      const [{ createWorker, PSM }, cleaned] = await Promise.all([
        import("tesseract.js"),
        preprocess(blob).catch(() => blob),
      ]);

      const worker = await createWorker("ind+eng", 1, {
        logger: (message: { status: string; progress: number }) => {
          if (message.status === "recognizing text") {
            setProgress(Math.round(message.progress * 100));
          }
        },
      });

      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
      });

      let rawText = "";
      try {
        const { data } = await worker.recognize(cleaned);
        rawText = data.text ?? "";

        if (parsePrescription(rawText).length === 0) {
          await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
          const retry = await worker.recognize(cleaned);
          if (parsePrescription(retry.data.text ?? "").length > 0) {
            rawText = retry.data.text ?? rawText;
          }
        }
      } finally {
        await worker.terminate();
      }

      return {
        rawText,
        medicines: parsePrescription(rawText),
        blob,
        previewUrl: URL.createObjectURL(blob),
      };
    } finally {
      setBusy(false);
    }
  }, []);

  const capture = useCallback(async (): Promise<OcrResult | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
    );
    if (!blob) return null;

    return readBlob(blob);
  }, [readBlob]);

  return { attach, stop, capture, readBlob, ready, cameraError, progress, busy };
}

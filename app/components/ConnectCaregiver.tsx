"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Camera, Check, KeyRound, X } from "lucide-react";
import { redeemPairingCode, type RedeemState } from "../lib/care/pairing";

/** The patient's half of pairing: type the six characters, or point the camera
 *  at the caregiver's QR.
 *
 *  ── About the scanner ─────────────────────────────────────────────────────
 *  It uses `BarcodeDetector`, which is built into Chrome and Android's WebView
 *  and absent from Safari and Firefox. That is a deliberate choice over
 *  shipping a decoder: the JavaScript ones are a few hundred kilobytes of WASM
 *  to save six characters of typing, on a screen whose whole point is being
 *  usable by somebody who is not comfortable with phones.
 *
 *  So the camera button only appears where it will actually work, and the field
 *  beside it is the path that always works. A scanner that is offered and then
 *  fails is worse than one that was never offered. */

/** Narrow shape for the API, which TypeScript's DOM library does not ship. */
type Detector = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};
type DetectorCtor = new (options?: { formats?: string[] }) => Detector;

function detectorCtor(): DetectorCtor | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector ?? null;
}

/** Pulls the code out of whatever the QR carried — the pair URL, or a bare
 *  code if somebody generated their own. */
function codeFrom(raw: string): string | null {
  const direct = raw.trim().toUpperCase();
  if (/^KRS-[A-Z0-9]{6}$/.test(direct)) return direct;

  try {
    const url = new URL(raw);
    const param = url.searchParams.get("code");
    if (param) return param.trim().toUpperCase();
  } catch {
    /* Not a URL. Fall through — the field will reject it and say so. */
  }
  return null;
}

export default function ConnectCaregiver({
  /** Prefilled when the patient arrived by scanning the QR, which carries the
   *  code in the link — so the common path is "press Hubungkan", not "retype
   *  what you just scanned". */
  initialCode = "",
  autoFocus = false,
}: {
  initialCode?: string;
  autoFocus?: boolean;
}) {
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [canScan, setCanScan] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uid = useId();

  const [state, submit, busy] = useActionState<RedeemState, FormData>(redeemPairingCode, {
    error: null,
  });

  /* Checked after mount, never during render: the API's presence is a fact
     about the browser, and reading it while the server is producing HTML would
     make the two renders disagree. */
  useEffect(() => setCanScan(Boolean(detectorCtor())), []);

  /** Everything the camera holds, released. Called on stop, on success, and on
   *  unmount — a camera left running is a light left on on somebody's phone. */
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  };

  useEffect(() => stopCamera, []);
  useEffect(() => {
    if (state.ok) stopCamera();
  }, [state.ok]);

  const startCamera = async () => {
    const Ctor = detectorCtor();
    if (!Ctor) return;

    setScanError(null);
    setScanning(true);

    try {
      /* `environment` is the rear camera. Without it a phone opens the selfie
         camera and the person ends up filming themselves. */
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      const detector = new Ctor({ formats: ["qr_code"] });

      /* Polled rather than run every animation frame: a QR does not move, four
         reads a second finds it just as fast, and it leaves the phone's battery
         and the rest of the page alone. */
      const tick = window.setInterval(async () => {
        if (!streamRef.current || !videoRef.current) {
          window.clearInterval(tick);
          return;
        }
        try {
          const found = await detector.detect(videoRef.current);
          const hit = found.map((f) => codeFrom(f.rawValue)).find(Boolean);
          if (hit) {
            window.clearInterval(tick);
            setCode(hit);
            stopCamera();
          }
        } catch {
          /* A frame that cannot be decoded is the normal case, not an error. */
        }
      }, 250);
    } catch {
      setScanError(
        "Kameranya tidak bisa dibuka. Izinkan akses kamera, atau ketik kodenya saja.",
      );
      stopCamera();
    }
  };

  if (state.ok) {
    return (
      <div className="rounded-3xl bg-karsa-soft p-6 text-center ring-1 ring-karsa/20">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-karsa-dark">
          <Check size={28} strokeWidth={2.8} aria-hidden />
        </span>
        <p className="mt-4 text-[18px] font-bold text-neutral-900">Terhubung!</p>
        <p className="mx-auto mt-2 max-w-[32ch] text-[15px] leading-6 text-neutral-600">
          {state.caregiverName} sekarang mendampingimu di Karsa. Kamu bisa
          mencabut aksesnya kapan saja dari halaman ini.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-karsa-line sm:p-7">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-karsa-soft text-karsa-dark"
        >
          <KeyRound size={20} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[19px] font-bold tracking-tight text-neutral-900">
            Hubungkan pendamping / keluarga
          </h2>
          <p className="mt-1 text-[14.5px] leading-5 text-neutral-500">
            Masukkan kode yang diberikan pendampingmu, atau pindai kode QR-nya.
          </p>
        </div>
      </div>

      {scanning && (
        <div className="relative mt-5 overflow-hidden rounded-2xl bg-neutral-900">
          {/* `playsInline` is what stops iOS taking the video full screen the
              moment it plays, which would hide the whole form behind it. */}
          <video
            ref={videoRef}
            muted
            playsInline
            className="h-64 w-full object-cover"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 m-auto h-40 w-40 rounded-2xl border-4 border-white/80"
          />
          <button
            type="button"
            onClick={stopCamera}
            aria-label="Tutup kamera"
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white outline-none transition-colors hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>
      )}

      <form action={submit} className="mt-5">
        <label htmlFor={`${uid}-code`} className="sr-only">
          Kode pendampingan
        </label>
        <input
          id={`${uid}-code`}
          name="code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          autoFocus={autoFocus}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={10}
          placeholder="KRS-______"
          disabled={busy}
          className="h-16 w-full rounded-2xl border-2 border-karsa-line bg-white text-center text-2xl font-bold uppercase tracking-widest text-neutral-900 outline-none transition-colors duration-200 placeholder:font-medium placeholder:tracking-widest placeholder:text-neutral-300 focus:border-karsa disabled:opacity-70"
        />

        {(state.error || scanError) && (
          <p
            role="alert"
            className="mt-4 whitespace-pre-line rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-[14px] font-semibold leading-5 text-rose-800"
          >
            {state.error ?? scanError}
          </p>
        )}

        <div className="mt-4 grid gap-2.5">
          <button
            type="submit"
            disabled={busy || code.trim().length === 0}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-karsa text-[16px] font-bold text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {busy ? "Menghubungkan…" : "Hubungkan"}
          </button>

          {canScan && !scanning && (
            <button
              type="button"
              onClick={startCamera}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-white text-[15px] font-bold text-neutral-700 ring-1 ring-karsa-line outline-none transition-colors duration-200 hover:bg-karsa-soft hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              <Camera size={19} strokeWidth={2.3} aria-hidden />
              Pindai kode QR
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

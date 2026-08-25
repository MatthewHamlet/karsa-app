"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, QrCode, RefreshCw } from "lucide-react";
import { createPairingCode, type PairCode } from "../lib/care/pairing";

function pairUrl(code: string): string {
  const origin = typeof window === "undefined" ? "https://karsa.id" : window.location.origin;
  return `${origin}/pair?code=${encodeURIComponent(code)}`;
}

function remaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "sudah kedaluwarsa";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 1) return `berlaku ${hours} jam ${minutes} menit lagi`;
  return `berlaku ${minutes} menit lagi`;
}

export default function PairingPanel() {
  const [code, setCode] = useState<PairCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (code) return;

    let cancelled = false;
    setBusy(true);
    createPairingCode()
      .then((result) => {
        if (cancelled) return;
        if (result.ok) setCode(result.code);
        else setError(result.error);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Tidak bisa menyalin otomatis. Salin manual dari layar ya.");
    }
  };

  const waHref = code
    ? `https://wa.me/?text=${encodeURIComponent(
        `Halo! Aku mau mendampingi kamu lewat Karsa.\n\nKode: ${code.code}\n\nBuka tautan ini untuk menghubungkan: ${pairUrl(code.code)}\n\nKodenya berlaku 24 jam ya.`,
      )}`
    : "#";

  if (busy && !code) {
    return <p className="py-12 text-center text-[15px] text-neutral-500">Membuat kode…</p>;
  }

  if (error && !code) {
    return (
      <p
        role="alert"
        className="whitespace-pre-line rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-[14px] font-semibold leading-5 text-rose-800"
      >
        {error}
      </p>
    );
  }

  if (!code) return null;

  return (
    <div className="flex flex-col items-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        Kode undangan
      </p>
      <p className="mt-2 select-all text-[34px] font-extrabold uppercase leading-none tracking-[0.12em] text-karsa-dark sm:text-[40px]">
        {code.code}
      </p>
      <p className="mt-2 text-[13px] text-neutral-500">{remaining(code.expiresAt)}</p>

      <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-karsa-line">
        <QRCodeSVG
          value={pairUrl(code.code)}
          size={172}
          level="M"
          marginSize={0}
          bgColor="#ffffff"
          fgColor="#2f4a35"
        />
      </div>
      <p className="mt-3 max-w-[32ch] text-center text-[13.5px] leading-5 text-neutral-500">
        Minta dia memindai kode QR ini, atau kirimkan kodenya.
      </p>

      <div className="mt-6 grid w-full gap-2.5">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] text-[15px] font-bold text-white outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
            <path d="M17.47 14.38c-.29-.15-1.7-.84-1.97-.93-.26-.1-.45-.15-.64.14-.19.29-.73.93-.9 1.12-.16.19-.33.21-.62.07-.29-.15-1.22-.45-2.33-1.44-.86-.77-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.17 2.95c.14.19 2.01 3.06 4.86 4.29.68.29 1.21.47 1.62.6.68.22 1.3.19 1.79.11.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34z" />
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.02h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23z" />
          </svg>
          Kirim kode via WhatsApp
        </a>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={copy}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-[14.5px] font-bold text-neutral-700 ring-1 ring-karsa-line outline-none transition-colors duration-200 hover:bg-karsa-soft hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            {copied ? (
              <Check size={17} strokeWidth={2.6} aria-hidden />
            ) : (
              <Copy size={16} strokeWidth={2.2} aria-hidden />
            )}
            {copied ? "Tersalin" : "Salin kode"}
          </button>

          <button
            type="button"
            onClick={() => {
              setCode(null);
              setError(null);
            }}
            disabled={busy}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-[14.5px] font-bold text-neutral-700 ring-1 ring-karsa-line outline-none transition-colors duration-200 hover:bg-karsa-soft hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:opacity-50"
          >
            <RefreshCw size={16} strokeWidth={2.2} aria-hidden />
            Muat ulang
          </button>
        </div>
      </div>

      <p className="mt-5 flex items-start gap-2 text-[13px] leading-5 text-neutral-500">
        <QrCode size={15} strokeWidth={2.2} className="mt-0.5 shrink-0" aria-hidden />
        Kode ini hanya bisa dipakai sekali. Begitu dia terhubung, kodenya hangus
        dan halaman ini langsung terbuka.
      </p>
    </div>
  );
}

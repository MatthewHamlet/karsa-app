"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { EASE } from "./List";
import { lockScroll } from "../lib/scrollLock";

/** The one dialog every "lihat semua" on this page opens.
 *
 *  Escape closes it, the backdrop closes it, focus moves into the panel on
 *  open and returns to whatever opened it on close, and the page behind stops
 *  scrolling while it's up. */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    opener.current = document.activeElement;
    const unlock = lockScroll();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // Next frame, so the panel exists before we reach for it.
    const focus = requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
      cancelAnimationFrame(focus);
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.2, ease: EASE }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={
              reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 }
            }
            className={`relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-karsa-canvas shadow-[0_30px_70px_-30px_rgba(24,32,24,0.6)] outline-none sm:rounded-3xl ${
              size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg"
            }`}
          >
            <header className="flex shrink-0 items-start gap-4 border-b border-karsa-line bg-white px-6 py-5">
              <div className="min-w-0 flex-1">
                <h2
                  id={titleId}
                  className="text-[19px] font-bold leading-6 tracking-tight text-neutral-900"
                >
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-[13.5px] leading-5 text-neutral-500">{description}</p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-500 outline-none transition-colors duration-200 hover:bg-karsa-canvas hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-karsa/40"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

            {footer && (
              <footer className="shrink-0 border-t border-karsa-line bg-white px-6 py-4">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

/** A panel that comes in from the right edge.
 *
 *  Used where a desktop side column has nowhere to go on a phone. Stacking it
 *  under the page works but buries a month grid under three screens of feed —
 *  a caregiver checking Thursday shouldn't have to scroll past today to do it.
 *
 *  Not `Modal`: that one is a centred dialog, and this has to keep the full
 *  height a calendar needs. */
export default function SlideOver({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    returnTo.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    /* The page behind must not scroll while a full-height sheet is over it —
       otherwise flicking the sheet's edge scrolls the feed underneath. */
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      returnTo.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[55] bg-neutral-950/40 backdrop-blur-[2px] lg:hidden"
          />

          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 420, damping: 40, mass: 0.9 }
            }
            className="fixed inset-y-0 right-0 z-[56] flex w-[min(90vw,400px)] flex-col border-l border-karsa-line bg-karsa-canvas shadow-2xl outline-none lg:hidden"
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-karsa-line px-5 py-4">
              <h2 className="font-nohemi text-[17px] font-bold tracking-tight text-neutral-800">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup panel"
                className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 outline-none transition-colors duration-200 hover:bg-white hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-karsa/40"
              >
                <X size={18} strokeWidth={2.4} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 [contain:paint]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

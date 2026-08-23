"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, Check, ChevronDown } from "lucide-react";
import { EASE } from "./List";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PATIENTS } from "../data/dashboard";
import { RELATIONSHIP_LABEL, type CarePatient } from "../lib/care/types";
import { colourFor } from "./avatarColour";

/** Who this page is about, and how to change it.
 *
 *  This corner used to show the caregiver — their own name and their own role,
 *  above a column of somebody else's numbers. It was the third place the app
 *  said who you are and the only place it never said who you are reading
 *  about. The caregiver moved to the rail's foot, where an account belongs,
 *  and the space went to the one question this column actually raises. */

/** Real rows when signed in. The placeholder list survives only so the design
 *  pages still render for someone working without credentials — it is used when
 *  `patients` is undefined, never when it is an empty array. An empty array is
 *  a real answer: this caregiver has nobody yet, and that has its own screen. */
const DESIGN_FALLBACK: CarePatient[] = PATIENTS.map((p) => ({
  relationshipId: p.id,
  patientId: p.id,
  displayName: p.name,
  initial: p.initial,
  relation: p.relation,
  dateOfBirth: null,
  status: "active",
  patientStatus: "active",
}));

export default function PatientSwitcher({
  patients,
  activeId: activeFromServer,
}: {
  patients?: CarePatient[];
  /** Which patient the page is currently about. Comes from the URL, because
   *  every figure on the page around this control was fetched on the server for
   *  that specific person — a selection held in local state here would change
   *  the name at the top and nothing underneath it. */
  activeId?: string;
}) {
  const list = patients ?? DESIGN_FALLBACK;
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();
  /* The navigation is a server round trip, so the menu would otherwise sit
     open, unchanged, until the new page streamed in. `pending` is what lets the
     row show that the press landed. */
  const [pending, startTransition] = useTransition();

  const activeId = activeFromServer ?? list[0]?.patientId ?? "";
  const active = list.find((p) => p.patientId === activeId) ?? list[0];
  const fade = reduce ? { duration: 0 } : { duration: 0.18, ease: EASE };

  const select = (patientId: string) => {
    setOpen(false);
    if (patientId === activeId) return;
    /* `replace`, not `push`: switching who you are reading about is changing
       the view, not travelling somewhere. Pushing would make Back walk through
       every patient you glanced at before leaving the page. */
    startTransition(() => router.replace(`${pathname}?p=${patientId}`, { scroll: false }));
  };

  const avatar = (patient: CarePatient, size: string) => (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${size}`}
      style={{ backgroundColor: colourFor(patient.patientId) }}
    >
      {patient.initial}
    </span>
  );

  /* Nobody yet. A switcher with nothing to switch between is a dead control, so
     the space goes to the one thing worth doing here instead. */
  if (!active) {
    return (
      <div
        data-user-card
        className="shrink-0 border-b border-karsa-line/80 pb-4"
      >
        <p className="text-[14px] leading-5 text-neutral-500">
          Belum ada pasien yang didampingi.
        </p>
        <Link
          href="/care/tambah-pasien"
          className="mt-3 inline-flex h-11 items-center gap-2 rounded-xl bg-karsa px-4 text-[14px] font-bold text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
        >
          <Plus size={17} strokeWidth={2.6} aria-hidden />
          Tambahkan pasien
        </Link>
      </div>
    );
  }

  return (
    <div
      data-user-card
      className={`flex shrink-0 items-center gap-2 border-b border-karsa-line/80 pb-4 transition-opacity duration-200 ${
        pending ? "opacity-60" : ""
      }`}
    >
      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="group/sw flex w-full items-center gap-3 rounded-2xl px-1 py-1 text-left outline-none transition-colors duration-200 hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-karsa/40"
        >
          {avatar(active, "h-12 w-12 text-[15px]")}

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[16.5px] font-semibold leading-6 text-neutral-800">
              {active.displayName}
            </span>
            <span className="block truncate text-[13px] leading-4 text-neutral-500">
              {active.relation ?? RELATIONSHIP_LABEL[active.status]}
            </span>
          </span>

          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.2, ease: EASE }}
            className="grid shrink-0 place-items-center text-neutral-400 transition-colors group-hover/sw:text-neutral-600"
          >
            <ChevronDown size={17} strokeWidth={2.4} />
          </motion.span>
        </button>

        <AnimatePresence>
          {open && (
            <>
              {/* Catches the next click anywhere else, so the list closes the
                  way every other menu in the app does. */}
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-20 cursor-default"
              />

              <motion.ul
                role="listbox"
                aria-label="Pilih orang yang dirawat"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={fade}
                className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_18px_40px_-20px_rgba(24,32,24,0.5)] ring-1 ring-karsa-line"
              >
                {list.map((patient) => {
                  const selected = patient.patientId === activeId;

                  return (
                    <li key={patient.relationshipId}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => select(patient.patientId)}
                        className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
                          selected ? "bg-karsa-soft" : "hover:bg-karsa-canvas"
                        }`}
                      >
                        {avatar(patient, "h-9 w-9 text-[13px]")}

                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-[14.5px] leading-5 ${
                              selected
                                ? "font-bold text-karsa-dark"
                                : "font-semibold text-neutral-800"
                            }`}
                          >
                            {patient.displayName}
                            {patient.relation && (
                              <span className="ml-1.5 font-medium text-neutral-500">
                                · {patient.relation}
                              </span>
                            )}
                          </span>
                          {/* The status line, not a bio. "Menunggu persetujuan"
                              is the one thing a caregiver needs to see here:
                              the name is in the list but the data behind it is
                              not theirs yet. */}
                          <span
                            className={`block truncate text-[12px] leading-4 ${
                              patient.status === "active"
                                ? "text-neutral-500"
                                : "font-semibold text-amber-700"
                            }`}
                          >
                            {patient.status === "active" && patient.patientStatus === "pending_activation"
                              ? "Belum punya akun Karsa"
                              : RELATIONSHIP_LABEL[patient.status]}
                          </span>
                        </span>

                        {selected && (
                          <Check
                            size={15}
                            strokeWidth={2.6}
                            className="shrink-0 text-karsa-dark"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </motion.ul>
            </>
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        aria-label="Notifikasi"
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl text-neutral-500 outline-none transition-colors duration-200 hover:bg-karsa-soft hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
      >
        <Bell size={20} strokeWidth={2} />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-karsa ring-2 ring-karsa-canvas" />
      </button>
    </div>
  );
}

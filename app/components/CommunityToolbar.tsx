"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ListFilter, PenLine, Search, UsersRound, X } from "lucide-react";
import { SORTS, type SortKey } from "../data/community";

const FOREST = "#3d5a45";

export type FeedTab = "semua" | "postingan" | "grup" | "grupku";

export const TABS: { key: FeedTab; label: string; short: string }[] = [
  { key: "semua", label: "Semua", short: "Semua" },
  { key: "postingan", label: "Postingan", short: "Postingan" },
  { key: "grup", label: "Grup & Komunitas", short: "Grup" },
  { key: "grupku", label: "Grup Saya", short: "Grup Saya" },
];

/** Search, filter and compose — one row, in the order the sketch puts them.
 *  Below it, the tab bar that decides what kind of thing the feed shows. */
export default function CommunityToolbar({
  query,
  onQuery,
  tab,
  onTab,
  sort,
  onSort,
  counts,
  onCompose,
  onComposeGroup,
}: {
  query: string;
  onQuery: (next: string) => void;
  tab: FeedTab;
  onTab: (next: FeedTab) => void;
  sort: SortKey;
  onSort: (next: SortKey) => void;
  /** How many items each tab would show, so a caregiver can see a tab is empty
   *  before spending a click on it. */
  counts: Record<FeedTab, number>;
  onCompose: () => void;
  onComposeGroup: () => void;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  /* A popover that only closes on its own button is a popover you have to
     fight. Escape and an outside click both dismiss it. */
  useEffect(() => {
    if (!filterOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFilterOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setFilterOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [filterOpen]);

  useEffect(() => {
    if (!createOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCreateOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!createRef.current?.contains(event.target as Node)) setCreateOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [createOpen]);

  const activeSort = SORTS.find((s) => s.key === sort) ?? SORTS[0];

  return (
    <div className="mb-4 -mt-4">
      {/* ── Search row ──────────────────────────────────────────────────── */}
      <div
        className="-mx-4 flex flex-row items-center gap-3 px-4 py-3 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 xl:-mx-12 xl:rounded-b-[24px] xl:px-12"
        style={{ backgroundColor: FOREST }}
      >
        <h1 className="hidden shrink-0 font-satoshi text-[22px] font-bold leading-none tracking-tight text-white sm:block xl:text-[24px]">
          Komunitas
        </h1>

        <div className="relative min-w-0 flex-1">
          <Search
            size={17}
            strokeWidth={2.2}
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <label htmlFor="community-search" className="sr-only">
            Cari di komunitas
          </label>
          <input
            id="community-search"
            type="search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Cari diskusi, grup, atau topik…"
            /* The browser draws its own clear button in a grey that disappears
               on this field; ours sits where it can be seen. */
            className="h-11 w-full rounded-full bg-white pl-10 pr-10 text-[14.5px] text-neutral-800 outline-none ring-1 ring-transparent transition-shadow duration-200 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-white/70 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQuery("")}
              aria-label="Hapus pencarian"
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-neutral-400 outline-none transition-colors duration-200 hover:bg-karsa-canvas hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-karsa/40"
            >
              <X size={16} strokeWidth={2.4} />
            </button>
          )}
        </div>

        {/* ── Filter ────────────────────────────────────────────────────── */}
        <div ref={filterRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            aria-expanded={filterOpen}
            aria-haspopup="menu"
            className={`inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-semibold outline-none ring-1 transition-colors duration-200 hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70 ${
              sort === "relevan"
                ? "text-neutral-700 ring-transparent"
                : "text-karsa-dark ring-karsa"
            }`}
          >
            <ListFilter size={17} strokeWidth={2.2} aria-hidden />
            <span className="hidden sm:inline">
              {sort === "relevan" ? "Filter" : activeSort.label}
            </span>
          </button>

          {filterOpen && (
            <div
              role="menu"
              aria-label="Urutkan feed"
              className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_1px_2px_rgba(24,32,24,0.04),0_20px_44px_-24px_rgba(24,32,24,0.45)] ring-1 ring-karsa-line"
            >
              <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-neutral-400">
                Urutkan
              </p>
              {SORTS.map((option) => {
                const on = option.key === sort;
                return (
                  <button
                    key={option.key}
                    type="button"
                    role="menuitemradio"
                    aria-checked={on}
                    onClick={() => {
                      onSort(option.key);
                      setFilterOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[14px] outline-none transition-colors duration-200 hover:bg-karsa-canvas focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40 ${
                      on ? "font-semibold text-karsa-dark" : "text-neutral-600"
                    }`}
                  >
                    <span className="grid w-4 shrink-0 place-items-center">
                      {on && <Check size={15} strokeWidth={2.8} />}
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div ref={createRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setCreateOpen((open) => !open)}
            aria-expanded={createOpen}
            aria-haspopup="menu"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-bold text-karsa-dark outline-none transition-colors duration-200 hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <PenLine size={17} strokeWidth={2.4} aria-hidden />
            <span className="hidden sm:inline">Buat Diskusi</span>
            <span className="sr-only sm:hidden">Buat Diskusi</span>
            <ChevronDown size={15} strokeWidth={2.6} aria-hidden />
          </button>

          {createOpen && (
            <div
              role="menu"
              aria-label="Buat sesuatu"
              className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_1px_2px_rgba(24,32,24,0.04),0_20px_44px_-24px_rgba(24,32,24,0.45)] ring-1 ring-karsa-line"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setCreateOpen(false);
                  onCompose();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors duration-200 hover:bg-karsa-canvas focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-karsa-soft text-karsa-dark">
                  <PenLine size={17} strokeWidth={2.3} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-bold text-neutral-800">Postingan</span>
                  <span className="block text-[12.5px] text-neutral-500">Tanya atau berbagi</span>
                </span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setCreateOpen(false);
                  onComposeGroup();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors duration-200 hover:bg-karsa-canvas focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-karsa-soft text-karsa-dark">
                  <UsersRound size={17} strokeWidth={2.3} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-bold text-neutral-800">Grup</span>
                  <span className="block text-[12.5px] text-neutral-500">Satu per akun</span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────
          Scrollable rather than wrapped: four labels do not fit a phone, and a
          tab bar that becomes two rows stops reading as one control. */}
      <div
        role="tablist"
        aria-label="Jenis konten"
        className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((item) => {
          const active = tab === item.key;
          const n = counts[item.key];

          return (
            <button
              key={item.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onTab(item.key)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold outline-none ring-1 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
                active
                  ? "bg-karsa text-white ring-karsa"
                  : "bg-white text-neutral-600 ring-karsa-line hover:bg-karsa-canvas"
              }`}
            >
              <span className="sm:hidden">{item.short}</span>
              <span className="hidden sm:inline">{item.label}</span>
              <span
                className={`tabular-nums ${active ? "text-white/70" : "text-neutral-400"}`}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

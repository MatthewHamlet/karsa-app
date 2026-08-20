"use client";

import { useState } from "react";
import { PenLine, Search, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import CommunityDiscussions from "../components/CommunityDiscussions";
import CommunityGroups from "../components/CommunityGroups";
import CommunityAside from "../components/CommunityAside";

export default function CommunityPage() {
  /* One query for the whole page. The search field and the topic chips write to
     it and both lists read from it, which is what keeps a chip honest: pressing
     #Demensia puts the word in the box you can see and edit, rather than
     applying a filter with no visible cause. */
  const [query, setQuery] = useState("");

  return (
    /* Same rest at the foot of the page as every other route — see Care. */
    <div className="w-full px-4 pb-10 pt-20 sm:px-6 md:px-8 md:pt-10 xl:px-12 xl:pb-12 xl:pt-12">
      <PageHeader
        tone="forest"
        eyebrow="Karsa"
        title="Komunitas"
        subtitle="Tempat pendamping berbagi cerita, informasi, dan saling mendukung."
        action={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-bold text-karsa-dark outline-none transition-colors duration-200 hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70 sm:px-5"
          >
            <PenLine size={16} strokeWidth={2.4} />
            <span className="hidden sm:inline">Buat Diskusi Baru</span>
            <span className="sm:hidden">Diskusi Baru</span>
          </button>
        }
      >
        <div className="relative max-w-2xl">
          <Search
            size={18}
            strokeWidth={2.2}
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/50"
          />
          <label htmlFor="community-search" className="sr-only">
            Cari di komunitas
          </label>
          <input
            id="community-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari diskusi, grup, atau topik (misal: demensia, resep nutrisi)…"
            /* Glass rather than white: a white field in the middle of the band
               reads as a hole punched in it. `[&::-webkit-search-cancel-button]`
               is hidden because the browser draws its clear button in its own
               dark grey, invisible on this colour — ours sits beside it. */
            className="w-full rounded-full bg-white/15 py-3 pl-11 pr-11 text-[14.5px] text-white outline-none ring-1 ring-white/25 transition-colors duration-200 placeholder:text-white/55 focus:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/70 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Hapus pencarian"
              className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-white/70 outline-none transition-colors duration-200 hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <X size={16} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </PageHeader>

      {/* The aside is a companion, not a second page: it keeps its width while
          the thread column takes whatever the viewport gives. Below `lg` it
          drops under the groups, where an upcoming session still makes sense
          to meet after you have read what the room is talking about. */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_316px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_336px] xl:gap-10 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-8 xl:space-y-10">
          <CommunityDiscussions query={query} />
          <CommunityGroups query={query} />
        </div>

        <CommunityAside onTopic={setQuery} active={query} />
      </div>
    </div>
  );
}

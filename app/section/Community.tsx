"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import PageHeader from "../components/PageHeader";
import CommunityToolbar, { type FeedTab } from "../components/CommunityToolbar";
import CommunityFeed, { tabCounts } from "../components/CommunityFeed";
import CommunityAside from "../components/CommunityAside";
import ComposePost from "../components/ComposePost";
import type { SortKey } from "../data/community";
import type { CommunityData } from "../lib/community/queries";

export default function CommunityPage({ data }: { data: CommunityData }) {
  /* One query for the whole page. The search field and the topic chips write to
     it and the feed reads from it, which is what keeps a chip honest: pressing
     #Demensia puts the word in the box you can see and edit, rather than
     applying a filter with no visible cause. */
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FeedTab>("semua");
  const [sort, setSort] = useState<SortKey>("relevan");
  const [composing, setComposing] = useState(false);

  const counts = useMemo(() => tabCounts(query, data), [query, data]);

  /* The feed scrolls inside itself rather than lengthening the page, and the
     height it scrolls within is the sidebar's — so the page ends where "Orang
     untuk Diikuti" ends no matter how many posts load.

     Measured rather than guessed: the topic chips wrap differently at every
     width, so the sidebar has no height a stylesheet could know. Nothing loops
     here — the columns are independent `items-start` grid tracks, so capping
     the feed can never change what the sidebar measures. */
  const asideRef = useRef<HTMLDivElement>(null);
  const [asideH, setAsideH] = useState(0);

  useEffect(() => {
    const node = asideRef.current;
    if (!node) return;

    const sync = () => setAsideH(node.offsetHeight);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    /* Same rest at the foot of the page as every other route — see Care. */
    <div className="w-full px-4 pb-10 pt-6 sm:px-6 md:px-8 md:pt-10 xl:px-12 xl:pb-12 xl:pt-12">
      <PageHeader
        tone="forest"
        eyebrow="Karsa"
        title="Komunitas"
        subtitle="Tempat pendamping berbagi cerita, informasi, dan saling mendukung."
      />

      {/* The aside is a companion, not a second page: it keeps its width while
          the feed takes whatever the viewport gives. Below `lg` it drops under
          the feed, where an upcoming session still makes sense to meet after
          you have read what the room is talking about. */}
      {/* The cap is carried as a custom property and only *used* from `lg` up.
          Below that the sidebar sits under the feed, where borrowing its height
          would mean scrolling a box inside a page that already scrolls. */}
      <div
        style={{ "--aside-h": asideH ? `${asideH}px` : "none" } as CSSProperties}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_316px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_336px] xl:gap-10 2xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="min-w-0 lg:flex lg:max-h-[var(--aside-h)] lg:flex-col">
          {/* Stays put: a search box and a tab bar that scroll away are two
              controls you have to go back up for. */}
          <div className="lg:shrink-0">
            <CommunityToolbar
              query={query}
              onQuery={setQuery}
              tab={tab}
              onTab={setTab}
              sort={sort}
              onSort={setSort}
              counts={counts}
              onCompose={() => setComposing(true)}
            />
          </div>

          {/* `-mx-1 px-1` gives the cards' rings and shadows room to draw
              instead of being shaved off by the scroll container's edge.

              `contain: paint` is load-bearing, not a hint. Without it the feed's
              clipped overflow still counted toward the document's scrollable
              area: the page ended at 1.389px but scrolled to 2.359px, so every
              post added blank canvas below the sidebar — the exact growth the
              cap was meant to stop. Paint containment is what actually keeps
              the overflow inside the box. Scoped to `lg` alongside the overflow,
              because below that it would clip the cards' own shadows. */}
          <div className="lg:-mx-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:px-1 lg:[contain:paint] lg:[scrollbar-gutter:stable]">
            <CommunityFeed query={query} tab={tab} sort={sort} data={data} />
          </div>
        </div>

        <ComposePost
          open={composing}
          onClose={() => setComposing(false)}
          groups={data.groups}
        />

        <div ref={asideRef}>
          <CommunityAside onTopic={setQuery} active={query} data={data} />
        </div>
      </div>
    </div>
  );
}

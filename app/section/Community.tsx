"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import CommunityToolbar, { type FeedTab } from "../components/CommunityToolbar";
import CommunityFeed, { tabCounts } from "../components/CommunityFeed";
import CommunityAside from "../components/CommunityAside";
import ComposePost from "../components/ComposePost";
import GroupChat from "../components/GroupChat";
import ComposeGroup from "../components/ComposeGroup";
import PostDetail from "../components/PostDetail";
import ProfileCardModal from "../components/ProfileCardModal";
import { findPeople } from "../lib/community/actions";
import type {
  CommunityGroup,
  CommunityPerson,
  CommunityPost,
} from "../lib/community/queries";
import type { SortKey } from "../data/community";
import type { CommunityData } from "../lib/community/queries";

export default function CommunityPage({ data }: { data: CommunityData }) {

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FeedTab>("semua");
  const [sort, setSort] = useState<SortKey>("relevan");
  const [composing, setComposing] = useState(false);
  const [chatGroup, setChatGroup] = useState<CommunityGroup | null>(null);
  const [makingGroup, setMakingGroup] = useState(false);
  const [openPost, setOpenPost] = useState<CommunityPost | null>(null);
  const [openProfile, setOpenProfile] = useState<string | null>(null);

  const [found, setFound] = useState<{ term: string; rows: CommunityPerson[] }>({
    term: "",
    rows: [],
  });

  const counts = useMemo(() => tabCounts(query, data), [query, data]);


  const term = query.trim();

  useEffect(() => {
    if (term.length < 2) return;

    let stale = false;
    const timer = window.setTimeout(() => {
      findPeople(term)
        .then((rows) => {
          if (!stale) setFound({ term, rows });
        })
        .catch(() => {
          if (!stale) setFound({ term, rows: [] });
        });
    }, 250);

    return () => {
      stale = true;
      window.clearTimeout(timer);
    };
  }, [term]);


  const people = term.length >= 2 && found.term === term ? found.rows : [];

  const feedScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-[calc(100svh-var(--bottom-nav))] w-full flex-col px-4 pb-4 pt-4 sm:px-6 md:px-8 xl:px-12">
      <div className="shrink-0">
        <CommunityToolbar
          query={query}
          onQuery={setQuery}
          tab={tab}
          onTab={setTab}
          sort={sort}
          onSort={setSort}
          counts={counts}
          onCompose={() => setComposing(true)}
          onComposeGroup={() => setMakingGroup(true)}
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
        <div
          ref={feedScrollRef}
          className="-mx-1 min-h-0 overflow-y-auto overscroll-contain px-1 pb-2 [contain:paint] lg:[scrollbar-gutter:stable]"
        >
          <CommunityFeed
            query={query}
            tab={tab}
            sort={sort}
            data={data}
            onOpenGroup={setChatGroup}
            onOpenPost={setOpenPost}
            onOpenProfile={setOpenProfile}
            people={people}
            scrollRoot={feedScrollRef}
          />
        </div>

        <div className="hidden min-h-0 overflow-y-auto pb-2 lg:block">
          <CommunityAside
            onTopic={setQuery}
            active={query}
            data={data}
            onOpenGroup={setChatGroup}
          />
        </div>
      </div>

        <PostDetail post={openPost} meId={data.meId} onClose={() => setOpenPost(null)} />

        <ProfileCardModal profileId={openProfile} onClose={() => setOpenProfile(null)} />

        <GroupChat group={chatGroup} meId={data.meId} onClose={() => setChatGroup(null)} />

        <ComposeGroup
          open={makingGroup}
          onClose={() => setMakingGroup(false)}
          ownsGroup={data.ownsGroup}
        />

        <ComposePost
          open={composing}
          onClose={() => setComposing(false)}
          groups={data.groups}
        />

    </div>
  );
}

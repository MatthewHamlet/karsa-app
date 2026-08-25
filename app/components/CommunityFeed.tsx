"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowBigUp, Bell, BellRing, CalendarDays, Check, Clock, MessageCircle, UsersRound } from "lucide-react";
import Image from "next/image";
import GroupArt from "./GroupArt";
import { Avatar, Tag } from "./CommunityKit";
import { TONES } from "./tones";
import type { FeedTab } from "./CommunityToolbar";
import { count, matches, type SortKey } from "../data/community";
import type { GroupArtKind } from "./GroupArt";
import type { Tone } from "./tones";
import { POSTS_PER_PAGE } from "../lib/community/constants";
import type {
  CommunityData,
  CommunityGroup,
  CommunityPerson,
  CommunityPost,
} from "../lib/community/queries";
import { loadMorePosts, toggleGroup, toggleVote } from "../lib/community/actions";


export const ART: GroupArtKind[] = ["nutrition", "elderly", "mind", "recovery"];

const TAG_TONES: Tone[] = ["green", "lavender", "peach", "blue", "cream"];
export function toneForTag(word: string): Tone {
  let hash = 0;
  for (let i = 0; i < word.length; i += 1) hash = (hash * 31 + word.charCodeAt(i)) >>> 0;
  return TAG_TONES[hash % TAG_TONES.length];
}

export const artOf = (value: string): GroupArtKind =>
  (ART as string[]).includes(value) ? (value as GroupArtKind) : "elderly";

export const toneOf = (value: string): Tone =>
  value in TONES ? (value as Tone) : "green";


const postText = (post: CommunityPost) => [
  post.title,
  post.snippet,
  post.author.name,
  ...post.keywords,
  ...post.tags,
];

const groupTextOf = (group: CommunityGroup) => [
  group.name,
  group.blurb,
  ...group.keywords,
];

const PLUM = "#6f5a7d";


export function tabCounts(query: string, data: CommunityData): Record<FeedTab, number> {
  const posts = data.posts.filter((d) => matches(query, postText(d))).length;
  const groups = data.groups.filter((g) => matches(query, groupTextOf(g))).length;
  const mine = data.myGroups.filter((g) => matches(query, groupTextOf(g))).length;

  return { semua: posts + groups, postingan: posts, grup: groups, grupku: mine };
}




function PostCard({
  post,
  onOpen,
  onOpenProfile,
}: {
  post: CommunityPost;
  onOpen: (post: CommunityPost) => void;
  onOpenProfile: (profileId: string) => void;
}) {
  const author = post.author;

  const [voted, setVoted] = useState(post.voted);
  const [votes, setVotes] = useState(post.upvotes);

  const vote = () => {
    setVoted((v) => !v);
    setVotes((n) => n + (voted ? -1 : 1));
    const fd = new FormData();
    fd.set("post_id", post.id);
    void toggleVote({ error: null }, fd);
  };

  return (
    <article className="relative rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgba(24,32,24,0.03),0_14px_30px_-26px_rgba(24,32,24,0.28)] ring-1 ring-karsa-line transition-shadow duration-200 hover:shadow-[0_1px_2px_rgba(24,32,24,0.04),0_20px_36px_-24px_rgba(24,32,24,0.38)] xl:p-6">

      <div className="relative z-10 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onOpenProfile(author.id)}
          aria-label={`Lihat profil ${author.name}`}
          className="group/author flex min-w-0 items-center gap-2.5 rounded-full text-left outline-none focus-visible:ring-2 focus-visible:ring-karsa/40"
        >
          <Avatar person={author} />
          <span className="min-w-0 truncate text-[13.5px] font-semibold text-neutral-700 transition-colors duration-150 group-hover/author:text-karsa-dark">
            {author.name}
          </span>
        </button>

        <span aria-hidden className="text-[13px] text-neutral-300">
          ·
        </span>
        <p className="shrink-0 text-[12.5px] text-neutral-400">{post.age}</p>
      </div>

      <h3 className="mt-3 font-satoshi text-[16px] font-bold leading-6 tracking-tight text-neutral-900 xl:text-[17px]">
        <button
          type="button"
          onClick={() => onOpen(post)}
          className="text-left outline-none after:absolute after:inset-0 after:rounded-[20px] focus-visible:underline focus-visible:decoration-karsa focus-visible:decoration-2 focus-visible:underline-offset-4"
        >
          {post.title}
        </button>
      </h3>

      <p className="mt-2 line-clamp-2 text-[13.5px] leading-6 text-neutral-500">
        {post.snippet}
      </p>

      {post.imageUrl && (

        <div className="relative mt-4 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-karsa-canvas ring-1 ring-karsa-line">
          <Image
            src={post.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1280px) 640px, (min-width: 768px) 60vw, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">

          {post.tags.map((tag) => (
            <Tag key={tag} label={tag} tone={toneForTag(tag)} />
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-4 text-[13px] font-semibold text-neutral-500">
          <button
            type="button"
            onClick={() => onOpen(post)}
            className="inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 outline-none transition-colors duration-200 hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            <MessageCircle size={15} strokeWidth={2.2} aria-hidden />
            {count(post.replies)}
            <span className="sr-only">tanggapan — buka untuk berkomentar</span>
          </button>
          <button
            type="button"
            onClick={vote}
            aria-pressed={voted}
            aria-label={voted ? "Batalkan dukungan" : "Dukung postingan ini"}
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
              voted ? "text-karsa-dark" : "hover:text-neutral-700"
            }`}
          >
            <ArrowBigUp
              size={17}
              strokeWidth={2.1}
              aria-hidden
              className={voted ? "fill-current" : ""}
            />
            {count(votes)}
          </button>
        </div>
      </div>
    </article>
  );
}




function GroupCard({
  group,
  onOpenChat,
}: {
  group: CommunityGroup;
  onOpenChat: (group: CommunityGroup) => void;
}) {
  const [joined, setJoined] = useState(group.joined);
  const [members, setMembers] = useState(group.members);
  const tone = TONES[toneOf(group.tone)];

  const toggle = () => {
    setJoined((v) => !v);
    setMembers((n) => n + (joined ? -1 : 1));
    const fd = new FormData();
    fd.set("group_id", group.id);
    void toggleGroup({ error: null }, fd);
  };

  return (
    <article className={`rounded-[20px] p-5 ring-1 ${tone.card} ${tone.ring} xl:p-6`}>
      <div className="flex items-start gap-4">
        <span
          className={`grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/70 ring-1 ${tone.ring}`}
        >
          <GroupArt kind={artOf(group.art)} tone={toneOf(group.tone)} className="h-full w-full" />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={`text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] ${tone.ink}`}
          >
            Grup disarankan
          </p>
          <h3 className="mt-1 text-[16px] font-bold leading-5 tracking-tight text-neutral-900 xl:text-[17px]">
            {group.name}
          </h3>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-neutral-500">
            <UsersRound size={14} strokeWidth={2.2} aria-hidden />
            {count(members)} anggota
          </p>
        </div>
      </div>

      <p className="mt-3 text-[13.5px] leading-6 text-neutral-600">{group.blurb}</p>

      <button
        type="button"
        onClick={toggle}
        aria-pressed={joined}
        className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[14px] font-bold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 focus-visible:ring-offset-2 ${
          joined
            ? "bg-white/80 text-neutral-700 ring-1 ring-karsa-line hover:bg-white"
            : "bg-karsa text-white hover:bg-karsa-dark"
        }`}
      >
        {joined && <Check size={15} strokeWidth={2.6} aria-hidden />}
        {joined ? "Tergabung" : "Gabung"}
      </button>

      {joined && (
        <button
          type="button"
          onClick={() => onOpenChat(group)}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[14px] font-bold text-karsa-dark outline-none ring-1 ring-karsa-line transition-colors duration-200 hover:bg-karsa-soft focus-visible:ring-2 focus-visible:ring-karsa/40"
        >
          <MessageCircle size={15} strokeWidth={2.4} aria-hidden />
          Buka obrolan
        </button>
      )}
    </article>
  );
}



const SORTERS: Record<SortKey, ((a: CommunityPost, b: CommunityPost) => number) | null> = {

  relevan: null,
  terbaru: null,
  ramai: (a, b) => b.replies - a.replies,
  didukung: (a, b) => b.upvotes - a.upvotes,
};


const GROUP_EVERY = 3;

export default function CommunityFeed({
  query,
  tab,
  sort,
  data,
  onOpenGroup,
  onOpenPost,
  onOpenProfile,
  people,
  scrollRoot,
}: {
  query: string;
  tab: FeedTab;
  sort: SortKey;
  data: CommunityData;
  onOpenGroup: (group: CommunityGroup) => void;
  onOpenPost: (post: CommunityPost) => void;
  onOpenProfile: (profileId: string) => void;

  people: CommunityPerson[];
  scrollRoot?: React.RefObject<HTMLDivElement | null>;
}) {
  const [extra, setExtra] = useState<CommunityPost[]>([]);
  const [exhausted, setExhausted] = useState(data.posts.length < POSTS_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    setExtra([]);
    setExhausted(data.posts.length < POSTS_PER_PAGE);
  }, [data.posts]);

  const loaded = useMemo(() => {
    const seen = new Set<string>();
    return [...data.posts, ...extra].filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [data.posts, extra]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || exhausted) return;

    const container = scrollRoot?.current ?? null;
    const root = container && container.scrollHeight > container.clientHeight ? container : null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || busyRef.current) return;
        busyRef.current = true;
        setLoadingMore(true);

        loadMorePosts(loaded.length)
          .then((rows) => {
            if (rows.length < POSTS_PER_PAGE) setExhausted(true);
            if (rows.length > 0) setExtra((prev) => [...prev, ...rows]);
          })
          .finally(() => {
            busyRef.current = false;
            setLoadingMore(false);
          });
      },
      { root, rootMargin: "400px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [exhausted, loaded.length, scrollRoot]);

  const posts = loaded.filter((p) => matches(query, postText(p)));
  const groups = data.groups.filter((g) => matches(query, groupTextOf(g)));
  const mine = data.myGroups.filter((g) => matches(query, groupTextOf(g)));

  const sorter = SORTERS[sort];
  const ordered = sorter ? [...posts].sort(sorter) : posts;


  const followed = new Set(data.followedIds);
  const sortedPosts =
    followed.size > 0 && !query.trim()
      ? [
          ...ordered.filter((p) => followed.has(p.author.id)),
          ...ordered.filter((p) => !followed.has(p.author.id)),
        ]
      : ordered;

  const rendered: React.ReactNode[] = [];

  if (tab === "postingan") {
    rendered.push(
      ...sortedPosts.map((post) => (
        <PostCard key={post.id} post={post} onOpen={onOpenPost} onOpenProfile={onOpenProfile} />
      )),
    );
  } else if (tab === "grup") {
    rendered.push(
      ...groups.map((group) => (
        <GroupCard key={group.id} group={group} onOpenChat={onOpenGroup} />
      )),
    );
  } else if (tab === "grupku") {
    rendered.push(
      ...mine.map((group) => (
        <GroupCard key={group.id} group={group} onOpenChat={onOpenGroup} />
      )),
    );
  } else {

    let groupCursor = 0;

    sortedPosts.forEach((post, i) => {
      rendered.push(<PostCard key={post.id} post={post} onOpen={onOpenPost} onOpenProfile={onOpenProfile} />);

      if ((i + 1) % GROUP_EVERY === 0 && groupCursor < groups.length) {
        const group = groups[groupCursor];
        groupCursor += 1;
        rendered.push(
          <GroupCard key={group.id} group={group} onOpenChat={onOpenGroup} />,
        );
      }
    });

    for (; groupCursor < groups.length; groupCursor += 1) {
      const group = groups[groupCursor];
      rendered.push(<GroupCard key={group.id} group={group} onOpenChat={onOpenGroup} />);
    }
  }


  const peopleBlock =
    people.length > 0 && tab !== "grup" && tab !== "grupku" ? (
      <section
        key="people"
        className="rounded-[20px] bg-white p-4 ring-1 ring-karsa-line xl:p-5"
      >
        <p className="mb-2.5 text-[11px] font-semibold uppercase leading-4 tracking-[0.16em] text-neutral-400">
          Orang
        </p>
        <ul className="space-y-1">
          {people.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => onOpenProfile(person.id)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left outline-none transition-colors duration-150 hover:bg-karsa-canvas focus-visible:ring-2 focus-visible:ring-karsa/40"
              >
                <Avatar person={person} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-neutral-800">
                    {person.name}
                  </span>
                  <span className="block truncate text-[12.5px] text-neutral-500">
                    {person.role}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  if (rendered.length === 0) {

    if (peopleBlock) return <div className="space-y-4 xl:space-y-5">{peopleBlock}</div>;

    return (
      <p className="rounded-[20px] bg-white/60 px-5 py-10 text-center text-[14px] leading-6 text-neutral-500 ring-1 ring-karsa-line">
        {query.trim() ? (
          <>
            Tidak ada yang cocok dengan{" "}
            <span className="font-semibold text-neutral-700">“{query.trim()}”</span>.
          </>
        ) : (
          "Belum ada apa pun di sini. Jadilah yang pertama menulis."
        )}
      </p>
    );
  }

  return (
    <div className="space-y-4 xl:space-y-5">
      {peopleBlock}
      {rendered}

      {tab !== "grup" && tab !== "grupku" && !exhausted && (
        <div ref={sentinelRef} className="py-4 text-center">
          {loadingMore && (
            <p className="text-[13.5px] text-neutral-500">Memuat postingan…</p>
          )}
        </div>
      )}
    </div>
  );
}

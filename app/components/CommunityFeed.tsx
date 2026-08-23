"use client";

import { useState } from "react";
import { ArrowBigUp, Bell, BellRing, CalendarDays, Check, Clock, MessageCircle, UsersRound } from "lucide-react";
import Image from "next/image";
import GroupArt from "./GroupArt";
import { Avatar, Tag } from "./CommunityKit";
import { TONES } from "./tones";
import type { FeedTab } from "./CommunityToolbar";
import { count, matches, type SortKey } from "../data/community";
import type { GroupArtKind } from "./GroupArt";
import type { Tone } from "./tones";
import type {
  CommunityData,
  CommunityGroup,
  CommunityPost,
  CommunitySession,
} from "../lib/community/queries";
import {
  toggleFollow,
  toggleGroup,
  toggleSession,
  toggleVote,
} from "../lib/community/actions";

/** The database keeps `art` and `tone` as free text so a value added later
 *  cannot fail a constraint on deploy day — which means the component has to be
 *  the one that copes with an unknown one. Both fall back rather than throwing;
 *  a card with the default drawing is a card, a crash is not. */
const ART: GroupArtKind[] = ["nutrition", "elderly", "mind", "recovery"];
/** A stable tone per tag word. Hashed rather than random, so "lansia" is the
 *  same colour on every card and on every reload — a chip that changes colour
 *  between renders reads as a different chip. */
const TAG_TONES: Tone[] = ["green", "lavender", "peach", "blue", "cream"];
export function toneForTag(word: string): Tone {
  let hash = 0;
  for (let i = 0; i < word.length; i += 1) hash = (hash * 31 + word.charCodeAt(i)) >>> 0;
  return TAG_TONES[hash % TAG_TONES.length];
}

const artOf = (value: string): GroupArtKind =>
  (ART as string[]).includes(value) ? (value as GroupArtKind) : "elderly";

const toneOf = (value: string): Tone =>
  value in TONES ? (value as Tone) : "green";

/** What a post is searchable by. Built here rather than stored: the same words
 *  are already on the row, and a second denormalised copy is one more thing to
 *  keep in step. */
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

/** How many items a tab would show. Computed from the same predicate the feed
 *  uses, so a badge can never promise a row the feed doesn't render. */
export function tabCounts(query: string, data: CommunityData): Record<FeedTab, number> {
  const posts = data.posts.filter((d) => matches(query, postText(d))).length;
  const groups = data.groups.filter((g) => matches(query, groupTextOf(g))).length;
  const session =
    data.session &&
    matches(query, [data.session.title, data.session.blurb, data.session.host, "sesi langsung"])
      ? 1
      : 0;

  return { semua: posts + groups + session, postingan: posts, grup: groups, sesi: session };
}

/* ── Post ─────────────────────────────────────────────────────────────────── */

/** A thread, full width. Header, question, then a footer that carries the tags
 *  on the left and the counts on the right — the sketch's layout, and the one
 *  that lets a caregiver scan either column on its own. */
function PostCard({ post }: { post: CommunityPost }) {
  const author = post.author;
  /* Optimistic, and local to the card. The write is a round trip and the arrow
     has to answer the press immediately; the next server render is what
     corrects it if the write lost. */
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
    <article className="rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgba(24,32,24,0.03),0_14px_30px_-26px_rgba(24,32,24,0.28)] ring-1 ring-karsa-line transition-shadow duration-200 hover:shadow-[0_1px_2px_rgba(24,32,24,0.04),0_20px_36px_-24px_rgba(24,32,24,0.38)] xl:p-6">
      <div className="flex items-center gap-2.5">
        <Avatar person={author} />
        <p className="min-w-0 truncate text-[13.5px] font-semibold text-neutral-700">
          {author.name}
        </p>
        {/* The dot carries the separation so the timestamp needs no label —
            "·" between a name and a time already reads as "posted". */}
        <span aria-hidden className="text-[13px] text-neutral-300">
          ·
        </span>
        <p className="shrink-0 text-[12.5px] text-neutral-400">{post.age}</p>
      </div>

      <h3 className="mt-3 font-satoshi text-[16px] font-bold leading-6 tracking-tight text-neutral-900 xl:text-[17px]">
        <a
          href="#"
          className="outline-none after:absolute focus-visible:underline focus-visible:decoration-karsa focus-visible:decoration-2 focus-visible:underline-offset-4"
        >
          {post.title}
        </a>
      </h3>

      <p className="mt-2 line-clamp-2 text-[13.5px] leading-6 text-neutral-500">
        {post.snippet}
      </p>

      {post.imageUrl && (
        /* Fixed aspect box with `object-cover`: photos arrive at every ratio,
            and letting each set its own height makes the feed jump as images
            decode. `sizes` matters — without it Next serves the largest source
            to a phone. */
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {/* The tone is derived from the word rather than stored beside it:
              a colour is a fact about the design, and asking somebody writing
              a post to pick one would be asking them to do art direction. */}
          {post.tags.map((tag) => (
            <Tag key={tag} label={tag} tone={toneForTag(tag)} />
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-4 text-[13px] font-semibold text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle size={15} strokeWidth={2.2} aria-hidden />
            {count(post.replies)}
            <span className="sr-only">tanggapan</span>
          </span>
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

/* ── Group ────────────────────────────────────────────────────────────────── */

/** A group recommendation, deliberately not shaped like a post: it sits on its
 *  own hue instead of white, carries artwork instead of an avatar, and ends in
 *  a full-width button. Nothing about it invites a read — it asks a yes/no. */
function GroupCard({ group }: { group: CommunityGroup }) {
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
    </article>
  );
}

/* ── Session ──────────────────────────────────────────────────────────────── */

/** The same session the sidebar carries, inlined where the feed reaches it —
 *  and the only thing the "Sesi Langsung" tab has to show on a phone, where the
 *  sidebar has dropped to the bottom of the page. */
function SessionCard({ session }: { session: CommunitySession }) {
  const [joined, setJoined] = useState(session.joined);
  const [reminded, setReminded] = useState(false);

  const attend = () => {
    setJoined((v) => !v);
    const fd = new FormData();
    fd.set("session_id", session.id);
    void toggleSession({ error: null }, fd);
  };

  return (
    <article
      className="relative overflow-hidden rounded-[20px] p-5 text-white shadow-[0_1px_2px_rgba(24,32,24,0.03),0_18px_36px_-28px_rgba(24,32,24,0.55)] xl:p-6"
      style={{ backgroundColor: PLUM }}
    >
      <svg
        aria-hidden
        viewBox="0 0 480 220"
        preserveAspectRatio="xMaxYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.13]"
      >
        <circle cx="430" cy="10" r="92" fill="white" />
        <circle cx="476" cy="182" r="64" fill="white" />
        <circle cx="340" cy="196" r="44" fill="white" />
      </svg>

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.18em] text-white/60">
          Sesi langsung
        </p>
        <h3 className="mt-2 font-satoshi text-[17px] font-bold leading-6 tracking-tight xl:text-[19px]">
          {session.title}
        </h3>
        <p className="mt-2 text-[13.5px] leading-6 text-white/75">{session.blurb}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12.5px] font-semibold ring-1 ring-white/20">
            <CalendarDays size={14} strokeWidth={2.2} aria-hidden />
            {session.date}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12.5px] font-semibold tabular-nums ring-1 ring-white/20">
            <Clock size={14} strokeWidth={2.2} aria-hidden />
            {session.time}
          </span>
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1.5 text-[12.5px] text-white/80 ring-1 ring-white/20">
            Bersama {session.host}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={attend}
            aria-pressed={joined}
            className={`flex-1 rounded-full py-2.5 text-[14px] font-bold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/70 ${
              joined ? "bg-white/25 text-white ring-1 ring-white/40" : "bg-white hover:bg-white/90"
            }`}
            style={joined ? undefined : { color: PLUM }}
          >
            {joined ? "Sudah terdaftar" : "Ikuti Sesi"}
          </button>
          <button
            type="button"
            onClick={() => setReminded((v) => !v)}
            aria-pressed={reminded}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-[13.5px] font-semibold outline-none ring-1 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/70 ${
              reminded
                ? "bg-white/25 text-white ring-white/40"
                : "bg-white/10 text-white/85 ring-white/25 hover:bg-white/20"
            }`}
          >
            {reminded ? (
              <BellRing size={15} strokeWidth={2.3} aria-hidden />
            ) : (
              <Bell size={15} strokeWidth={2.3} aria-hidden />
            )}
            {reminded ? "Pengingat aktif" : "Ingatkan Saya"}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ── Feed ─────────────────────────────────────────────────────────────────── */

const SORTERS: Record<SortKey, ((a: CommunityPost, b: CommunityPost) => number) | null> = {
  /* The query already returns newest-first, so "relevan" and "terbaru" are the
     same order until there is a relevance score to sort by. Kept as two entries
     rather than collapsed, because they will diverge the moment there is one. */
  relevan: null,
  terbaru: null,
  ramai: (a, b) => b.replies - a.replies,
  didukung: (a, b) => b.upvotes - a.upvotes,
};

/** How often a group card is dealt into the run of posts.
 *
 *  The feed used to be a hand-written running order — post, post, group,
 *  post, session — which cannot survive real data: there is no editor deciding
 *  what the fourth card is. Woven at a fixed interval instead, so the rhythm of
 *  the original stays without anybody having to maintain a list. */
const GROUP_EVERY = 3;
/** Which slot the session lands in, when there is one on. */
const SESSION_AFTER = 2;

export default function CommunityFeed({
  query,
  tab,
  sort,
  data,
}: {
  query: string;
  tab: FeedTab;
  sort: SortKey;
  data: CommunityData;
}) {
  const posts = data.posts.filter((p) => matches(query, postText(p)));
  const groups = data.groups.filter((g) => matches(query, groupTextOf(g)));
  const session =
    data.session &&
    matches(query, [data.session.title, data.session.blurb, data.session.host, "sesi langsung"])
      ? data.session
      : null;

  const sorter = SORTERS[sort];
  const sortedPosts = sorter ? [...posts].sort(sorter) : posts;

  const rendered: React.ReactNode[] = [];

  if (tab === "postingan") {
    rendered.push(...sortedPosts.map((post) => <PostCard key={post.id} post={post} />));
  } else if (tab === "grup") {
    rendered.push(...groups.map((group) => <GroupCard key={group.id} group={group} />));
  } else if (tab === "sesi") {
    if (session) rendered.push(<SessionCard key={session.id} session={session} />);
  } else {
    /* "Semua": posts carry the thread, with a group dealt in every few and the
       session once near the top. Any groups left over are appended, so nothing
       is silently unreachable just because there were too few posts to weave
       them into. */
    let groupCursor = 0;
    let sessionPlaced = false;

    sortedPosts.forEach((post, i) => {
      rendered.push(<PostCard key={post.id} post={post} />);

      if (!sessionPlaced && session && i === SESSION_AFTER) {
        rendered.push(<SessionCard key={session.id} session={session} />);
        sessionPlaced = true;
      }

      if ((i + 1) % GROUP_EVERY === 0 && groupCursor < groups.length) {
        const group = groups[groupCursor];
        groupCursor += 1;
        rendered.push(<GroupCard key={group.id} group={group} />);
      }
    });

    if (!sessionPlaced && session) {
      rendered.push(<SessionCard key={session.id} session={session} />);
    }
    for (; groupCursor < groups.length; groupCursor += 1) {
      const group = groups[groupCursor];
      rendered.push(<GroupCard key={group.id} group={group} />);
    }
  }

  if (rendered.length === 0) {
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

  return <div className="space-y-4 xl:space-y-5">{rendered}</div>;
}

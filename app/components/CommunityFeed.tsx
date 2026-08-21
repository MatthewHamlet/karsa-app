"use client";

import { useState } from "react";
import { ArrowBigUp, Bell, BellRing, CalendarDays, Check, Clock, MessageCircle, UsersRound } from "lucide-react";
import GroupArt from "./GroupArt";
import { Avatar, Tag } from "./CommunityKit";
import { TONES } from "./tones";
import type { FeedTab } from "./CommunityToolbar";
import {
  DISCUSSIONS,
  FEED,
  GROUPS,
  LIVE_SESSION,
  PEOPLE,
  count,
  discussionText,
  groupText,
  matches,
  type Discussion,
  type Group,
  type SortKey,
} from "../data/community";

const PLUM = "#6f5a7d";

const byId = <T extends { id: string }>(list: T[], id: string) =>
  list.find((item) => item.id === id);

/** How many items a tab would show. Computed from the same predicate the feed
 *  uses, so a badge can never promise a row the feed doesn't render. */
export function tabCounts(query: string): Record<FeedTab, number> {
  const posts = DISCUSSIONS.filter((d) => matches(query, discussionText(d))).length;
  const groups = GROUPS.filter((g) => matches(query, groupText(g))).length;
  const session = matches(query, [
    LIVE_SESSION.title,
    LIVE_SESSION.blurb,
    LIVE_SESSION.host,
    "sesi langsung",
  ])
    ? 1
    : 0;

  return { semua: posts + groups + session, postingan: posts, grup: groups, sesi: session };
}

/* ── Post ─────────────────────────────────────────────────────────────────── */

/** A thread, full width. Header, question, then a footer that carries the tags
 *  on the left and the counts on the right — the sketch's layout, and the one
 *  that lets a caregiver scan either column on its own. */
function PostCard({ post }: { post: Discussion }) {
  const author = PEOPLE[post.author];

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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Tag key={tag.label} label={tag.label} tone={tag.tone} />
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-4 text-[13px] font-semibold text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle size={15} strokeWidth={2.2} aria-hidden />
            {count(post.replies)}
            <span className="sr-only">tanggapan</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <ArrowBigUp size={17} strokeWidth={2.1} aria-hidden />
            {count(post.upvotes)}
            <span className="sr-only">dukungan</span>
          </span>
        </div>
      </div>
    </article>
  );
}

/* ── Group ────────────────────────────────────────────────────────────────── */

/** A group recommendation, deliberately not shaped like a post: it sits on its
 *  own hue instead of white, carries artwork instead of an avatar, and ends in
 *  a full-width button. Nothing about it invites a read — it asks a yes/no. */
function GroupCard({
  group,
  joined,
  onToggle,
}: {
  group: Group;
  joined: boolean;
  onToggle: () => void;
}) {
  const tone = TONES[group.tone];

  return (
    <article className={`rounded-[20px] p-5 ring-1 ${tone.card} ${tone.ring} xl:p-6`}>
      <div className="flex items-start gap-4">
        <span
          className={`grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/70 ring-1 ${tone.ring}`}
        >
          <GroupArt kind={group.art} tone={group.tone} className="h-full w-full" />
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
            {count(group.members)} anggota
          </p>
        </div>
      </div>

      <p className="mt-3 text-[13.5px] leading-6 text-neutral-600">{group.blurb}</p>

      <button
        type="button"
        onClick={onToggle}
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
function SessionCard() {
  const [reminded, setReminded] = useState(false);

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
          {LIVE_SESSION.eyebrow}
        </p>
        <h3 className="mt-2 font-satoshi text-[17px] font-bold leading-6 tracking-tight xl:text-[19px]">
          {LIVE_SESSION.title}
        </h3>
        <p className="mt-2 text-[13.5px] leading-6 text-white/75">{LIVE_SESSION.blurb}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12.5px] font-semibold ring-1 ring-white/20">
            <CalendarDays size={14} strokeWidth={2.2} aria-hidden />
            {LIVE_SESSION.date}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12.5px] font-semibold tabular-nums ring-1 ring-white/20">
            <Clock size={14} strokeWidth={2.2} aria-hidden />
            {LIVE_SESSION.time}
          </span>
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1.5 text-[12.5px] text-white/80 ring-1 ring-white/20">
            Bersama {LIVE_SESSION.host}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="flex-1 rounded-full bg-white py-2.5 text-[14px] font-bold outline-none transition-colors duration-200 hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70"
            style={{ color: PLUM }}
          >
            {LIVE_SESSION.cta}
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

const SORTERS: Record<SortKey, ((a: Discussion, b: Discussion) => number) | null> = {
  relevan: null,
  /* `FEED` is already newest-first, so position in it is the timestamp. Sorting
     on `age` would mean parsing "2 jam yang lalu", which is display text. */
  terbaru: (a, b) => order(a.id) - order(b.id),
  ramai: (a, b) => b.replies - a.replies,
  didukung: (a, b) => b.upvotes - a.upvotes,
};

const order = (id: string) =>
  FEED.findIndex((entry) => entry.kind === "post" && entry.ref === id);

export default function CommunityFeed({
  query,
  tab,
  sort,
}: {
  query: string;
  tab: FeedTab;
  sort: SortKey;
}) {
  const [joined, setJoined] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.id, Boolean(g.joined)])),
  );

  /* Resolve the running order into real items, then drop what the tab and the
     search have ruled out. Filtering after resolving keeps one source of order
     — the alternative is three lists that can each be sorted differently. */
  const entries = FEED.filter((entry) => {
    if (tab === "postingan") return entry.kind === "post";
    if (tab === "grup") return entry.kind === "group";
    if (tab === "sesi") return entry.kind === "session";
    return true;
  });

  const posts = entries
    .filter((e) => e.kind === "post")
    .map((e) => byId(DISCUSSIONS, (e as { ref: string }).ref))
    .filter((p): p is Discussion => Boolean(p) && matches(query, discussionText(p!)));

  const sorter = SORTERS[sort];
  const sortedPosts = sorter ? [...posts].sort(sorter) : posts;

  /* A sort only reorders posts. Groups and the session keep their slots, and
     the posts are dealt back into those slots in their new order — so changing
     the sort never makes a group jump the page. */
  let cursor = 0;
  const rendered = entries.flatMap((entry, i) => {
    if (entry.kind === "post") {
      const post = sortedPosts[cursor];
      if (!post || cursor >= sortedPosts.length) {
        cursor += 1;
        return [];
      }
      cursor += 1;
      return [<PostCard key={post.id} post={post} />];
    }

    if (entry.kind === "group") {
      const group = byId(GROUPS, entry.ref);
      if (!group || !matches(query, groupText(group))) return [];
      return [
        <GroupCard
          key={group.id}
          group={group}
          joined={Boolean(joined[group.id])}
          onToggle={() =>
            setJoined((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
          }
        />,
      ];
    }

    const visible = matches(query, [
      LIVE_SESSION.title,
      LIVE_SESSION.blurb,
      LIVE_SESSION.host,
      "sesi langsung",
    ]);
    return visible ? [<SessionCard key={`session-${i}`} />] : [];
  });

  if (rendered.length === 0) {
    return (
      <p className="rounded-[20px] bg-white/60 px-5 py-10 text-center text-[14px] leading-6 text-neutral-500 ring-1 ring-karsa-line">
        {query.trim() ? (
          <>
            Tidak ada yang cocok dengan{" "}
            <span className="font-semibold text-neutral-700">“{query.trim()}”</span>.
          </>
        ) : (
          "Belum ada apa pun di sini."
        )}
      </p>
    );
  }

  return <div className="space-y-4 xl:space-y-5">{rendered}</div>;
}

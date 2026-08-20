"use client";

import { useState } from "react";
import { Check, UsersRound } from "lucide-react";
import GroupArt from "./GroupArt";
import { SectionHead } from "./CommunityKit";
import { Empty } from "./CommunityDiscussions";
import { TONES } from "./tones";
import { GROUPS, count, groupText, matches } from "../data/community";

/** The sub-communities, two across.
 *
 *  These were one per row, which gave the blurb all the width it could want and
 *  spent five hundred pixels of page on four groups. In pairs the blurb clamps
 *  to two lines and the whole section fits above the fold — and the card turns
 *  vertical, art on top, so the name and the join button stop competing for the
 *  same line. */
export default function CommunityGroups({ query = "" }: { query?: string }) {
  const [joined, setJoined] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.id, Boolean(g.joined)])),
  );

  const groups = GROUPS.filter((group) => matches(query, groupText(group)));

  return (
    <section>
      <SectionHead title="Topik & Grup Pendamping" />

      {groups.length === 0 ? (
        <Empty query={query} what="grup" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => {
            const isIn = joined[group.id];
            const tone = TONES[group.tone];

            return (
              <li
                key={group.id}
                className="flex flex-col rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,24,0.03),0_14px_30px_-26px_rgba(24,32,24,0.28)] ring-1 ring-karsa-line sm:p-5"
              >
                <div className="flex items-start gap-4">
                  {/* The thumbnail sits on its group's own wash, so the card is
                      one hue from picture to button. */}
                  <span
                    className={`grid h-[64px] w-[80px] shrink-0 place-items-center overflow-hidden rounded-2xl ring-1 ${tone.card} ${tone.ring}`}
                  >
                    <GroupArt kind={group.art} tone={group.tone} className="h-full w-full" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15.5px] font-bold leading-5 tracking-tight text-neutral-900 xl:text-[16px]">
                      {group.name}
                    </h3>
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-neutral-500">
                      <UsersRound size={14} strokeWidth={2.2} aria-hidden />
                      {count(group.members)} anggota
                    </p>
                  </div>
                </div>

                {/* Clamped so every card in the row keeps one height. A blurb
                    that runs long is a blurb that needed editing, not more
                    room. */}
                <p className="mt-3 line-clamp-2 text-[13.5px] leading-5 text-neutral-500">
                  {group.blurb}
                </p>

                {/* The wrapper carries `mt-auto`, so the button is pinned to the
                    floor of the card and every card in a row puts it on the
                    same line — while `pt-4` guarantees a gap above it even in
                    the tallest card, where there is no slack left to give. */}
                <div className="mt-auto pt-4">
                  <button
                    type="button"
                    onClick={() => setJoined((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                    aria-pressed={isIn}
                    className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[13.5px] font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 focus-visible:ring-offset-2 ${
                      isIn
                        ? "bg-karsa-soft text-karsa-dark ring-1 ring-karsa-line hover:bg-karsa-soft/70"
                        : "bg-karsa text-white hover:bg-karsa-dark"
                    }`}
                  >
                    {isIn && <Check size={15} strokeWidth={2.6} aria-hidden />}
                    {isIn ? "Tergabung" : "Gabung Grup"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import { Check, UsersRound } from "lucide-react";
import GroupArt from "./GroupArt";
import { SectionHead } from "./CommunityKit";
import { TONES } from "./tones";
import { GROUPS, count } from "../data/community";

/** The sub-communities, stacked. A row rather than a grid: the blurb is what
 *  tells a caregiver whether this is their room, and a grid would crop it. */
export default function CommunityGroups() {
  const [joined, setJoined] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.id, Boolean(g.joined)])),
  );

  return (
    <section>
      <SectionHead title="Topik & Grup Pendamping" />

      <ul className="space-y-4">
        {GROUPS.map((group) => {
          const isIn = joined[group.id];
          const tone = TONES[group.tone];

          return (
            <li
              key={group.id}
              className="flex flex-wrap items-center gap-x-5 gap-y-4 rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,24,0.03),0_14px_30px_-26px_rgba(24,32,24,0.28)] ring-1 ring-karsa-line sm:p-5"
            >
              {/* The thumbnail sits on its group's own wash, so the row is one
                  hue from picture to tag. */}
              <span
                className={`grid h-[74px] w-[92px] shrink-0 place-items-center overflow-hidden rounded-2xl ring-1 sm:h-[86px] sm:w-[108px] ${tone.card} ${tone.ring}`}
              >
                <GroupArt kind={group.art} tone={group.tone} className="h-full w-full" />
              </span>

              {/* A small basis on purpose: it lets the blurb take a third line
                  rather than pushing the join button onto one of its own, which
                  is what the row looks worst doing. */}
              <div className="min-w-0 flex-1 basis-[168px]">
                <h3 className="text-[16px] font-bold leading-6 tracking-tight text-neutral-900 xl:text-[17px]">
                  {group.name}
                </h3>
                {/* Clamped so the stack keeps one row height. A blurb that
                    runs long is a blurb that needed editing, not more room. */}
                <p className="mt-1 line-clamp-2 text-[13.5px] leading-5 text-neutral-500">
                  {group.blurb}
                </p>
                <p className="mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-neutral-500">
                  <UsersRound size={14} strokeWidth={2.2} />
                  {count(group.members)} anggota
                </p>
              </div>

              <button
                type="button"
                onClick={() => setJoined((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                aria-pressed={isIn}
                className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[13.5px] font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 focus-visible:ring-offset-2 ${
                  isIn
                    ? "bg-karsa-soft text-karsa-dark ring-1 ring-karsa-line hover:bg-karsa-soft/70"
                    : "bg-karsa text-white hover:bg-karsa-dark"
                }`}
              >
                {isIn && <Check size={15} strokeWidth={2.6} />}
                {isIn ? "Tergabung" : "Gabung Grup"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

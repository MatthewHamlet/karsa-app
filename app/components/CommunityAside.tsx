"use client";

import { useState } from "react";
import { CalendarDays, Clock, Plus, Check } from "lucide-react";
import Panel from "./Panel";
import { Avatar } from "./CommunityKit";
import { TONES } from "./tones";
import { HASHTAGS, LIVE_SESSION, PEOPLE, SUGGESTED } from "../data/community";

/** The one loud colour on the page. Plum rather than another green: it has to
 *  read as a different kind of thing from the forest header above it, and it
 *  is the only card here asking for a decision. */
const PLUM = "#6f5a7d";

/** The header's texture, at card scale — same three overlapping discs, so the
 *  banner reads as family with the page's own header. */
const Shapes = () => (
  <svg
    aria-hidden
    viewBox="0 0 320 260"
    preserveAspectRatio="xMaxYMin slice"
    className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.13]"
  >
    <circle cx="284" cy="-6" r="92" fill="white" />
    <circle cx="330" cy="118" r="64" fill="white" />
    <circle cx="212" cy="132" r="44" fill="white" />
  </svg>
);

function LiveSession() {
  return (
    <section
      className="relative overflow-hidden rounded-[20px] p-6 text-white shadow-[0_1px_2px_rgba(24,32,24,0.03),0_18px_36px_-28px_rgba(24,32,24,0.55)]"
      style={{ backgroundColor: PLUM }}
    >
      <Shapes />

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.18em] text-white/60">
          {LIVE_SESSION.eyebrow}
        </p>
        {/* Same rule as a thread title — this one runs to three lines. */}
        <h2 className="mt-2 font-satoshi text-[19px] font-bold leading-7 tracking-tight">
          {LIVE_SESSION.title}
        </h2>
        <p className="mt-2 text-[13.5px] leading-5 text-white/75">{LIVE_SESSION.blurb}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12.5px] font-semibold ring-1 ring-white/20">
            <CalendarDays size={14} strokeWidth={2.2} />
            {LIVE_SESSION.date}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12.5px] font-semibold tabular-nums ring-1 ring-white/20">
            <Clock size={14} strokeWidth={2.2} />
            {LIVE_SESSION.time}
          </span>
        </div>

        <p className="mt-4 text-[12.5px] text-white/60">Bersama {LIVE_SESSION.host}</p>

        <button
          type="button"
          className="mt-4 w-full rounded-full bg-white py-2.5 text-[14px] font-bold outline-none transition-colors duration-200 hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70"
          style={{ color: PLUM }}
        >
          {LIVE_SESSION.cta}
        </button>
      </div>
    </section>
  );
}

function TopicCloud() {
  return (
    <Panel title="Topik Populer">
      <div className="flex flex-wrap gap-2">
        {HASHTAGS.map((tag) => {
          const t = TONES[tag.tone];
          return (
            <a
              key={tag.label}
              href="#"
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-[12.5px] font-semibold outline-none ring-1 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-karsa/40 ${t.card} ${t.ring} ${t.ink}`}
            >
              {tag.label}
            </a>
          );
        })}
      </div>
    </Panel>
  );
}

function PeopleToFollow() {
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  return (
    <Panel title="Orang untuk Diikuti">
      <ul className="space-y-4">
        {SUGGESTED.map((id) => {
          const person = PEOPLE[id];
          const isOn = following[id];

          return (
            <li key={id} className="flex items-center gap-3">
              <Avatar person={person} size="md" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold leading-5 text-neutral-800">
                  {person.name}
                </p>
                <p className="truncate text-[12.5px] leading-4 text-neutral-500">{person.role}</p>
              </div>

              <button
                type="button"
                onClick={() => setFollowing((prev) => ({ ...prev, [id]: !prev[id] }))}
                aria-pressed={isOn}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
                  isOn
                    ? "bg-karsa-soft text-karsa-dark ring-1 ring-karsa-line hover:bg-karsa-soft/70"
                    : "bg-karsa text-white hover:bg-karsa-dark"
                }`}
              >
                {isOn ? <Check size={13} strokeWidth={2.8} /> : <Plus size={13} strokeWidth={2.8} />}
                {isOn ? "Mengikuti" : "Ikuti"}
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** The right-hand column: what's coming up, what people are talking about, and
 *  who to listen to — in that order, because only the first one expires. */
export default function CommunityAside() {
  return (
    <aside className="space-y-6 xl:space-y-8">
      <LiveSession />
      <TopicCloud />
      <PeopleToFollow />
    </aside>
  );
}

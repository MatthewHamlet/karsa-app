"use client";

import { useState } from "react";
import { MessageCircle, Plus, Check } from "lucide-react";
import Panel from "./Panel";
import { Avatar } from "./CommunityKit";
import { TONES } from "./tones";
import { count } from "../data/community";
import { toneForTag } from "./CommunityFeed";
import type {
  CommunityData,
  CommunityGroup,
  CommunityPerson,
} from "../lib/community/queries";
import GroupArt from "./GroupArt";
import { artOf, toneOf } from "./CommunityFeed";
import { toggleFollow } from "../lib/community/actions";


const PLUM = "#6f5a7d";


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

function MyGroups({
  groups,
  onOpen,
}: {
  groups: CommunityGroup[];
  onOpen: (group: CommunityGroup) => void;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-[20px] p-6 text-white shadow-[0_1px_2px_rgba(24,32,24,0.03),0_18px_36px_-28px_rgba(24,32,24,0.55)]"
      style={{ backgroundColor: PLUM }}
    >
      <Shapes />

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.18em] text-white/60">
          Grup saya
        </p>

        {groups.length === 0 ? (
          <>
            <h2 className="mt-2 font-satoshi text-[19px] font-bold leading-7 tracking-tight">
              Belum gabung grup mana pun
            </h2>
            <p className="mt-2 text-[13.5px] leading-5 text-white/75">
              Gabung salah satu grup di daftar, lalu obrolannya muncul di sini.
            </p>
          </>
        ) : (
          <ul className="mt-3 space-y-2">
            {groups.map((group) => (
              <li key={group.id}>
                <button
                  type="button"
                  onClick={() => onOpen(group)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-3 py-3 text-left outline-none ring-1 ring-white/20 transition-colors duration-200 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/85">
                    <GroupArt
                      kind={artOf(group.art)}
                      tone={toneOf(group.tone)}
                      className="h-full w-full"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-bold leading-5">
                      {group.name}
                    </span>
                    <span className="block text-[12px] leading-4 text-white/65">
                      {count(group.members)} anggota
                    </span>
                  </span>
                  <MessageCircle size={17} strokeWidth={2.2} className="shrink-0 text-white/70" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}


function TopicCloud({
  onTopic,
  active,
  topics,
}: {
  onTopic: (term: string) => void;
  active: string;
  topics: CommunityData["topics"];
}) {
  const current = active.trim().toLowerCase().replace(/^#/, "");

  return (
    <Panel title="Topik Populer">
      {topics.length === 0 && (
        <p className="text-[13.5px] leading-5 text-neutral-500">
          Topik muncul dari kata yang dipakai di postingan. Tulis postingan
          pertama dan topiknya akan tampil di sini.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {topics.map((tag) => {
          const t = TONES[toneForTag(tag.term)];
          const on = current !== "" && current === tag.term;

          return (
            <button
              key={tag.label}
              type="button"
              aria-pressed={on}

              onClick={() => onTopic(on ? "" : tag.term)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold outline-none ring-1 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
                on ? "bg-karsa text-white ring-karsa" : `${t.card} ${t.ring} ${t.ink}`
              }`}
            >
              {tag.label}
              <span className={`tabular-nums ${on ? "text-white/70" : "opacity-60"}`}>
                {count(tag.threads)}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function PeopleToFollow({ people }: { people: CommunityPerson[] }) {
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  const follow = (id: string) => {
    setFollowing((prev) => ({ ...prev, [id]: !prev[id] }));
    const fd = new FormData();
    fd.set("profile_id", id);
    void toggleFollow({ error: null }, fd);
  };

  return (
    <Panel title="Orang untuk Diikuti">

      {people.length === 0 && (
        <p className="py-6 text-center text-[13.5px] leading-5 text-neutral-500">
          Belum tersedia.
          <br />
          Rekomendasi muncul setelah ada pengguna Karsa lain.
        </p>
      )}

      <ul className="space-y-4">
        {people.map((person) => {
          const id = person.id;
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
                onClick={() => follow(id)}
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


export default function CommunityAside({
  onTopic,
  active = "",
  data,
  onOpenGroup,
}: {
  onTopic: (term: string) => void;
  active?: string;
  data: CommunityData;
  onOpenGroup: (group: CommunityGroup) => void;
}) {
  return (
    <aside className="space-y-6 xl:space-y-8">

      <MyGroups groups={data.myGroups} onOpen={onOpenGroup} />
      <TopicCloud onTopic={onTopic} active={active} topics={data.topics} />
      <PeopleToFollow people={data.people} />
    </aside>
  );
}

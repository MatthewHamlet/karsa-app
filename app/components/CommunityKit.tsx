import { BadgeCheck } from "lucide-react";
import { TONES, type Tone } from "./tones";
import type { Person } from "../data/community";

const AVATAR = {
  sm: { box: "h-7 w-7 text-[11px]", check: 13, ring: "ring-2" },
  md: { box: "h-10 w-10 text-[14px]", check: 15, ring: "ring-[2.5px]" },
} as const;

/** A member, as a lettered disc. The community has no photographs — everyone
 *  here is a stranger to the caregiver until they aren't, and a letter in
 *  their own colour identifies them without pretending otherwise. */
export function Avatar({
  person,
  size = "sm",
}: {
  person: Person;
  size?: keyof typeof AVATAR;
}) {
  const s = AVATAR[size];

  return (
    <span className="relative inline-grid shrink-0">
      <span
        className={`grid place-items-center rounded-full font-bold text-white ${s.box}`}
        style={{ backgroundColor: person.color }}
      >
        {person.initial}
      </span>
      {person.verified && (
        <span
          title="Terverifikasi Karsa"
          className={`absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full bg-white text-karsa ring-white ${s.ring}`}
        >
          <BadgeCheck size={s.check} strokeWidth={2.4} />
        </span>
      )}
    </span>
  );
}

/** A category pill. Pale fill, accent ink — the same two-tone rule the icon
 *  tiles follow, so a tag and its category read as the same thing. */
export function Tag({ label, tone }: { label: string; tone: Tone }) {
  const t = TONES[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ${t.card} ${t.ring} ${t.ink}`}
    >
      {label}
    </span>
  );
}

/** The heading over a section that sits straight on the canvas, with its
 *  "lihat semua" on the far side. */
export function SectionHead({
  title,
  href = "#",
  linkLabel = "Lihat semua",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-[19px] font-bold leading-7 tracking-tight text-neutral-800 xl:text-[22px]">
        {title}
      </h2>
      <a
        href={href}
        className="shrink-0 rounded-full px-2 py-1 text-[13px] font-semibold text-karsa outline-none transition-colors duration-200 hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
      >
        {linkLabel}
      </a>
    </div>
  );
}

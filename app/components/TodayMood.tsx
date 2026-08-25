import Link from "next/link";
import { ArrowRight, SmilePlus } from "lucide-react";
import MoodFace from "./MoodFace";
import { MOOD_BY_KEY, type MoodKey } from "../data/mood";

const PREVIEW = 62;


export type MoodGlance = {
  mood: MoodKey;
  when: string;
  note?: string | null;
};


export default function TodayMood({ entry }: { entry?: MoodGlance | null }) {
  if (!entry) {
    return (
      <section className="flex h-full flex-col rounded-3xl bg-white/70 p-5 ring-1 ring-karsa-line xl:p-6">
        <p className="text-[10.5px] font-semibold uppercase leading-4 tracking-[0.16em] text-neutral-500">
          Perasaan hari ini
        </p>


        <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
          <span
            aria-hidden
            className="grid h-16 w-16 place-items-center rounded-full bg-karsa-soft text-karsa-dark"
          >
            <SmilePlus size={28} strokeWidth={2.1} />
          </span>
          <p className="mt-3 max-w-[24ch] text-[14px] leading-5 text-neutral-500">
            Belum ada catatan perasaan hari ini.
          </p>
          <p className="mt-1 max-w-[26ch] text-[12.5px] leading-4 text-neutral-400">
            Akan muncul di sini setelah dia mencatatnya sendiri.
          </p>
        </div>
      </section>
    );
  }

  const mood = MOOD_BY_KEY[entry.mood];
  const note = entry.note
    ? entry.note.length > PREVIEW
      ? `${entry.note.slice(0, PREVIEW).trimEnd()}…`
      : entry.note
    : null;

  return (
    <section
      className="flex h-full flex-col rounded-3xl p-5 xl:p-6"
      style={{ backgroundColor: mood.soft, boxShadow: `inset 0 0 0 1px ${mood.color}33` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10.5px] font-semibold uppercase leading-4 tracking-[0.16em] text-neutral-500">
          Perasaan hari ini
        </p>

        <Link
          href="/care"
          aria-label="Lihat catatan perasaan"
          title="Lihat catatan perasaan"
          className="group/mood grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/75 outline-none transition-colors duration-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-karsa/40"
          style={{ color: mood.ink }}
        >
          <ArrowRight
            size={15}
            strokeWidth={2.6}
            className="transition-transform duration-200 group-hover/mood:translate-x-0.5"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-2 text-center">
        <MoodFace mood={entry.mood} className="h-24 w-24 xl:h-[116px] xl:w-[116px]" />
        <p className="mt-3 text-[17px] font-bold leading-6 tracking-tight text-neutral-900 xl:text-[18px]">
          {mood.label}
        </p>
        <p className="mt-0.5 text-[12px] leading-4 text-neutral-500">{entry.when}</p>
      </div>

      {note && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${mood.color}30` }}>
          <p className="text-[10.5px] font-semibold uppercase leading-4 tracking-[0.14em] text-neutral-500">
            Catatan
          </p>
          <p className="mt-1 text-[13px] leading-5 text-neutral-700">“{note}”</p>
        </div>
      )}
    </section>
  );
}

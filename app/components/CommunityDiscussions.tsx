import { ArrowBigUp, MessageCircle } from "lucide-react";
import { Avatar, SectionHead, Tag } from "./CommunityKit";
import { DISCUSSIONS, PEOPLE, count, discussionText, matches } from "../data/community";

/** The two threads worth interrupting someone for. Side by side on anything
 *  wider than a phone: three would shrink the titles past reading, and the
 *  point of the section is that you can read the question without opening it. */
export default function CommunityDiscussions({ query = "" }: { query?: string }) {
  const threads = DISCUSSIONS.filter((thread) => matches(query, discussionText(thread)));

  return (
    <section>
      <SectionHead title="Diskusi Populer" />

      {threads.length === 0 ? (
        <Empty query={query} what="diskusi" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:gap-5">
          {threads.map((thread) => {
            const author = PEOPLE[thread.author];

            return (
              <li key={thread.id}>
                <a
                  href="#"
                  className="flex h-full flex-col rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgba(24,32,24,0.03),0_14px_30px_-26px_rgba(24,32,24,0.28)] outline-none ring-1 ring-karsa-line transition-shadow duration-200 hover:shadow-[0_1px_2px_rgba(24,32,24,0.04),0_20px_36px_-24px_rgba(24,32,24,0.38)] focus-visible:ring-2 focus-visible:ring-karsa/40 xl:p-6"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar person={author} />
                    <p className="min-w-0 truncate text-[13px] font-semibold text-neutral-600">
                      {author.name}
                    </p>
                    {/* The dot carries the separation so the timestamp doesn't
                        need a label — "·" between a name and a time reads as
                        "posted", and saying so would cost a line. */}
                    <span aria-hidden className="text-[13px] text-neutral-300">
                      ·
                    </span>
                    <p className="shrink-0 text-[12.5px] text-neutral-400">{thread.age}</p>
                  </div>

                  {/* Satoshi, not the display face: a thread title is a whole
                      sentence — often a question — and Nohemi is drawn for short
                      lines set large. It also has no Bold, so `font-bold` here
                      was quietly rendering as Medium; Satoshi has a real 700. */}
                  <h3 className="mt-3.5 font-satoshi text-[15.5px] font-bold leading-6 tracking-tight text-neutral-900 xl:text-[16.5px]">
                    {thread.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-[13.5px] leading-5 text-neutral-500">
                    {thread.snippet}
                  </p>

                  <div className="mt-3 flex items-center gap-4 text-[12.5px] font-medium text-neutral-500">
                    <span className="inline-flex items-center gap-1.5">
                      <MessageCircle size={14} strokeWidth={2.2} aria-hidden />
                      {count(thread.replies)}
                      <span className="sr-only">tanggapan</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ArrowBigUp size={16} strokeWidth={2.1} aria-hidden />
                      {count(thread.upvotes)}
                      <span className="sr-only">dukungan</span>
                    </span>
                  </div>

                  {/* Pushed to the foot so the two cards' tag rows line up even
                      when one title runs a line longer. */}
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                    {thread.tags.map((tag) => (
                      <Tag key={tag.label} label={tag.label} tone={tag.tone} />
                    ))}
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Says what was searched for, because "tidak ada hasil" on its own leaves the
 *  caregiver guessing whether the page is broken or the room is just quiet. */
export function Empty({ query, what }: { query: string; what: string }) {
  return (
    <p className="rounded-[20px] bg-white/60 px-5 py-8 text-center text-[14px] leading-6 text-neutral-500 ring-1 ring-karsa-line">
      Tidak ada {what} yang cocok dengan{" "}
      <span className="font-semibold text-neutral-700">“{query.trim()}”</span>.
    </p>
  );
}

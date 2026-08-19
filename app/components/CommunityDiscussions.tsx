import { MessageCircle } from "lucide-react";
import { Avatar, SectionHead, Tag } from "./CommunityKit";
import { DISCUSSIONS, PEOPLE, count } from "../data/community";

/** The two threads worth interrupting someone for. Side by side on anything
 *  wider than a phone: three would shrink the titles past reading, and the
 *  point of the section is that you can read the question without opening it. */
export default function CommunityDiscussions() {
  return (
    <section>
      <SectionHead title="Diskusi Populer" />

      <ul className="grid gap-4 sm:grid-cols-2 xl:gap-5">
        {DISCUSSIONS.map((thread) => {
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
                </div>

                <h3 className="mt-3.5 text-[15.5px] font-bold leading-6 tracking-tight text-neutral-900 xl:text-[16.5px]">
                  {thread.title}
                </h3>

                <p className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-neutral-500">
                  <MessageCircle size={14} strokeWidth={2.2} />
                  {count(thread.replies)} tanggapan
                </p>

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
    </section>
  );
}

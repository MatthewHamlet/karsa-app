import type { Metadata } from "next";
import CommunityPage from "../section/Community";
import { getCommunityData } from "../lib/community/queries";

export const metadata: Metadata = {
  title: "Komunitas · Karsa",
  description:
    "Tempat pendamping berbagi cerita, informasi, dan saling mendukung: diskusi, grup, dan sesi bersama ahli.",
};

/** Reads the session — the feed marks which posts you have already upvoted and
 *  which groups you are in — so a cached copy would show one person's state to
 *  the next visitor. */
export const dynamic = "force-dynamic";

export default async function Community() {
  return <CommunityPage data={await getCommunityData()} />;
}

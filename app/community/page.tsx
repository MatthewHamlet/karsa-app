import type { Metadata } from "next";
import CommunityPage from "../section/Community";
import { getCommunityData } from "../lib/community/queries";

export const metadata: Metadata = {
  title: "Komunitas · Karsa",
  description:
    "Tempat pendamping berbagi cerita, informasi, dan saling mendukung: diskusi, grup, dan sesi bersama ahli.",
};

export const dynamic = "force-dynamic";

export default async function Community() {
  return <CommunityPage data={await getCommunityData()} />;
}

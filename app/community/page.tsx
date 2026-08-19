import type { Metadata } from "next";
import CommunityPage from "../section/Community";

export const metadata: Metadata = {
  title: "Komunitas · Karsa",
  description:
    "Tempat pendamping berbagi cerita, informasi, dan saling mendukung: diskusi, grup, dan sesi bersama ahli.",
};

export default function Community() {
  return <CommunityPage />;
}

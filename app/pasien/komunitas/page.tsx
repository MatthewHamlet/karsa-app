import type { Metadata } from "next";
import CommunityPage from "../../section/Community";

export const metadata: Metadata = {
  title: "Komunitas · Karsa",
  description:
    "Tempat berbagi cerita, informasi, dan saling mendukung: diskusi, grup, dan sesi bersama ahli.",
};

/** The same room, entered from the other door.
 *
 *  A static segment beats `[section]`, so this replaces the placeholder without
 *  touching it. The page itself is untouched too — the patient app has its own
 *  shell (its own rail entries and its own floating bar), and the community is
 *  the one part of Karsa where both people are in the same conversation. Two
 *  copies of it would be two rooms. */
export default function PatientCommunity() {
  return <CommunityPage />;
}

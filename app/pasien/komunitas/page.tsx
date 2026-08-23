import type { Metadata } from "next";
import CommunityPage from "../../section/Community";
import { getCommunityData } from "../../lib/community/queries";

export const metadata: Metadata = {
  title: "Komunitas · Karsa",
  description: "Cerita dan dukungan dari sesama, di ruang yang sama.",
};

export const dynamic = "force-dynamic";

/** The same community, reached from the patient app. One room, not two — the
 *  point of it is that caregivers and the people they look after are not kept
 *  in separate buildings. */
export default async function PatientCommunity() {
  return <CommunityPage data={await getCommunityData()} />;
}

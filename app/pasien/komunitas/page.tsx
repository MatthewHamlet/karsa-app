import type { Metadata } from "next";
import CommunityPage from "../../section/Community";
import { getCommunityData } from "../../lib/community/queries";

export const metadata: Metadata = {
  title: "Komunitas · Karsa",
  description: "Cerita dan dukungan dari sesama, di ruang yang sama.",
};

export const dynamic = "force-dynamic";

export default async function PatientCommunity() {
  return <CommunityPage data={await getCommunityData()} />;
}

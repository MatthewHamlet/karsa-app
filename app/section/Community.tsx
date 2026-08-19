import PageHeader from "../components/PageHeader";
import CommunityDiscussions from "../components/CommunityDiscussions";
import CommunityGroups from "../components/CommunityGroups";
import CommunityAside from "../components/CommunityAside";

export default function CommunityPage() {
  return (
    /* Same rest at the foot of the page as every other route — see Care. */
    <div className="w-full px-4 pb-10 pt-20 sm:px-6 md:px-8 md:pt-10 xl:px-12 xl:pb-12 xl:pt-12">
      <PageHeader
        tone="forest"
        eyebrow="Karsa"
        title="Komunitas"
        subtitle="Tempat pendamping berbagi cerita, informasi, dan saling mendukung."
      />

      {/* The aside is a companion, not a second page: it keeps its width while
          the thread column takes whatever the viewport gives. Below `lg` it
          drops under the groups, where an upcoming session still makes sense
          to meet after you have read what the room is talking about. */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_316px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_336px] xl:gap-10 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-8 xl:space-y-10">
          <CommunityDiscussions />
          <CommunityGroups />
        </div>

        <CommunityAside />
      </div>
    </div>
  );
}

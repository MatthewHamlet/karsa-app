import ProfileAvatar from "../components/ProfileAvatar";
import PageHeader from "../components/PageHeader";
import CareStats from "../components/CareStats";
import PatientActivities from "../components/PatientActivities";
import ImportantInfo from "../components/ImportantInfo";
import { CARE_GROUP } from "../data/careStats";

export default function CarePage() {
  return (
    <div className="w-full px-4 pb-20 pt-20 sm:px-6 md:px-8 md:pt-10 xl:px-12 xl:pt-12">
      {/* Warm clay — the page's own colour, washed across the top. */}
      <PageHeader
        tone="clay"
        eyebrow="Karsa"
        title="Perawatan"
        subtitle="Profil perawatan Meimei dan orang-orang yang merawatnya."
        backHref="/"
        backLabel="Kembali ke beranda"
      />

      <div className="space-y-8 xl:space-y-10">
        {/* ── The care group ───────────────────────────────────────────────
            Who this circle is, who's in it, and since when. */}
        {/* Profile picture and name on the left, created-at pinned to the far
            right — the two ends of the row, not a huddle on the left. */}
        <section className="flex flex-wrap items-center gap-x-6 gap-y-5 rounded-3xl bg-[#fdf8f0] p-6 ring-1 ring-edge-sand sm:gap-x-8 sm:p-8 xl:p-9">
          <ProfileAvatar className="h-[104px] w-[104px] xl:h-[120px] xl:w-[120px]" />

          <div className="min-w-0">
            <h2 className="text-[28px] font-bold leading-none tracking-tight text-neutral-900 xl:text-[34px]">
              {CARE_GROUP.name}
            </h2>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {CARE_GROUP.members.map((member) => (
                  <span
                    key={member.id}
                    title={member.name}
                    className="grid h-9 w-9 place-items-center rounded-full text-[13px] font-bold text-white ring-[2.5px] ring-[#fdf8f0]"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initial}
                  </span>
                ))}
              </div>
              <span className="text-[13.5px] font-medium text-neutral-600">
                {CARE_GROUP.members.length} anggota
              </span>
            </div>
          </div>

          <span className="ml-auto shrink-0 text-[13px] text-neutral-500">
            {CARE_GROUP.createdAt}
          </span>
        </section>

        <CareStats />
        <PatientActivities />
        <ImportantInfo />
      </div>
    </div>
  );
}

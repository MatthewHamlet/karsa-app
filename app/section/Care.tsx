import Mascot from "../components/Mascot";
import RoomScene from "../components/RoomScene";
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
        <section className="relative overflow-hidden rounded-3xl bg-[#fdf8f0] ring-1 ring-edge-sand">
          <RoomScene />

          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8 xl:gap-10 xl:p-9">
            <div className="relative shrink-0 self-center sm:self-auto">
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-x-6 -bottom-6 top-1 rounded-full bg-[radial-gradient(closest-side,rgba(255,244,222,0.95),rgba(255,244,222,0))]"
              />
              <Mascot className="relative h-[112px] w-[112px] xl:h-[128px] xl:w-[128px]" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-[28px] font-bold leading-none tracking-tight text-neutral-900 xl:text-[34px]">
                {CARE_GROUP.name}
              </h2>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
                <div className="flex items-center gap-2.5">
                  {/* Overlapped avatars, so the group reads as a group. */}
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

                <span aria-hidden className="hidden h-4 w-px bg-neutral-900/10 sm:block" />

                <span className="text-[13px] text-neutral-500">{CARE_GROUP.createdAt}</span>
              </div>
            </div>
          </div>
        </section>

        <CareStats />
        <PatientActivities />
        <ImportantInfo />
      </div>
    </div>
  );
}

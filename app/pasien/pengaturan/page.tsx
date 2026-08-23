import type { Metadata } from "next";
import SettingsPage from "../../section/Settings";
import { getAccountStats } from "../../lib/community/queries";
import {
  getContributions,
  getMySettings,
  getPatientAccess,
} from "../../lib/settings/queries";

export const metadata: Metadata = {
  title: "Pengaturan · Karsa",
  description: "Kelola akun, informasi pribadi, tampilan, dan akses pasien.",
};

export const dynamic = "force-dynamic";

export default async function PatientSettings({ searchParams }: PageProps<"/pasien/pengaturan">) {
  const [me, access, stats, contributions] = await Promise.all([
    getMySettings(),
    getPatientAccess(),
    getAccountStats(),
    getContributions(),
  ]);

  return (
    <SettingsPage
      params={await searchParams}
      me={me}
      access={access}
      stats={stats}
      contributions={contributions}
    />
  );
}

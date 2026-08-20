import type { Metadata } from "next";
import SettingsPage from "../section/Settings";

export const metadata: Metadata = {
  title: "Pengaturan · Karsa",
  description: "Kelola akun, preferensi, notifikasi, dan privasi aplikasi.",
};

export default async function Settings({ searchParams }: PageProps<"/settings">) {
  return <SettingsPage params={await searchParams} />;
}

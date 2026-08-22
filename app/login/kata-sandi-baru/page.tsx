import type { Metadata } from "next";
import NewPasswordPage from "../../section/NewPasswordPage";

export const metadata: Metadata = {
  title: "Kata sandi baru · Karsa",
  description: "Buat kata sandi baru untuk akun Karsa.",
};

export const dynamic = "force-dynamic";

export default function KataSandiBaru() {
  return <NewPasswordPage />;
}

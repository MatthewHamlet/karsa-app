import type { Metadata } from "next";
import ForgotPasswordPage from "../../section/ForgotPasswordPage";

export const metadata: Metadata = {
  title: "Lupa kata sandi · Karsa",
  description: "Kirim tautan untuk mengatur ulang kata sandi akun Karsa.",
};

export default function LupaPassword() {
  return <ForgotPasswordPage />;
}

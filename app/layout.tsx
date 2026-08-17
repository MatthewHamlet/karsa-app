import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import Sidebar from "./section/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Karsa App",
  description: "Mum I'm Jamaican, Jamaican me dinner mum",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} h-full antialiased`}
    >
      {/* The rail is the app shell, so it lives in the layout rather than
          being re-mounted by every route. */}
      <body className="min-h-full flex flex-col">
        <Sidebar>{children}</Sidebar>
      </body>
    </html>
  );
}

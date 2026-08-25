import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import Sidebar from "./section/Sidebar";
import { getSessionProfile } from "./lib/profile";

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

export default async function RootLayout({ children }: LayoutProps<"/">) {

  const profile = await getSessionProfile();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} h-full antialiased`}
    >

      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />

        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f%5B%5D=satoshi@1&display=swap"
        />
      </head>

      <body className="min-h-full flex flex-col">
        <Sidebar profile={profile}>{children}</Sidebar>
      </body>
    </html>
  );
}

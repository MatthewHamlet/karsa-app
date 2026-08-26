import type { Metadata, Viewport } from "next";
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

/* ini penyebab navbar bawah kepotong di hp.
   kodenya udah pakai env(safe-area-inset-bottom) di --bottom-nav dan di
   padding navbar, tapi nilainya SELALU 0 kalau meta viewport-nya gak punya
   viewport-fit=cover. next gak masang itu secara default, jadi harus
   dideklarasiin di sini. begitu ada, tulisan "Beranda/Jurnal/Arsa" gak
   ketiban lagi sama tombol gestur android.

   interactiveWidget: keyboard hp cuma nutupin layar, gak ngecilin halaman —
   jadi navbar gak ikut kedorong naik pas lagi ngetik. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "overlays-content",
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

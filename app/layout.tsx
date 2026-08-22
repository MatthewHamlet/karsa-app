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
  /* Read once here and passed down, rather than each component asking. The rail
     is a client component and cannot reach the database itself. */
  const profile = await getSessionProfile();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} h-full antialiased`}
    >
      {/* Satoshi comes from Fontshare's own CDN — it isn't on Google Fonts, so
          `next/font/google` can't reach it. Nohemi has no CDN at all and is
          self-hosted from `public/fonts/nohemi/`; both stacks fall back to
          Manrope, which is why it stays loaded above. */}
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        {/* `@1` is the variable roman, one file covering 300–900. The static
            cuts skip 600, so `font-semibold` — which this UI leans on heavily —
            would snap up to Bold and flatten the weight scale. */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f%5B%5D=satoshi@1&display=swap"
        />
      </head>
      {/* The rail is the app shell, so it lives in the layout rather than
          being re-mounted by every route. */}
      <body className="min-h-full flex flex-col">
        <Sidebar profile={profile}>{children}</Sidebar>
      </body>
    </html>
  );
}

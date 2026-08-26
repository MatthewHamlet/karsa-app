import type { NextConfig } from "next";

/** Where `next/image` is allowed to fetch from.
 *
 *  An allow-list, and it has to be one: without an entry here every remote
 *  `<Image src>` throws at render time rather than degrading, so a missing host
 *  is a blank page, not a broken picture.
 *
 *  Only the project's own Supabase storage is listed, and only its public
 *  bucket path. `next/image` proxies and re-encodes whatever it is pointed at,
 *  so a wildcard here would turn this deployment into an open image-resizing
 *  service for anybody who can get a URL into a post — which is the same reason
 *  `createPost` refuses an `image_url` from any other origin.
 *
 *  Read from the environment rather than hardcoded, so a different Supabase
 *  project (a staging one, or a teammate's) works without editing this file.
 *  Falls back to an empty list when the variable is missing, which is the
 *  correct behaviour for a checkout with no credentials: there are no images to
 *  serve either. */
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },

  experimental: {
    /* berapa lama browser boleh pakai ulang halaman yang udah dimuat.
       ini penyebab utama pindah-pindah halaman kerasa berat: sejak next 15
       defaultnya 0 detik alias gak di-cache sama sekali, padahal semua route
       di sini dinamis (baca cookie sesi). jadi balik ke Beranda dari Komunitas
       itu ngulang render server lengkap + puluhan query supabase.
       30 detik = default lama. aman karena action yang ngubah data manggil
       revalidatePath, yang langsung buang cache ini. */
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;

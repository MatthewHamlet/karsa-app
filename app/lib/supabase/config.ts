/** Where the Supabase credentials come from, and what happens when they don't.
 *
 *  Both values are safe to ship to the browser — that is what the `NEXT_PUBLIC_`
 *  prefix means and why the key is called `anon`. It is not a secret: it only
 *  ever grants what Row Level Security lets it grant. The service-role key is
 *  the dangerous one, and it must never appear in this file or any other file
 *  under `app/`.
 *
 *  Nothing here throws. The app has to keep running before anyone has pasted a
 *  key in — otherwise every page in the project goes white the moment these
 *  modules are imported, which is a miserable way to develop. Instead each entry
 *  point asks `isSupabaseConfigured()` first and degrades honestly:
 *  the proxy skips the session refresh, and the login form says what is missing
 *  rather than throwing a stack trace at the person trying to sign in. */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

/** Shown to the user, so it is in Indonesian like the rest of the interface. */
export const NOT_CONFIGURED_MESSAGE =
  "Supabase belum tersambung. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local, lalu jalankan ulang server.";

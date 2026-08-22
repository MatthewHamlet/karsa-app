"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/** The browser-side client.
 *
 *  Signing in does not go through this — that runs as a Server Action so the
 *  session cookies are written `httpOnly` and the password never travels through
 *  client-side state. This is here for what genuinely has to happen in the
 *  browser later: realtime subscriptions, and reacting to `onAuthStateChange`.
 *
 *  `createBrowserClient` already memoises per set of arguments, so calling this
 *  from several components does not open several connections. */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

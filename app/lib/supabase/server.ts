import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/** A Supabase client for Server Components, Server Actions and Route Handlers.
 *
 *  A new one per request, never a shared module-level instance: the client
 *  carries the caller's session, and one shared across requests would hand one
 *  person's session to the next.
 *
 *  `cookies()` is async in this version of Next, hence the await — a detail
 *  worth stating because most Supabase examples still show it as synchronous.
 *
 *  `getAll`/`setAll` rather than the older `get`/`set`/`remove`: the single-cookie
 *  methods are deprecated in `@supabase/ssr` and the library's own docs warn
 *  that they miss cases which show up as random logouts. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          /* Server Components are not allowed to write cookies, and a refresh
             landing in one will throw here. That is safe to swallow *only*
             because `proxy.ts` refreshes the session on every request and
             writes the new cookies to the response itself. Remove the proxy and
             this catch starts silently dropping sessions. */
        }
      },
    },
  });
}

/** The signed-in user, or `null`.
 *
 *  Deliberately `getUser()` and not `getSession()`. `getSession()` reads the
 *  cookie and trusts it; on the server that cookie is just something the client
 *  sent, so it can be forged. `getUser()` verifies the token with Supabase
 *  before answering. Never gate anything on `getSession()` server-side. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

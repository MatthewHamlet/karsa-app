/** Helpers shared by the Komunitas screens.
 *
 *  Everything this file used to hold — the people, the threads, the groups, the
 *  live session, the topic cloud — is gone. All of it now comes from the
 *  database through `app/lib/community/queries.ts`. What is left is the two
 *  pure functions and the sort options, which are interface vocabulary rather
 *  than content. */

export const count = (n: number) => n.toLocaleString("id-ID");

export type SortKey = "relevan" | "terbaru" | "ramai" | "didukung";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "relevan", label: "Paling relevan" },
  { key: "terbaru", label: "Terbaru" },
  { key: "ramai", label: "Paling ramai" },
  { key: "didukung", label: "Paling didukung" },
];

export type Person = {
  id: string;
  name: string;
  role: string;
  initial: string;
  color: string;
  verified?: boolean;
};

export const matches = (query: string, haystack: (string | undefined)[]) => {
  const q = query.trim().toLowerCase().replace(/^#/, "");
  if (!q) return true;
  return haystack.some((field) => field?.toLowerCase().includes(q));
};

/* Everything an item can be found by, flattened in one place.
 *
 *  The `?? []` are not decoration. Spreading a field straight into an array
 *  literal means one absent property throws `not iterable` *during render*, and
 *  a filter that cannot find a keyword takes down the entire page instead of
 *  quietly matching less. That is exactly what happened while these fields were
 *  being added and the dev server was serving a half-updated module — and it is
 *  what would happen again the first time this data comes from a request. */

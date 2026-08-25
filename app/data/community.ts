

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

  avatarUrl?: string | null;
};

export const matches = (query: string, haystack: (string | undefined)[]) => {
  const q = query.trim().toLowerCase().replace(/^#/, "");
  if (!q) return true;
  return haystack.some((field) => field?.toLowerCase().includes(q));
};



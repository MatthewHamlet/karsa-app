
export const TONES = {
  green: {
    card: "bg-act-50",
    ring: "ring-act-edge",
    tile: "bg-act-100 text-act-600",
    ink: "text-act-600",
    inset: "ring-act-edge/70",
  },
  lavender: {
    card: "bg-med-50",
    ring: "ring-med-edge",
    tile: "bg-med-100 text-med-600",
    ink: "text-med-600",
    inset: "ring-med-edge/70",
  },
  peach: {
    card: "bg-nut-50",
    ring: "ring-nut-edge",
    tile: "bg-nut-100 text-nut-600",
    ink: "text-nut-600",
    inset: "ring-nut-edge/70",
  },
  blue: {
    card: "bg-rest-50",
    ring: "ring-rest-edge",
    tile: "bg-rest-100 text-rest-600",
    ink: "text-rest-600",
    inset: "ring-rest-edge/70",
  },
  cream: {
    card: "bg-info-50",
    ring: "ring-info-edge",
    tile: "bg-info-100 text-info-600",
    ink: "text-info-600",
    inset: "ring-info-edge/70",
  },

  rose: {
    card: "bg-rose-50",
    ring: "ring-rose-100",
    tile: "bg-rose-100 text-rose-600",
    ink: "text-rose-600",
    inset: "ring-rose-100/70",
  },
  neutral: {
    card: "bg-white",
    ring: "ring-karsa-line",
    tile: "bg-karsa-soft text-karsa-dark",
    ink: "text-karsa-dark",
    inset: "ring-karsa-line/70",
  },
} as const;

export type Tone = keyof typeof TONES;


export const TONE_HEX = {
  green: { tile: "#dbecdf", ink: "#45734e" },
  lavender: { tile: "#e7e1f8", ink: "#6a58ae" },
  peach: { tile: "#fae3cd", ink: "#b06c34" },
  blue: { tile: "#d9e6f6", ink: "#3f6a95" },
  cream: { tile: "#f8ebc8", ink: "#97722a" },
  rose: { tile: "#ffe4e6", ink: "#e11d48" },
  neutral: { tile: "#eef2ec", ink: "#3f5c46" },
} as const satisfies Record<Tone, { tile: string; ink: string }>;


export const CARE_TONE = {
  medication: "lavender",
  nutrition: "peach",
  activity: "green",
  rest: "blue",
} as const satisfies Record<string, Tone>;

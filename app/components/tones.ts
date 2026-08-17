/** The app's accent palette, keyed by colour rather than by feature so any
 *  page can reach for it. Colour carries meaning — a category owns a hue and
 *  keeps it across icon, card and accent — so these stay pale and cohesive.
 *
 *  `card`/`ring` dress a container, `tile`/`ink` an icon, `inset` a panel
 *  nested inside a tinted card. */
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
  /** Reserved for leaving/destroying — the only warm red on the page. */
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

/** Which hue each area of care owns. */
export const CARE_TONE = {
  medication: "lavender",
  nutrition: "peach",
  activity: "green",
  rest: "blue",
} as const satisfies Record<string, Tone>;

import { TONE_HEX, type Tone } from "./tones";

export type GroupArtKind = "nutrition" | "elderly" | "mind" | "recovery";

/** Thumbnails for the community groups, drawn rather than photographed.
 *
 *  The reference layout puts a stock photo here. Photos would be the only
 *  ones in the app and would drag in four unrelated colour schemes, so these
 *  follow StatArt's grammar instead — one scene per group, flat filled shapes,
 *  no outlines, and only three values: the group's `ink` at varying alpha, its
 *  pale `tile`, and white for a single highlight. The tile behind them is the
 *  group's own wash, so each card stays inside one hue. */
export default function GroupArt({
  kind,
  tone,
  className = "",
}: {
  kind: GroupArtKind;
  tone: Tone;
  className?: string;
}) {
  const { tile, ink } = TONE_HEX[tone];

  return (
    <svg viewBox="0 0 96 76" aria-hidden className={`shrink-0 ${className}`}>
      {kind === "nutrition" && (
        <>
          {/* A bowl, filled past the rim. */}
          <path d="M60 16c8-6 17-5 17-5s-3 8-9 10-8-5-8-5Z" fill={ink} opacity="0.65" />
          <circle cx="33" cy="31" r="10" fill={tile} />
          <circle cx="50" cy="26" r="12" fill={ink} opacity="0.5" />
          <circle cx="67" cy="32" r="9" fill="#fff" opacity="0.8" />
          <path d="M12 40h72a36 22 0 0 1-72 0Z" fill={ink} />
          <rect x="38" y="60" width="20" height="7" rx="3.5" fill={ink} opacity="0.55" />
          <ellipse
            cx="31"
            cy="49"
            rx="9"
            ry="4"
            transform="rotate(-24 31 49)"
            fill="#fff"
            opacity="0.35"
          />
        </>
      )}

      {kind === "elderly" && (
        <>
          {/* One figure with an arm round the other — the whole point of the
              group, in two shapes and a link. */}
          <circle cx="67" cy="29" r="10" fill={ink} opacity="0.5" />
          <path d="M51 68v-5a16 16 0 0 1 32 0v5Z" fill={ink} opacity="0.5" />
          <path d="M36 42c11 6 20 8 29 8l-1 9c-12 0-22-3-32-9Z" fill={tile} />
          <circle cx="30" cy="23" r="12" fill={ink} />
          <path d="M11 68v-7a19 19 0 0 1 38 0v7Z" fill={ink} />
          <circle cx="25" cy="19" r="3.5" fill="#fff" opacity="0.45" />
        </>
      )}

      {kind === "mind" && (
        <>
          {/* A head with something tended inside it. */}
          <path d="M48 9c7-5 15-4 15-4s-2 8-8 10-7-6-7-6Z" fill={ink} opacity="0.6" />
          <circle cx="48" cy="42" r="26" fill={ink} />
          <path
            d="M48 57c-11-7-17-13-17-20a8.5 8.5 0 0 1 17-5 8.5 8.5 0 0 1 17 5c0 7-6 13-17 20Z"
            fill={tile}
          />
          <circle cx="33" cy="29" r="4.5" fill="#fff" opacity="0.4" />
        </>
      )}

      {kind === "recovery" && (
        <>
          {/* Three steps and someone standing on the last one. Progress that
              climbs slowly is the group's whole subject. */}
          <rect x="12" y="50" width="22" height="18" rx="6" fill={tile} />
          <rect x="37" y="40" width="22" height="28" rx="6" fill={ink} opacity="0.5" />
          <rect x="62" y="28" width="22" height="40" rx="6" fill={ink} />
          <circle cx="73" cy="16" r="8" fill={ink} />
          <rect x="67" y="34" width="6" height="12" rx="3" fill="#fff" opacity="0.4" />
        </>
      )}
    </svg>
  );
}

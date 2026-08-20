import { useId } from "react";

/** Line art on a 24×24 grid, so every glyph can be placed with one transform
 *  and they all carry the same weight. Stroked, never filled — a filled shape
 *  at this opacity turns into a smudge, an outline stays a drawing. */
const GLYPH = {
  heart: "M12 20.7 3.9 12.6a5 5 0 0 1 7.1-7.1l1 1 1-1a5 5 0 1 1 7.1 7.1Z",
  cross: "M9.6 3.6h4.8v5.2h5.2v4.8h-5.2v5.2H9.6v-5.2H4.4V8.8h5.2Z",
  pill: "M8.4 15.6 15.6 8.4a5.1 5.1 0 0 1 7.2 7.2l-7.2 7.2a5.1 5.1 0 0 1-7.2-7.2Z M12 12l7.2 7.2",
  droplet: "M12 21.5a6.6 6.6 0 0 0 6.6-6.6c0-3.8-6.6-12.4-6.6-12.4S5.4 11.1 5.4 14.9A6.6 6.6 0 0 0 12 21.5Z",
  pulse: "M2.5 12h4.2l2.8-7.5 4.2 15 2.8-7.5h5",
  leaf: "M10.6 19.8A6.6 6.6 0 0 1 9.4 6.2C14.8 5.2 16.2 4.7 18.1 2.4c.9 1.9 1.9 3.9 1.9 7.5 0 5.2-4.5 9.9-9.4 9.9Z M8.4 20.6c1.4-4 4.2-7.3 7.8-9.4",
  thermometer: "M14 14.4V3.6a2.4 2.4 0 0 0-4.8 0v10.8a4.3 4.3 0 1 0 4.8 0Z",
} as const;

/** Where each glyph sits inside one tile: [x, y, rotation, scale, glyph].
 *  Placed by eye rather than on a grid — an even spread reads as wallpaper, a
 *  regular one reads as a table. Nothing crosses the tile edge, because a
 *  pattern clips there and a half-drawn heart is the one thing the eye finds
 *  immediately in a repeat. */
const SCATTER: [number, number, number, number, keyof typeof GLYPH][] = [
  [18, 28, -12, 1, "heart"],
  [96, 12, 24, 0.85, "pill"],
  [178, 34, -8, 0.95, "pulse"],
  [262, 16, 14, 0.8, "droplet"],
  [46, 96, 18, 0.9, "cross"],
  [132, 84, -20, 1, "leaf"],
  [228, 104, 10, 0.85, "thermometer"],
  [288, 78, -14, 0.75, "heart"],
  [14, 176, 6, 0.9, "pulse"],
  [104, 168, -16, 0.8, "droplet"],
  [190, 178, 22, 0.95, "pill"],
  [268, 196, -6, 0.85, "cross"],
  [52, 258, -10, 0.95, "thermometer"],
  [146, 268, 16, 0.85, "heart"],
  [236, 276, -18, 0.9, "leaf"],
];

/** Big on purpose. The tile is the unit that repeats, so the wider it is the
 *  further apart the repeats fall — which matters more the more visible the
 *  pattern gets, since anything the eye can see it can also line up. */
const TILE = 320;

/** A scattered health-icon wallpaper.
 *
 *  Absolutely positioned, so the host needs `relative` and the content on top
 *  needs to be positioned too. Takes its colour from `currentColor`: set the
 *  text colour on the host and the pattern follows, which is what keeps it
 *  inside whatever palette the surface already has. */
export default function HealthPattern({
  className = "",
  opacity = 0.13,
}: {
  className?: string;
  opacity?: number;
}) {
  const uid = useId();

  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ opacity }}
    >
      <defs>
        <pattern id={uid} width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {SCATTER.map(([x, y, rotate, scale, glyph], i) => (
              <path
                key={i}
                d={GLYPH[glyph]}
                transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
              />
            ))}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${uid})`} />
    </svg>
  );
}

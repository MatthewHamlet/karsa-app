import { MOOD_BY_KEY, type MoodKey } from "../data/mood";

/** The five faces, drawn rather than borrowed from an icon set — a line icon
 *  can't be cute, and these carry the whole feature's personality.
 *
 *  Each is the same 48×48 circle with the same eye positions, so they read as
 *  one family; only the eyes and mouth change. */
export default function MoodFace({
  mood,
  size = 48,
  className = "",
}: {
  mood: MoodKey;
  size?: number;
  className?: string;
}) {
  const { color, ink, label } = MOOD_BY_KEY[mood];

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={`shrink-0 ${className}`}
    >
      <circle cx="24" cy="24" r="24" fill={color} />
      {/* A soft highlight so the face reads as a rounded object. */}
      <ellipse cx="24" cy="15" rx="20" ry="13" fill="#ffffff" opacity="0.16" />

      <g fill="none" stroke={ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        {mood === "great" && (
          <>
            {/* Happy closed eyes — the arcs curve up. */}
            <path d="M13.5 21.5q3.5-4 7 0" />
            <path d="M27.5 21.5q3.5-4 7 0" />
            <path d="M16 29q8 7 16 0" strokeWidth="2.8" />
          </>
        )}

        {mood === "good" && (
          <>
            <circle cx="17" cy="21" r="1.5" fill={ink} stroke="none" />
            <circle cx="31" cy="21" r="1.5" fill={ink} stroke="none" />
            <path d="M17 29q7 5.5 14 0" />
          </>
        )}

        {mood === "okay" && (
          <>
            <circle cx="17" cy="21" r="1.5" fill={ink} stroke="none" />
            <circle cx="31" cy="21" r="1.5" fill={ink} stroke="none" />
            <path d="M18 30h12" />
          </>
        )}

        {mood === "low" && (
          <>
            <circle cx="17" cy="21.5" r="1.5" fill={ink} stroke="none" />
            <circle cx="31" cy="21.5" r="1.5" fill={ink} stroke="none" />
            <path d="M18 31q6-5 12 0" />
          </>
        )}

        {mood === "verylow" && (
          <>
            {/* Scrunched-shut eyes rather than crosses — sad, not comical. */}
            <path d="M13.5 22.5q3.5 4 7 0" />
            <path d="M27.5 22.5q3.5 4 7 0" />
            <path d="M18 32q6-5.5 12 0" />
          </>
        )}
      </g>

      {/* Cheeks — the detail that makes them friendly. */}
      <ellipse cx="11.5" cy="27.5" rx="3.6" ry="2.4" fill={ink} opacity="0.16" />
      <ellipse cx="36.5" cy="27.5" rx="3.6" ry="2.4" fill={ink} opacity="0.16" />
    </svg>
  );
}

"use client";

import { useId } from "react";
import type { StatTone } from "../data/careStats";

export type StatArtKind =
  | "fluid"
  | "meals"
  | "medication"
  | "sleep"
  | "bloodPressure"
  | "bloodSugar"
  | "oxygen"
  | "heartRate"
  | "temperature"
  | "weight";

/** Small illustrations rather than line icons — but drawn to one grammar so
 *  the cards still read as a set:
 *
 *  · a 48px square, the object centred with a little air around it
 *  · flat filled shapes, no outlines
 *  · three values only — the card's `ink` at varying alpha, its pale `tile`,
 *    and white for highlights — so nothing introduces a colour the card
 *    doesn't already have
 *  · one white highlight per object, to suggest a light source
 *
 *  They stay this size deliberately: the statistic is the headline, this is
 *  the label. */
export default function StatArt({
  kind,
  tone,
  className = "h-11 w-11 xl:h-12 xl:w-12",
}: {
  kind: StatArtKind;
  tone: StatTone;
  className?: string;
}) {
  const uid = useId();
  const ink = tone.ink;
  const tile = tone.tile;

  return (
    <svg viewBox="0 0 48 48" aria-hidden className={`shrink-0 ${className}`}>
      {kind === "fluid" && (
        <>
          <defs>
            <clipPath id={`${uid}-glass`}>
              <path d="M13 13h22l-2.3 25.5a4 4 0 0 1-4 3.5h-9.4a4 4 0 0 1-4-3.5Z" />
            </clipPath>
          </defs>

          <path
            d="M13 13h22l-2.3 25.5a4 4 0 0 1-4 3.5h-9.4a4 4 0 0 1-4-3.5Z"
            fill={tile}
          />
          {/* Water sits inside the glass, with a wave for a surface. */}
          <g clipPath={`url(#${uid}-glass)`}>
            <path
              d="M8 24c4 0 5-2.2 8-2.2s5 2.2 8 2.2 5-2.2 8-2.2 5 2.2 8 2.2v20H8Z"
              fill={ink}
              opacity="0.72"
            />
          </g>
          <rect x="11.5" y="10.5" width="25" height="4.5" rx="2.25" fill={ink} opacity="0.3" />
          <rect x="17" y="17" width="2.6" height="12" rx="1.3" fill="#fff" opacity="0.5" />
          <path d="M38 4c2.6 3.2 4 4.7 4 6.2a4 4 0 0 1-8 0C34 8.7 35.4 7.2 38 4Z" fill={ink} opacity="0.42" />
        </>
      )}

      {kind === "meals" && (
        <>
          <path d="M19 9c0-2.2 2.2-2.2 2.2-4.4" stroke={ink} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
          <path d="M27 10c0-2.2 2.2-2.2 2.2-4.4" stroke={ink} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />

          {/* Food heaped above the rim, so the bowl reads as full. */}
          <path d="M12.5 25.5a11.5 8 0 0 1 23 0Z" fill={ink} opacity="0.5" />
          <circle cx="19" cy="21.5" r="3.4" fill={ink} opacity="0.85" />
          <ellipse
            cx="29.5"
            cy="21"
            rx="5"
            ry="3.2"
            fill={ink}
            opacity="0.32"
            transform="rotate(-22 29.5 21)"
          />

          <path d="M7 25.5h34a17 17 0 0 1-34 0Z" fill={tile} />
          <path d="M7 25.5h34a17 17 0 0 1-34 0Z" fill={ink} opacity="0.16" />
          <rect x="5.5" y="23.5" width="37" height="4.5" rx="2.25" fill={ink} opacity="0.5" />
          <path d="M13 31a13 13 0 0 0 7 8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.4" />
        </>
      )}

      {kind === "medication" && (
        <>
          {/* Blister pack behind, one loose capsule in front. */}
          <g transform="rotate(-9 21 23)">
            <rect x="9" y="9" width="24" height="28" rx="5" fill={tile} />
            <rect x="9" y="9" width="24" height="28" rx="5" fill={ink} opacity="0.14" />
            <circle cx="16" cy="17" r="3.7" fill={ink} opacity="0.4" />
            <circle cx="26" cy="17" r="3.7" fill={ink} opacity="0.4" />
            <circle cx="16" cy="28" r="3.7" fill={ink} opacity="0.4" />
            <circle cx="26" cy="28" r="3.7" fill={ink} opacity="0.4" />
            <rect x="13" y="12" width="3" height="4" rx="1.5" fill="#fff" opacity="0.5" />
          </g>

          <g transform="rotate(38 32 33)">
            <rect x="23" y="28.5" width="19" height="9.5" rx="4.75" fill={ink} opacity="0.85" />
            <path
              d="M23 33.25a4.75 4.75 0 0 1 4.75-4.75H32.5v9.5h-4.75A4.75 4.75 0 0 1 23 33.25Z"
              fill="#fff"
              opacity="0.72"
            />
          </g>
        </>
      )}

      {kind === "sleep" && (
        <>
          <path d="M41 5a6.5 6.5 0 1 0 0 12 7.6 7.6 0 0 1 0-12Z" fill={ink} opacity="0.45" />
          <circle cx="32" cy="7" r="1.3" fill={ink} opacity="0.32" />
          <circle cx="35.5" cy="13.5" r="0.9" fill={ink} opacity="0.26" />

          <rect x="4" y="17" width="5" height="20" rx="2.5" fill={ink} opacity="0.5" />
          <rect x="4" y="27" width="40" height="10" rx="4" fill={tile} />
          <rect x="4" y="27" width="40" height="10" rx="4" fill={ink} opacity="0.16" />
          {/* Blanket folded over the far end. */}
          <path d="M20 27h20a4 4 0 0 1 4 4v2H20Z" fill={ink} opacity="0.42" />
          <rect
            x="8"
            y="21.5"
            width="12"
            height="7"
            rx="3.5"
            fill="#fff"
            opacity="0.85"
            transform="rotate(-7 14 25)"
          />
          <rect x="5.5" y="37" width="3" height="5.5" rx="1.5" fill={ink} opacity="0.38" />
          <rect x="39.5" y="37" width="3" height="5.5" rx="1.5" fill={ink} opacity="0.38" />
        </>
      )}

      {kind === "bloodPressure" && (
        <>
          <circle cx="23" cy="22" r="15" fill={tile} />
          <circle cx="23" cy="22" r="15" fill={ink} opacity="0.14" />
          <circle cx="23" cy="10.5" r="1.3" fill={ink} opacity="0.4" />
          <circle cx="34.5" cy="22" r="1.3" fill={ink} opacity="0.4" />
          <circle cx="11.5" cy="22" r="1.3" fill={ink} opacity="0.4" />
          <path d="M23 22 31 14.5" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <circle cx="23" cy="22" r="2.8" fill={ink} />
          <path d="M20 36c-1 5 6 4 6 9" stroke={ink} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.38" />
          <circle cx="17" cy="15" r="2.6" fill="#fff" opacity="0.45" />
        </>
      )}

      {kind === "bloodSugar" && (
        <>
          <g transform="rotate(-12 21 34)">
            <rect x="6" y="30" width="31" height="8.5" rx="3.5" fill={tile} />
            <rect x="6" y="30" width="31" height="8.5" rx="3.5" fill={ink} opacity="0.16" />
            <rect x="8.5" y="32.5" width="7" height="3.5" rx="1.75" fill={ink} opacity="0.5" />
          </g>
          <path d="M26 5c6.4 8 9.5 11.2 9.5 14.8a9.5 9.5 0 0 1-19 0C16.5 16.2 19.6 13 26 5Z" fill={ink} opacity="0.78" />
          <ellipse cx="21.5" cy="19" rx="2.4" ry="3.4" fill="#fff" opacity="0.42" />
        </>
      )}

      {kind === "oxygen" && (
        <>
          <rect x="6" y="13" width="36" height="22" rx="8" fill={tile} />
          <rect x="6" y="13" width="36" height="22" rx="8" fill={ink} opacity="0.14" />
          <path
            d="M12 24h4.5l3-6.5 4.5 13 3-6.5H36"
            stroke={ink}
            strokeWidth="2.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.85"
          />
          <rect x="10" y="16" width="8" height="3" rx="1.5" fill="#fff" opacity="0.45" />
          <circle cx="19" cy="40" r="2.2" fill={ink} opacity="0.3" />
          <circle cx="27" cy="40.5" r="1.5" fill={ink} opacity="0.22" />
        </>
      )}

      {kind === "heartRate" && (
        <>
          <path
            d="M24 40S7.5 29.5 7.5 18.5A8.5 8.5 0 0 1 24 15a8.5 8.5 0 0 1 16.5 3.5C40.5 29.5 24 40 24 40Z"
            fill={ink}
            opacity="0.72"
          />
          <path
            d="M12.5 23h5l3-5.5 4.5 11 3-5.5h7"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.9"
          />
          <ellipse cx="16" cy="17" rx="3.4" ry="2.4" fill="#fff" opacity="0.3" transform="rotate(-30 16 17)" />
        </>
      )}

      {kind === "temperature" && (
        <>
          <rect x="19.5" y="5" width="9" height="26" rx="4.5" fill={tile} />
          <rect x="19.5" y="5" width="9" height="26" rx="4.5" fill={ink} opacity="0.16" />
          <circle cx="24" cy="35" r="8.5" fill={ink} opacity="0.78" />
          <rect x="21.75" y="15" width="4.5" height="18" rx="2.25" fill={ink} opacity="0.78" />
          <rect x="30" y="11" width="5" height="2" rx="1" fill={ink} opacity="0.32" />
          <rect x="30" y="17" width="4" height="2" rx="1" fill={ink} opacity="0.26" />
          <rect x="30" y="23" width="5" height="2" rx="1" fill={ink} opacity="0.32" />
          <rect x="21.5" y="8" width="2.2" height="5" rx="1.1" fill="#fff" opacity="0.5" />
        </>
      )}

      {kind === "weight" && (
        <>
          <rect x="5" y="16" width="38" height="23" rx="7" fill={tile} />
          <rect x="5" y="16" width="38" height="23" rx="7" fill={ink} opacity="0.14" />
          <rect x="13" y="21" width="22" height="10" rx="5" fill="#fff" opacity="0.8" />
          <path d="M24 29 28.5 23.5" stroke={ink} strokeWidth="2.3" strokeLinecap="round" />
          <circle cx="24" cy="29" r="1.9" fill={ink} />
          <rect x="9.5" y="39" width="5.5" height="3.5" rx="1.75" fill={ink} opacity="0.32" />
          <rect x="33" y="39" width="5.5" height="3.5" rx="1.75" fill={ink} opacity="0.32" />
        </>
      )}
    </svg>
  );
}

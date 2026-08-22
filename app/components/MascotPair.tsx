import BottsDefs from "./BottsDefs";

/** Two Karsas standing close, pleased to see you.
 *
 *  Static on purpose — one drawing, no framer-motion, no timers, no `useId`.
 *  The `Mascot` component elsewhere breathes, blinks and wanders off; none of
 *  that belongs on the door. Being static also means no client boundary.
 *
 *  They are *near* each other, not embracing. An earlier version gave them arms
 *  wrapped around one another, which was wrong twice over: the character has no
 *  arms in its own design, so inventing a pair made them read as a different
 *  toy, and the pose was heavier than it should be. Two friends leaning in is
 *  the whole idea.
 *
 *  Fixed ids rather than generated ones because `BottsDefs` suffixes every
 *  `url(#…)` with the uid it is given, and this page has exactly one of these.
 *  Two `<defs>` blocks, one per character, so they never share a mask. */

/** The eyes are the expression. Two green bars is the character's resting face;
 *  these are the two faces from the sketch, drawn as strokes instead.
 *
 *    `excited` → `>` `<`  — both eyes squeezed shut, the `>_<` of delight
 *    `wink`    → `|` `<`  — one eye open, the other closed
 *
 *  Coordinates are inside the visor group, whose screen runs x 8–96, y 10–46.
 *  Each eye sits on the centre line at y 29.5, left eye at x 33, right at 71. */
const EYE_STROKE = {
  stroke: "#5EF2B8",
  strokeWidth: 5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
} as const;

function Eyes({ face }: { face: "excited" | "wink" }) {
  return (
    <g {...EYE_STROKE}>
      {face === "excited" ? (
        <path d="M28.5 22.5 L36 29.5 L28.5 36.5" />
      ) : (
        <path d="M33 21.5 L33 37.5" />
      )}
      <path d="M75.5 22.5 L68 29.5 L75.5 36.5" />
    </g>
  );
}

function Bot({ uid, face }: { uid: string; face: "excited" | "wink" }) {
  return (
    <g>
      <use transform="translate(6 66)" href={`#sides-cables01-${uid}`} />
      <use transform="translate(49 -.6)" href={`#top-glowingBulb02-${uid}`} />
      <use transform="translate(25 44)" href={`#head-round01-${uid}`} />
      <use transform="translate(56 128)" href={`#mouth-smile01-${uid}`} />

      <g transform="translate(38 76)">
        <rect x="8" y="10" width="88" height="36" rx="4" fill="black" fillOpacity=".8" />
        <Eyes face={face} />
        {/* The visor's glare, kept from the original artwork. */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M83 10h5L76 46h-5z"
          fill="white"
          fillOpacity=".4"
        />
      </g>
    </g>
  );
}

export default function MascotPair({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 220"
      role="img"
      aria-label="Dua maskot Karsa berdiri berdampingan"
      className={`overflow-visible ${className}`}
    >
      <BottsDefs uid="pairA" />
      <BottsDefs uid="pairB" />

      {/* The ground they stand on, so the pair has some weight. */}
      <ellipse cx="153" cy="200" rx="106" ry="14" fill="#3f6b44" opacity="0.16" />

      {/* Back character: slightly smaller and leaning in, which is what puts it
          behind rather than merely beside. */}
      <g transform="translate(6 34) scale(0.95) rotate(7 90 104)">
        <Bot uid="pairA" face="excited" />
      </g>

      {/* Front character, leaning the other way. They overlap by only a few
          units — shoulder to shoulder, not merged into one blob. */}
      <g transform="translate(122 28) rotate(-7 90 104)">
        <Bot uid="pairB" face="wink" />
      </g>
    </svg>
  );
}

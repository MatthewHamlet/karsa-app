import BottsDefs from "./BottsDefs";




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
      <use transform="translate(6 66)" href={`#sides-round-${uid}`} />
      <use transform="translate(49 -.6)" href={`#top-antennaCrooked-${uid}`} />
      <use transform="translate(49 -.6)" href={`#top-antennaLight-${uid}`} />
      <use transform="translate(25 44)" href={`#head-round01-${uid}`} />
      <use transform="translate(56 128)" href={`#mouth-smile01-${uid}`} />

      <g transform="translate(38 76)">
        <rect x="8" y="10" width="88" height="36" rx="4" fill="black" fillOpacity=".8" />
        <Eyes face={face} />

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


      <ellipse cx="153" cy="200" rx="106" ry="14" fill="#3f6b44" opacity="0.16" />


      <g transform="translate(6 34) scale(0.95) rotate(7 90 104)">
        <Bot uid="pairA" face="excited" />
      </g>


      <g transform="translate(122 28) rotate(-7 90 104)">
        <Bot uid="pairB" face="wink" />
      </g>
    </svg>
  );
}

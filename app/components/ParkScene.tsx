export function ParkBench({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 104" aria-hidden className={`pointer-events-none ${className}`}>
      <ellipse cx="120" cy="98" rx="112" ry="9" fill="#3f8a4a" opacity="0.2" />
      <rect x="24" y="44" width="10" height="52" rx="5" fill="#7a563e" />
      <rect x="206" y="44" width="10" height="52" rx="5" fill="#7a563e" />
      <rect x="26" y="6" width="188" height="12" rx="6" fill="#c08b5e" />
      <rect x="26" y="24" width="188" height="12" rx="6" fill="#b8834f" />
      <rect x="32" y="2" width="10" height="46" rx="5" fill="#8a6247" />
      <rect x="198" y="2" width="10" height="46" rx="5" fill="#8a6247" />
      <rect x="16" y="46" width="208" height="14" rx="7" fill="#cf9a6b" />
      <rect x="30" y="58" width="11" height="38" rx="5.5" fill="#8a6247" />
      <rect x="199" y="58" width="11" height="38" rx="5.5" fill="#8a6247" />
    </svg>
  );
}

function Bush({ x, y, s = 1, fill = "#4f9a58" }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="-22" cy="4" r="18" fill={fill} />
      <circle cx="22" cy="4" r="16" fill={fill} />
      <circle cx="0" cy="-6" r="24" fill={fill} />
    </g>
  );
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#ffffff" opacity="0.92">
      <circle cx="-28" cy="6" r="18" />
      <circle cx="0" cy="-6" r="26" />
      <circle cx="28" cy="4" r="20" />
      <rect x="-30" y="4" width="60" height="20" rx="10" />
    </g>
  );
}

function Flower({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="0" cy="-4" r="3.4" fill="#ffffff" />
      <circle cx="-4" cy="1" r="3.4" fill="#ffffff" />
      <circle cx="4" cy="1" r="3.4" fill="#ffffff" />
      <circle cx="0" cy="3" r="3.4" fill="#ffffff" />
      <circle cx="0" cy="0" r="2.2" fill="#f6c453" />
    </g>
  );
}

export default function ParkScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 700"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 top-0 aspect-[900/700] w-full ${className}`}
    >
      <defs>
        <linearGradient id="ps-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe4f5" />
          <stop offset="0.26" stopColor="#dcf0f7" />
          <stop offset="0.44" stopColor="#f0f7e8" />
        </linearGradient>
        <radialGradient id="ps-sun" cx="0.44" cy="0.4" r="0.42">
          <stop offset="0" stopColor="#fff6d8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff6d8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="900" height="700" fill="url(#ps-sky)" />
      <rect width="900" height="700" fill="url(#ps-sun)" />

      <Cloud x={150} y={70} s={1} />
      <Cloud x={520} y={44} s={0.7} />
      <Cloud x={790} y={112} s={0.8} />

      <path d="M0 300 C 180 250, 360 250, 540 288 C 700 322, 800 268, 900 292 L900 700 L0 700 Z" fill="#9ccf92" />
      <path d="M0 348 C 200 308, 380 344, 560 336 C 720 329, 810 364, 900 340 L900 700 L0 700 Z" fill="#84c37c" />
      <path d="M0 396 C 220 368, 400 408, 620 392 C 760 382, 840 406, 900 394 L900 700 L0 700 Z" fill="#6fb86a" />

      <Bush x={40} y={396} s={1.5} fill="#5fa564" />
      <Bush x={124} y={372} s={1.05} fill="#6cb471" />
      <Bush x={866} y={396} s={1.42} fill="#5fa564" />
      <Bush x={776} y={370} s={0.95} fill="#6cb471" />
      <Bush x={712} y={358} s={0.85} fill="#66ad6b" />

      <Bush x={34} y={470} s={1.25} fill="#4f9a58" />
      <Bush x={156} y={444} s={0.85} fill="#59a662" />
      <Bush x={878} y={462} s={1.15} fill="#4f9a58" />
      <Bush x={762} y={440} s={0.8} fill="#59a662" />
      <Bush x={18} y={614} s={1.7} fill="#5aa862" />
      <Bush x={888} y={598} s={1.6} fill="#5aa862" />

      <Flower x={206} y={424} />
      <Flower x={300} y={412} />
      <Flower x={430} y={430} />
      <Flower x={536} y={418} />
      <Flower x={622} y={436} />
      <Flower x={96} y={528} />
      <Flower x={250} y={566} />
      <Flower x={392} y={598} />
      <Flower x={560} y={552} />
      <Flower x={704} y={528} />
      <Flower x={820} y={556} />
      <Flower x={132} y={636} />
      <Flower x={484} y={640} />
      <Flower x={836} y={634} />
    </svg>
  );
}

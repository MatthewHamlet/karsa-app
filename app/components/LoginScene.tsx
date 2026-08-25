


function Cloud({ x, y, s = 1, o = 0.94 }: { x: number; y: number; s?: number; o?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#ffffff" opacity={o}>
      <circle cx="-26" cy="6" r="17" />
      <circle cx="0" cy="-7" r="25" />
      <circle cx="27" cy="4" r="19" />
      <rect x="-28" y="3" width="56" height="21" rx="10.5" />
    </g>
  );
}


function Bush({ x, y, s = 1, fill = "#4f9a58" }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
      <circle cx="-20" cy="4" r="16" />
      <circle cx="20" cy="4" r="14" />
      <circle cx="0" cy="-6" r="21" />
    </g>
  );
}


function Flower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="-5" r="4" fill="#ffffff" />
      <circle cx="-5" cy="1" r="4" fill="#ffffff" />
      <circle cx="5" cy="1" r="4" fill="#ffffff" />
      <circle cx="-3" cy="6" r="4" fill="#ffffff" />
      <circle cx="3" cy="6" r="4" fill="#ffffff" />
      <circle cx="0" cy="0" r="3" fill="#f6c453" />
    </g>
  );
}

export default function LoginScene({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-[#bfe4f5] ${className}`}
    >

      <div className="absolute inset-0 bg-gradient-to-b from-[#bfe4f5] via-[#dcf0f7] to-[#f0f7e8]" />

      <svg
        viewBox="0 0 400 260"
        preserveAspectRatio="xMidYMin meet"
        className="absolute inset-x-0 top-0 aspect-[400/260] w-full"
      >
        <defs>
          <radialGradient id="ls-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff6d8" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fff6d8" stopOpacity="0" />
          </radialGradient>
        </defs>


        <circle cx="334" cy="56" r="62" fill="url(#ls-glow)" />
        <g stroke="#f6c453" strokeWidth="7" strokeLinecap="round">
          <path d="M334 4 v-0.5 M334 4 v10" />
          <path d="M334 98 v10" />
          <path d="M282 56 h10" />
          <path d="M376 56 h10" />
          <path d="M297 19 l7 7" />
          <path d="M364 86 l7 7" />
          <path d="M371 19 l-7 7" />
          <path d="M304 86 l-7 7" />
        </g>
        <circle cx="334" cy="56" r="31" fill="#f8d772" />

        <Cloud x={86} y={62} s={1.05} />
        <Cloud x={248} y={132} s={0.7} o={0.85} />
        <Cloud x={52} y={190} s={0.62} o={0.75} />
        <Cloud x={330} y={202} s={0.85} o={0.8} />
      </svg>


      <svg
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[32%] w-full lg:h-[44%]"
      >

        <path d="M0 44 C 60 18, 130 22, 190 40 C 250 58, 320 26, 400 40 L400 120 L0 120 Z" fill="#9ccf92" />
        <path d="M0 66 C 70 44, 140 62, 210 62 C 280 62, 340 78, 400 62 L400 120 L0 120 Z" fill="#84c37c" />
        <path d="M0 92 C 90 74, 160 96, 250 90 C 320 85, 360 98, 400 90 L400 120 L0 120 Z" fill="#6fb86a" />
      </svg>


      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 hidden aspect-[400/200] w-full lg:block"
      >
        <Bush x={36} y={158} s={0.9} fill="#4f9a58" />
        <Bush x={368} y={150} s={0.8} fill="#59a662" />
        <Bush x={132} y={186} s={0.62} fill="#5aa862" />
        <Flower x={72} y={182} s={0.9} />
        <Flower x={186} y={166} s={0.75} />
        <Flower x={246} y={190} s={0.95} />
        <Flower x={308} y={174} s={0.8} />
        <Flower x={352} y={192} s={0.7} />
      </svg>
    </div>
  );
}

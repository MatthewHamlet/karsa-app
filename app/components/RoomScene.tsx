/** The room the mascot stands in: morning light through a window on the right,
 *  a sofa and side table on the left, plants between them.
 *
 *  Two constraints shape the layout. Everything is pale and low-contrast,
 *  because the greeting copy sits on top of it. And the furniture is kept to
 *  the outer thirds — the middle is left as plain wall, which is where the
 *  headline lands at every width, and it's also the band that survives when
 *  `slice` crops the sides on a narrower card. */
export default function RoomScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 300"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        {/* Wall warms up as it approaches the window. */}
        <linearGradient id="rs-wall" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stopColor="#f5ead9" />
          <stop offset="0.55" stopColor="#faf1e2" />
          <stop offset="1" stopColor="#fdf7ec" />
        </linearGradient>

        <linearGradient id="rs-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6d7bd" />
          <stop offset="1" stopColor="#eee1cb" />
        </linearGradient>

        <linearGradient id="rs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dfeaf1" />
          <stop offset="1" stopColor="#fae4c4" />
        </linearGradient>

        <radialGradient id="rs-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe6b8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffe6b8" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="rs-beam" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff4dd" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff4dd" stopOpacity="0" />
        </linearGradient>

        {/* Lifts the middle of the scene toward white so the copy stays clean. */}
        <linearGradient id="rs-veil" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="0.72" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <rect width="900" height="300" fill="url(#rs-wall)" />

      {/* Window, hard right — clear of where the headline ends */}
      <g>
        <rect x="730" y="24" width="168" height="178" rx="14" fill="#e2d2b4" />
        <rect x="741" y="35" width="146" height="156" rx="9" fill="url(#rs-sky)" />
        {/* Distant hills, just enough to suggest an outside. */}
        <path d="M741 158 q30 -26 62 -4 q26 17 50 -7 l34 -17 v61 H741 Z" fill="#c9dcc6" opacity="0.7" />
        <circle cx="846" cy="76" r="19" fill="#ffe9bf" />
        <circle cx="846" cy="76" r="56" fill="url(#rs-sun)" />
        {/* Mullions */}
        <rect x="810" y="35" width="7" height="156" fill="#e2d2b4" />
        <rect x="741" y="109" width="146" height="7" fill="#e2d2b4" />
        <rect x="720" y="198" width="188" height="10" rx="5" fill="#d8c6a4" />
      </g>

      {/* Morning light spilling onto the floor */}
      <g opacity="0.68">
        <path d="M752 203 L604 300 L440 300 L710 203 Z" fill="url(#rs-beam)" />
        <path d="M862 203 L790 300 L664 300 L814 203 Z" fill="url(#rs-beam)" />
      </g>

      {/* Floor, with a rug through the middle — the one thing that reads in
          the centre band, which is all a narrow card has room to show. */}
      <rect y="244" width="900" height="56" fill="url(#rs-floor)" />
      <rect y="244" width="900" height="2" fill="#d9c8a8" />
      <ellipse cx="450" cy="278" rx="228" ry="28" fill="#e0cfb0" />
      <ellipse cx="450" cy="278" rx="196" ry="20" fill="#ebdcc2" />

      {/* Sofa, far left */}
      <g>
        <rect x="4" y="150" width="196" height="60" rx="22" fill="#dccfb8" />
        <rect x="20" y="182" width="164" height="62" rx="18" fill="#e7dbc6" />
        <rect x="34" y="188" width="62" height="24" rx="11" fill="#d5c8ae" />
        <rect x="106" y="188" width="62" height="24" rx="11" fill="#d5c8ae" />
        <rect x="28" y="238" width="14" height="15" rx="5" fill="#cbbb9f" />
        <rect x="164" y="238" width="14" height="15" rx="5" fill="#cbbb9f" />
      </g>

      {/* Tall plant — peeks out from behind the mascot */}
      <g>
        <path d="M216 248 h60 l-8 -48 h-44 Z" fill="#d3c0a0" />
        <g stroke="#a3c39c" strokeWidth="7" fill="none" strokeLinecap="round">
          <path d="M246 200 v-44" />
          <path d="M246 176 q-26 -12 -33 -40" />
          <path d="M246 165 q26 -16 35 -44" />
          <path d="M246 188 q-22 -6 -29 -26" />
        </g>
        <ellipse cx="208" cy="130" rx="15" ry="9" fill="#bcd4b6" transform="rotate(-28 208 130)" />
        <ellipse cx="284" cy="119" rx="16" ry="9" fill="#bcd4b6" transform="rotate(26 284 119)" />
        <ellipse cx="246" cy="149" rx="13" ry="8" fill="#c6dbc0" />
      </g>

      {/* Side table with a little vase */}
      <g>
        <rect x="300" y="196" width="72" height="10" rx="5" fill="#d7c5a5" />
        <rect x="314" y="206" width="8" height="42" rx="4" fill="#d7c5a5" />
        <rect x="352" y="206" width="8" height="42" rx="4" fill="#d7c5a5" />
        <path d="M328 196 q-6 -21 4 -29h13 q10 8 4 29 Z" fill="#c9dcc6" />
        <path d="M334 167 q-11 -17 -2 -27" stroke="#a9c8a3" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M340 167 q11 -15 21 -19" stroke="#a9c8a3" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>

      <rect width="900" height="300" fill="url(#rs-veil)" />
    </svg>
  );
}

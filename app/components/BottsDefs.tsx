
export default function BottsDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <g id={`sides-round-${uid}`}>
        <mask id={`sidesRound-a-${uid}`} style={{ maskType: "luminance" }}>
          <ellipse cx="144" cy="38.5" rx="18" ry="22.5" fill="white" />
          <ellipse
            cx="18"
            cy="22.5"
            rx="18"
            ry="22.5"
            transform="matrix(-1 0 0 1 42 16)"
            fill="white"
          />
        </mask>
        <g mask={`url(#sidesRound-a-${uid})`}>
          <path d="M-6 0h180v76H-6z" fill="#879198" />
          <path d="M-6 0h180v76H-6z" fill="white" fillOpacity=".3" />
          <path fill="black" fillOpacity=".2" d="M14 0h140v76H14z" />
        </g>
      </g>

      <g id={`top-antennaCrooked-${uid}`}>
        <mask id={`topAntennaCrooked-a-${uid}`} style={{ maskType: "luminance" }}>
          <path
            d="M47.54 34.98 43 45.59h-3.74l4.92-10.43-6.05-10.43 3.22-11.84 2.9.8-2.9 10.6z"
            fill="white"
          />
          <path fill="white" d="M30 39.59h24v13H30z" />
        </mask>
        <g mask={`url(#topAntennaCrooked-a-${uid})`}>
          <path d="M-8 .6H92v52H-8z" fill="#879198" />
          <path d="M-8 6.6H92v52H-8z" fill="white" fillOpacity=".3" />
          <path fill="white" fillOpacity=".2" d="M30 39.59h24v13H30z" />
        </g>
      </g>

      <g id={`top-antennaLight-${uid}`}>
        <circle cx="42" cy="8.59" r="8" fill="#FFE65C" />
        <circle cx="45" cy="5.59" r="3" fill="white" />
      </g>

      <g id={`head-round01-${uid}`}>
        <mask id={`headRound01-a-${uid}`} style={{ maskType: "luminance" }}>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M66 0c58.35 0 64 40.69 64 78 0 33.32-25.47 42-64 42-37.46 0-66-8.69-66-42C0 40.69 7.65 0 66 0"
            fill="white"
          />
        </mask>
        <g mask={`url(#headRound01-a-${uid})`}>
          <path d="M-4-2h138v124H-4z" fill="#879198" />
        </g>
      </g>

      <g id={`mouth-smile01-${uid}`}>
        <path
          d="M23.05 4.44a2 2 0 1 1 3.9-.88C27.72 6.96 30.4 9 34 9s6.28-2.04 7.05-5.44a2 2 0 1 1 3.9.88C43.75 9.7 39.43 13 34 13s-9.76-3.3-10.95-8.56"
          fill="black"
          fillOpacity=".6"
        />
      </g>
    </defs>
  );
}

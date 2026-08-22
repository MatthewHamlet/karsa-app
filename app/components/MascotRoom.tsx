/** Karsa's room, behind the assistant's stage panel.
 *
 *  Flat vector in the same register as the park: no outlines, no texture, a
 *  handful of warm neutrals and one sage accent. Late-afternoon light comes in
 *  through the window and lands on the floor, which is the only thing in here
 *  doing any real work — it is what makes the character look lit by the room
 *  rather than pasted onto it.
 *
 *  ── Sizing, which is the whole difficulty ────────────────────────────────
 *  The panel is a tall portrait column whose height is the viewport's, so it
 *  runs anywhere from ~640px to ~900px while its width barely moves. The fit is
 *  `xMidYMax slice`: the bottom is anchored and a short panel crops off the top.
 *  Everything below y≈420 therefore always shows; everything above it is
 *  decoration that is allowed to disappear on a small laptop.
 *
 *  The mascot is placed by flexbox, not by this drawing, and the two cannot be
 *  aligned exactly — the scene scales with the panel's width while the caption
 *  and padding under the character are fixed pixels, so the gap between them
 *  drifts. Two things absorb that. The floor is a deep band, the bottom 30%, so
 *  the feet land inside it at any size. And the rug is not drawn here at all:
 *  it ships as `RoomRug` and is positioned against the mascot itself, the same
 *  trick the park bench uses.
 *
 *  Everything is kept pale on purpose: the status caption sits on top of it,
 *  and the mascot has to stay the darkest thing in the frame.
 *
 *  The clear zone is the middle. The mascot covers roughly x 86–374 upward from
 *  the floor, so the window sits above that band and the furniture beside it. */

const WOOD = "#d8c7a6";
const WOOD_DARK = "#c9b593";
const FRAME = "#e0cfae";

/** One book on a shelf. Widths and heights vary or a row reads as a fence. */
function Book({ x, y, w, h, fill }: { x: number; y: number; w: number; h: number; fill: string }) {
  return <rect x={x} y={y - h} width={w} height={h} rx="2" fill={fill} />;
}

/** A potted plant. `s` scales the whole thing about its pot's base. */
function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-15 0 h30 l-4 -26 h-22 Z" fill="#cbb896" />
      <rect x="-17" y="-30" width="34" height="7" rx="3" fill="#d6c4a2" />
      <g stroke="#a7c6a0" strokeWidth="4" fill="none" strokeLinecap="round">
        <path d="M0 -30 v-26" />
        <path d="M0 -44 q-16 -6 -20 -24" />
        <path d="M0 -50 q16 -9 21 -26" />
      </g>
      <ellipse cx="-21" cy="-70" rx="10" ry="6" fill="#bcd7b5" transform="rotate(-30 -21 -70)" />
      <ellipse cx="22" cy="-78" rx="10" ry="6" fill="#bcd7b5" transform="rotate(28 22 -78)" />
      <ellipse cx="0" cy="-60" rx="8" ry="5" fill="#c8e0c1" />
    </g>
  );
}

/** The rug, drawn against the mascot rather than into the room.
 *
 *  Same reasoning as the park's bench: the character's baseline moves with the
 *  layout and the scene's does not, so a rug painted at a fixed y ends up either
 *  under the feet or halfway up the shins depending on the window. Anchored to
 *  the mascot it is always exactly where the character is standing. Two ellipses
 *  rather than one, so it has a border — without that it reads as a shadow. */
export function RoomRug({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 120" aria-hidden className={`pointer-events-none ${className}`}>
      <ellipse cx="200" cy="60" rx="198" ry="58" fill="#dde6d3" />
      <ellipse cx="200" cy="60" rx="165" ry="44" fill="#eaf0e3" />
    </svg>
  );
}

export default function MascotRoom({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 460 860"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        {/* The wall warms up towards the window rather than being one flat
            colour — a single fill reads as a backdrop, not as a room. */}
        <linearGradient id="mr-wall" x1="0" y1="0.2" x2="1" y2="0.8">
          <stop offset="0" stopColor="#f2e9d8" />
          <stop offset="0.5" stopColor="#f9f2e6" />
          <stop offset="1" stopColor="#f4ebda" />
        </linearGradient>
        <linearGradient id="mr-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8d8b9" />
          <stop offset="1" stopColor="#dbc7a2" />
        </linearGradient>
        <linearGradient id="mr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c6e2f0" />
          <stop offset="0.62" stopColor="#e4f0f4" />
          <stop offset="1" stopColor="#fce7c2" />
        </linearGradient>
        <radialGradient id="mr-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe9bd" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffe9bd" stopOpacity="0" />
        </radialGradient>
        {/* The spill from the window: bright where it leaves the sill, gone by
            the time it reaches the front of the room. */}
        <linearGradient id="mr-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3d9" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff3d9" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="mr-lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffdfa4" stopOpacity="0.65" />
          <stop offset="1" stopColor="#ffdfa4" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="460" height="860" fill="url(#mr-wall)" />

      {/* ── Window and curtains ───────────────────────────────────────────
          Lifted as a group rather than by editing every coordinate. It has to
          clear two things at once: the mascot's head, which rises higher up the
          wall on a short panel because the character keeps its size while the
          room loses height, and the top crop, which eats everything above
          y≈85 on a 720px screen. -40 is the window that satisfies both. */}
      <g transform="translate(0 -40)">
        <rect x="142" y="208" width="176" height="188" rx="12" fill={FRAME} />
        <rect x="153" y="219" width="154" height="166" rx="7" fill="url(#mr-sky)" />
        <circle cx="268" cy="260" r="19" fill="#ffeec6" />
        <circle cx="268" cy="260" r="54" fill="url(#mr-sun)" />
        {/* Just enough outside to read as outside. */}
        <path d="M153 336 q34 -28 68 -6 q30 20 54 -9 l32 -13 v77 H153 Z" fill="#c7dcc4" opacity="0.75" />
        <path d="M153 358 q46 -15 92 2 q38 14 62 -6 v31 H153 Z" fill="#b6d0b2" opacity="0.7" />
        {/* Mullions, then the sill. */}
        <rect x="226" y="219" width="8" height="166" fill={FRAME} />
        <rect x="153" y="294" width="154" height="8" fill={FRAME} />
        <rect x="130" y="392" width="200" height="13" rx="6" fill={WOOD_DARK} />
        <Plant x={296} y={392} s={0.36} />
      </g>

      {/* Curtains, hung wide so they frame the window without covering it.
          Same -40 as the window they hang beside. */}
      <g transform="translate(0 -40)">
        <rect x="116" y="190" width="228" height="9" rx="4.5" fill={WOOD_DARK} />
        <circle cx="116" cy="194.5" r="7" fill={WOOD} />
        <circle cx="344" cy="194.5" r="7" fill={WOOD} />
        <path d="M124 196 h34 q-12 82 4 136 q-14 36 -4 70 h-34 Z" fill="#e8eee0" />
        <path d="M150 196 h8 q-12 82 4 136 q-14 36 -4 70 h-10 q10 -36 2 -71 q-14 -55 0 -135 Z" fill="#dbe4d1" />
        <path d="M336 196 h-34 q12 82 -4 136 q14 36 4 70 h34 Z" fill="#e8eee0" />
        <path d="M310 196 h-8 q12 82 -4 136 q14 36 4 70 h10 q-10 -36 -2 -71 q14 -55 -2 -135 Z" fill="#dbe4d1" />
      </g>

      {/* ── Wall things ──────────────────────────────────────────────────── */}
      <g>
        <rect x="22" y="206" width="76" height="94" rx="7" fill={FRAME} />
        <rect x="30" y="214" width="60" height="78" rx="4" fill="#eef4e8" />
        <circle cx="72" cy="236" r="9" fill="#f3dcae" />
        <path d="M30 276 q16 -24 30 -6 q12 15 30 -8 v30 H30 Z" fill="#c2d8bd" />
      </g>
      <g>
        <circle cx="412" cy="248" r="32" fill={FRAME} />
        <circle cx="412" cy="248" r="24" fill="#f7f1e4" />
        <path d="M412 248 V232 M412 248 h12" stroke="#b9a889" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* ── Floor ────────────────────────────────────────────────────────── */}
      <rect y="600" width="460" height="260" fill="url(#mr-floor)" />
      <rect y="594" width="460" height="12" rx="3" fill="#ece0c8" />
      <rect y="594" width="460" height="3" fill={WOOD_DARK} opacity="0.5" />
      {/* Board seams, fanning very slightly so the floor has a direction. */}
      <g stroke="#cdb994" strokeWidth="2" opacity="0.4" strokeLinecap="round">
        <path d="M96 606 L64 860" />
        <path d="M212 606 L200 860" />
        <path d="M330 606 L360 860" />
      </g>

      {/* Light on the floor, drawn over the boards but under the furniture. */}
      <path d="M156 600 L104 860 L364 860 L304 600 Z" fill="url(#mr-beam)" opacity="0.75" />

      {/* ── Bookshelf, hard left ─────────────────────────────────────────── */}
      <g>
        <rect x="8" y="330" width="98" height="270" rx="9" fill={WOOD} />
        <rect x="17" y="339" width="80" height="252" rx="5" fill="#efe2ca" />
        <rect x="17" y="404" width="80" height="8" fill={WOOD_DARK} />
        <rect x="17" y="480" width="80" height="8" fill={WOOD_DARK} />
        <rect x="17" y="556" width="80" height="8" fill={WOOD_DARK} />

        <Book x={24} y={404} w={11} h={50} fill="#c6d8c0" />
        <Book x={37} y={404} w={9} h={42} fill="#e3c9a5" />
        <Book x={48} y={404} w={13} h={55} fill="#d9b9a4" />
        <Book x={63} y={404} w={10} h={39} fill="#cdd9e0" />
        <Book x={75} y={404} w={12} h={48} fill="#c6d8c0" />

        <Book x={24} y={480} w={12} h={44} fill="#d9b9a4" />
        <Book x={38} y={480} w={10} h={53} fill="#cdd9e0" />
        <Book x={50} y={480} w={9} h={37} fill="#e3c9a5" />
        {/* A stack lying flat, so the shelves aren't three identical rows. */}
        <rect x="63" y="464" width="30" height="8" rx="3" fill="#c6d8c0" />
        <rect x="66" y="472" width="27" height="8" rx="3" fill="#e3c9a5" />

        <Book x={24} y={556} w={10} h={41} fill="#cdd9e0" />
        <Book x={36} y={556} w={13} h={50} fill="#c6d8c0" />
        <Plant x={76} y={556} s={0.4} />
      </g>

      {/* ── Side table and lamp, hard right ──────────────────────────────── */}
      <g>
        <circle cx="414" cy="440" r="66" fill="url(#mr-lamp)" />
        {/* Shade, stem, base. */}
        <path d="M386 412 h56 l12 44 h-80 Z" fill="#f6e6c4" />
        <rect x="411" y="456" width="6" height="34" fill={WOOD_DARK} />
        <ellipse cx="414" cy="492" rx="20" ry="6" fill={WOOD_DARK} />

        <rect x="360" y="498" width="104" height="12" rx="6" fill="#dfd0b1" />
        <rect x="372" y="510" width="9" height="90" rx="4" fill={WOOD} />
        <rect x="443" y="510" width="9" height="90" rx="4" fill={WOOD} />
        {/* A mug, because a bare table reads as unused. */}
        <rect x="386" y="480" width="20" height="18" rx="4" fill="#e8eee0" />
        <path d="M406 485 q9 4 0 9" stroke="#d3ddc8" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>

      {/* A tall plant in the near-left corner and a pouffe in the near-right.
          These are the only objects in front of the character, and they are the
          reason the room has any depth rather than being a painted backdrop. */}
      <Plant x={40} y={806} s={1.15} />
      <g>
        <ellipse cx="396" cy="826" rx="46" ry="17" fill="#cfd9c5" />
        <rect x="350" y="800" width="92" height="26" fill="#dde6d3" />
        <ellipse cx="396" cy="800" rx="46" ry="17" fill="#e8eee0" />
      </g>
    </svg>
  );
}

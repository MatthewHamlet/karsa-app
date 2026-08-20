/** The mascot's artwork, inlined from `public/botts.svg`.
 *
 *  "Bottts" by Pablo Stanley (https://bottts.com), generated through DiceBear.
 *  Free for personal and commercial use; the original file stays in `public/`
 *  with its licence metadata intact.
 *
 *  Inlined rather than loaded through an `<img>` because the mascot has to
 *  blink: an image is one opaque box to the DOM, and the eyes have to be
 *  reachable elements before anything can animate them. Every id is suffixed
 *  with a per-instance `uid` so two mascots on one page cannot collide over
 *  the same `url(#…)`.
 *
 *  Generated — edit `public/botts.svg` and re-run the conversion, not this. */
export default function BottsDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <g id={`sides-cables01-${uid}`}><path d="M32 12c-2.95 11.7-19.9 6.67-23.37 18-3.46 11.35 8.03 20 17.53 20" stroke="#2A3544" strokeWidth="6" opacity=".9"/><path d="M144 55c8.4 3.49 20.1-7.6 16-16.5s-16-6.7-16-19.3" stroke="#2A3544" strokeWidth="4" opacity=".9"/><mask id={`sidesCables01-a-${uid}`} style={{ maskType: "luminance" }}><rect x="15" y="35" width="16" height="22" rx="2" fill="white"/><rect x="130" y="42" width="23" height="22" rx="2" fill="white"/><rect x="130" y="6" width="23" height="18" rx="2" fill="white"/></mask><g mask={`url(#sidesCables01-a-${uid})`}><path d="M-6 0h180v76H-6z" fill="#879198"/><path d="M-6 0h180v76H-6z" fill="white" fillOpacity=".3"/></g></g><filter id={`topGlowingBulb02-a-${uid}`} x="14" y="5.59" width="56" height="47" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="r0"/><feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="r1"/><feOffset/><feGaussianBlur stdDeviation="4"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"/><feBlend in2="r0" result="r2"/><feBlend in="SourceGraphic" in2="r2" result="r3"/><feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="r1"/><feOffset/><feGaussianBlur stdDeviation="2"/><feComposite in2="r1" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"/><feBlend in2="r3" result="r4"/></filter><g id={`top-glowingBulb02-${uid}`}><g filter={`url(#topGlowingBulb02-a-${uid})`}><path fillRule="evenodd" clipRule="evenodd" d="M22 33.6a20 20 0 1 1 40 0v11H22z" fill="white" fillOpacity=".3"/></g><ellipse cx="42" cy="30.59" rx="4" ry="6" fill="white" fillOpacity=".6"/><path d="M42 16.1c4.93 0 9.37 2.12 12.44 5.51m2.43 3.5q1.05 1.98 1.53 4.23" stroke="white" strokeWidth="2" strokeLinecap="round"/><rect x="12" y="36.59" width="60" height="16" rx="1" fill="#48494B"/></g><g id={`texture-circuits-${uid}`}><path d="M66 36h49.42a5 5 0 1 1 0 4H62V6h4zm-8-12h-4V6h4z" fill="black" fillOpacity=".1"/><path d="M163 31a5 5 0 0 1 2 9.58V66h19v4h-23V40.58a5 5 0 0 1 2-9.58" fill="white" fillOpacity=".2"/><path d="M157 74h27v4h-31V52h4zm-85 26a5 5 0 0 0-2 9.58V135H51v4h23v-29.42a5 5 0 0 0-2-9.58" fill="black" fillOpacity=".2"/></g><g id={`head-round01-${uid}`}><mask id={`headRound01-a-${uid}`} style={{ maskType: "luminance" }}><path fillRule="evenodd" clipRule="evenodd" d="M66 0c58.35 0 64 40.69 64 78 0 33.32-25.47 42-64 42-37.46 0-66-8.69-66-42C0 40.69 7.65 0 66 0" fill="white"/></mask><g mask={`url(#headRound01-a-${uid})`}><path d="M-4-2h138v124H-4z" fill="#879198"/><use transform="translate(-44 -7)" href={`#texture-circuits-${uid}`}/></g></g><g id={`mouth-smile01-${uid}`}><path d="M23.05 4.44a2 2 0 1 1 3.9-.88C27.72 6.96 30.4 9 34 9s6.28-2.04 7.05-5.44a2 2 0 1 1 3.9.88C43.75 9.7 39.43 13 34 13s-9.76-3.3-10.95-8.56" fill="black" fillOpacity=".6"/></g><clipPath id={`clip-${uid}`}><rect width="180" height="180" rx="0" ry="0"/></clipPath>
    </defs>
  );
}

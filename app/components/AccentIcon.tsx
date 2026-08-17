import type { LucideIcon } from "lucide-react";
import { TONES, type Tone } from "./tones";

const SIZE = {
  sm: { box: "h-9 w-9 rounded-[10px]", icon: 17 },
  md: { box: "h-11 w-11 rounded-xl", icon: 20 },
  lg: { box: "h-13 w-13 rounded-2xl", icon: 23 },
} as const;

/** A category's icon on its own tile.
 *
 *  Two-tone by construction: the tile carries the pale shade of the category
 *  and the glyph the saturated one, with a white sheen across the top so it
 *  reads as an object rather than a flat colour chip. */
export default function AccentIcon({
  icon: Icon,
  tone,
  size = "md",
}: {
  icon: LucideIcon;
  tone: Tone;
  size?: keyof typeof SIZE;
}) {
  const { box, icon } = SIZE[size];

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden ${box} ${TONES[tone].tile}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/60 to-transparent"
      />
      <Icon size={icon} strokeWidth={2} className="relative" />
    </span>
  );
}

import type { ReactNode } from "react";

/** The app's own tooltip.
 *
 *  The browser's `title` attribute was doing this job and doing it badly: it
 *  waits a second before appearing, it is drawn by the operating system in a
 *  style that belongs to no design system at all, and on a touch screen it
 *  never appears. This one shows on the first pointer move, in the same cream
 *  and hairline the cards are built from. */
export const TIP =
  "pointer-events-none z-20 whitespace-nowrap rounded-xl bg-white px-2.5 py-1.5 text-[11.5px] font-semibold leading-4 text-neutral-800 shadow-[0_10px_24px_-10px_rgba(24,32,24,0.55)] ring-1 ring-karsa-line";

/** Anchored to whatever `relative` element it sits inside — which is what makes
 *  it survive a wrapping grid, where a percentage across the row would put the
 *  label above the wrong day.
 *
 *  `align` is for the ends of a row. A centred label on the first column hangs
 *  off the left of the card, and the card clips its overflow — so the tooltip
 *  that most needs reading is the one that disappears. */
export default function Tip({
  children,
  align = "center",
}: {
  children: ReactNode;
  align?: "center" | "start" | "end";
}) {
  const place =
    align === "start"
      ? "left-0"
      : align === "end"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <span role="status" className={`absolute bottom-full mb-1.5 ${place} ${TIP}`}>
      {children}
    </span>
  );
}

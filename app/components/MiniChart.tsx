"use client";

import { useState } from "react";
import { TIP } from "./Tip";
import type { Series } from "../data/careTrends";
import type { StatTone } from "../data/careStats";

/** A period's readings, small enough to live inside a stat card.
 *
 *  Lines are SVG and bars are DOM boxes rather than both being one or the
 *  other. The SVG is stretched with `preserveAspectRatio="none"` so it fills
 *  whatever width the card has, which would squash a rounded rect into a
 *  lozenge and turn a dot into an ellipse — so bars, which need square corners
 *  and even gaps, are laid out by flexbox instead, and every stroke that stays
 *  in the SVG is marked `non-scaling-stroke` so the stretch cannot thin it. */
export default function MiniChart({
  series,
  kind,
  tone,
  label,
  className = "h-[92px]",
}: {
  series: Series;
  kind: "line" | "dualLine" | "bar";
  tone: StatTone;
  /** Names the metric for anyone who cannot see the drawing. */
  label: string;
  className?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const { points, average, averageSecondary } = series;
  const n = points.length;

  const readings = points.flatMap((p) =>
    p.secondary === undefined ? [p.value] : [p.value, p.secondary],
  );
  const low = Math.min(...readings, average);
  const high = Math.max(...readings, average);

  /* Bars are measured from zero — a bar chart that starts partway up overstates
     every difference it draws. A line is a shape, not a quantity, so it gets a
     tight window with a little air. */
  const pad = (high - low || 1) * 0.2;
  const min = kind === "bar" ? 0 : low - pad;
  const max = high + pad;
  const span = max - min || 1;

  /** 0 at the top of the box, 100 at the bottom. */
  const y = (value: number) => ((max - value) / span) * 100;
  /** Bars sit in bands; a line's ends touch the edges. */
  const x = (i: number) => (kind === "bar" ? ((i + 0.5) / n) * 100 : (i / (n - 1 || 1)) * 100);

  const path = (pick: (p: (typeof points)[number]) => number | undefined) =>
    points
      .map((p, i) => {
        const value = pick(p);
        return value === undefined ? "" : `${i === 0 ? "M" : "L"}${x(i)} ${y(value)}`;
      })
      .join(" ");

  const track = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    setActive(Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1)))));
  };

  const point = active === null ? null : points[active];

  return (
    <div className="relative">
      <div
        role="img"
        aria-label={`${label}. Rata-rata ${series.averageLabel} dari ${n} catatan.`}
        onPointerMove={track}
        onPointerDown={track}
        onPointerLeave={() => setActive(null)}
        className={`relative w-full touch-pan-y ${className}`}
      >
        {/* The average, drawn behind everything: a reference, not a reading.
            Blood pressure gets two, because "rata-rata 126/80" is a claim about
            both numbers and a single line would only back up half of it. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 border-t border-dashed"
          style={{ top: `${y(average)}%`, borderColor: `${tone.ink}66` }}
        />
        {averageSecondary !== undefined && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 border-t border-dashed"
            style={{ top: `${y(averageSecondary)}%`, borderColor: `${tone.ink}40` }}
          />
        )}

        {kind === "bar" ? (
          <div aria-hidden className="flex h-full items-end gap-[3px]">
            {points.map((p, i) => (
              <span
                key={p.label}
                className="min-w-0 flex-1 rounded-t-[3px] transition-[height,opacity] duration-300"
                style={{
                  height: `${Math.max(2, 100 - y(p.value))}%`,
                  backgroundColor: tone.ink,
                  opacity: active === null || active === i ? 0.85 : 0.35,
                }}
              />
            ))}
          </div>
        ) : (
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
          >
            {/* Wash under the primary line, so the card reads as filled rather
                than as a wire floating in space. */}
            <path
              d={`${path((p) => p.value)} L100 100 L0 100 Z`}
              fill={tone.ink}
              opacity={0.1}
            />
            {kind === "dualLine" && (
              <path
                d={path((p) => p.secondary)}
                fill="none"
                stroke={tone.ink}
                strokeOpacity={0.45}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
              />
            )}
            <path
              d={path((p) => p.value)}
              fill="none"
              stroke={tone.ink}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        {/* The hovered reading, marked in DOM rather than SVG so the dot stays
            round however wide the card gets. */}
        {point && kind !== "bar" && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute top-0 h-full border-l border-dashed"
              style={{ left: `${x(active!)}%`, borderColor: `${tone.ink}55` }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
              style={{
                left: `${x(active!)}%`,
                top: `${y(point.value)}%`,
                backgroundColor: tone.ink,
              }}
            />
          </>
        )}
      </div>

      {/* Tooltip. Clamped to the card at both ends, because the first and last
          readings are exactly the ones a caregiver reaches for. */}
      {point && (
        <div
          role="status"
          className="pointer-events-none absolute -top-1 z-10 -translate-y-full"
          style={{
            left: `${Math.min(84, Math.max(16, x(active!)))}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span className={`block ${TIP}`}>
            <span className="text-neutral-400">{point.label} · </span>
            {series.format(point.value, point.secondary)}
          </span>
        </div>
      )}
    </div>
  );
}

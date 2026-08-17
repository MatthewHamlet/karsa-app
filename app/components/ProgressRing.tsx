/** Circular progress, sized by its wrapper rather than a pixel prop, so it can
 *  be the card's main statistic on a wide screen and still fit a phone. */
export default function ProgressRing({
  value,
  label,
  className = "h-28 w-28",
}: {
  /** 0–100. */
  value: number;
  label?: string;
  className?: string;
}) {
  const R = 44;
  const circumference = 2 * Math.PI * R;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className={`@container relative shrink-0 ${className}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={R} fill="none" strokeWidth="9" className="stroke-white/75" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="stroke-karsa transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>

      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="text-[clamp(20px,26cqw,34px)] font-extrabold leading-none tabular-nums text-neutral-900">
          {Math.round(value)}%
        </span>
        {label && (
          <span className="mt-1 text-[clamp(11px,10cqw,14px)] font-medium leading-none text-neutral-500">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

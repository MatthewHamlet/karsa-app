import { ReactNode } from "react";

const CARD =
  "rounded-[20px] p-6 shadow-[0_1px_2px_rgba(24,32,24,0.03),0_14px_30px_-26px_rgba(24,32,24,0.28)] ring-1 sm:p-7 xl:p-8";

const TONE = {
  white: "bg-white ring-karsa-line",
  sand: "bg-tint-sand ring-edge-sand",
  sky: "bg-tint-sky ring-edge-sky",
  mint: "bg-tint-mint ring-edge-mint",
  lilac: "bg-tint-lilac ring-edge-lilac",
  plain: "",
} as const;

type PanelProps = {
  eyebrow?: string;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  tone?: keyof typeof TONE;
  className?: string;
  bodyClassName?: string;
};

export default function Panel({
  eyebrow,
  title,
  action,
  children,
  tone = "white",
  className = "",
  bodyClassName = "",
}: PanelProps) {
  const shell = tone === "plain" ? "" : `${CARD} ${TONE[tone]}`;

  return (
    <section className={`${shell} ${className}`}>
      {(eyebrow || title || action) && (
        <header className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-neutral-400 xl:text-xs">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="truncate text-[19px] font-bold leading-7 text-neutral-800 xl:text-[22px]">
                {title}
              </h2>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

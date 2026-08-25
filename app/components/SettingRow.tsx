"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export default function SettingRow({
  icon,
  title,
  description,
  value,
  trailing,
  interactive = false,
  onClick,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  value?: string;
  trailing?: ReactNode;
  interactive?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      {icon}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[15.5px] font-medium leading-6 text-neutral-800">
          {title}
        </span>
        {description && (
          <span className="mt-0.5 block text-[13.5px] leading-5 text-neutral-500">
            {description}
          </span>
        )}
      </span>

      {value && (
        <span className="shrink-0 text-[14px] tabular-nums text-neutral-500">{value}</span>
      )}

      {trailing}

      {interactive && !trailing && (
        <ChevronRight
          size={18}
          strokeWidth={2}
          className="shrink-0 text-neutral-300 transition-transform duration-200 group-hover/row:translate-x-0.5 group-hover/row:text-neutral-400"
        />
      )}
    </>
  );

  const shell =
    "group/row flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-200";

  if (!interactive) {
    return <div className={shell}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${shell} outline-none hover:bg-karsa-canvas/50 focus-visible:bg-karsa-canvas/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-karsa/40`}
    >
      {body}
    </button>
  );
}

import type { ReactNode } from "react";


export const TIP =
  "pointer-events-none z-20 whitespace-nowrap rounded-xl bg-white px-2.5 py-1.5 text-[11.5px] font-semibold leading-4 text-neutral-800 shadow-[0_10px_24px_-10px_rgba(24,32,24,0.55)] ring-1 ring-karsa-line";


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

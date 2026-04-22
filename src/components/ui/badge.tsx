import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "pill inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

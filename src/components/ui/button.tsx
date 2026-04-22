import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const buttonStyles = {
  primary:
    "inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-strong)]",
  secondary:
    "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50",
  ghost:
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/80",
  danger:
    "inline-flex items-center justify-center rounded-full bg-[var(--danger)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90",
};

type SharedProps = {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof buttonStyles;
};

type ButtonProps = SharedProps & React.ButtonHTMLAttributes<HTMLButtonElement>;
type ButtonLinkProps = SharedProps & { href: string };

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button className={cn(buttonStyles[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  className,
  variant = "primary",
}: ButtonLinkProps) {
  return (
    <Link href={href} className={cn(buttonStyles[variant], className)}>
      {children}
    </Link>
  );
}

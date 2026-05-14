import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const buttonStyles = {
  primary:
    "inline-flex min-h-11 max-w-full items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-center text-sm font-semibold leading-tight text-white shadow-sm transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60",
  secondary:
    "inline-flex min-h-11 max-w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold leading-tight text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
  ghost:
    "inline-flex min-h-10 max-w-full items-center justify-center rounded-full px-4 py-2 text-center text-sm font-medium leading-tight text-slate-700 transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-60",
  danger:
    "inline-flex min-h-11 max-w-full items-center justify-center rounded-full bg-[var(--danger)] px-5 py-3 text-center text-sm font-semibold leading-tight text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
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

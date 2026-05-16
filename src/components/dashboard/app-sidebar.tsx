"use client";

import { CreditCard, History, Home, LayoutDashboard, PenLine, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AccountMenu } from "@/components/auth/account-menu";
import { DASHBOARD_NAV, PLAN_LABELS } from "@/lib/domain";
import type { PlanCode } from "@/lib/domain";
import { cn } from "@/lib/utils";

const navIcons = {
  "/dashboard": LayoutDashboard,
  "/dashboard/new": PenLine,
  "/dashboard/history": History,
  "/dashboard/billing": CreditCard,
  "/dashboard/settings": Settings,
} as const;

export function AppSidebar({
  planCode,
}: {
  planCode: PlanCode;
}) {
  const pathname = usePathname();

  return (
    <aside className="panel sticky top-3 z-30 flex h-fit flex-col gap-4 p-3 backdrop-blur supports-[backdrop-filter]:bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] lg:top-6 lg:gap-6 lg:p-5">
      <div className="flex items-center justify-between gap-3 px-1 lg:px-0">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
          aria-label="Humaniser home"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand)] text-xs font-bold text-white lg:hidden">
            H
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">Humaniser</p>
            <p className="truncate text-xs text-slate-500">{PLAN_LABELS[planCode]} plan</p>
          </div>
        </Link>
        <AccountMenu />
      </div>
      <nav
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
        aria-label="Dashboard navigation"
      >
        <Link
          href="/"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950 lg:w-full lg:rounded-2xl lg:bg-transparent lg:px-4 lg:py-3"
        >
          <Home className="h-4 w-4 shrink-0" aria-hidden="true" />
          Home
        </Link>
        {DASHBOARD_NAV.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = navIcons[item.href];

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition lg:w-full lg:rounded-2xl lg:px-4 lg:py-3",
                active
                  ? "bg-[var(--brand)] text-white shadow-[0_10px_24px_rgba(15,118,110,0.22)] ring-1 ring-[color:color-mix(in_srgb,var(--brand-strong)_32%,white)]"
                  : "bg-white/70 text-slate-600 hover:bg-white hover:text-slate-950 lg:bg-transparent",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

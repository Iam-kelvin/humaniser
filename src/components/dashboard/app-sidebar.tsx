"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DASHBOARD_NAV, PLAN_LABELS } from "@/lib/domain";
import type { PlanCode } from "@/lib/domain";
import { cn } from "@/lib/utils";

export function AppSidebar({
  planCode,
}: {
  planCode: PlanCode;
}) {
  const pathname = usePathname();

  return (
    <aside className="panel flex h-fit flex-col gap-6 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Humaniser</p>
          <p className="text-xs text-slate-500">{PLAN_LABELS[planCode]} plan</p>
        </div>
        <UserButton />
      </div>
      <nav className="flex flex-col gap-2">
        {DASHBOARD_NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-medium transition",
                active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

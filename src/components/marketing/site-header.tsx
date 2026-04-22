import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { MARKETING_NAV } from "@/lib/domain";
import { ButtonLink } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 md:px-6">
      <div className="container-shell">
        <div className="panel flex flex-col gap-4 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-[color:color-mix(in_srgb,var(--surface)_82%,transparent)] md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand)] text-sm font-bold text-white">
              H
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">Humaniser</p>
              <p className="truncate text-xs text-slate-500">Natural writing refinement</p>
            </div>
          </Link>
          <nav className="order-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm md:order-2 md:justify-center">
            {MARKETING_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="font-medium text-slate-600 transition hover:text-slate-900">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="order-2 flex items-center justify-end gap-3 md:order-3">
            {session.userId ? (
              <>
                <ButtonLink href="/dashboard" variant="secondary" className="px-4 py-2.5">
                  Dashboard
                </ButtonLink>
                <UserButton />
              </>
            ) : (
              <>
                <ButtonLink href="/sign-in" variant="ghost" className="px-3 py-2">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/sign-up" className="px-4 py-2.5">
                  Start free
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

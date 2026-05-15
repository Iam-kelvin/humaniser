"use client";

import { UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { MARKETING_NAV } from "@/lib/domain";
import { cn } from "@/lib/utils";

export function SiteHeaderNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 md:px-6 md:pt-4">
      <div className="container-shell">
        <div className="relative panel overflow-visible backdrop-blur supports-[backdrop-filter]:bg-[color:color-mix(in_srgb,var(--surface)_86%,transparent)]">
          <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-3 sm:px-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-6 md:px-5">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-3 rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 md:justify-self-start"
              aria-label="Humaniser home"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand)] text-sm font-bold text-white">
                H
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">Humaniser</p>
                <p className="hidden truncate text-xs text-slate-500 min-[430px]:block">Natural writing refinement</p>
              </div>
            </Link>

            <nav className="hidden items-center justify-center gap-6 md:flex" aria-label="Main navigation">
              {MARKETING_NAV.map((item) => (
                <HeaderLink key={item.href} href={item.href} active={pathname === item.href}>
                  {item.label}
                </HeaderLink>
              ))}
            </nav>

            <div className="hidden items-center justify-self-end gap-2 md:flex">
              {signedIn ? (
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

            <div className="flex shrink-0 items-center justify-self-end gap-2 md:hidden">
              {signedIn ? (
                <UserButton />
              ) : (
                <ButtonLink href="/sign-up" className="min-h-10 px-3 py-2 text-xs min-[430px]:text-sm">
                  Start free
                </ButtonLink>
              )}
              <button
                type="button"
                aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-site-navigation"
                onClick={() => setMenuOpen((value) => !value)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
              >
                {menuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div
            id="mobile-site-navigation"
            className={cn(
              "pointer-events-none absolute left-0 right-0 top-full z-50 px-1 pt-2 opacity-0 transition duration-200 md:hidden",
              menuOpen && "pointer-events-auto opacity-100",
            )}
          >
            <div
              className={cn(
                "origin-top translate-y-2 rounded-[2rem] border border-[var(--line)] bg-white/96 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur transition duration-200",
                menuOpen && "translate-y-0",
              )}
            >
              <nav className="grid gap-2" aria-label="Mobile navigation">
                {MARKETING_NAV.map((item) => (
                  <MobileHeaderLink key={item.href} href={item.href} active={pathname === item.href} onClick={closeMenu}>
                    {item.label}
                  </MobileHeaderLink>
                ))}
                {signedIn ? (
                  <MobileHeaderLink href="/dashboard" active={pathname.startsWith("/dashboard")} onClick={closeMenu}>
                    Dashboard
                  </MobileHeaderLink>
                ) : (
                  <MobileHeaderLink href="/sign-in" active={pathname.startsWith("/sign-in")} onClick={closeMenu}>
                    Sign in
                  </MobileHeaderLink>
                )}
                {!signedIn && (
                  <Link
                    href="/sign-up"
                    onClick={closeMenu}
                    className="mt-1 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
                  >
                    Start free
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "text-sm font-medium text-slate-600 transition hover:text-slate-950",
        active && "text-slate-950",
      )}
    >
      {children}
    </Link>
  );
}

function MobileHeaderLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white",
        active && "bg-white text-slate-950 shadow-sm",
      )}
    >
      {children}
    </Link>
  );
}

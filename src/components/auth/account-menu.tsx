"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountMenuProps = {
  align?: "left" | "right";
  compact?: boolean;
};

export function AccountMenu({
  align = "right",
  compact = false,
}: AccountMenuProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayName = useMemo(() => {
    if (!user) return "Account";
    return user.fullName || user.firstName || user.username || "Account";
  }, [user]);

  const secondaryLabel = useMemo(() => {
    if (!user) return "";
    return user.primaryEmailAddress?.emailAddress || user.username || "";
  }, [user]);

  const initials = useMemo(() => {
    if (!displayName) return "H";
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "H";
  }, [displayName]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Open account menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white p-1.5 text-left shadow-sm transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2",
          compact && "p-1",
        )}
      >
        <span className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-white",
          compact && "h-9 w-9",
        )}>
          {initials}
        </span>
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-[calc(100%+0.75rem)] z-50 w-[19rem] rounded-[2rem] border border-[var(--line)] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="flex items-center gap-4 px-6 py-5">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xl font-semibold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
              {secondaryLabel ? (
                <p className="truncate text-sm text-slate-500">{secondaryLabel}</p>
              ) : null}
            </div>
          </div>

          <div className="border-t border-slate-200">
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-4 px-6 py-5 text-slate-700 transition hover:bg-slate-50"
            >
              <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="text-sm font-medium">Manage account</span>
            </Link>
          </div>

          <div className="border-t border-slate-200">
            <SignOutButton>
              <Button
                type="button"
                variant="ghost"
                className="flex w-full justify-start gap-4 rounded-none px-6 py-5 text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium">Sign out</span>
              </Button>
            </SignOutButton>
          </div>
        </div>
      )}
    </div>
  );
}

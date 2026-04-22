"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[var(--page)] p-6">
        <div className="panel max-w-xl space-y-4 p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Application error</p>
          <h1 className="text-3xl font-semibold text-slate-900">Something went wrong while loading Humaniser.</h1>
          <p className="text-sm leading-7 text-slate-600">
            {error.message || "An unexpected error occurred."}
          </p>
          <Button onClick={() => reset()}>Try again</Button>
        </div>
      </body>
    </html>
  );
}

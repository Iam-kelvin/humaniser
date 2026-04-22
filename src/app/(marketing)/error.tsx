"use client";

import { Button } from "@/components/ui/button";

export default function MarketingError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="container-shell py-16">
      <div className="panel max-w-2xl space-y-4 p-8">
        <h1 className="text-3xl font-semibold text-slate-900">The marketing site hit a snag.</h1>
        <p className="text-sm leading-7 text-slate-600">
          Try the request again. If the problem persists, check the latest application logs and environment configuration.
        </p>
        <Button onClick={() => reset()}>Retry</Button>
      </div>
    </div>
  );
}

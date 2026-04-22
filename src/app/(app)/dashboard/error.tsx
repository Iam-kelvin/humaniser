"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="panel space-y-4 p-8">
      <h1 className="text-3xl font-semibold text-slate-900">We couldn&apos;t load this dashboard view.</h1>
      <p className="text-sm leading-7 text-slate-600">
        This usually means a temporary issue with authentication, the database connection, or a pending integration setting.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const missingDatabase =
    error.name === "DatabaseNotConfiguredError" || error.message.includes("DATABASE_URL");

  return (
    <div className="panel space-y-4 p-8">
      <h1 className="text-3xl font-semibold text-slate-900">
        {missingDatabase ? "Database setup needed before loading the dashboard." : "We couldn&apos;t load this dashboard view."}
      </h1>
      {missingDatabase ? (
        <div className="space-y-3 text-sm leading-7 text-slate-600">
          <p>Add `DATABASE_URL` to `.env.local`, then run the Prisma setup commands:</p>
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 px-4 py-4 text-xs text-slate-100">
{`npx prisma generate
npx prisma migrate dev --name init
# optional
npx prisma db seed`}
          </pre>
        </div>
      ) : (
        <p className="text-sm leading-7 text-slate-600">
          This usually means a temporary issue with authentication, the database connection, or a pending integration setting.
        </p>
      )}
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}

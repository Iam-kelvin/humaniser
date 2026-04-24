import Link from "next/link";

import { ReadinessPanel } from "@/components/dashboard/readiness-panel";
import { UsageCard } from "@/components/dashboard/usage-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PRESET_LABELS, TONE_LABELS, PLAN_LABELS } from "@/lib/domain";
import { requireViewer } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { getAppReadiness } from "@/lib/readiness";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const viewer = await requireViewer();
  const [data, readiness] = await Promise.all([getDashboardData(viewer.user.id), getAppReadiness()]);

  return (
    <>
      <section className="panel flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Dashboard</p>
          <h1 className="text-4xl font-semibold text-slate-950">Keep meaning intact. Improve how it lands.</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            You&apos;re on the {PLAN_LABELS[data.planCode]} plan. Start a new rewrite, review recent output, or head to billing when you need more control.
          </p>
        </div>
        <ButtonLink href="/dashboard/new">Start a new rewrite</ButtonLink>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <UsageCard
          planCode={data.planCode}
          rewritesUsed={data.usage.rewritesUsed}
          rewritesLimit={data.usage.entitlements.monthlyRewrites}
          wordsUsed={data.usage.inputWordsUsed}
          wordsLimit={data.usage.entitlements.monthlyInputWords}
        />
        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Recent rewrites</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Latest activity</h2>
            </div>
            <Link href="/dashboard/history" className="text-sm font-medium text-[var(--brand)]">
              View history
            </Link>
          </div>
          <div className="mt-6">
            {data.recentRewrites.length === 0 ? (
              <EmptyState
                title="No rewrites yet"
                description="Your recent draft activity will appear here once you create a rewrite."
                action={<ButtonLink href="/dashboard/new">Create your first rewrite</ButtonLink>}
              />
            ) : (
              <div className="space-y-3">
                {data.recentRewrites.map((rewrite) => (
                  <Link
                    key={rewrite.id}
                    href={`/dashboard/new?rewriteId=${rewrite.id}`}
                    className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white px-5 py-4 transition hover:border-slate-300"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-900">{rewrite.document.title}</h3>
                      <span className="text-xs text-slate-500">{formatDate(rewrite.createdAt)}</span>
                    </div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {PRESET_LABELS[rewrite.document.writingPreset]} · {TONE_LABELS[rewrite.tone]}
                    </p>
                    <p className="line-clamp-2 text-sm leading-6 text-slate-600">{rewrite.rewrittenText}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ReadinessPanel readiness={readiness} />
    </>
  );
}

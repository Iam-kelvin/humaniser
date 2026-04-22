import { PLAN_LABELS } from "@/lib/domain";
import type { PlanCode } from "@/lib/domain";
import { formatNumber } from "@/lib/utils";

export function UsageCard({
  planCode,
  rewritesUsed,
  rewritesLimit,
  wordsUsed,
  wordsLimit,
}: {
  planCode: PlanCode;
  rewritesUsed: number;
  rewritesLimit: number;
  wordsUsed: number;
  wordsLimit: number;
}) {
  const rewritePercent = Math.min((rewritesUsed / rewritesLimit) * 100, 100);
  const wordPercent = Math.min((wordsUsed / wordsLimit) * 100, 100);

  return (
    <div className="panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Usage</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">{PLAN_LABELS[planCode]} plan</h3>
        </div>
        <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Monthly</div>
      </div>
      <div className="mt-6 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Rewrites</span>
            <span>{formatNumber(rewritesUsed)} / {formatNumber(rewritesLimit)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-[var(--brand)]" style={{ width: `${rewritePercent}%` }} />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Input words</span>
            <span>{formatNumber(wordsUsed)} / {formatNumber(wordsLimit)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-amber-500" style={{ width: `${wordPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

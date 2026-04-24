import { Badge } from "@/components/ui/badge";
import { StatusBanner } from "@/components/ui/status-banner";
import type { AppReadiness } from "@/lib/readiness";

export function ReadinessPanel({ readiness }: { readiness: AppReadiness }) {
  return (
    <div className="panel space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Readiness</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Launch posture</h2>
        </div>
        <Badge className={readiness.launchStage === "beta_ready" ? "border-none bg-emerald-50 text-emerald-700" : "border-none bg-amber-50 text-amber-700"}>
          {readiness.launchStage === "beta_ready" ? "Private Beta Ready" : "Internal Testing"}
        </Badge>
      </div>

      <StatusBanner
        title={readiness.launchStage === "beta_ready" ? "Close to private beta" : "A few blockers remain"}
        description={readiness.summary}
        tone={readiness.launchStage === "beta_ready" ? "success" : "warning"}
      />

      <div className="grid gap-3">
        {readiness.checks.map((check) => (
          <div key={check.label} className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">{check.label}</p>
              <Badge className={check.status === "ready" ? "border-none bg-emerald-50 text-emerald-700" : "border-none bg-amber-50 text-amber-700"}>
                {check.status === "ready" ? "Ready" : "Attention"}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{check.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

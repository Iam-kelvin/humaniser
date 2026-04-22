import { startUpgradeAction, openBillingPortalAction } from "@/server/actions/billing";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import { requireViewer } from "@/lib/auth";
import { getBillingState } from "@/lib/data/billing";
import { getUsageSummary, resolveCurrentPlan } from "@/lib/data/dashboard";
import { PLAN_LABELS } from "@/lib/domain";
import { formatDate } from "@/lib/utils";

export default async function BillingPage() {
  const viewer = await requireViewer();
  const [planCode, billing] = await Promise.all([resolveCurrentPlan(viewer.user.id), getBillingState(viewer.user.id)]);
  const usage = await getUsageSummary(viewer.user.id, planCode);

  return (
    <section className="space-y-6">
      <div className="panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Billing</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-950">Manage plan and subscription access.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Humaniser uses a provider-agnostic billing layer with Paddle as the current checkout path.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel space-y-5 p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Current plan</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{PLAN_LABELS[planCode]}</h2>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <p>Usage this month: {usage.rewritesUsed} rewrites · {usage.inputWordsUsed} input words</p>
            <p>Subscription status: {billing.subscription?.status ?? "FREE"}</p>
            <p>Current period end: {formatDate(billing.subscription?.currentPeriodEnd)}</p>
          </div>
          {planCode === "FREE" ? (
            <form action={startUpgradeAction}>
              <Button type="submit">Upgrade to Pro</Button>
            </form>
          ) : (
            <form action={openBillingPortalAction}>
              <Button type="submit" variant="secondary">
                Open billing portal
              </Button>
            </form>
          )}
        </div>
        <div className="space-y-4">
          <StatusBanner
            title="Paddle-first billing architecture"
            description="Checkout, portal handoff, subscription sync, and webhooks are wired through a provider abstraction so Lemon Squeezy can be added later without reshaping the app."
            tone="info"
          />
          <StatusBanner
            title="Webhook ingestion is idempotent"
            description="Incoming provider events are stored by provider event ID before subscription updates are applied."
            tone="success"
          />
        </div>
      </div>
    </section>
  );
}

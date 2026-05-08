import { openBillingPortalAction, startUpgradeAction } from "@/server/actions/billing";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import { requireViewer } from "@/lib/auth";
import { getBillingState } from "@/lib/data/billing";
import { getUsageSummary, resolveCurrentPlan } from "@/lib/data/dashboard";
import { PLAN_LABELS } from "@/lib/domain";
import { formatDate } from "@/lib/utils";

export default async function BillingPage() {
  const viewer = await requireViewer();
  const planCode = await resolveCurrentPlan(viewer.user.id);
  const [billing, usage] = await Promise.all([getBillingState(viewer.user.id), getUsageSummary(viewer.user.id, planCode)]);

  return (
    <section className="space-y-6">
      <div className="panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Billing</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-950">Manage plan and subscription access.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Upgrade when you need more monthly volume, stronger controls, and access to the full subscription flow.
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
            <div className="space-y-4">
              <StatusBanner
                title={billing.checkoutReady ? "Upgrade checkout is ready" : "Checkout needs live billing keys"}
                description={
                  billing.checkoutReady
                    ? "When billing keys are configured, this button sends people into the Paddle-backed upgrade flow."
                    : "The upgrade button is wired up, but it will use a pricing fallback until Paddle keys and price ids are added."
                }
                tone={billing.checkoutReady ? "success" : "warning"}
              />
              <form action={startUpgradeAction}>
                <Button type="submit">Upgrade to Pro</Button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {!billing.customer ? (
                <StatusBanner
                  title="Portal access needs a billing customer"
                  description="This account has Pro access, but there is no linked Paddle customer yet. A real checkout or synced webhook will create that record."
                  tone="warning"
                />
              ) : null}
              <form action={openBillingPortalAction}>
                <Button type="submit" variant="secondary" disabled={!billing.customer}>
                  Open billing portal
                </Button>
              </form>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <StatusBanner
            title="Upgrade flow is connected"
            description="The app can launch checkout, store upgrade attempts, and sync plan changes from provider webhooks."
            tone="success"
          />
          <StatusBanner
            title="Public test checklist"
            description="Before opening billing to outside testers, add Paddle API keys, a real Pro price id, the webhook secret, and the production checkout URL."
            tone={billing.checkoutReady ? "success" : "warning"}
          />
          <StatusBanner
            title="Webhook ingestion is idempotent"
            description="Incoming provider events are stored by provider event ID before subscription updates are applied."
            tone="info"
          />
        </div>
      </div>
    </section>
  );
}

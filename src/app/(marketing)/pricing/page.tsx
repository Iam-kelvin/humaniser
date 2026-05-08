import { auth } from "@clerk/nextjs/server";

import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { resolveCurrentPlan } from "@/lib/data/dashboard";
import { startUpgradeAction } from "@/server/actions/billing";

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "For individual writers improving drafts a few times each month.",
    features: [
      "25 rewrites per month",
      "15,000 monthly input words",
      "Email, Research Summary, and General Writing presets",
      "Natural, Professional, and Warm tones",
      "Light and Moderate rewrite intensity",
      "Basic history access",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    description: "For regular professional use, deeper controls, and a cleaner path from first draft to finished copy.",
    features: [
      "300,000 monthly input words",
      "All tones and all intensity levels",
      "Custom instructions",
      "Explain changes",
      "Full history access",
      "Billing portal access",
    ],
  },
] as const;

export default async function PricingPage() {
  const session = await auth();
  const planCode = session.userId ? await resolveCurrentPlan(session.userId) : null;

  return (
    <div className="container-shell page-fade space-y-10 pt-8 md:space-y-12 md:pt-10">
      <div className="space-y-4 text-center">
        <Badge>Pricing</Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Simple plans for clearer writing.</h1>
        <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-600">
          Start free, then upgrade when you need more volume, more tone control, and deeper refinement.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {tiers.map((tier) => {
          const isCurrentFree = session.userId && tier.name === "Free" && planCode === "FREE";
          const isCurrentPro = session.userId && tier.name === "Pro" && planCode === "PRO";

          return (
            <div key={tier.name} className="panel flex h-full flex-col gap-6 p-6 md:p-8">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{tier.name}</p>
                <div className="flex items-end gap-2">
                  <h2 className="text-5xl font-semibold text-slate-950">{tier.price}</h2>
                  {tier.name === "Pro" && <p className="pb-2 text-sm text-slate-500">/ month</p>}
                </div>
                <p className="text-sm leading-7 text-slate-600">{tier.description}</p>
              </div>

              <ul className="flex-1 space-y-3 text-sm text-slate-700">
                {tier.features.map((feature) => (
                  <li key={feature} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    {feature}
                  </li>
                ))}
              </ul>

              {!session.userId ? (
                <ButtonLink href={tier.name === "Free" ? "/sign-up" : "/sign-up"} className="w-full justify-center" variant={tier.name === "Free" ? "primary" : "secondary"}>
                  {tier.name === "Free" ? "Start free" : "Create account to upgrade"}
                </ButtonLink>
              ) : tier.name === "Free" ? (
                <ButtonLink href="/dashboard" className="w-full justify-center" variant="secondary">
                  {isCurrentFree ? "Current plan" : "Back to dashboard"}
                </ButtonLink>
              ) : isCurrentPro ? (
                <ButtonLink href="/dashboard/billing" className="w-full justify-center" variant="secondary">
                  Manage billing
                </ButtonLink>
              ) : (
                <form action={startUpgradeAction}>
                  <Button type="submit" className="w-full justify-center">
                    Upgrade to Pro
                  </Button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

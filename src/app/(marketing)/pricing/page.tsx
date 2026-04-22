import { auth } from "@clerk/nextjs/server";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "For individual writers improving AI-assisted drafts a few times each month.",
    features: [
      "25 rewrites per month",
      "15,000 monthly input words",
      "Email, Research Summary, and General Writing presets",
      "Natural, Professional, and Warm tones",
      "Light and Moderate rewrite intensity",
      "Basic history access",
    ],
    cta: "/sign-up",
  },
  {
    name: "Pro",
    price: "$19",
    description: "For regular professional use, more control, and a faster path from draft to polished copy.",
    features: [
      "300,000 monthly input words",
      "All tones and all intensity levels",
      "Custom instructions",
      "Explain changes",
      "Full history access",
      "Billing portal access",
    ],
    cta: "/dashboard/billing",
  },
];

export default async function PricingPage() {
  const session = await auth();

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
        {tiers.map((tier) => (
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
            <ButtonLink href={tier.cta} className="w-full justify-center" variant={session.userId && tier.name === "Free" ? "secondary" : "primary"}>
              {session.userId
                ? tier.name === "Free"
                  ? "Current starter path"
                  : "Open billing"
                : tier.name === "Free"
                  ? "Start free"
                  : "Create account to upgrade"}
            </ButtonLink>
          </div>
        ))}
      </div>
    </div>
  );
}

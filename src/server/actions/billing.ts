"use server";

import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/auth";
import { createBillingPortal, createUpgradeCheckout } from "@/lib/data/billing";
import { resolveCurrentPlan } from "@/lib/data/dashboard";

export async function startUpgradeAction() {
  const viewer = await requireViewer();
  const checkout = await createUpgradeCheckout(viewer.user.id, viewer.user.email, "FREE");
  redirect(checkout.checkoutUrl);
}

export async function openBillingPortalAction() {
  const viewer = await requireViewer();
  const planCode = await resolveCurrentPlan(viewer.user.id);

  if (planCode !== "PRO") {
    redirect("/pricing");
  }

  const portal = await createBillingPortal(viewer.user.id);
  redirect(portal.portalUrl);
}

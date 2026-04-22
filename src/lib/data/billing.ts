import "server-only";

import { prisma } from "@/lib/prisma";
import { getBillingProvider } from "@/lib/billing";
import type { PlanCode } from "@/lib/domain";

export async function getBillingState(userId: string) {
  const [subscription, customer] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.paymentCustomer.findFirst({ where: { userId, provider: "PADDLE" } }),
  ]);

  return {
    subscription,
    customer,
  };
}

export async function createUpgradeCheckout(userId: string, email: string, planCode: PlanCode) {
  const provider = getBillingProvider();
  const checkout = await provider.createUpgradeCheckout({ userId, email, planCode });

  await prisma.usageEvent.create({
    data: {
      userId,
      eventType: "PLAN_UPGRADE_STARTED",
      inputWords: 0,
      outputWords: 0,
      planAtTime: planCode,
    },
  });

  return checkout;
}

export async function createBillingPortal(userId: string) {
  const provider = getBillingProvider();
  const customer = await prisma.paymentCustomer.findFirst({
    where: { userId, provider: "PADDLE" },
  });

  if (!customer) {
    throw new Error("No Paddle customer record found for this account.");
  }

  const portal = await provider.createCustomerPortal({
    providerCustomerId: customer.providerCustomerId,
  });

  await prisma.usageEvent.create({
    data: {
      userId,
      eventType: "PLAN_PORTAL_OPENED",
      inputWords: 0,
      outputWords: 0,
      planAtTime: "PRO",
    },
  });

  return portal;
}

import type { BillingProvider, PlanCode } from "@/lib/domain";

export type BillingCheckoutResult = {
  provider: BillingProvider;
  checkoutUrl: string;
  providerTransactionId?: string;
};

export interface BillingPortalResult {
  provider: BillingProvider;
  portalUrl: string;
}

export interface BillingProviderAdapter {
  provider: BillingProvider;
  createUpgradeCheckout(input: { userId: string; email: string; planCode: PlanCode }): Promise<BillingCheckoutResult>;
  createCustomerPortal(input: { providerCustomerId: string }): Promise<BillingPortalResult>;
  mapWebhookEvent(payload: unknown): {
    eventId: string;
    eventType: string;
    providerCustomerId?: string | null;
    providerSubscriptionId?: string | null;
    planCode?: PlanCode;
    status?: "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE";
    periodStart?: Date | null;
    periodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
  };
}

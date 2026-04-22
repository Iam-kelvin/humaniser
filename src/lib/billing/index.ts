import { paddleAdapter } from "@/lib/billing/paddle";
import type { BillingProviderAdapter } from "@/lib/billing/types";

export function getBillingProvider(): BillingProviderAdapter {
  return paddleAdapter;
}

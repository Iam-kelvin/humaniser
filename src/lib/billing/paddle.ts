import { createHmac, timingSafeEqual } from "node:crypto";

import type { BillingProviderAdapter } from "@/lib/billing/types";
import { getEnv, requireEnv } from "@/lib/env";

function parseSignatureHeader(header: string) {
  const parts = header.split(";").map((entry) => entry.trim());
  const timestamp = parts.find((part) => part.startsWith("ts="))?.slice(3);
  const signature = parts.find((part) => part.startsWith("h1="))?.slice(3);

  if (!timestamp || !signature) {
    throw new Error("Invalid Paddle-Signature header.");
  }

  return { timestamp, signature };
}

export function verifyPaddleSignature(rawBody: string, header: string) {
  const secret = requireEnv("PADDLE_WEBHOOK_SECRET");
  const { timestamp, signature } = parseSignatureHeader(header);
  const payload = `${timestamp}:${rawBody}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error("Paddle webhook signature mismatch.");
  }
}

export const paddleAdapter: BillingProviderAdapter = {
  provider: "PADDLE",
  async createUpgradeCheckout({ email }) {
    const env = getEnv();
    const base = env.PADDLE_DEFAULT_CHECKOUT_URL ?? env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const checkoutUrl =
      env.PADDLE_PRO_PRICE_ID && env.PADDLE_API_KEY
        ? `${base.replace(/\/$/, "")}/checkout?price_id=${encodeURIComponent(env.PADDLE_PRO_PRICE_ID)}&email=${encodeURIComponent(email)}`
        : `${base.replace(/\/$/, "")}/pricing?intent=upgrade`;

    return {
      provider: "PADDLE",
      checkoutUrl,
    };
  },
  async createCustomerPortal({ providerCustomerId }) {
    const base = getEnv().NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    return {
      provider: "PADDLE",
      portalUrl: `${base.replace(/\/$/, "")}/dashboard/billing?portal=${encodeURIComponent(providerCustomerId)}`,
    };
  },
  mapWebhookEvent(payload) {
    const body = payload as {
      event_id?: string;
      event_type?: string;
      data?: {
        customer_id?: string | null;
        id?: string | null;
        status?: string | null;
        scheduled_change?: { action?: string | null } | null;
        items?: Array<{ price?: { id?: string | null } | null }> | null;
        current_billing_period?: { starts_at?: string | null; ends_at?: string | null } | null;
      };
    };

    const statusMap: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE"> = {
      active: "ACTIVE",
      past_due: "PAST_DUE",
      canceled: "CANCELED",
      paused: "PAST_DUE",
      trialing: "ACTIVE",
    };

    return {
      eventId: body.event_id ?? crypto.randomUUID(),
      eventType: body.event_type ?? "unknown",
      providerCustomerId: body.data?.customer_id ?? null,
      providerSubscriptionId: body.data?.id ?? null,
      planCode: "PRO",
      status: statusMap[body.data?.status ?? ""] ?? "INCOMPLETE",
      periodStart: body.data?.current_billing_period?.starts_at ? new Date(body.data.current_billing_period.starts_at) : null,
      periodEnd: body.data?.current_billing_period?.ends_at ? new Date(body.data.current_billing_period.ends_at) : null,
      cancelAtPeriodEnd: body.data?.scheduled_change?.action === "cancel",
    };
  },
};

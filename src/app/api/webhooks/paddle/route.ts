import { NextResponse } from "next/server";

import { getBillingProvider } from "@/lib/billing";
import { verifyPaddleSignature } from "@/lib/billing/paddle";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("Paddle-Signature");

  if (process.env.PADDLE_WEBHOOK_SECRET) {
    if (!signature) {
      return NextResponse.json({ error: "Missing Paddle-Signature header." }, { status: 400 });
    }

    try {
      verifyPaddleSignature(rawBody, signature);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid signature." }, { status: 400 });
    }
  }

  const payload = JSON.parse(rawBody) as unknown;
  const provider = getBillingProvider();
  const mapped = provider.mapWebhookEvent(payload);

  const record = await prisma.webhookEvent.upsert({
    where: {
      provider_eventId: {
        provider: "PADDLE",
        eventId: mapped.eventId,
      },
    },
    update: {
      payloadJson: payload as object,
      eventType: mapped.eventType,
    },
    create: {
      provider: "PADDLE",
      eventId: mapped.eventId,
      eventType: mapped.eventType,
      payloadJson: payload as object,
      status: "RECEIVED",
    },
  });

  if (record.processedAt) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (mapped.providerCustomerId) {
    const customer = await prisma.paymentCustomer.findFirst({
      where: {
        provider: "PADDLE",
        providerCustomerId: mapped.providerCustomerId,
      },
    });

    if (customer) {
      await prisma.subscription.upsert({
        where: { userId: customer.userId },
        update: {
          provider: "PADDLE",
          providerCustomerId: mapped.providerCustomerId ?? undefined,
          providerSubscriptionId: mapped.providerSubscriptionId ?? undefined,
          planCode: mapped.planCode ?? "PRO",
          status: mapped.status ?? "ACTIVE",
          currentPeriodStart: mapped.periodStart ?? undefined,
          currentPeriodEnd: mapped.periodEnd ?? undefined,
          cancelAtPeriodEnd: mapped.cancelAtPeriodEnd ?? false,
        },
        create: {
          userId: customer.userId,
          provider: "PADDLE",
          providerCustomerId: mapped.providerCustomerId ?? undefined,
          providerSubscriptionId: mapped.providerSubscriptionId ?? undefined,
          planCode: mapped.planCode ?? "PRO",
          status: mapped.status ?? "ACTIVE",
          currentPeriodStart: mapped.periodStart ?? undefined,
          currentPeriodEnd: mapped.periodEnd ?? undefined,
          cancelAtPeriodEnd: mapped.cancelAtPeriodEnd ?? false,
        },
      });
    }
  }

  await prisma.webhookEvent.update({
    where: { id: record.id },
    data: {
      status: "PROCESSED",
      processedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}

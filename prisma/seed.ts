import { PrismaClient, PlanCode, RewriteIntensity, SourceType, SubscriptionProvider, SubscriptionStatus, Tone, UsageEventType, WebhookStatus, WritingPreset } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demoClerkUserId = process.env.DEMO_USER_CLERK_ID;
  const demoEmail = process.env.DEMO_USER_EMAIL ?? "demo@humaniser.app";

  if (!demoClerkUserId) {
    console.log("Skipping demo user seed because DEMO_USER_CLERK_ID is not set.");
    return;
  }

  const user = await prisma.user.upsert({
    where: { clerkUserId: demoClerkUserId },
    update: { email: demoEmail },
    create: {
      clerkUserId: demoClerkUserId,
      email: demoEmail,
      profile: {
        create: {
          displayName: "Demo Writer",
          defaultPreset: WritingPreset.EMAIL,
          defaultTone: Tone.NATURAL,
          defaultIntensity: RewriteIntensity.MODERATE,
          defaultLanguage: "English",
          customInstructions: "Keep the writing grounded, specific, and direct.",
        },
      },
      subscription: {
        create: {
          provider: SubscriptionProvider.PADDLE,
          planCode: PlanCode.PRO,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
      },
      customers: {
        create: {
          provider: SubscriptionProvider.PADDLE,
          providerCustomerId: "ctm_demo_humaniser",
          email: demoEmail,
          country: "US",
        },
      },
    },
    include: { profile: true },
  });

  const document = await prisma.document.create({
    data: {
      userId: user.id,
      title: "Quarterly partner email",
      sourceText:
        "Hi team, I hope this email finds you well. I wanted to reach out to provide an update regarding the quarterly rollout and let you know that we are currently in progress on the outstanding items. We are confident this initiative will drive meaningful value for everyone involved.",
      sourceType: SourceType.PASTED_TEXT,
      writingPreset: WritingPreset.EMAIL,
    },
  });

  await prisma.rewrite.create({
    data: {
      documentId: document.id,
      userId: user.id,
      tone: Tone.PROFESSIONAL,
      intensity: RewriteIntensity.MODERATE,
      instructionsSnapshot: user.profile?.customInstructions,
      rewrittenText:
        "Hi team, I wanted to share a quick update on the quarterly rollout. We are still working through the remaining items, and the project is moving in the right direction. We expect this work to create clear value for the teams involved.",
      changeSummary:
        "Tightened the opening, replaced vague filler, and made the progress update more concrete without changing the message.",
      modelName: "mock-humaniser-v1",
      tokensUsed: 328,
      latencyMs: 240,
    },
  });

  await prisma.usageEvent.create({
    data: {
      userId: user.id,
      eventType: UsageEventType.REWRITE_CREATED,
      inputWords: 38,
      outputWords: 35,
      planAtTime: PlanCode.PRO,
    },
  });

  await prisma.webhookEvent.create({
    data: {
      provider: SubscriptionProvider.PADDLE,
      eventId: "evt_demo_seed",
      eventType: "subscription.created",
      payloadJson: { source: "seed" },
      processedAt: new Date(),
      status: WebhookStatus.PROCESSED,
    },
  }).catch(() => undefined);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

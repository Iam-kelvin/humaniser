import { startOfMonth } from "date-fns";
import "server-only";

import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/plans";
import type { PlanCode, Tone, WritingPreset } from "@/lib/domain";

export async function resolveCurrentPlan(userId: string): Promise<PlanCode> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { planCode: true, status: true },
  });

  if (!subscription) {
    return "FREE";
  }

  return subscription.status === "ACTIVE" || subscription.status === "TRIALING" ? subscription.planCode : "FREE";
}

export async function getUsageSummary(userId: string, planCode: PlanCode) {
  const monthStart = startOfMonth(new Date());

  const usage = await prisma.usageEvent.aggregate({
    where: {
      userId,
      createdAt: { gte: monthStart },
    },
    _count: { id: true },
    _sum: { inputWords: true, outputWords: true },
  });

  const entitlements = getEntitlements(planCode);
  const rewritesUsed = usage._count.id;
  const inputWordsUsed = usage._sum.inputWords ?? 0;
  const outputWordsUsed = usage._sum.outputWords ?? 0;

  return {
    entitlements,
    rewritesUsed,
    inputWordsUsed,
    outputWordsUsed,
    rewritesRemaining: Math.max(entitlements.monthlyRewrites - rewritesUsed, 0),
    inputWordsRemaining: Math.max(entitlements.monthlyInputWords - inputWordsUsed, 0),
  };
}

export async function getDashboardData(userId: string) {
  const planCode = await resolveCurrentPlan(userId);
  const usage = await getUsageSummary(userId, planCode);

  const recentRewrites = await prisma.rewrite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          writingPreset: true,
          sourceText: true,
          sourceType: true,
        },
      },
    },
    take: 5,
  });

  return {
    planCode,
    usage,
    recentRewrites,
  };
}

export async function getHistory(userId: string, filters?: { preset?: WritingPreset; tone?: Tone }) {
  const planCode = await resolveCurrentPlan(userId);
  const entitlements = getEntitlements(planCode);

  return prisma.rewrite.findMany({
    where: {
      userId,
      ...(filters?.tone ? { tone: filters.tone } : {}),
      ...(filters?.preset ? { document: { writingPreset: filters.preset } } : {}),
    },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          sourceText: true,
          sourceType: true,
          writingPreset: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: entitlements.historyWindow === "basic" ? 10 : 50,
  });
}

export async function getRewriteForEditor(userId: string, rewriteId?: string | null) {
  if (!rewriteId) {
    return null;
  }

  const planCode = await resolveCurrentPlan(userId);
  const entitlements = getEntitlements(planCode);

  const rewrite = await prisma.rewrite.findFirst({
    where: { id: rewriteId, userId },
    include: {
      document: true,
    },
  });

  if (!rewrite) {
    return null;
  }

  if (entitlements.historyWindow === "full") {
    return rewrite;
  }

  const visibleIds = await prisma.rewrite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true },
  });

  return visibleIds.some((item) => item.id === rewrite.id) ? rewrite : null;
}

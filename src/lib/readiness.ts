import "server-only";

import { getEnv } from "@/lib/env";
import { isDatabaseConfigured } from "@/lib/database";

type ReadinessStatus = "ready" | "attention";

export type ReadinessCheck = {
  label: string;
  status: ReadinessStatus;
  detail: string;
};

export type AppReadiness = {
  launchStage: "internal" | "beta_ready";
  summary: string;
  checks: ReadinessCheck[];
};

export function getAppReadiness(): AppReadiness {
  const env = getEnv();
  const rewriteProvider = env.HUMANISER_REWRITE_PROVIDER ?? "mock";
  const hasClerk = Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() && env.CLERK_SECRET_KEY?.trim());
  const hasDatabase = isDatabaseConfigured();
  const hasOpenAI = rewriteProvider !== "openai" || Boolean(env.OPENAI_API_KEY?.trim());
  const hasPaddleCore = Boolean(
    env.PADDLE_API_KEY?.trim() &&
      env.PADDLE_WEBHOOK_SECRET?.trim() &&
      env.PADDLE_PRO_PRICE_ID?.trim() &&
      env.PADDLE_DEFAULT_CHECKOUT_URL?.trim(),
  );

  const checks: ReadinessCheck[] = [
    {
      label: "Authentication",
      status: hasClerk ? "ready" : "attention",
      detail: hasClerk ? "Clerk publishable and secret keys are configured." : "Add Clerk publishable and secret keys before onboarding external users.",
    },
    {
      label: "Database",
      status: hasDatabase ? "ready" : "attention",
      detail: hasDatabase ? "Database-backed dashboard flows are enabled." : "Set DATABASE_URL before inviting testers into the app.",
    },
    {
      label: "Rewrite provider",
      status: hasOpenAI ? "ready" : "attention",
      detail:
        rewriteProvider === "mock"
          ? "Mock rewrites are enabled for free development and internal testing."
          : hasOpenAI
            ? "OpenAI provider is selected and has an API key configured."
            : "OpenAI provider is selected but missing OPENAI_API_KEY, so rewrite quality testing is blocked.",
    },
    {
      label: "Billing",
      status: hasPaddleCore ? "ready" : "attention",
      detail: hasPaddleCore
        ? "Paddle checkout, webhook, and price configuration are present."
        : "Billing is still scaffolded. Finish Paddle env configuration before a paid beta.",
    },
  ];

  const blockers = checks.filter((check) => check.status === "attention");

  return blockers.length <= 1 && hasClerk && hasDatabase
    ? {
        launchStage: "beta_ready",
        summary: "Core app infrastructure is in place. Focus on real rewrite quality and end-to-end production testing for private beta.",
        checks,
      }
    : {
        launchStage: "internal",
        summary: "The app is healthy for internal testing, but a few launch blockers still need attention before private beta.",
        checks,
      };
}

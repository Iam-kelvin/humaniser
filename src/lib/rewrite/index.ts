import { getEnv } from "@/lib/env";
import { GroqRewriteProvider } from "@/lib/rewrite/groq-provider";
import { MockRewriteProvider } from "@/lib/rewrite/mock-provider";
import type { RewriteProvider } from "@/lib/rewrite/types";

export function getRewriteProvider(): RewriteProvider {
  const env = getEnv();
  const hasGroqKey = Boolean(env.GROQ_API_KEY?.trim());

  switch (env.HUMANISER_REWRITE_PROVIDER) {
    case "groq":
      return hasGroqKey ? new GroqRewriteProvider() : new MockRewriteProvider();
    case "mock":
    default:
      return new MockRewriteProvider();
  }
}

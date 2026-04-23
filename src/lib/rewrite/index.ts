import { getEnv } from "@/lib/env";
import { MockRewriteProvider } from "@/lib/rewrite/mock-provider";
import { OpenAIRewriteProvider } from "@/lib/rewrite/openai-provider";
import type { RewriteProvider } from "@/lib/rewrite/types";

export function getRewriteProvider(): RewriteProvider {
  const env = getEnv();
  const hasOpenAIKey = Boolean(env.OPENAI_API_KEY?.trim());

  switch (env.HUMANISER_REWRITE_PROVIDER) {
    case "openai":
      return hasOpenAIKey ? new OpenAIRewriteProvider() : new MockRewriteProvider();
    case "mock":
    default:
      return new MockRewriteProvider();
  }
}

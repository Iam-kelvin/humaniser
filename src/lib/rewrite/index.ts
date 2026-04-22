import { getEnv } from "@/lib/env";
import { MockRewriteProvider } from "@/lib/rewrite/mock-provider";
import type { RewriteProvider } from "@/lib/rewrite/types";

export function getRewriteProvider(): RewriteProvider {
  const env = getEnv();

  switch (env.HUMANISER_REWRITE_PROVIDER) {
    case "mock":
    default:
      return new MockRewriteProvider();
  }
}

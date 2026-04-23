import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { requireEnv, getEnv } from "@/lib/env";
import type { RewriteProvider, RewriteRequestInput, RewriteResult } from "@/lib/rewrite/types";

const rewriteResponseSchema = z.object({
  rewrittenText: z.string(),
  changeSummary: z.string(),
});

function buildLengthGuidance(input: RewriteRequestInput) {
  if (input.options.shorten) {
    return "Shorten the writing while keeping the intended meaning.";
  }

  if (input.options.expandSlightly) {
    return "Expand slightly only where it improves clarity or flow.";
  }

  if (input.options.keepLength) {
    return "Keep the overall length close to the original.";
  }

  return "Keep the rewrite reasonably close in length to the original unless clarity clearly benefits from a small change.";
}

function buildDeveloperInstructions(input: RewriteRequestInput) {
  const extraRules = [
    `Target preset: ${input.options.preset}.`,
    `Target tone: ${input.options.tone}.`,
    `Target rewrite intensity: ${input.options.intensity}.`,
    buildLengthGuidance(input),
    input.options.preserveTechnicalTerms ? "Preserve technical terms and specialized wording when possible." : "You may simplify wording, but do not change the intended meaning.",
    input.options.preserveKeywords.length > 0
      ? `Preserve these keywords exactly where natural: ${input.options.preserveKeywords.join(", ")}.`
      : "Do not introduce unrelated claims, facts, or credentials.",
    "If the input already has visible structure such as a letter header, salutation, body paragraphs, blank lines, or sign-off, preserve that structure.",
    "Keep salutation and sign-off formatting intact unless the source clearly needs a small grammar fix.",
    "Return only the schema fields requested.",
  ];

  if (input.options.customInstructions) {
    extraRules.push(`Additional guidance from the user: ${input.options.customInstructions}`);
  }

  return [
    "You rewrite text so it sounds more natural, clear, and audience-aware without changing the intended meaning.",
    ...extraRules,
  ].join(" ");
}

export class OpenAIRewriteProvider implements RewriteProvider {
  name = "openai";

  private client = new OpenAI({
    apiKey: requireEnv("OPENAI_API_KEY"),
  });

  async generateRewrite(input: RewriteRequestInput): Promise<RewriteResult> {
    const startedAt = Date.now();
    const env = getEnv();
    const model = env.OPENAI_MODEL ?? "gpt-5-mini";
    const response = await this.client.responses.parse({
      model,
      reasoning: { effort: env.OPENAI_REASONING_EFFORT ?? "low" },
      input: [
        {
          role: "developer",
          content: buildDeveloperInstructions(input),
        },
        {
          role: "user",
          content: input.sourceText,
        },
      ],
      text: {
        format: zodTextFormat(rewriteResponseSchema, "rewrite_response"),
      },
    });

    if (!response.output_parsed) {
      throw new Error("OpenAI did not return a parsed rewrite response.");
    }

    return {
      rewrittenText: response.output_parsed.rewrittenText.trim(),
      changeSummary: response.output_parsed.changeSummary.trim(),
      modelName: response.model,
      tokensUsed: response.usage?.total_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
      metadata: {
        detectedStructure: "plain",
        rewrittenParagraphs: 1,
        preservedElements: [],
      } satisfies NonNullable<RewriteResult["metadata"]>,
    };
  }
}

import { getEnv, requireEnv } from "@/lib/env";
import type { RewriteProvider, RewriteRequestInput, RewriteResult } from "@/lib/rewrite/types";

type GroqRewriteResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    total_tokens?: number;
  };
  model?: string;
};

function buildDocumentTypeGuidance(input: RewriteRequestInput) {
  switch (input.context?.documentType) {
    case "email":
      return "Write like a clear, natural email. Preserve the sender's intent, ask, and level of directness without sounding robotic or overly formal.";
    case "research_summary":
      return "Write like a precise research summary. Preserve factual accuracy, technical meaning, and cautious phrasing. Do not overstate conclusions.";
    case "cover_letter":
      return "Write like a strong but believable cover letter. Keep the first-person voice, preserve the applicant's real qualifications, and avoid exaggerated claims or generic filler.";
    case "general_writing":
    default:
      return "Write like polished everyday professional prose that sounds human and easy to follow.";
  }
}

function buildSectionGuidance(input: RewriteRequestInput) {
  if (input.context?.sectionRole !== "paragraph") {
    return "Rewrite only the provided text, without adding framing or commentary around it.";
  }

  const index = input.context.paragraphIndex ?? 1;
  const total = input.context.totalParagraphs ?? 1;
  const structure = input.context.structure ?? "plain";

  return [
    `You are rewriting body paragraph ${index} of ${total}.`,
    structure === "letter" || structure === "multi_paragraph"
      ? "Keep it as body paragraph prose only. Do not add a salutation, sign-off, title, or header."
      : "Keep it as a standalone paragraph only.",
    "Do not merge it with another paragraph or turn it into a full document.",
  ].join(" ");
}

function buildLengthGuidance(input: RewriteRequestInput) {
  if (input.options.shorten) {
    return "Shorten the writing while keeping the intended meaning.";
  }

  if (input.options.expandSlightly) {
    return "Expand slightly only where it improves clarity or flow. Keep the same coverage of ideas and do not summarize or compress the source.";
  }

  if (input.options.keepLength) {
    return "Keep the overall length close to the original. Do not summarize, compress, or drop supporting details.";
  }

  return "Keep the rewrite reasonably close in length to the original unless clarity clearly benefits from a small change. Do not collapse multiple ideas into a shorter summary.";
}

function buildSystemPrompt(input: RewriteRequestInput) {
  const rules = [
    "You rewrite text so it sounds more natural, clear, and audience-aware without changing the intended meaning.",
    `Target preset: ${input.options.preset}.`,
    `Target tone: ${input.options.tone}.`,
    `Target rewrite intensity: ${input.options.intensity}.`,
    buildDocumentTypeGuidance(input),
    buildSectionGuidance(input),
    buildLengthGuidance(input),
    input.options.preserveTechnicalTerms ? "Preserve technical terms and specialized wording when possible." : "You may simplify wording, but do not change the intended meaning.",
    input.options.preserveKeywords.length > 0
      ? `Preserve these keywords exactly where natural: ${input.options.preserveKeywords.join(", ")}.`
      : "Do not introduce unrelated claims, facts, or credentials.",
    "Never add greetings, gratitude, sign-offs, qualifications, or facts that are not already supported by the source.",
    "Never add assistant-like phrases, meta commentary, or explanations inside the rewritten text.",
    "Avoid repetitive intensifiers, repeated words, and generic filler such as 'I am excited', 'I am confident', or 'Thank you for your time' unless the source already clearly contains them and they still fit naturally.",
    "If the input already has visible structure such as a letter header, salutation, body paragraphs, blank lines, or sign-off, preserve that structure.",
    "Keep salutation and sign-off formatting intact unless the source clearly needs a small grammar fix.",
    'Return valid JSON only in this exact shape: {"rewrittenText":"...","changeSummary":"..."}',
    "Make changeSummary short and specific. Describe the writing changes plainly in one sentence.",
  ];

  if (input.options.customInstructions) {
    rules.push(`Additional guidance from the user: ${input.options.customInstructions}`);
  }

  return rules.join(" ");
}

function extractJson(text: string) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("Groq did not return a JSON rewrite response.");
}

function parseRewritePayload(text: string) {
  const parsed = JSON.parse(extractJson(text)) as {
    rewrittenText?: unknown;
    changeSummary?: unknown;
  };

  if (typeof parsed.rewrittenText !== "string" || typeof parsed.changeSummary !== "string") {
    throw new Error("Groq returned an invalid rewrite payload.");
  }

  return {
    rewrittenText: parsed.rewrittenText.trim(),
    changeSummary: parsed.changeSummary.trim(),
  };
}

function cleanupArtifacts(text: string) {
  return text
    .replace(/\[([^\]]+)\]\(mailto:[^)]+\)/gi, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi, "$2")
    .replace(/\b(\w+)\s+\1\b/gi, "$1")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([,.!?;:])([A-Za-z])/g, "$1 $2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function requestGroqRewrite(
  input: RewriteRequestInput,
  model: string,
  additionalSystemMessage?: string,
) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireEnv("GROQ_API_KEY")}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: additionalSystemMessage
            ? `${buildSystemPrompt(input)} ${additionalSystemMessage}`
            : buildSystemPrompt(input),
        },
        {
          role: "user",
          content: input.sourceText,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq request failed: ${response.status} ${body}`.slice(0, 400));
  }

  return (await response.json()) as GroqRewriteResponse;
}

export class GroqRewriteProvider implements RewriteProvider {
  name = "groq";

  async generateRewrite(input: RewriteRequestInput): Promise<RewriteResult> {
    const startedAt = Date.now();
    const env = getEnv();
    const model = env.GROQ_MODEL ?? "llama-3.1-8b-instant";
    let payload = await requestGroqRewrite(input, model);
    let content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Groq did not return rewrite content.");
    }

    let parsed = parseRewritePayload(content);
    const sourceWords = wordCount(input.sourceText);
    const rewrittenWords = wordCount(parsed.rewrittenText);
    const needsLengthRetry =
      !input.options.shorten &&
      sourceWords >= 80 &&
      ((input.options.expandSlightly && rewrittenWords < sourceWords * 0.98) ||
        (input.options.keepLength && rewrittenWords < sourceWords * 0.9));

    if (needsLengthRetry) {
      payload = await requestGroqRewrite(
        input,
        model,
        "Your first attempt was too compressed. Rewrite again while preserving the full set of ideas, examples, and supporting detail from the source. Keep the output at least as long as the source when asked to expand slightly, and close in length to the source when asked to keep length.",
      );
      content = payload.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Groq did not return rewrite content.");
      }

      parsed = parseRewritePayload(content);
    }

    return {
      rewrittenText: cleanupArtifacts(parsed.rewrittenText),
      changeSummary: parsed.changeSummary,
      modelName: payload.model ?? model,
      tokensUsed: payload.usage?.total_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
      metadata: {
        detectedStructure: "plain",
        rewrittenParagraphs: 1,
        preservedElements: [],
      } satisfies NonNullable<RewriteResult["metadata"]>,
    };
  }
}

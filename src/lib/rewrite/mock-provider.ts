import { TONE_LABELS, PRESET_LABELS } from "@/lib/domain";
import { countWords, sleep } from "@/lib/utils";
import type { RewriteProvider, RewriteRequestInput } from "@/lib/rewrite/types";

function replacePhrase(text: string, original: string, replacement: string) {
  return text.replace(new RegExp(original, "gi"), replacement);
}

function reshape(text: string, input: RewriteRequestInput) {
  let output = text.replace(/\s+/g, " ").trim();

  output = replacePhrase(output, "i hope this email finds you well\\.?\\s*", "");
  output = replacePhrase(output, "i wanted to reach out to", "I wanted to");
  output = replacePhrase(output, "in order to", "to");
  output = replacePhrase(output, "currently", "");
  output = replacePhrase(output, "meaningful value", "clear value");
  output = replacePhrase(output, "let you know that", "share that");

  if (input.options.tone === "WARM") {
    output = `Thanks for sharing this draft. ${output}`;
  }

  if (input.options.tone === "PROFESSIONAL") {
    output = output.replace(/\bkind of\b/gi, "somewhat");
  }

  if (input.options.tone === "CONFIDENT") {
    output = output.replace(/\bwe hope to\b/gi, "we will");
    output = output.replace(/\bwe think\b/gi, "we believe");
  }

  if (input.options.tone === "CONCISE") {
    output = output
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.replace(/\bthat\b/gi, "").replace(/\s{2,}/g, " ").trim())
      .join(" ");
  }

  if (input.options.intensity === "STRONG") {
    output = output
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .join(" ");
  }

  if (input.options.shorten) {
    const sentences = output.split(/(?<=[.!?])\s+/).slice(0, 3);
    output = sentences.join(" ");
  } else if (input.options.expandSlightly) {
    output = `${output} It keeps the original point while making the writing easier to follow.`;
  }

  if (input.options.keepLength) {
    const sourceCount = countWords(text);
    const outputWords = output.split(/\s+/);

    if (outputWords.length > sourceCount + 5) {
      output = outputWords.slice(0, sourceCount + 5).join(" ");
    }
  }

  return output.replace(/\s{2,}/g, " ").trim();
}

export class MockRewriteProvider implements RewriteProvider {
  name = "mock";

  async generateRewrite(input: RewriteRequestInput) {
    const start = Date.now();
    await sleep(150);

    const rewrittenText = reshape(input.sourceText, input);
    const summaryParts = [
      `Adjusted for ${TONE_LABELS[input.options.tone].toLowerCase()} tone.`,
      `Applied a ${input.options.intensity.toLowerCase()} rewrite for ${PRESET_LABELS[input.options.preset].toLowerCase()} writing.`,
    ];

    if (input.options.preserveTechnicalTerms) {
      summaryParts.push("Kept technical phrasing stable where possible.");
    }

    if (input.options.preserveKeywords.length > 0) {
      summaryParts.push(`Preserved keywords: ${input.options.preserveKeywords.join(", ")}.`);
    }

    return {
      rewrittenText,
      changeSummary: summaryParts.join(" "),
      modelName: "mock-humaniser-v1",
      tokensUsed: Math.max(140, countWords(input.sourceText) * 4),
      latencyMs: Date.now() - start,
    };
  }
}

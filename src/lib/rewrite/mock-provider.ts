import { TONE_LABELS, PRESET_LABELS } from "@/lib/domain";
import { countWords, sleep } from "@/lib/utils";
import type { RewriteProvider, RewriteRequestInput, RewriteResult } from "@/lib/rewrite/types";

function replacePhrase(text: string, original: string, replacement: string) {
  return text.replace(new RegExp(original, "gi"), replacement);
}

function toContractions(text: string) {
  return text
    .replace(/\bI am\b/g, "I'm")
    .replace(/\bI have\b/g, "I've")
    .replace(/\bI would\b/g, "I'd")
    .replace(/\bI will\b/g, "I'll")
    .replace(/\bWe are\b/g, "We're")
    .replace(/\bWe will\b/g, "We'll")
    .replace(/\bThat is\b/g, "That's")
    .replace(/\bit is\b/g, "it's");
}

function sentenceCase(text: string) {
  return text.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix, char) => `${prefix}${char.toUpperCase()}`);
}

function humaniseSentence(sentence: string, input: RewriteRequestInput) {
  let output = sentence.trim();

  output = replacePhrase(output, "^dear hiring manager,?\\s*i am excited to apply for", "Dear Hiring Manager, I'm applying for");
  output = replacePhrase(output, "\\bi am excited to apply for\\b", "I'm applying for");
  output = replacePhrase(output, "\\bwith experience in\\b", "With experience across");
  output = replacePhrase(output, "\\bi am confident in my ability to\\b", "I can");
  output = replacePhrase(output, "\\bi understand that this role requires\\b", "I understand this role calls for");
  output = replacePhrase(output, "\\bi am comfortable working independently\\b", "I work well independently");
  output = replacePhrase(output, "\\bensuring that tasks are completed accurately and on time\\b", "making sure work is accurate and on schedule");
  output = replacePhrase(output, "\\bthese strengths have helped me build\\b", "This experience has given me");
  output = replacePhrase(output, "\\bi would welcome the opportunity to\\b", "I'd value the opportunity to");
  output = replacePhrase(output, "\\bthank you for your time and consideration\\b", "Thank you for your time and consideration");
  output = replacePhrase(output, "\\bin order to\\b", "to");
  output = replacePhrase(output, "\\bthat involve reviewing\\b", "that involves reviewing");
  output = replacePhrase(output, "\\bclarify details when needed\\b", "clarify details when needed");

  if (input.options.tone === "PROFESSIONAL") {
    output = replacePhrase(output, "\\bi can\\b", "I can confidently");
    output = replacePhrase(output, "\\bi'd value the opportunity to\\b", "I would value the opportunity to");
  }

  if (input.options.tone === "WARM") {
    output = replacePhrase(output, "^Dear Hiring Manager,", "Dear Hiring Manager,");
    output = replacePhrase(output, "\\bThank you for your time and consideration\\b", "Thank you for taking the time to review my application");
  }

  if (input.options.tone === "CONFIDENT") {
    output = replacePhrase(output, "\\bi can\\b", "I can readily");
    output = replacePhrase(output, "\\bi work well independently\\b", "I work effectively independently");
  }

  if (input.options.tone === "CONCISE") {
    output = output
      .replace(/\bcareful attention to detail and consistency\b/gi, "accuracy and consistency")
      .replace(/\bstrong focus, organization, and the ability to maintain accuracy while handling multiple tasks\b/gi, "focus, organization, and accuracy across multiple tasks");
  }

  output = output.replace(/\s{2,}/g, " ").trim();
  return sentenceCase(output);
}

function ensureVisibleDifference(source: string, rewritten: string, input: RewriteRequestInput) {
  const normalizedSource = source.replace(/\s+/g, " ").trim();
  const normalizedRewrite = rewritten.replace(/\s+/g, " ").trim();

  if (normalizedSource.toLowerCase() !== normalizedRewrite.toLowerCase()) {
    return rewritten;
  }

  const sentences = normalizedSource.split(/(?<=[.!?])\s+/).filter(Boolean);
  const rebuilt = sentences
    .map((sentence, index) => {
      const next = humaniseSentence(sentence, input);

      if (index === 0 && input.options.preset === "EMAIL" && !/^Dear /i.test(next)) {
        return `I'm writing to share a clearer version of this note. ${next}`;
      }

      return next;
    })
    .join(" ");

  return rebuilt.replace(/\s{2,}/g, " ").trim();
}

function reshape(text: string, input: RewriteRequestInput) {
  let output = text.replace(/\s+/g, " ").trim();

  output = replacePhrase(output, "i hope this email finds you well\\.?\\s*", "");
  output = replacePhrase(output, "i wanted to reach out to", "I wanted to");
  output = replacePhrase(output, "in order to", "to");
  output = replacePhrase(output, "currently", "");
  output = replacePhrase(output, "meaningful value", "clear value");
  output = replacePhrase(output, "let you know that", "share that");

  output = output
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => humaniseSentence(sentence, input))
    .filter(Boolean)
    .join(" ");

  if (input.options.tone === "WARM" && !/^Thanks for sharing this draft\./.test(output)) {
    output = `Thanks for sharing this draft. ${output}`;
  }

  if (input.options.tone !== "PROFESSIONAL") {
    output = toContractions(output);
  }

  if (input.options.intensity === "STRONG") {
    output = output
      .split(/(?<=[.!?])\s+/)
      .map((sentence) =>
        sentence
          .replace(/\bI am\b/gi, "I'm")
          .replace(/\bI have\b/gi, "I've")
          .replace(/\bI would\b/gi, "I'd")
          .trim(),
      )
      .filter(Boolean)
      .join(" ");
  } else if (input.options.intensity === "MODERATE") {
    output = output.replace(/\bI am\b/gi, "I'm");
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

  return ensureVisibleDifference(text, output.replace(/\s{2,}/g, " ").trim(), input);
}

export class MockRewriteProvider implements RewriteProvider {
  name = "mock";

  async generateRewrite(input: RewriteRequestInput): Promise<RewriteResult> {
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
      metadata: {
        detectedStructure: "plain",
        rewrittenParagraphs: 1,
        preservedElements: [],
      } satisfies NonNullable<RewriteResult["metadata"]>,
    };
  }
}

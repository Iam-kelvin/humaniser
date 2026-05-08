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

function cleanupArtifacts(text: string) {
  return text
    .replace(/\b(\w+)\s+\1\b/gi, "$1")
    .replace(/\bI can confidently support\b/gi, "I can support")
    .replace(/\bI can confidently follow\b/gi, "I can follow")
    .replace(/\bI work effectively independently\b/gi, "I work independently")
    .replace(/\bI recognize this role calls for\b/gi, "I understand this role calls for")
    .replace(/\bI understand this role calls for strong focus, organization, and the ability to maintain accuracy while handling multiple tasks\b/gi, "I understand this role requires focus, organization, and accuracy across multiple tasks")
    .replace(/\bWith experience across\b/gi, "With experience in")
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function splitSentences(text: string) {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}

function mergeShortSentences(text: string) {
  const sentences = splitSentences(text);
  const merged: string[] = [];

  for (const sentence of sentences) {
    if (merged.length > 0 && sentence.split(/\s+/).length <= 7) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${sentence}`.trim();
      continue;
    }

    merged.push(sentence);
  }

  return merged.join(" ");
}

function applyPresetAdjustments(text: string, input: RewriteRequestInput) {
  let output = text;

  if (input.options.preset === "EMAIL") {
    output = output
      .replace(/\bI am writing to\b/gi, "I'm writing to")
      .replace(/\bI wanted to let you know\b/gi, "I'm reaching out to share")
      .replace(/\bPlease let me know if you have any questions\b/gi, "Please let me know if you'd like any clarification");
  }

  if (input.options.preset === "RESEARCH_SUMMARY") {
    output = output
      .replace(/\bI found that\b/gi, "The draft shows that")
      .replace(/\bthis shows that\b/gi, "This suggests that")
      .replace(/\bin conclusion\b/gi, "Overall");
  }

  if (input.options.preset === "GENERAL_WRITING") {
    output = output
      .replace(/\bI am excited to apply for\b/gi, "I'm applying for")
      .replace(/\bI would value the opportunity to\b/gi, "I would welcome the opportunity to");
  }

  return output;
}

function applyLengthStrategy(text: string, input: RewriteRequestInput) {
  let output = text;

  if (input.options.shorten) {
    const sentences = splitSentences(output).slice(0, 3);
    return sentences.join(" ");
  }

  if (input.options.expandSlightly && countWords(output) < countWords(input.sourceText)) {
    output = output
      .replace(/\bI can support\b/g, "I can confidently support")
      .replace(/\bI work well\b/g, "I work effectively")
      .replace(/\bI understand\b/g, "I recognize");
  }

  return output;
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
    output = replacePhrase(output, "\\bi can support\\b", "I can support");
    output = replacePhrase(output, "\\bi can follow\\b", "I can follow");
    output = replacePhrase(output, "\\bi'd value the opportunity to\\b", "I would value the opportunity to");
  }

  if (input.options.tone === "WARM") {
    output = replacePhrase(output, "^Dear Hiring Manager,", "Dear Hiring Manager,");
    output = replacePhrase(output, "\\bThank you for your time and consideration\\b", "Thank you for taking the time to review my application");
  }

  if (input.options.tone === "CONFIDENT") {
    output = replacePhrase(output, "\\bi can support\\b", "I can confidently support");
    output = replacePhrase(output, "\\bi can follow\\b", "I can confidently follow");
    output = replacePhrase(output, "\\bi work well independently\\b", "I work effectively independently");
  }

  if (input.options.tone === "CONCISE") {
    output = output
      .replace(/\bcareful attention to detail and consistency\b/gi, "accuracy and consistency")
      .replace(/\bstrong focus, organization, and the ability to maintain accuracy while handling multiple tasks\b/gi, "focus, organization, and accuracy across multiple tasks");
  }

  return sentenceCase(cleanupArtifacts(output));
}

function ensureVisibleDifference(source: string, rewritten: string, input: RewriteRequestInput) {
  const normalizedSource = source.replace(/\s+/g, " ").trim();
  const normalizedRewrite = rewritten.replace(/\s+/g, " ").trim();

  if (normalizedSource.toLowerCase() !== normalizedRewrite.toLowerCase()) {
    return rewritten;
  }

  const sentences = normalizedSource.split(/(?<=[.!?])\s+/).filter(Boolean);
  const rebuilt = sentences
    .map((sentence) => humaniseSentence(sentence, input))
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

  output = splitSentences(output)
    .map((sentence) => humaniseSentence(sentence, input))
    .filter(Boolean)
    .join(" ");

  output = applyPresetAdjustments(output, input);

  if (input.options.tone !== "PROFESSIONAL") {
    output = toContractions(output);
  }

  if (input.options.intensity === "STRONG") {
    output = splitSentences(output)
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

  output = applyLengthStrategy(output, input);

  if (input.options.keepLength) {
    const sourceCount = countWords(text);
    const outputWords = output.split(/\s+/);

    if (outputWords.length > sourceCount + 5) {
      output = outputWords.slice(0, sourceCount + 5).join(" ");
    }
  }

  output = mergeShortSentences(cleanupArtifacts(output));

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

import { countWords } from "@/lib/utils";
import type { RewriteProvider, RewriteRequestInput, RewriteResult } from "@/lib/rewrite/types";

const SALUTATION_PATTERN = /^(dear\b|hello\b|hi\b|greetings\b|to whom it may concern\b)/i;
const CLOSING_PATTERN = /^(sincerely|best regards|kind regards|regards|yours sincerely|yours faithfully|warm regards)\b/i;
const CONTACT_PATTERN = /(@|https?:\/\/|\+?\d[\d\s\-()]{6,}|\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b)/i;
const PARAGRAPH_START_PATTERN =
  /^(in my previous work|i understand|more so|moreso|thank you for|i would|i will be|additionally|furthermore|finally|beyond that)\b/i;

export type DocumentSection =
  | { type: "header"; lines: string[] }
  | { type: "title"; text: string }
  | { type: "salutation"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "closing"; lines: string[] };

export type StructuredDocument = {
  isLetterLike: boolean;
  sections: DocumentSection[];
};

export type StructuredCompareSection = {
  key: string;
  title: string;
  preserved: boolean;
  sourceText: string;
  rewrittenText: string;
};

function sectionContent(section: DocumentSection) {
  if (section.type === "header") {
    const lines = section.lines.length === 1 && looksLikeCompactHeaderBlock(section.lines[0] ?? "") ? expandCompactHeaderLines(section.lines[0] ?? "") : section.lines;
    return lines.join("\n");
  }

  if (section.type === "closing") {
    return section.lines.join("\n");
  }

  return section.text;
}

function normalizeLineEndings(text: string) {
  return text.replace(/\r\n/g, "\n");
}

function trimEmptyEdges(lines: string[]) {
  let start = 0;
  let end = lines.length;

  while (start < end && !lines[start]?.trim()) {
    start += 1;
  }

  while (end > start && !lines[end - 1]?.trim()) {
    end -= 1;
  }

  return lines.slice(start, end);
}

function splitParagraphBlocks(text: string) {
  return normalizeLineEndings(text)
    .split(/\n{2,}/)
    .flatMap((block) => splitImplicitParagraphs(block.trim()))
    .filter(Boolean);
}

function splitLineBlocks(lines: string[]) {
  const blocks: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      if (current.length > 0) {
        blocks.push(current.join("\n").trim());
        current = [];
      }

      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    blocks.push(current.join("\n").trim());
  }

  return blocks;
}

function splitClosingBlock(block: string) {
  const normalized = normalizeLineEndings(block).trim();
  const lineMatch = normalized.match(/\n(sincerely|best regards|kind regards|regards|yours sincerely|yours faithfully|warm regards)\b/i);

  if (lineMatch && typeof lineMatch.index === "number") {
    return [
      normalized.slice(0, lineMatch.index).trim(),
      normalized.slice(lineMatch.index + 1).trim(),
    ].filter(Boolean);
  }

  const inlineMatch = normalized.match(/(?<=[.!?])\s+(sincerely|best regards|kind regards|regards|yours sincerely|yours faithfully|warm regards)\b/i);

  if (inlineMatch && typeof inlineMatch.index === "number") {
    return [
      normalized.slice(0, inlineMatch.index).trim(),
      normalized.slice(inlineMatch.index).trim(),
    ].filter(Boolean);
  }

  const compactClosingMatch = normalized.match(/(sincerely|best regards|kind regards|regards|yours sincerely|yours faithfully|warm regards),\s*([A-Z][^\n]+)$/i);

  if (compactClosingMatch && typeof compactClosingMatch.index === "number") {
    const closingText = `${compactClosingMatch[1]},\n${compactClosingMatch[2].trim()}`;
    const beforeClosing = normalized.slice(0, compactClosingMatch.index).trim();

    return [beforeClosing, closingText].filter(Boolean);
  }

  return [normalized];
}

function splitLongParagraphBlock(block: string) {
  const normalized = block.trim();

  if (!normalized || normalized.includes("\n")) {
    return [normalized];
  }

  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);

  if (sentences.length < 4) {
    return [normalized];
  }

  const paragraphs: string[] = [];
  let current: string[] = [];

  for (const sentence of sentences) {
    if (current.length > 0 && PARAGRAPH_START_PATTERN.test(sentence)) {
      paragraphs.push(current.join(" ").trim());
      current = [sentence];
      continue;
    }

    current.push(sentence);
  }

  if (current.length > 0) {
    paragraphs.push(current.join(" ").trim());
  }

  return paragraphs.length > 1 ? paragraphs : [normalized];
}

function splitImplicitParagraphs(block: string) {
  return splitClosingBlock(block).flatMap((part) => splitLongParagraphBlock(part));
}

function looksLikeHeaderBlock(lines: string[]) {
  if (lines.length < 2 || lines.length > 6) {
    return false;
  }

  const shortLineCount = lines.filter((line) => line.trim().length <= 60).length;
  const hasContactLine = lines.some((line) => CONTACT_PATTERN.test(line) || /\b\d{4}\b/.test(line));
  return shortLineCount === lines.length && (hasContactLine || lines.length >= 3);
}

function looksLikeCompactHeaderBlock(block: string) {
  const normalized = block.trim();

  if (!normalized || normalized.includes("\n")) {
    return false;
  }

  return CONTACT_PATTERN.test(normalized) && !/[.!?]/.test(normalized) && normalized.length <= 140;
}

function looksLikePreservedLetterBlock(block: string) {
  const normalized = block.trim();

  if (!normalized) {
    return false;
  }

  if (looksLikeCompactHeaderBlock(normalized)) {
    return true;
  }

  const lines = trimEmptyEdges(normalizeLineEndings(normalized).split("\n"));

  if (lines.length >= 2 && lines.length <= 8) {
    return true;
  }

  return (
    normalized.length <= 180 &&
    !/(?<=[a-z])[.!?]\s+[A-Z]/.test(normalized) &&
    (CONTACT_PATTERN.test(normalized) || /,/.test(normalized))
  );
}

function expandCompactHeaderLines(block: string) {
  const normalized = block.replace(/\s+/g, " ").trim();
  const emailMatch = normalized.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);

  if (!emailMatch || typeof emailMatch.index !== "number") {
    return [normalized];
  }

  const beforeEmail = normalized
    .slice(0, emailMatch.index)
    .replace(/([a-z])([A-Z])/g, "$1\n$2")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const emailLine = emailMatch[0].trim();
  const afterEmail = normalized
    .slice(emailMatch.index + emailMatch[0].length)
    .replace(/([a-z])([A-Z])/g, "$1\n$2")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return [...beforeEmail, emailLine, ...afterEmail];
}

function toHeaderLines(text: string) {
  if (looksLikeCompactHeaderBlock(text)) {
    return expandCompactHeaderLines(text);
  }

  return trimEmptyEdges(normalizeLineEndings(text).split("\n"));
}

function looksLikeTitleBlock(block: string) {
  const lines = trimEmptyEdges(normalizeLineEndings(block).split("\n"));

  if (lines.length === 0 || lines.length > 3) {
    return false;
  }

  const joined = lines.join(" ").trim();
  const lettersOnly = joined.replace(/[^A-Za-z]/g, "");

  if (!lettersOnly) {
    return false;
  }

  const uppercaseRatio = lettersOnly.replace(/[a-z]/g, "").length / lettersOnly.length;
  return uppercaseRatio > 0.7 || /^application\b/i.test(joined) || /^subject\b/i.test(joined);
}

function looksLikeStandaloneTitleLine(line: string) {
  const trimmed = line.trim();

  if (!trimmed) {
    return false;
  }

  return looksLikeTitleBlock(trimmed) || /^\d+(\.\d+)*\s+\S+/.test(trimmed);
}

function splitSalutationBlock(block: string) {
  const lines = trimEmptyEdges(normalizeLineEndings(block).split("\n"));

  if (lines.length <= 1) {
    return {
      salutation: block.trim(),
      remainder: null,
    };
  }

  return {
    salutation: lines[0]?.trim() ?? block.trim(),
    remainder: lines.slice(1).join("\n").trim() || null,
  };
}

function splitTitleLeadingBlock(block: string) {
  const lines = trimEmptyEdges(normalizeLineEndings(block).split("\n"));

  if (lines.length <= 1) {
    return {
      title: block.trim(),
      remainder: null,
    };
  }

  return {
    title: lines[0]?.trim() ?? block.trim(),
    remainder: lines.slice(1).join("\n").trim() || null,
  };
}

function promoteLeadingLetterSections(sections: DocumentSection[]) {
  const salutationIndex = sections.findIndex((section) => section.type === "salutation");

  if (salutationIndex <= 0) {
    return sections;
  }

  return sections.map((section, index) => {
    if (index >= salutationIndex || section.type !== "paragraph") {
      return section;
    }

    if (!looksLikePreservedLetterBlock(section.text)) {
      return section;
    }

    return {
      type: "header" as const,
      lines: toHeaderLines(section.text),
    };
  });
}

function segmentLineBasedLetter(sourceText: string): StructuredDocument | null {
  const lines = trimEmptyEdges(normalizeLineEndings(sourceText).split("\n"));
  const salutationIndex = lines.findIndex((line) => SALUTATION_PATTERN.test(line.trim()));

  if (salutationIndex < 0) {
    return null;
  }

  const leadingLines = trimEmptyEdges(lines.slice(0, salutationIndex));
  const salutationLine = lines[salutationIndex]?.trim();
  const trailingLines = lines.slice(salutationIndex + 1);
  const sections: DocumentSection[] = [];

  if (leadingLines.length > 0) {
    sections.push({
      type: "header",
      lines: leadingLines,
    });
  }

  if (salutationLine) {
    sections.push({
      type: "salutation",
      text: salutationLine,
    });
  }

  const trailingBlocks = splitLineBlocks(trailingLines)
    .flatMap((block) => splitImplicitParagraphs(block))
    .filter(Boolean);

  trailingBlocks.forEach((block) => {
    const blockLines = trimEmptyEdges(normalizeLineEndings(block).split("\n"));
    const firstLine = blockLines[0]?.trim() ?? "";

    if (CLOSING_PATTERN.test(firstLine)) {
      sections.push({
        type: "closing",
        lines: blockLines,
      });
      return;
    }

    sections.push({
      type: "paragraph",
      text: block,
    });
  });

  return {
    isLetterLike: sections.some((section) => section.type === "paragraph"),
    sections,
  };
}

function segmentLineBasedTitleDocument(sourceText: string): StructuredDocument | null {
  const lines = trimEmptyEdges(normalizeLineEndings(sourceText).split("\n"));
  const firstLine = lines[0]?.trim() ?? "";

  if (!looksLikeStandaloneTitleLine(firstLine) || lines.length < 2) {
    return null;
  }

  const remainderBlocks = splitLineBlocks(lines.slice(1))
    .flatMap((block) => splitImplicitParagraphs(block))
    .filter(Boolean);

  if (remainderBlocks.length === 0) {
    return null;
  }

  return {
    isLetterLike: false,
    sections: [
      {
        type: "title",
        text: firstLine,
      },
      ...remainderBlocks.map((block) => ({
        type: "paragraph" as const,
        text: block,
      })),
    ],
  };
}

export function segmentStructuredDocument(sourceText: string): StructuredDocument {
  const lineBasedLetter = segmentLineBasedLetter(sourceText);

  if (lineBasedLetter) {
    return lineBasedLetter;
  }

  const lineBasedTitle = segmentLineBasedTitleDocument(sourceText);

  if (lineBasedTitle) {
    return lineBasedTitle;
  }

  const blocks = splitParagraphBlocks(sourceText);

  if (blocks.length === 0) {
    return {
      isLetterLike: false,
      sections: [],
    };
  }

  const sections: DocumentSection[] = [];
  let hasHeader = false;
  let hasTitle = false;
  let hasSalutation = false;
  let hasClosing = false;
  let seenBody = false;

  for (const block of blocks) {
    const lines = trimEmptyEdges(normalizeLineEndings(block).split("\n"));
    const firstLine = lines[0]?.trim() ?? "";

    if (!seenBody && (looksLikeHeaderBlock(lines) || looksLikeCompactHeaderBlock(block))) {
      hasHeader = true;
      sections.push({
        type: "header",
        lines: looksLikeCompactHeaderBlock(block) ? expandCompactHeaderLines(block) : lines,
      });
      continue;
    }

    if (!seenBody && looksLikeTitleBlock(block)) {
      hasTitle = true;
      const titleBlock = splitTitleLeadingBlock(block);

      sections.push({
        type: "title",
        text: titleBlock.title,
      });

      if (titleBlock.remainder) {
        seenBody = true;
        sections.push({
          type: "paragraph",
          text: titleBlock.remainder,
        });
      }
      continue;
    }

    if (!seenBody && SALUTATION_PATTERN.test(firstLine)) {
      hasSalutation = true;
      const salutationBlock = splitSalutationBlock(block);

      sections.push({
        type: "salutation",
        text: salutationBlock.salutation,
      });

      if (salutationBlock.remainder) {
        seenBody = true;
        sections.push({
          type: "paragraph",
          text: salutationBlock.remainder,
        });
      }

      continue;
    }

    if (CLOSING_PATTERN.test(firstLine)) {
      hasClosing = true;
      sections.push({
        type: "closing",
        lines,
      });
      continue;
    }

    seenBody = true;
    sections.push({
      type: "paragraph",
      text: block,
    });
  }

  const isLetterLike = (hasHeader || hasTitle || hasSalutation || hasClosing) && sections.some((section) => section.type === "paragraph");
  const normalizedSections =
    sections[0]?.type === "paragraph" &&
    sections[1]?.type === "salutation" &&
    looksLikeCompactHeaderBlock(sections[0].text)
      ? [
          {
            type: "header" as const,
            lines: expandCompactHeaderLines(sections[0].text),
          },
          ...sections.slice(1),
        ]
      : sections;
  const forceLeadingHeaderSections =
    normalizedSections[0]?.type === "paragraph" &&
    normalizedSections[1]?.type === "salutation" &&
    CONTACT_PATTERN.test(normalizedSections[0].text)
      ? [
          {
            type: "header" as const,
            lines: expandCompactHeaderLines(normalizedSections[0].text),
          },
          ...normalizedSections.slice(1),
        ]
      : normalizedSections;
  const promotedLetterSections = promoteLeadingLetterSections(forceLeadingHeaderSections);

  return {
    isLetterLike,
    sections:
      isLetterLike ||
      promotedLetterSections.filter((section) => section.type === "paragraph").length > 1
        ? promotedLetterSections
        : promotedLetterSections.map((section) =>
            section.type === "paragraph"
              ? section
              : {
                  type: "paragraph",
                  text:
                    section.type === "header" || section.type === "closing"
                      ? section.lines.join("\n")
                      : section.text,
                },
          ),
  };
}

function normalizeParagraphOutput(text: string) {
  return normalizeLineEndings(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
}

function inferDocumentType(input: RewriteRequestInput, structured: StructuredDocument) {
  const lowerSource = input.sourceText.toLowerCase();
  const looksLikeCoverLetter =
    structured.isLetterLike &&
    /dear\s+(hiring manager|sir|madam|recruiter|team)/i.test(input.sourceText) &&
    /(apply|application|position|role|opportunity|experience|skills)/i.test(lowerSource);

  if (looksLikeCoverLetter) {
    return "cover_letter" as const;
  }

  if (input.options.preset === "EMAIL") {
    return "email" as const;
  }

  if (input.options.preset === "RESEARCH_SUMMARY") {
    return "research_summary" as const;
  }

  return "general_writing" as const;
}

function stripParagraphBoundaryArtifacts(text: string) {
  const normalized = normalizeLineEndings(text).trim();
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const withoutLeadingSalutation =
    lines.length > 1 && SALUTATION_PATTERN.test(lines[0] ?? "") ? lines.slice(1) : lines;
  const withoutTrailingClosing = withoutLeadingSalutation.filter((line, index, all) => {
    if (!CLOSING_PATTERN.test(line)) {
      return true;
    }

    return all.length === 1 && index === 0;
  });

  return withoutTrailingClosing.join(" ").trim() || normalized;
}

export async function generateStructuredRewrite(
  provider: RewriteProvider,
  input: RewriteRequestInput,
): Promise<RewriteResult> {
  const structured = segmentStructuredDocument(input.sourceText);
  const paragraphSections = structured.sections.filter((section) => section.type === "paragraph");
  const detectedStructure = structured.isLetterLike ? "letter" : paragraphSections.length > 1 ? "multi_paragraph" : "plain";
  const documentType = inferDocumentType(input, structured);

  if (paragraphSections.length <= 1 && !structured.isLetterLike) {
    return provider.generateRewrite({
      ...input,
      context: {
        documentType,
        structure: detectedStructure,
        sectionRole: "full_document",
      },
    });
  }

  const rewrittenParagraphs = await Promise.all(
    paragraphSections.map((section, index) =>
      provider.generateRewrite({
        ...input,
        sourceText: section.text,
        context: {
          documentType,
          structure: detectedStructure,
          sectionRole: "paragraph",
          paragraphIndex: index + 1,
          totalParagraphs: paragraphSections.length,
        },
      }),
    ),
  );

  let paragraphIndex = 0;
  const rewrittenSections = structured.sections.map((section) => {
    if (section.type === "paragraph") {
      const current = rewrittenParagraphs[paragraphIndex];
      paragraphIndex += 1;
      return normalizeParagraphOutput(stripParagraphBoundaryArtifacts(current.rewrittenText));
    }

    if (section.type === "header") {
      return section.lines.join("\n");
    }

    if (section.type === "title") {
      return section.text;
    }

    if (section.type === "closing") {
      return section.lines.join("\n");
    }

    return section.text;
  });

  const summaryParts = rewrittenParagraphs.map((result) => result.changeSummary).filter(Boolean);

  if (structured.isLetterLike) {
    summaryParts.push("Preserved letter structure, including header, spacing, salutation, and sign-off formatting.");
  } else if (paragraphSections.length > 1) {
    summaryParts.push("Preserved paragraph boundaries while rewriting each paragraph separately.");
  }

  return {
    rewrittenText: rewrittenSections.join("\n\n").trim(),
    changeSummary: Array.from(new Set(summaryParts)).join(" "),
    modelName: rewrittenParagraphs[0]?.modelName ?? provider.name,
    tokensUsed: rewrittenParagraphs.reduce((total, result) => total + result.tokensUsed, 0) || Math.max(140, countWords(input.sourceText) * 4),
    latencyMs: rewrittenParagraphs.reduce((total, result) => total + result.latencyMs, 0),
    metadata: {
      detectedStructure,
      rewrittenParagraphs: paragraphSections.length,
      preservedElements: structured.isLetterLike
        ? ["Header block", "Title / subject", "Salutation", "Blank-line spacing", "Closing / signature"]
        : paragraphSections.length > 1
          ? ["Paragraph boundaries", "Blank-line spacing"]
          : [],
    },
  };
}

function sectionToText(section: DocumentSection | undefined) {
  if (!section) {
    return "";
  }

  return sectionContent(section);
}

function sectionTitle(section: DocumentSection | undefined, paragraphNumber: number) {
  if (!section) {
    return `Section ${paragraphNumber}`;
  }

  switch (section.type) {
    case "header":
      return "Header";
    case "salutation":
      return "Salutation";
    case "title":
      return "Title";
    case "closing":
      return "Closing";
    case "paragraph":
    default:
      return `Body paragraph ${paragraphNumber}`;
  }
}

export function buildStructuredCompareSections(sourceText: string, rewrittenText: string): StructuredCompareSection[] | null {
  const source = segmentStructuredDocument(sourceText);
  const rewritten = segmentStructuredDocument(rewrittenText);
  const shouldStructureCompare =
    source.isLetterLike ||
    rewritten.isLetterLike ||
    source.sections.filter((section) => section.type === "paragraph").length > 1 ||
    rewritten.sections.filter((section) => section.type === "paragraph").length > 1;

  if (!shouldStructureCompare) {
    return null;
  }

  const length = Math.max(source.sections.length, rewritten.sections.length);
  let paragraphNumber = 0;
  const sections: StructuredCompareSection[] = [];

  for (let index = 0; index < length; index += 1) {
    const sourceSection = source.sections[index];
    const rewrittenSection = rewritten.sections[index];
    const sectionType = sourceSection?.type ?? rewrittenSection?.type;

    if (sectionType === "paragraph") {
      paragraphNumber += 1;
    }

    sections.push({
      key: `${sectionType ?? "section"}-${index}`,
      title: sectionTitle(sourceSection ?? rewrittenSection, paragraphNumber || index + 1),
      preserved: sectionType === "header" || sectionType === "title" || sectionType === "salutation" || sectionType === "closing",
      sourceText: sectionToText(sourceSection),
      rewrittenText: sectionToText(rewrittenSection),
    });
  }

  return sections;
}

export function formatStructuredPlainText(text: string) {
  const structured = segmentStructuredDocument(text);
  const paragraphCount = structured.sections.filter((section) => section.type === "paragraph").length;

  if (!structured.isLetterLike && paragraphCount <= 1) {
    return text.trim();
  }

  return structured.sections
    .map((section) => sectionContent(section))
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

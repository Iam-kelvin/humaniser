import { countWords } from "@/lib/utils";
import type { RewriteProvider, RewriteRequestInput, RewriteResult } from "@/lib/rewrite/types";

const SALUTATION_PATTERN = /^(dear\b|hello\b|hi\b|greetings\b|to whom it may concern\b)/i;
const CLOSING_PATTERN =
  /^(sincerely|best regards|kind regards|regards|yours sincerely|yours faithfully|warm regards|thank you|thanks)\b/i;
const CONTACT_PATTERN = /(@|https?:\/\/|\+?\d[\d\s\-()]{6,}|\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b)/i;

export type DocumentSection =
  | { type: "header"; lines: string[] }
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
    .map((block) => block.trim())
    .filter(Boolean);
}

function looksLikeHeaderBlock(lines: string[]) {
  if (lines.length < 2 || lines.length > 6) {
    return false;
  }

  const shortLineCount = lines.filter((line) => line.trim().length <= 60).length;
  const hasContactLine = lines.some((line) => CONTACT_PATTERN.test(line));
  return shortLineCount === lines.length && hasContactLine;
}

function findSalutationIndex(blocks: string[]) {
  return blocks.findIndex((block) => {
    const firstLine = block.split("\n")[0]?.trim() ?? "";
    return SALUTATION_PATTERN.test(firstLine);
  });
}

function findClosingIndex(blocks: string[]) {
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const firstLine = blocks[index]?.split("\n")[0]?.trim() ?? "";

    if (CLOSING_PATTERN.test(firstLine)) {
      return index;
    }
  }

  return -1;
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

export function segmentStructuredDocument(sourceText: string): StructuredDocument {
  const blocks = splitParagraphBlocks(sourceText);

  if (blocks.length === 0) {
    return {
      isLetterLike: false,
      sections: [],
    };
  }

  const salutationIndex = findSalutationIndex(blocks);
  const closingIndex = findClosingIndex(blocks);
  const headerCandidate = salutationIndex > 0 ? trimEmptyEdges(blocks.slice(0, salutationIndex).join("\n").split("\n")) : [];
  const hasHeader = looksLikeHeaderBlock(headerCandidate);
  const hasSalutation = salutationIndex >= 0;
  const hasClosing = closingIndex > salutationIndex;
  const isLetterLike = hasSalutation && (hasHeader || hasClosing);

  if (!isLetterLike) {
    return {
      isLetterLike: false,
      sections: blocks.map((block) => ({
        type: "paragraph",
        text: block,
      })),
    };
  }

  const sections: DocumentSection[] = [];

  if (hasHeader) {
    sections.push({
      type: "header",
      lines: headerCandidate,
    });
  }

  if (hasSalutation) {
    const salutationBlock = splitSalutationBlock(blocks[salutationIndex]);

    sections.push({
      type: "salutation",
      text: salutationBlock.salutation,
    });

    if (salutationBlock.remainder) {
      sections.push({
        type: "paragraph",
        text: salutationBlock.remainder,
      });
    }
  }

  const bodyStart = salutationIndex + 1;
  const bodyEnd = hasClosing ? closingIndex : blocks.length;

  for (const block of blocks.slice(bodyStart, bodyEnd)) {
    sections.push({
      type: "paragraph",
      text: block,
    });
  }

  if (hasClosing) {
    sections.push({
      type: "closing",
      lines: trimEmptyEdges(blocks.slice(closingIndex).join("\n").split("\n")),
    });
  }

  return {
    isLetterLike,
    sections,
  };
}

function normalizeParagraphOutput(text: string) {
  return normalizeLineEndings(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
}

export async function generateStructuredRewrite(
  provider: RewriteProvider,
  input: RewriteRequestInput,
): Promise<RewriteResult> {
  const structured = segmentStructuredDocument(input.sourceText);
  const paragraphSections = structured.sections.filter((section) => section.type === "paragraph");

  if (paragraphSections.length <= 1 && !structured.isLetterLike) {
    return provider.generateRewrite(input);
  }

  const rewrittenParagraphs = await Promise.all(
    paragraphSections.map((section) =>
      provider.generateRewrite({
        ...input,
        sourceText: section.text,
      }),
    ),
  );

  let paragraphIndex = 0;
  const rewrittenSections = structured.sections.map((section) => {
    if (section.type === "paragraph") {
      const current = rewrittenParagraphs[paragraphIndex];
      paragraphIndex += 1;
      return normalizeParagraphOutput(current.rewrittenText);
    }

    if (section.type === "header") {
      return section.lines.join("\n");
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
      detectedStructure: structured.isLetterLike ? "letter" : paragraphSections.length > 1 ? "multi_paragraph" : "plain",
      rewrittenParagraphs: paragraphSections.length,
      preservedElements: structured.isLetterLike
        ? ["Header block", "Salutation", "Blank-line spacing", "Closing / signature"]
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

  if (section.type === "header" || section.type === "closing") {
    return section.lines.join("\n");
  }

  return section.text;
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
      preserved: sectionType === "header" || sectionType === "salutation" || sectionType === "closing",
      sourceText: sectionToText(sourceSection),
      rewrittenText: sectionToText(rewrittenSection),
    });
  }

  return sections;
}

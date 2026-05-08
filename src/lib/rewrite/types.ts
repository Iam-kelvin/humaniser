import type { RewriteIntensity, Tone, WritingPreset } from "@/lib/domain";

export type RewriteOptions = {
  preset: WritingPreset;
  tone: Tone;
  intensity: RewriteIntensity;
  keepLength: boolean;
  shorten: boolean;
  expandSlightly: boolean;
  preserveTechnicalTerms: boolean;
  preserveKeywords: string[];
  customInstructions?: string;
};

export type RewriteRequestInput = {
  sourceText: string;
  options: RewriteOptions;
  context?: {
    documentType: "email" | "research_summary" | "cover_letter" | "general_writing";
    structure: "plain" | "multi_paragraph" | "letter";
    sectionRole?: "full_document" | "paragraph";
    paragraphIndex?: number;
    totalParagraphs?: number;
  };
};

export type RewriteResult = {
  rewrittenText: string;
  changeSummary: string;
  modelName: string;
  tokensUsed: number;
  latencyMs: number;
  metadata?: {
    detectedStructure: "plain" | "multi_paragraph" | "letter";
    rewrittenParagraphs: number;
    preservedElements: string[];
  };
};

export interface RewriteProvider {
  name: string;
  generateRewrite(input: RewriteRequestInput): Promise<RewriteResult>;
}

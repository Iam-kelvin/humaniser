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
};

export type RewriteResult = {
  rewrittenText: string;
  changeSummary: string;
  modelName: string;
  tokensUsed: number;
  latencyMs: number;
};

export interface RewriteProvider {
  name: string;
  generateRewrite(input: RewriteRequestInput): Promise<RewriteResult>;
}

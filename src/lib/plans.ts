import type { PlanCode, RewriteIntensity, Tone, WritingPreset } from "@/lib/domain";

type PlanEntitlements = {
  planCode: PlanCode;
  monthlyRewrites: number;
  monthlyInputWords: number;
  historyWindow: "basic" | "full";
  presets: WritingPreset[];
  tones: Tone[];
  intensities: RewriteIntensity[];
  customInstructions: boolean;
  explainChanges: boolean;
  billingPortal: boolean;
};

export const PLAN_ENTITLEMENTS: Record<PlanCode, PlanEntitlements> = {
  FREE: {
    planCode: "FREE",
    monthlyRewrites: 25,
    monthlyInputWords: 15000,
    historyWindow: "basic",
    presets: ["EMAIL", "RESEARCH_SUMMARY", "GENERAL_WRITING"],
    tones: ["NATURAL", "PROFESSIONAL", "WARM"],
    intensities: ["LIGHT", "MODERATE"],
    customInstructions: false,
    explainChanges: false,
    billingPortal: false,
  },
  PRO: {
    planCode: "PRO",
    monthlyRewrites: 100000,
    monthlyInputWords: 300000,
    historyWindow: "full",
    presets: ["EMAIL", "RESEARCH_SUMMARY", "GENERAL_WRITING"],
    tones: ["NATURAL", "PROFESSIONAL", "WARM", "CONFIDENT", "CONCISE"],
    intensities: ["LIGHT", "MODERATE", "STRONG"],
    customInstructions: true,
    explainChanges: true,
    billingPortal: true,
  },
};

export type { PlanEntitlements };

export function getEntitlements(planCode: PlanCode) {
  return PLAN_ENTITLEMENTS[planCode];
}

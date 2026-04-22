import { z } from "zod";

import { REWRITE_INTENSITIES, TONES, WRITING_PRESETS } from "@/lib/domain";

export const settingsSchema = z.object({
  displayName: z.string().trim().max(80).optional().or(z.literal("")),
  defaultPreset: z.enum(WRITING_PRESETS),
  defaultTone: z.enum(TONES),
  defaultIntensity: z.enum(REWRITE_INTENSITIES),
  defaultLanguage: z.string().trim().min(2).max(40),
  customInstructions: z.string().trim().max(500).optional().or(z.literal("")),
});

export const rewriteSchema = z.object({
  sourceText: z.string().trim().min(20, "Paste at least 20 characters to rewrite."),
  preset: z.enum(WRITING_PRESETS),
  tone: z.enum(TONES),
  intensity: z.enum(REWRITE_INTENSITIES),
  keepLength: z.boolean().default(false),
  shorten: z.boolean().default(false),
  expandSlightly: z.boolean().default(false),
  preserveTechnicalTerms: z.boolean().default(false),
  preserveKeywords: z.string().trim().max(200).optional().default(""),
  customInstructions: z.string().trim().max(500).optional().default(""),
  documentId: z.string().optional(),
});

export type RewriteInput = z.infer<typeof rewriteSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;

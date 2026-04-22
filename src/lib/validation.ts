import { z } from "zod";

import { REWRITE_INTENSITIES, TONES, WRITING_PRESETS } from "@/lib/domain";

const optionalTextField = (maxLength: number) =>
  z.preprocess(
    (value) => {
      if (value == null) {
        return "";
      }

      return typeof value === "string" ? value : String(value);
    },
    z.string().trim().max(maxLength),
  );

export const settingsSchema = z.object({
  displayName: optionalTextField(80),
  defaultPreset: z.enum(WRITING_PRESETS),
  defaultTone: z.enum(TONES),
  defaultIntensity: z.enum(REWRITE_INTENSITIES),
  defaultLanguage: z.string().trim().min(2).max(40),
  customInstructions: optionalTextField(500),
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
  preserveKeywords: optionalTextField(200),
  customInstructions: optionalTextField(500),
  documentId: z.preprocess((value) => (typeof value === "string" && value.trim() ? value : undefined), z.string().optional()),
});

export type RewriteInput = z.infer<typeof rewriteSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;

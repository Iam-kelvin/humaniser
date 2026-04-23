import "server-only";

import { titleFromUploadName } from "@/lib/document-upload";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/plans";
import { getRewriteProvider } from "@/lib/rewrite";
import { generateStructuredRewrite } from "@/lib/rewrite/structured";
import { countWords, titleFromText } from "@/lib/utils";
import type { PlanCode, SourceType } from "@/lib/domain";
import type { RewriteInput } from "@/lib/validation";

export type RewriteExecutionResult =
  | {
      ok: true;
      rewriteId: string;
      documentId: string;
      rewrittenText: string;
      changeSummary: string;
      modelName: string;
      saveStatus: string;
      metadata?: {
        detectedStructure: "plain" | "multi_paragraph" | "letter";
        rewrittenParagraphs: number;
        preservedElements: string[];
      };
    }
  | {
      ok: false;
      error: string;
      upgradeRequired?: boolean;
    };

function assertEntitlements(planCode: PlanCode, input: RewriteInput) {
  const entitlements = getEntitlements(planCode);

  if (!entitlements.presets.includes(input.preset)) {
    return "Your current plan does not include this writing preset.";
  }

  if (!entitlements.tones.includes(input.tone)) {
    return "Upgrade to Pro to use this tone.";
  }

  if (!entitlements.intensities.includes(input.intensity)) {
    return "Upgrade to Pro to use this rewrite intensity.";
  }

  if (input.customInstructions && !entitlements.customInstructions) {
    return "Custom instructions are available on Pro.";
  }

  return null;
}

export async function executeRewrite(input: {
  userId: string;
  planCode: PlanCode;
  existingDocumentId?: string;
  customInstructionsFromProfile?: string | null;
  sourceType: SourceType;
  uploadedFileName?: string;
  payload: RewriteInput;
}): Promise<RewriteExecutionResult> {
  const entitlementError = assertEntitlements(input.planCode, input.payload);

  if (entitlementError) {
    return {
      ok: false,
      error: entitlementError,
      upgradeRequired: true,
    };
  }

  const existingDocument = input.existingDocumentId
    ? await prisma.document.findFirst({
        where: {
          id: input.existingDocumentId,
          userId: input.userId,
        },
        select: {
          id: true,
          sourceType: true,
          title: true,
        },
      })
    : null;

  if (input.existingDocumentId && !existingDocument) {
    return {
      ok: false,
      error: "We could not find the document you were trying to update.",
    };
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const usage = await prisma.usageEvent.aggregate({
    where: {
      userId: input.userId,
      createdAt: { gte: monthStart },
    },
    _count: { id: true },
    _sum: { inputWords: true },
  });

  const entitlements = getEntitlements(input.planCode);
  const sourceWordCount = countWords(input.payload.sourceText);
  const projectedWords = (usage._sum.inputWords ?? 0) + sourceWordCount;

  if (usage._count.id >= entitlements.monthlyRewrites) {
    return {
      ok: false,
      error: "You have reached your monthly rewrite limit.",
      upgradeRequired: input.planCode === "FREE",
    };
  }

  if (projectedWords > entitlements.monthlyInputWords) {
    return {
      ok: false,
      error: "You have reached your monthly word limit.",
      upgradeRequired: input.planCode === "FREE",
    };
  }

  const provider = getRewriteProvider();
  const customInstructions = input.payload.customInstructions || input.customInstructionsFromProfile || undefined;
  const preserveKeywords = input.payload.preserveKeywords
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  let result;

  try {
    result = await generateStructuredRewrite(provider, {
      sourceText: input.payload.sourceText,
      options: {
        preset: input.payload.preset,
        tone: input.payload.tone,
        intensity: input.payload.intensity,
        keepLength: input.payload.keepLength,
        shorten: input.payload.shorten,
        expandSlightly: input.payload.expandSlightly,
        preserveTechnicalTerms: input.payload.preserveTechnicalTerms,
        preserveKeywords,
        customInstructions,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The rewrite provider failed unexpectedly.";

    return {
      ok: false,
      error: message,
    };
  }

  const nextTitle =
    (input.sourceType === "DOCUMENT_UPLOAD" && input.uploadedFileName
      ? titleFromUploadName(input.uploadedFileName)
      : null) ??
    (existingDocument?.sourceType === "DOCUMENT_UPLOAD" ? existingDocument.title : null) ??
    titleFromText(input.payload.sourceText, "Untitled rewrite");

  const document = input.existingDocumentId
    ? await prisma.document.update({
        where: { id: input.existingDocumentId },
        data: {
          sourceText: input.payload.sourceText,
          title: nextTitle,
          writingPreset: input.payload.preset,
          sourceType: input.sourceType === "DOCUMENT_UPLOAD" ? input.sourceType : undefined,
        },
      })
    : await prisma.document.create({
        data: {
          userId: input.userId,
          title: nextTitle,
          sourceText: input.payload.sourceText,
          writingPreset: input.payload.preset,
          sourceType: input.sourceType,
        },
      });

  const rewrite = await prisma.rewrite.create({
    data: {
      documentId: document.id,
      userId: input.userId,
      tone: input.payload.tone,
      intensity: input.payload.intensity,
      instructionsSnapshot: customInstructions,
      rewrittenText: result.rewrittenText,
      changeSummary: result.changeSummary,
      modelName: result.modelName,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
    },
  });

  await prisma.usageEvent.create({
    data: {
      userId: input.userId,
      eventType: input.existingDocumentId ? "REWRITE_REGENERATED" : "REWRITE_CREATED",
      inputWords: sourceWordCount,
      outputWords: countWords(result.rewrittenText),
      planAtTime: input.planCode,
    },
  });

  return {
    ok: true,
    rewriteId: rewrite.id,
    documentId: document.id,
    rewrittenText: result.rewrittenText,
    changeSummary: result.changeSummary,
    modelName: result.modelName,
    saveStatus: "Saved to history",
    metadata: result.metadata,
  };
}

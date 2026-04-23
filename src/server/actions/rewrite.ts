"use server";

import { revalidatePath } from "next/cache";

import { requireViewer } from "@/lib/auth";
import { resolveCurrentPlan } from "@/lib/data/dashboard";
import { executeRewrite } from "@/lib/data/rewrites";
import { getDocumentUploadError } from "@/lib/document-upload";
import { extractUploadedDocumentText } from "@/lib/document-upload.server";
import type { SourceType } from "@/lib/domain";
import { rewriteSchema } from "@/lib/validation";

export type RewriteActionState = {
  ok: boolean;
  message: string;
  upgradeRequired?: boolean;
  result?: {
    rewrittenText: string;
    changeSummary: string;
    saveStatus: string;
    sourceText: string;
    metadata?: {
      detectedStructure: "plain" | "multi_paragraph" | "letter";
      rewrittenParagraphs: number;
      preservedElements: string[];
    };
  };
};

export async function createRewriteAction(
  _prevState: RewriteActionState,
  formData: FormData,
): Promise<RewriteActionState> {
  const viewer = await requireViewer();
  const sourceFile = formData.get("sourceFile");
  const rawSourceText = formData.get("sourceText");
  let sourceText = typeof rawSourceText === "string" ? rawSourceText : "";
  let sourceType: SourceType = "PASTED_TEXT";
  let uploadedFileName: string | undefined;

  if (sourceFile instanceof File && sourceFile.size > 0) {
    const uploadError = getDocumentUploadError(sourceFile);

    if (uploadError) {
      return {
        ok: false,
        message: uploadError,
      };
    }

    sourceType = "DOCUMENT_UPLOAD";
    uploadedFileName = sourceFile.name;

    if (!sourceText.trim()) {
      sourceText = await extractUploadedDocumentText(sourceFile);

      if (!sourceText) {
        return {
          ok: false,
          message: "We could not extract readable text from that file. Try another document or paste the text directly.",
        };
      }
    }
  }

  const parsed = rewriteSchema.safeParse({
    sourceText,
    preset: formData.get("preset"),
    tone: formData.get("tone"),
    intensity: formData.get("intensity"),
    keepLength: formData.get("keepLength") === "true",
    shorten: formData.get("shorten") === "true",
    expandSlightly: formData.get("expandSlightly") === "true",
    preserveTechnicalTerms: formData.get("preserveTechnicalTerms") === "true",
    preserveKeywords: formData.get("preserveKeywords"),
    customInstructions: formData.get("customInstructions"),
    documentId: formData.get("documentId") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please check your rewrite settings.",
    };
  }

  const planCode = await resolveCurrentPlan(viewer.user.id);

  const result = await executeRewrite({
    userId: viewer.user.id,
    planCode,
    existingDocumentId: parsed.data.documentId,
    customInstructionsFromProfile: viewer.user.profile?.customInstructions,
    sourceType,
    uploadedFileName,
    payload: parsed.data,
  });

  if (!result.ok) {
    return {
      ok: false,
      message: result.error,
      upgradeRequired: result.upgradeRequired,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/new");

  return {
    ok: true,
    message: "Rewrite completed and saved to history.",
    result: {
      rewrittenText: result.rewrittenText,
      changeSummary: result.changeSummary,
      saveStatus: result.saveStatus,
      sourceText: parsed.data.sourceText,
      metadata: result.metadata,
    },
  };
}

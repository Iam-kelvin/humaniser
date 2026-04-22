"use server";

import { revalidatePath } from "next/cache";

import { requireViewer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/plans";
import { resolveCurrentPlan } from "@/lib/data/dashboard";
import { settingsSchema } from "@/lib/validation";

export type SettingsActionState = {
  ok: boolean;
  message: string;
};

export async function saveSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const viewer = await requireViewer();
  const planCode = await resolveCurrentPlan(viewer.user.id);
  const entitlements = getEntitlements(planCode);

  const parsed = settingsSchema.safeParse({
    displayName: formData.get("displayName"),
    defaultPreset: formData.get("defaultPreset"),
    defaultTone: formData.get("defaultTone"),
    defaultIntensity: formData.get("defaultIntensity"),
    defaultLanguage: formData.get("defaultLanguage"),
    customInstructions: formData.get("customInstructions"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please review your settings.",
    };
  }

  await prisma.profile.upsert({
    where: { userId: viewer.user.id },
    update: {
      displayName: parsed.data.displayName || null,
      defaultPreset: parsed.data.defaultPreset,
      defaultTone: parsed.data.defaultTone,
      defaultIntensity: parsed.data.defaultIntensity,
      defaultLanguage: parsed.data.defaultLanguage,
      customInstructions: entitlements.customInstructions ? parsed.data.customInstructions || null : null,
    },
    create: {
      userId: viewer.user.id,
      displayName: parsed.data.displayName || null,
      defaultPreset: parsed.data.defaultPreset,
      defaultTone: parsed.data.defaultTone,
      defaultIntensity: parsed.data.defaultIntensity,
      defaultLanguage: parsed.data.defaultLanguage,
      customInstructions: entitlements.customInstructions ? parsed.data.customInstructions || null : null,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/new");

  return {
    ok: true,
    message: "Settings saved.",
  };
}

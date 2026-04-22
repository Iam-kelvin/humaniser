import { SettingsForm } from "@/components/dashboard/settings-form";
import { requireViewer } from "@/lib/auth";
import { getEntitlements } from "@/lib/plans";
import { resolveCurrentPlan } from "@/lib/data/dashboard";

export default async function SettingsPage() {
  const viewer = await requireViewer();
  const planCode = await resolveCurrentPlan(viewer.user.id);
  const entitlements = getEntitlements(planCode);
  const profile = viewer.user.profile;

  return (
    <section className="space-y-6">
      <div className="panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Settings</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-950">Set your defaults once.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Save the writing preset, tone, intensity, language, and instruction defaults you want Humaniser to use.
        </p>
      </div>
      <SettingsForm
        customInstructionsEnabled={entitlements.customInstructions}
        defaults={{
          displayName: profile?.displayName ?? "",
          defaultPreset: profile?.defaultPreset ?? "EMAIL",
          defaultTone: profile?.defaultTone ?? "NATURAL",
          defaultIntensity: profile?.defaultIntensity ?? "MODERATE",
          defaultLanguage: profile?.defaultLanguage ?? "English",
          customInstructions: profile?.customInstructions ?? "",
        }}
      />
    </section>
  );
}

import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { RewriteWorkbench } from "@/components/dashboard/rewrite-workbench";
import { requireViewer } from "@/lib/auth";
import { getRewriteForEditor, resolveCurrentPlan } from "@/lib/data/dashboard";
import { getEntitlements } from "@/lib/plans";

export default async function NewRewritePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer();
  const [{ rewriteId }, planCode] = await Promise.all([searchParams, resolveCurrentPlan(viewer.user.id)]);
  const seed = await getRewriteForEditor(viewer.user.id, typeof rewriteId === "string" ? rewriteId : undefined);
  const entitlements = getEntitlements(planCode);
  const profile = viewer.user.profile;

  return (
    <section className="space-y-6">
      <div className="panel flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">New rewrite</p>
          <h1 className="text-4xl font-semibold text-slate-950">Refine your draft with audience-aware controls.</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            Paste the source text or upload a PDF, DOCX, or text-based document, choose the tone and intensity you need, and generate a clearer version without changing what you mean.
          </p>
        </div>
      </div>

      {entitlements.monthlyRewrites === 0 ? (
        <EmptyState
          title="This plan cannot create rewrites"
          description="Upgrade to a paid plan to start generating refined drafts."
          action={<ButtonLink href="/pricing">See plans</ButtonLink>}
        />
      ) : (
        <RewriteWorkbench
          explainChangesEnabled={entitlements.explainChanges}
          customInstructionsEnabled={entitlements.customInstructions}
          allowedPresets={entitlements.presets}
          allowedTones={entitlements.tones}
          allowedIntensities={entitlements.intensities}
          defaults={{
            documentId: seed?.documentId,
            sourceText: seed?.document.sourceText ?? "",
            preset: seed?.document.writingPreset ?? profile?.defaultPreset ?? "EMAIL",
            tone: seed?.tone ?? profile?.defaultTone ?? "NATURAL",
            intensity: seed?.intensity ?? profile?.defaultIntensity ?? "MODERATE",
            customInstructions: profile?.customInstructions ?? "",
            rewrittenText: seed?.rewrittenText,
            changeSummary: seed?.changeSummary ?? undefined,
            saveStatus: seed ? "Loaded from history" : undefined,
            compareSource: seed?.document.sourceText ?? "",
          }}
        />
      )}
    </section>
  );
}

"use client";

import { useActionState, useMemo, useState } from "react";

import { createRewriteAction, type RewriteActionState } from "@/server/actions/rewrite";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import { INTENSITY_LABELS, PRESET_LABELS, TONE_LABELS } from "@/lib/domain";
import type { RewriteIntensity, Tone, WritingPreset } from "@/lib/domain";

const initialState: RewriteActionState = {
  ok: false,
  message: "",
};

type EditorDefaults = {
  documentId?: string;
  sourceText: string;
  preset: WritingPreset;
  tone: Tone;
  intensity: RewriteIntensity;
  customInstructions?: string;
  rewrittenText?: string;
  changeSummary?: string;
  saveStatus?: string;
  compareSource?: string;
};

export function RewriteWorkbench({
  defaults,
  explainChangesEnabled,
  customInstructionsEnabled,
  allowedPresets,
  allowedTones,
  allowedIntensities,
}: {
  defaults: EditorDefaults;
  explainChangesEnabled: boolean;
  customInstructionsEnabled: boolean;
  allowedPresets: WritingPreset[];
  allowedTones: Tone[];
  allowedIntensities: RewriteIntensity[];
}) {
  const [state, formAction, pending] = useActionState(createRewriteAction, {
    ...initialState,
      result: defaults.rewrittenText
      ? {
          rewrittenText: defaults.rewrittenText,
          changeSummary: defaults.changeSummary ?? "",
          saveStatus: defaults.saveStatus ?? "Loaded from history",
          sourceText: defaults.compareSource ?? defaults.sourceText,
        }
      : undefined,
  });
  const [compareMode, setCompareMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayText = state.result?.rewrittenText ?? defaults.rewrittenText ?? "";
  const sourceText = state.result?.sourceText ?? defaults.compareSource ?? defaults.sourceText;

  const comparePairs = useMemo(() => {
    if (!compareMode) {
      return [];
    }

    return [
      { label: "Original", value: sourceText },
      { label: "Humanised", value: displayText },
    ];
  }, [compareMode, displayText, sourceText]);

  async function handleCopy() {
    await navigator.clipboard.writeText(displayText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form action={formAction} className="panel space-y-5 p-6">
        <input type="hidden" name="documentId" value={defaults.documentId ?? ""} />
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Source text</p>
          <textarea
            name="sourceText"
            defaultValue={defaults.sourceText}
            required
            rows={18}
            className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-[var(--brand)]"
            placeholder="Paste your email or research summary draft here."
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField name="preset" label="Preset" defaultValue={defaults.preset} options={allowedPresets.map((value) => ({ value, label: PRESET_LABELS[value] }))} />
          <SelectField name="tone" label="Tone" defaultValue={defaults.tone} options={allowedTones.map((value) => ({ value, label: TONE_LABELS[value] }))} />
          <SelectField
            name="intensity"
            label="Intensity"
            defaultValue={defaults.intensity}
            options={allowedIntensities.map((value) => ({ value, label: INTENSITY_LABELS[value] }))}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <CheckboxField name="keepLength" label="Keep length" />
          <CheckboxField name="shorten" label="Shorten" />
          <CheckboxField name="expandSlightly" label="Expand slightly" />
          <CheckboxField name="preserveTechnicalTerms" label="Preserve technical terms" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="preserveKeywords">
            Preserve keywords
          </label>
          <input
            id="preserveKeywords"
            name="preserveKeywords"
            defaultValue=""
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
            placeholder="Comma-separated keywords"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="customInstructions">
            Custom instructions
          </label>
          <textarea
            id="customInstructions"
            name="customInstructions"
            defaultValue={defaults.customInstructions ?? ""}
            rows={4}
            disabled={!customInstructionsEnabled}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="Optional guidance for Pro plans"
          />
        </div>
        {!customInstructionsEnabled && (
          <p className="text-sm text-amber-700">Custom instructions are available on Pro.</p>
        )}
        {state.message && (
          <StatusBanner
            title={state.ok ? "Rewrite ready" : state.upgradeRequired ? "Upgrade required" : "Action needed"}
            description={state.message}
            tone={state.ok ? "success" : state.upgradeRequired ? "warning" : "info"}
          />
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Rewriting..." : "Rewrite text"}
        </Button>
      </form>

      <div className="panel space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Output</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Refined draft</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setCompareMode((value) => !value)}>
              {compareMode ? "Hide compare" : "Compare mode"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCopy} disabled={!displayText}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        {displayText ? (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-800">
              {displayText}
            </div>
            {compareMode && (
              <div className="grid gap-4 md:grid-cols-2">
                {comparePairs.map((pair) => (
                  <div key={pair.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{pair.label}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">{pair.value}</p>
                  </div>
                ))}
              </div>
            )}
            {explainChangesEnabled ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Explain changes</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{state.result?.changeSummary ?? defaults.changeSummary}</p>
              </div>
            ) : (
              <StatusBanner
                title="Explain changes is a Pro feature"
                description="Upgrade to see a plain-language summary of what changed in each rewrite."
                tone="warning"
              />
            )}
            <p className="text-sm text-slate-500">{state.result?.saveStatus ?? defaults.saveStatus ?? "Ready to save after your first rewrite"}</p>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8">
            <p className="text-lg font-semibold text-slate-900">Your rewritten draft will appear here.</p>
            <p className="mt-2 max-w-lg text-sm leading-7 text-slate-600">
              Humaniser keeps the intended meaning intact while improving tone, flow, and audience fit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[var(--brand)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
      <input type="checkbox" name={name} value="true" className="h-4 w-4 rounded border-slate-300 accent-[var(--brand)]" />
      <span>{label}</span>
    </label>
  );
}

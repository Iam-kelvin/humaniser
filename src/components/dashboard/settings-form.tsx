"use client";

import { useActionState } from "react";

import { saveSettingsAction, type SettingsActionState } from "@/server/actions/settings";
import { Button } from "@/components/ui/button";
import { INTENSITY_LABELS, PRESET_LABELS, TONE_LABELS, REWRITE_INTENSITIES, TONES, WRITING_PRESETS } from "@/lib/domain";

const initialState: SettingsActionState = {
  ok: false,
  message: "",
};

export function SettingsForm({
  defaults,
  customInstructionsEnabled,
}: {
  defaults: {
    displayName: string;
    defaultPreset: string;
    defaultTone: string;
    defaultIntensity: string;
    defaultLanguage: string;
    customInstructions: string;
  };
  customInstructionsEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveSettingsAction, initialState);

  return (
    <form action={formAction} className="panel space-y-5 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Display name" name="displayName" defaultValue={defaults.displayName} />
        <Field label="Default language" name="defaultLanguage" defaultValue={defaults.defaultLanguage} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SelectField name="defaultPreset" label="Default preset" defaultValue={defaults.defaultPreset} options={WRITING_PRESETS.map((value) => ({ value, label: PRESET_LABELS[value] }))} />
        <SelectField name="defaultTone" label="Default tone" defaultValue={defaults.defaultTone} options={TONES.map((value) => ({ value, label: TONE_LABELS[value] }))} />
        <SelectField
          name="defaultIntensity"
          label="Default intensity"
          defaultValue={defaults.defaultIntensity}
          options={REWRITE_INTENSITIES.map((value) => ({ value, label: INTENSITY_LABELS[value] }))}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="customInstructions">
          Custom instructions
        </label>
        <textarea
          id="customInstructions"
          name="customInstructions"
          defaultValue={defaults.customInstructions}
          rows={5}
          disabled={!customInstructionsEnabled}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Guide the rewrite engine with audience or brand preferences."
        />
      </div>
      {!customInstructionsEnabled && (
        <p className="text-sm text-amber-700">Custom instructions unlock on the Pro plan.</p>
      )}
      {state.message && <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[var(--brand)]"
      />
    </label>
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
      <select name={name} defaultValue={defaultValue} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[var(--brand)]">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

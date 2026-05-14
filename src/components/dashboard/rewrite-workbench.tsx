"use client";

import { type ChangeEvent, type DragEvent, useActionState, useMemo, useRef, useState } from "react";

import { createRewriteAction, type RewriteActionState } from "@/server/actions/rewrite";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import { downloadDocx } from "@/lib/export-docx";
import {
  DOCUMENT_UPLOAD_ACCEPT,
  getDocumentUploadError,
  isClientPreviewableUpload,
  normalizeUploadedText,
} from "@/lib/document-upload";
import { INTENSITY_LABELS, PRESET_LABELS, TONE_LABELS } from "@/lib/domain";
import { buildStructuredCompareSections, formatStructuredPlainText, segmentStructuredDocument } from "@/lib/rewrite/structured";
import { titleFromText } from "@/lib/utils";
import type { RewriteIntensity, Tone, WritingPreset } from "@/lib/domain";

const initialState: RewriteActionState = {
  ok: false,
  message: "",
};

type EditorDefaults = {
  documentId?: string;
  title?: string;
  sourceText: string;
  preset: WritingPreset;
  tone: Tone;
  intensity: RewriteIntensity;
  customInstructions?: string;
  rewrittenText?: string;
  changeSummary?: string;
  saveStatus?: string;
  compareSource?: string;
  rewriteMetadata?: {
    detectedStructure: "plain" | "multi_paragraph" | "letter";
    rewrittenParagraphs: number;
    preservedElements: string[];
  };
};

type InlineFeedback = {
  title: string;
  description: string;
  tone: "info" | "warning" | "success";
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
  const [draftText, setDraftText] = useState(defaults.sourceText);
  const [uploadFeedback, setUploadFeedback] = useState<InlineFeedback | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [clientFeedback, setClientFeedback] = useState<InlineFeedback | null>(null);
  const [preset, setPreset] = useState(defaults.preset);
  const [tone, setTone] = useState(defaults.tone);
  const [intensity, setIntensity] = useState(defaults.intensity);
  const [keepLength, setKeepLength] = useState(false);
  const [shorten, setShorten] = useState(false);
  const [expandSlightly, setExpandSlightly] = useState(false);
  const [preserveTechnicalTerms, setPreserveTechnicalTerms] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const effectiveUploadedFileName = state.result?.uploadedFileName ?? selectedFileName;

  const displayText = state.result?.rewrittenText ?? defaults.rewrittenText ?? "";
  const sourceText = state.result?.sourceText ?? defaults.compareSource ?? defaults.sourceText;
  const editorText = draftText || (selectedFileName ? state.result?.sourceText ?? "" : "");
  const requiresTypedSource = !selectedFileName;
  const rewriteMetadata = state.result?.metadata ?? defaults.rewriteMetadata;
  const downloadFileName = useMemo(() => {
    const uploadedBaseName = effectiveUploadedFileName.replace(/\.[^.]+$/, "").trim();

    if (uploadedBaseName) {
      return uploadedBaseName;
    }

    if (defaults.title?.trim()) {
      return defaults.title.trim();
    }

    return titleFromText(sourceText || displayText, "humanised-rewrite");
  }, [defaults.title, displayText, effectiveUploadedFileName, sourceText]);

  const comparePairs = useMemo(() => {
    if (!compareMode) {
      return [];
    }

    return [
      { label: "Original", value: sourceText },
      { label: "Humanised", value: displayText },
    ];
  }, [compareMode, displayText, sourceText]);
  const structuredCompareSections = useMemo(
    () => (compareMode ? buildStructuredCompareSections(sourceText, displayText) : null),
    [compareMode, displayText, sourceText],
  );
  const structuredOutput = useMemo(() => {
    if (!displayText) {
      return null;
    }

    const structured = segmentStructuredDocument(displayText);
    const paragraphCount = structured.sections.filter((section) => section.type === "paragraph").length;

    if (!structured.isLetterLike && paragraphCount <= 1) {
      return null;
    }

    return structured;
  }, [displayText]);
  const copyReadyText = useMemo(() => formatStructuredPlainText(displayText), [displayText]);
  const controlsSummary = useMemo(() => {
    const parts = [
      `${PRESET_LABELS[preset]} preset`,
      `${TONE_LABELS[tone]} tone`,
      `${INTENSITY_LABELS[intensity]} intensity`,
    ];

    if (shorten) {
      parts.push("shorter output");
    } else if (expandSlightly) {
      parts.push("slightly expanded output");
    } else if (keepLength) {
      parts.push("similar length");
    }

    if (preserveTechnicalTerms) {
      parts.push("technical terms preserved");
    }

    return parts.join(" | ");
  }, [expandSlightly, intensity, keepLength, preset, preserveTechnicalTerms, shorten, tone]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyReadyText);
      setCopied(true);
      setClientFeedback({
        title: "Copied to clipboard",
        description: "The rewritten draft is ready to paste into Word, email, or another editor.",
        tone: "success",
      });
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setClientFeedback({
        title: "Copy failed",
        description: "We could not copy the draft automatically. Try again, or use Download DOCX instead.",
        tone: "warning",
      });
    }
  }

  async function loadSelectedFile(file: File | null) {
    setSelectedFileName(file?.name ?? "");

    if (!file) {
      setSelectedFileName("");
      setUploadFeedback(null);
      return;
    }

    const uploadError = getDocumentUploadError(file);

    if (uploadError) {
      setUploadFeedback({
        title: "Upload blocked",
        description: uploadError,
        tone: "warning",
      });
      return;
    }

    if (isClientPreviewableUpload(file)) {
      const text = normalizeUploadedText(await file.text());
      setDraftText(text);
      setUploadFeedback({
        title: "File loaded into the editor",
        description: `${file.name} is ready. You can review or edit the extracted text before rewriting.`,
        tone: "success",
      });
      return;
    }

    setDraftText("");
    setUploadFeedback({
      title: "File ready for extraction",
      description: `${file.name} will be extracted on submit, and the extracted text will appear in the editor afterward so you can review it.`,
      tone: "info",
    });
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    await loadSelectedFile(event.target.files?.[0] ?? null);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(false);
  }

  async function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (fileInputRef.current) {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInputRef.current.files = transfer.files;
    }

    await loadSelectedFile(file);
  }

  async function handleDownloadDocx() {
    if (!displayText) {
      return;
    }

    setDownloadingDocx(true);

    try {
      await downloadDocx(copyReadyText, downloadFileName);
      setClientFeedback({
        title: "DOCX downloaded",
        description: `${downloadFileName}.docx was prepared from the current rewrite.`,
        tone: "success",
      });
    } catch {
      setClientFeedback({
        title: "Download failed",
        description: "We could not create the DOCX file. Try again, or use Copy as a fallback.",
        tone: "warning",
      });
    } finally {
      setDownloadingDocx(false);
    }
  }

  function handleKeepLengthChange(checked: boolean) {
    setKeepLength(checked);

    if (checked) {
      setShorten(false);
    }
  }

  function handleShortenChange(checked: boolean) {
    setShorten(checked);

    if (checked) {
      setKeepLength(false);
      setExpandSlightly(false);
    }
  }

  function handleExpandSlightlyChange(checked: boolean) {
    setExpandSlightly(checked);

    if (checked) {
      setShorten(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form action={formAction} encType="multipart/form-data" className="panel min-w-0 space-y-5 p-5 sm:p-6">
        <input type="hidden" name="documentId" value={defaults.documentId ?? ""} />
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Document upload</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Upload a PDF, DOCX, or text-based file and Humaniser will pull the readable text into the rewrite flow.
              </p>
            </div>
            {selectedFileName ? <p className="max-w-full break-words text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{selectedFileName}</p> : null}
          </div>
          <label
            className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-8 text-center transition ${
              dragActive
                ? "border-[var(--brand)] bg-teal-50"
                : "border-slate-300 bg-white hover:border-[var(--brand)] hover:bg-slate-50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <span className="text-sm font-semibold text-slate-900">Choose a file</span>
            <span className="mt-2 text-sm leading-6 text-slate-600">Supports .pdf, .docx, .txt, .md, .rtf, .csv, .json, and .html up to 10 MB. You can also drag and drop.</span>
            <input ref={fileInputRef} type="file" name="sourceFile" accept={DOCUMENT_UPLOAD_ACCEPT} className="sr-only" onChange={handleFileChange} />
          </label>
          {uploadFeedback ? (
            <div className="mt-3">
              <StatusBanner title={uploadFeedback.title} description={uploadFeedback.description} tone={uploadFeedback.tone} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Prefer pasting? You can still type directly into the editor below.</p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Source text</p>
          <textarea
            name="sourceText"
            value={editorText}
            onChange={(event) => setDraftText(event.target.value)}
            required={requiresTypedSource}
            rows={18}
            className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-[var(--brand)]"
            placeholder={requiresTypedSource ? "Paste your email or research summary draft here." : "Optional: edit or replace the extracted source text."}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            name="preset"
            label="Preset"
            value={preset}
            onChange={(value) => setPreset(value as WritingPreset)}
            options={allowedPresets.map((value) => ({ value, label: PRESET_LABELS[value] }))}
          />
          <SelectField
            name="tone"
            label="Tone"
            value={tone}
            onChange={(value) => setTone(value as Tone)}
            options={allowedTones.map((value) => ({ value, label: TONE_LABELS[value] }))}
          />
          <SelectField
            name="intensity"
            label="Intensity"
            value={intensity}
            onChange={(value) => setIntensity(value as RewriteIntensity)}
            options={allowedIntensities.map((value) => ({ value, label: INTENSITY_LABELS[value] }))}
          />
        </div>
        <p className="text-sm text-slate-500">{controlsSummary}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <CheckboxField name="keepLength" label="Keep length" checked={keepLength} onChange={handleKeepLengthChange} />
          <CheckboxField name="shorten" label="Shorten" checked={shorten} onChange={handleShortenChange} />
          <CheckboxField name="expandSlightly" label="Expand slightly" checked={expandSlightly} onChange={handleExpandSlightlyChange} />
          <CheckboxField
            name="preserveTechnicalTerms"
            label="Preserve technical terms"
            checked={preserveTechnicalTerms}
            onChange={setPreserveTechnicalTerms}
          />
        </div>
        <p className="text-sm text-slate-500">Tip: `Shorten` overrides length-preserving expansion. Use `Keep length` or `Expand slightly` when you want fuller output.</p>
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
        {clientFeedback && <StatusBanner title={clientFeedback.title} description={clientFeedback.description} tone={clientFeedback.tone} />}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Rewriting..." : "Rewrite text"}
        </Button>
      </form>

      <div className="panel min-w-0 space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Output</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Refined draft</h2>
          </div>
          <div className="flex w-full flex-col gap-2 min-[480px]:w-auto min-[480px]:flex-row min-[480px]:flex-wrap">
            <Button type="button" variant="secondary" onClick={() => setCompareMode((value) => !value)} className="w-full min-[480px]:w-auto">
              {compareMode ? "Hide compare" : "Compare mode"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleDownloadDocx} disabled={!displayText || downloadingDocx} className="w-full min-[480px]:w-auto">
              {downloadingDocx ? "Preparing DOCX..." : "Download DOCX"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCopy} disabled={!displayText} className="w-full min-[480px]:w-auto">
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        {displayText ? (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm leading-7 break-words text-slate-800">
              {structuredOutput ? (
                <div className="space-y-6">
                  {structuredOutput.sections.map((section, index) => (
                    <div key={`${section.type}-${index}`} className="whitespace-pre-wrap">
                      {section.type === "header" || section.type === "closing" ? section.lines.join("\n") : section.text}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{displayText}</div>
              )}
            </div>
            {compareMode && structuredCompareSections ? (
              <div className="space-y-4">
                {structuredCompareSections.map((section) => (
                  <div key={section.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{section.title}</p>
                      {section.preserved ? <Badge className="border-none bg-white text-teal-700">Preserved</Badge> : null}
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Original</p>
                        <p className="mt-3 text-sm leading-7 whitespace-pre-wrap break-words text-slate-700">{section.sourceText || "No content"}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Humanised</p>
                        <p className="mt-3 text-sm leading-7 whitespace-pre-wrap break-words text-slate-700">{section.rewrittenText || "No content"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : compareMode && (
              <div className="grid gap-4 md:grid-cols-2">
                {comparePairs.map((pair) => (
                  <div key={pair.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{pair.label}</p>
                    <p className="mt-3 text-sm leading-7 whitespace-pre-wrap break-words text-slate-700">{pair.value}</p>
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
            {rewriteMetadata && rewriteMetadata.detectedStructure !== "plain" ? (
              <div className="rounded-3xl border border-teal-200 bg-teal-50 p-5">
                <p className="text-sm font-semibold text-teal-950">Layout preserved</p>
                <p className="mt-2 text-sm leading-7 text-teal-800">
                  {rewriteMetadata.detectedStructure === "letter"
                    ? "Letter-style formatting was kept intact while the body text was rewritten."
                    : "Paragraph spacing was kept intact while each paragraph was rewritten separately."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {rewriteMetadata.preservedElements.map((element) => (
                    <Badge key={element} className="border-none bg-white text-teal-800">
                      {element}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
            <p className="text-sm text-slate-500">{state.result?.saveStatus ?? defaults.saveStatus ?? "Ready to save after your first rewrite"}</p>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-5 sm:p-8">
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
  value,
  onChange,
  options,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
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
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
      <input
        type="checkbox"
        name={name}
        value="true"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 accent-[var(--brand)]"
      />
      <span>{label}</span>
    </label>
  );
}

import Link from "next/link";

import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { INTENSITY_LABELS, PRESET_LABELS, TONE_LABELS, TONES, WRITING_PRESETS } from "@/lib/domain";
import { requireViewer } from "@/lib/auth";
import { getHistory } from "@/lib/data/dashboard";
import { formatDate } from "@/lib/utils";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const preset = typeof params.preset === "string" ? params.preset : undefined;
  const tone = typeof params.tone === "string" ? params.tone : undefined;
  const history = await getHistory(viewer.user.id, {
    preset: preset as never,
    tone: tone as never,
  });

  return (
    <section className="space-y-6">
      <div className="panel flex flex-col gap-4 p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">History</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-950">Review and reopen past rewrites.</h1>
        </div>
        <form className="grid gap-4 md:grid-cols-3">
          <select name="preset" defaultValue={preset ?? ""} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
            <option value="">All presets</option>
            {WRITING_PRESETS.map((value) => (
              <option key={value} value={value}>
                {PRESET_LABELS[value]}
              </option>
            ))}
          </select>
          <select name="tone" defaultValue={tone ?? ""} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
            <option value="">All tones</option>
            {TONES.map((value) => (
              <option key={value} value={value}>
                {TONE_LABELS[value]}
              </option>
            ))}
          </select>
          <div className="flex gap-3">
            <Button type="submit" variant="secondary">
              Apply filters
            </Button>
            <ButtonLink href="/dashboard/history" variant="ghost">
              Clear filters
            </ButtonLink>
          </div>
        </form>
      </div>
      {history.length === 0 ? (
        <EmptyState
          title="No matching rewrites"
          description="Try adjusting your filters or create a fresh rewrite to start building your history."
          action={<ButtonLink href="/dashboard/new">Create a new rewrite</ButtonLink>}
        />
      ) : (
        <div className="space-y-3">
          {history.map((rewrite) => (
            <div key={rewrite.id} className="panel flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{rewrite.document.title}</h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {PRESET_LABELS[rewrite.document.writingPreset]} - {TONE_LABELS[rewrite.tone]} - {INTENSITY_LABELS[rewrite.intensity]}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {rewrite.document.sourceType === "DOCUMENT_UPLOAD" ? "Uploaded document" : "Pasted text"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500">{formatDate(rewrite.createdAt)}</span>
                  <Link href={`/dashboard/new?rewriteId=${rewrite.id}`} className="text-sm font-semibold text-[var(--brand)]">
                    Reopen
                  </Link>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Original</p>
                  <p className="mt-3 text-sm leading-7 whitespace-pre-wrap text-slate-600">{rewrite.document.sourceText}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rewritten</p>
                  <p className="mt-3 text-sm leading-7 whitespace-pre-wrap text-slate-700">{rewrite.rewrittenText}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

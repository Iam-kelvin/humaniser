import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="container-shell pb-8 pt-10 md:pb-10 md:pt-14">
      <div className="panel flex flex-col gap-6 px-5 py-7 sm:px-6 sm:py-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">Humaniser</p>
          <p className="max-w-lg text-sm leading-6 text-slate-600">
            Refine AI-assisted emails and research summaries so they read like considered human writing.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-3 text-sm text-slate-600">
          <Link href="/examples">Examples</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

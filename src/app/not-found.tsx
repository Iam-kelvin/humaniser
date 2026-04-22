import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container-shell page-fade flex min-h-screen items-center justify-center py-20">
      <div className="panel max-w-xl space-y-4 p-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">404</p>
        <h1 className="text-4xl font-semibold text-slate-900">This page drifted out of range.</h1>
        <p className="text-sm leading-7 text-slate-600">
          The route you requested does not exist, or it may have moved while the product was being updated.
        </p>
        <div className="flex justify-center gap-3">
          <ButtonLink href="/">Back home</ButtonLink>
          <ButtonLink href="/dashboard" variant="secondary">
            Open dashboard
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}

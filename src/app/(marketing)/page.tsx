import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

const valuePoints = [
  "Keeps your meaning",
  "Adapts to audience and tone",
  "Removes robotic phrasing",
  "Works for emails and research summaries",
];

export default function HomePage() {
  return (
    <div className="container-shell page-fade space-y-14 md:space-y-18">
      <section className="grid gap-10 pt-8 md:pt-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
        <div className="space-y-6">
          <Badge>Human-centred rewriting</Badge>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
              Rewrite AI-assisted text so it sounds natural, clear, and right for the person reading it.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Turn robotic drafts into polished emails and readable research summaries without changing what you mean.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/sign-up">Start free</ButtonLink>
            <ButtonLink href="/examples" variant="secondary">
              View examples
            </ButtonLink>
          </div>
          <div className="grid gap-3 pt-4 sm:grid-cols-2">
            {valuePoints.map((point) => (
              <div key={point} className="rounded-3xl border border-white/70 bg-white/70 px-4 py-4 text-sm font-medium text-slate-700">
                {point}
              </div>
            ))}
          </div>
        </div>
        <div className="panel overflow-hidden lg:self-start">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b border-[var(--line)] bg-slate-950 p-6 text-slate-100 md:border-b-0 md:border-r">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">Before</p>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                I wanted to reach out to follow up regarding the meeting yesterday and let you know that I am currently
                reviewing the next steps for the proposal. I believe there is meaningful value we can unlock if we are
                able to align on timelines soon.
              </p>
            </div>
            <div className="bg-[var(--surface-strong)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-strong)]">After</p>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                I wanted to follow up on yesterday&apos;s meeting and share where we are on the proposal. I&apos;m reviewing
                the next steps now, and if we align on timing soon, we can move this forward with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 pb-4 md:grid-cols-3">
        <div className="panel h-full p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Professional emails</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">Sharpen tone without flattening personality.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Move from generic draft language to a message that sounds composed, specific, and audience-aware.
          </p>
        </div>
        <div className="panel h-full p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Research summaries</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">Keep the signal. Lose the stiffness.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Preserve technical meaning while improving sentence rhythm, readability, and overall flow.
          </p>
        </div>
        <div className="panel h-full p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Plan-aware controls</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">From fast cleanup to full refinement.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Choose presets, tones, intensity, and instruction depth to match the situation instead of forcing one style.
          </p>
        </div>
      </section>
    </div>
  );
}

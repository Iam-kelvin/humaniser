import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

const valuePoints = [
  "Keeps your meaning",
  "Adapts to audience and tone",
  "Removes robotic phrasing",
  "Works for emails and research summaries",
];

const beforeSignals = [
  "Indirect opener",
  "Heavy phrasing",
  "Vague timeline",
];

const afterSignals = [
  "Clear purpose",
  "Natural tone",
  "Stronger next step",
];

export default function HomePage() {
  return (
    <div className="container-shell page-fade space-y-10 md:space-y-14">
      <section className="grid gap-8 pt-4 md:gap-10 md:pt-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
        <div className="space-y-6">
          <Badge>Human-centred rewriting</Badge>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
              Rewrite AI-assisted text so it sounds natural, clear, and right for the person reading it.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Turn robotic drafts into polished emails and readable research summaries without changing what you mean.
            </p>
          </div>
          <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
            <ButtonLink href="/sign-up" className="w-full min-[420px]:w-auto">
              Start free
            </ButtonLink>
            <ButtonLink href="/examples" variant="secondary" className="w-full min-[420px]:w-auto">
              View examples
            </ButtonLink>
          </div>
          <div className="grid gap-3 pt-4 sm:grid-cols-2">
            {valuePoints.map((point) => (
              <div key={point} className="rounded-2xl border border-white/70 bg-white/70 px-4 py-4 text-sm font-medium text-slate-700 sm:rounded-3xl">
                {point}
              </div>
            ))}
          </div>
        </div>
        <div className="panel overflow-hidden lg:self-start">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b border-[var(--line)] bg-slate-950 p-6 text-slate-100 md:border-b-0 md:border-r">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">Before</p>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {beforeSignals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300"
                    >
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                I wanted to reach out to follow up regarding the meeting yesterday and let you know that I am currently
                reviewing the next steps for the proposal. I believe there is meaningful value we can unlock if we are
                able to align on timelines soon.
              </p>
              <p className="mt-5 border-t border-white/8 pt-4 text-xs leading-6 text-slate-400">
                The meaning is there, but the message starts slowly and buries the action you want the reader to take.
              </p>
            </div>
            <div className="bg-[var(--surface-strong)] p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-strong)]">After</p>
                  <div className="h-px flex-1 bg-[color:color-mix(in_srgb,var(--brand)_18%,white)]" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {afterSignals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-full border border-[color:color-mix(in_srgb,var(--brand)_18%,white)] bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]"
                    >
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                I wanted to follow up on yesterday&apos;s meeting and share where we are on the proposal. I&apos;m reviewing
                the next steps now, and if we align on timing soon, we can move this forward with confidence.
              </p>
              <p className="mt-5 border-t border-[color:color-mix(in_srgb,var(--brand)_12%,white)] pt-4 text-xs leading-6 text-slate-500">
                Same intent, but the opener is tighter, the status is clearer, and the next-step urgency lands faster.
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

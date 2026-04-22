import { Badge } from "@/components/ui/badge";

const examples = [
  {
    title: "Email rewrite",
    before:
      "Hi Sarah, I hope this email finds you well. I wanted to reach out to follow up on the onboarding checklist and let you know that we are currently making progress on the remaining items.",
    after:
      "Hi Sarah, I wanted to follow up on the onboarding checklist. We are moving through the remaining items now and should have the last updates ready shortly.",
  },
  {
    title: "Research summary rewrite",
    before:
      "The study demonstrates that there are a number of statistically significant findings which indicate that participant adherence was associated with improved outcomes in the intervention cohort.",
    after:
      "The study found several statistically significant results, with better participant adherence linked to stronger outcomes in the intervention group.",
  },
];

const tones = [
  {
    tone: "Natural",
    copy: "Thanks for the update. I reviewed the draft and made a few changes so it reads more clearly for the client.",
  },
  {
    tone: "Professional",
    copy: "Thank you for the update. I reviewed the draft and made several edits to improve clarity for the client.",
  },
  {
    tone: "Warm",
    copy: "Thanks for the update. I went through the draft and made a few edits so it feels clearer and easier for the client to read.",
  },
];

export default function ExamplesPage() {
  return (
    <div className="container-shell page-fade space-y-10 pt-8 md:space-y-12 md:pt-10">
      <div className="space-y-4">
        <Badge>Examples</Badge>
        <h1 className="max-w-5xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Before and after, without changing the message.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-600">
          Humaniser is designed to preserve meaning while improving tone, flow, and audience fit.
        </p>
      </div>
      <div className="grid gap-6">
        {examples.map((example) => (
          <section key={example.title} className="panel overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="border-b border-[var(--line)] bg-slate-950 p-6 text-slate-100 md:border-b-0 md:border-r">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{example.title} / before</p>
                <p className="mt-4 text-sm leading-7 text-slate-300">{example.before}</p>
              </div>
              <div className="bg-[var(--surface)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">{example.title} / after</p>
                <p className="mt-4 text-sm leading-7 text-slate-700">{example.after}</p>
              </div>
            </div>
          </section>
        ))}
      </div>
      <section className="panel p-6 md:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Tone comparison</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {tones.map((example) => (
            <div key={example.tone} className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-lg font-semibold text-slate-900">{example.tone}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{example.copy}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

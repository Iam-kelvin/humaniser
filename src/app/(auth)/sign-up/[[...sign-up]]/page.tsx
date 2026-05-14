import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="container-shell page-fade flex min-h-screen items-center justify-center py-8 md:py-16">
      <div className="panel w-full max-w-5xl overflow-hidden">
        <div className="grid md:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[var(--brand)] p-6 text-white sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-100">Start free</p>
            <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Humanise your draft in a few focused steps.</h1>
            <p className="mt-4 text-sm leading-7 text-teal-50">
              Create your account to start rewriting emails and research summaries with plan-aware controls and saved history.
            </p>
          </div>
          <div className="flex min-w-0 items-center justify-center bg-[var(--surface)] p-4 sm:p-8">
            <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
          </div>
        </div>
      </div>
    </main>
  );
}

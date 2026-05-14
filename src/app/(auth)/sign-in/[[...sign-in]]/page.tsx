import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="container-shell page-fade flex min-h-screen items-center justify-center py-8 md:py-16">
      <div className="panel w-full max-w-5xl overflow-hidden">
        <div className="grid md:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-slate-950 p-6 text-slate-100 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">Welcome back</p>
            <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Refine the draft, not the meaning.</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Sign in to continue refining AI-assisted emails and research summaries with audience-aware controls.
            </p>
          </div>
          <div className="flex min-w-0 items-center justify-center bg-[var(--surface)] p-4 sm:p-8">
            <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
          </div>
        </div>
      </div>
    </main>
  );
}

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="container-shell page-fade flex min-h-screen items-center justify-center py-16">
      <div className="panel w-full max-w-5xl overflow-hidden">
        <div className="grid md:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-slate-950 p-10 text-slate-100">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">Welcome back</p>
            <h1 className="mt-4 text-4xl font-semibold">Refine the draft, not the meaning.</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Sign in to continue refining AI-assisted emails and research summaries with audience-aware controls.
            </p>
          </div>
          <div className="flex items-center justify-center bg-[var(--surface)] p-8">
            <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
          </div>
        </div>
      </div>
    </main>
  );
}

# Humaniser

Humaniser is a SaaS writing refinement app for rewriting AI-assisted emails and research summaries into natural, audience-aware writing without changing the intended meaning.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- Clerk authentication
- PostgreSQL + Prisma ORM
- Paddle-first billing abstraction
- Server Actions for settings and rewrite mutations

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Required values:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL`

Neon setup:

- Put your Neon pooled connection string in `DATABASE_URL`.
- Put your Neon direct / non-pooled connection string in `DATABASE_URL_UNPOOLED`.
- Keep only one `DATABASE_URL` entry in your local env file. If it appears twice, the later value wins.

Optional values for billing scaffolding:

- `PADDLE_API_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `PADDLE_PRO_PRICE_ID`
- `PADDLE_DEFAULT_CHECKOUT_URL`

Optional values for real AI rewrites:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_REASONING_EFFORT`

Rewrite provider notes:

- `HUMANISER_REWRITE_PROVIDER="mock"` keeps local development free and uses the built-in mock rewrite flow.
- `HUMANISER_REWRITE_PROVIDER="openai"` enables real AI rewrites when `OPENAI_API_KEY` is set.
- If `openai` is selected without an API key, the app falls back to `mock` so local rewrites keep working.

3. Generate Prisma Client:

```bash
npm run prisma:generate
```

4. Create and apply your first migration:

```bash
npm run prisma:migrate -- --name init
```

5. Seed demo content if you want a local account preloaded with history:

```bash
npm run prisma:seed
```

To seed a real demo user, set:

- `DEMO_USER_CLERK_ID`
- `DEMO_USER_EMAIL`

6. Start the app:

```bash
npm run dev
```

## Project Notes

- Marketing routes live under `src/app/(marketing)`.
- Auth routes live under `src/app/(auth)`.
- Product routes live under `src/app/(app)`.
- `proxy.ts` wires Clerk request handling for App Router server auth helpers.
- The rewrite engine is provider-neutral and defaults to the deterministic mock provider selected through `HUMANISER_REWRITE_PROVIDER`.
- Billing is abstracted behind a Paddle-first adapter with checkout, portal, and webhook integration points.

## Local Development

- Use Clerk development keys for `sign-in`, `sign-up`, and `UserButton`.
- The app syncs a local `User` and `Profile` record the first time an authenticated request hits the server.
- Free plan limits are enforced at both the UI and action layer.
- Pro-only features include all tones, all intensities, custom instructions, explain changes, full history access, and billing portal access.

## Verification Commands

```bash
npm run lint
npm run typecheck
npm run build
```

## Phase 2 TODO

- Document upload
- Browser extension
- Team workspace
- Brand voice profiles
- Lemon Squeezy support

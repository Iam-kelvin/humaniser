# Beta Checklist

Use this checklist before inviting private beta users into Humaniser.

## Product quality

- Verify rewrites on at least 15-20 representative user documents.
- Confirm structured letters preserve headers, salutations, spacing, and sign-offs.
- Confirm uploads work for PDF, DOCX, and text-based files.
- Review history and compare mode on real examples, not just seed data.

## Core infrastructure

- Confirm Clerk sign-up, sign-in, and session persistence work in production.
- Confirm database reads and writes work against the production database.
- Confirm rewrite usage limits and plan gating behave as expected.
- Confirm error boundaries show a useful recovery path.

## Billing readiness

- Set `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRO_PRICE_ID`, and `PADDLE_DEFAULT_CHECKOUT_URL`.
- Test upgrade checkout from a free account.
- Test webhook ingestion and subscription state sync.
- Test billing portal access for a paid user.

## AI rollout

- Decide whether beta users will use `mock` or `openai`.
- If using OpenAI, set `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_REASONING_EFFORT`.
- Measure real rewrite latency and cost on representative documents.
- Review failure handling when the external rewrite provider is unavailable.

## Launch ops

- Add basic analytics or error monitoring before wider rollout.
- Prepare a simple support channel for tester feedback.
- Write down the known limitations you are comfortable shipping with.
- Do one full end-to-end production smoke test before inviting users.

import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().optional());

const optionalUrl = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().url().optional());

const envSchema = z.object({
  DATABASE_URL: optionalString,
  CLERK_SECRET_KEY: optionalString,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: optionalString,
  NEXT_PUBLIC_APP_URL: optionalUrl,
  HUMANISER_REWRITE_PROVIDER: z.string().default("mock"),
  NEXT_PUBLIC_SHOW_READINESS_CHECKLIST: optionalString,
  GROQ_API_KEY: optionalString,
  GROQ_MODEL: optionalString,
  PADDLE_API_KEY: optionalString,
  PADDLE_WEBHOOK_SECRET: optionalString,
  PADDLE_PRO_PRICE_ID: optionalString,
  PADDLE_DEFAULT_CHECKOUT_URL: optionalUrl,
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}

export function requireEnv<K extends keyof AppEnv>(key: K) {
  const env = getEnv();
  const value = env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

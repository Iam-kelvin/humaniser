export const PLAN_CODES = ["FREE", "PRO"] as const;
export const BILLING_PROVIDERS = ["PADDLE", "LEMON_SQUEEZY"] as const;
export const SUBSCRIPTION_STATUSES = [
  "INCOMPLETE",
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "PAUSED",
] as const;
export const WRITING_PRESETS = ["EMAIL", "RESEARCH_SUMMARY", "GENERAL_WRITING"] as const;
export const TONES = ["NATURAL", "PROFESSIONAL", "WARM", "CONFIDENT", "CONCISE"] as const;
export const REWRITE_INTENSITIES = ["LIGHT", "MODERATE", "STRONG"] as const;
export const SOURCE_TYPES = ["PASTED_TEXT", "DOCUMENT_UPLOAD"] as const;
export const USAGE_EVENT_TYPES = [
  "REWRITE_CREATED",
  "REWRITE_REGENERATED",
  "PLAN_UPGRADE_STARTED",
  "PLAN_PORTAL_OPENED",
] as const;

export type PlanCode = (typeof PLAN_CODES)[number];
export type BillingProvider = (typeof BILLING_PROVIDERS)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export type WritingPreset = (typeof WRITING_PRESETS)[number];
export type Tone = (typeof TONES)[number];
export type RewriteIntensity = (typeof REWRITE_INTENSITIES)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];
export type UsageEventType = (typeof USAGE_EVENT_TYPES)[number];

export const PRESET_LABELS: Record<WritingPreset, string> = {
  EMAIL: "Email",
  RESEARCH_SUMMARY: "Research Summary",
  GENERAL_WRITING: "General Writing",
};

export const TONE_LABELS: Record<Tone, string> = {
  NATURAL: "Natural",
  PROFESSIONAL: "Professional",
  WARM: "Warm",
  CONFIDENT: "Confident",
  CONCISE: "Concise",
};

export const INTENSITY_LABELS: Record<RewriteIntensity, string> = {
  LIGHT: "Light",
  MODERATE: "Moderate",
  STRONG: "Strong",
};

export const PLAN_LABELS: Record<PlanCode, string> = {
  FREE: "Free",
  PRO: "Pro",
};

export const MARKETING_NAV = [
  { href: "/examples", label: "Examples" },
  { href: "/pricing", label: "Pricing" },
] as const;

export const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/new", label: "New Rewrite" },
  { href: "/dashboard/history", label: "History" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

export const DEFAULT_PADDLE_EVENTS = [
  "transaction.completed",
  "subscription.created",
  "subscription.updated",
  "subscription.canceled",
] as const;

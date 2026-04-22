import { cn } from "@/lib/utils";

export function StatusBanner({
  title,
  description,
  tone = "info",
}: {
  title: string;
  description: string;
  tone?: "info" | "warning" | "success";
}) {
  const tones = {
    info: "border-teal-200 bg-teal-50 text-teal-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  } as const;

  return (
    <div className={cn("rounded-3xl border p-4", tones[tone])}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 opacity-90">{description}</p>
    </div>
  );
}

import type { ReactNode } from "react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { requireViewer } from "@/lib/auth";
import { resolveCurrentPlan } from "@/lib/data/dashboard";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const viewer = await requireViewer();
  const planCode = await resolveCurrentPlan(viewer.user.id);

  return (
    <div className="container-shell page-fade py-8">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <AppSidebar planCode={planCode} />
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}

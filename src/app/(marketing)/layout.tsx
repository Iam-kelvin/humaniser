import type { ReactNode } from "react";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page-fade flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-16 pt-6 md:pb-20 md:pt-8">{children}</main>
      <SiteFooter />
    </div>
  );
}

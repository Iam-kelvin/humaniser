import { auth } from "@clerk/nextjs/server";

import { SiteHeaderNav } from "@/components/marketing/site-header-nav";

export async function SiteHeader() {
  const session = await auth();

  return <SiteHeaderNav signedIn={Boolean(session.userId)} />;
}

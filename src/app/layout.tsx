import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://humaniser.app"),
  title: {
    default: "Humaniser",
    template: "%s | Humaniser",
  },
  description:
    "Rewrite AI-assisted text so it sounds natural, clear, and right for the person reading it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-[var(--page)] text-slate-950">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}

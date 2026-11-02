import type { Metadata } from "next";
import "./globals.css";

import { AppSidebar } from "@/components/app-sidebar";
import { SETTINGS } from "@/lib/settings";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Alcon DC Risk Workbench",
  description:
    "High-level architecture of Alcon's distribution centers (ADC, JCD, EDC, EL) with a summary of the data and information received for each part.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex h-screen overflow-hidden bg-muted/30">
          <AppSidebar />

          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
              <Breadcrumbs />
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {SETTINGS.topBarTag}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
                  SE
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileStack, Grid3x3, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { DCS } from "@/lib/dc";
import { overallScore } from "@/lib/scoring";
import { SETTINGS } from "@/lib/settings";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const TOP: NavItem[] = [{ label: "Overview", href: "/", icon: Home }];
const BOTTOM: NavItem[] = [
  { label: "Scoring matrix", href: "/matrix", icon: Grid3x3 },
  { label: "Sources received", href: "/sources", icon: FileStack },
];

export function AppSidebar() {
  const pathname = usePathname();

  const link = (item: NavItem) => {
    const active = pathname === item.href;
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
        )}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-slate-950 md:text-slate-100">
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 font-bold text-white">
          A
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Alcon SCM / WMS</p>
          <p className="text-xs text-slate-400">DC Risk Workbench</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {TOP.map(link)}

        <p className="px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Distribution centers
        </p>
        {DCS.map((dc) => {
          const href = `/dc/${dc.slug}`;
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={dc.slug}
              href={href}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <span>{dc.name}</span>
              <span className={cn("text-[11px]", active ? "text-blue-100" : "text-slate-500")}>
                {overallScore(dc.slug).toFixed(1)}
              </span>
            </Link>
          );
        })}

        <div className="pt-5">{BOTTOM.map(link)}</div>
      </nav>

      <div className="border-t border-slate-800 px-6 py-4 text-xs text-slate-500">
        {SETTINGS.sidebarFooter}
      </div>
    </aside>
  );
}

import Link from "next/link";

import { DCS } from "@/lib/dc";
import { cn } from "@/lib/utils";

/** Pill row to jump between DCs while staying on the same kind of page. */
export function DcSwitcher({ slug, section = "" }: { slug: string; section?: string }) {
  return (
    <nav aria-label="Distribution centers" className="flex flex-wrap gap-2">
      {DCS.map((d) => (
        <Link
          key={d.slug}
          href={`/dc/${d.slug}${section}`}
          aria-current={d.slug === slug ? "page" : undefined}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            d.slug === slug
              ? "border-blue-600 bg-blue-600 text-white"
              : "bg-white text-slate-700 hover:border-blue-500"
          )}
        >
          {d.name}
        </Link>
      ))}
    </nav>
  );
}

/** The two menu options behind "Show details". */
export function ViewSwitch({
  slug,
  active,
}: {
  slug: string;
  active: "architecture" | "breakup";
}) {
  const items = [
    { id: "architecture", label: "Architecture" },
    { id: "breakup", label: "Breakup" },
  ] as const;
  return (
    <div role="tablist" aria-label="Detail view" className="inline-flex rounded-lg border bg-white p-1">
      {items.map((it) => (
        <Link
          key={it.id}
          href={`/dc/${slug}/${it.id}`}
          role="tab"
          aria-selected={active === it.id}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
            active === it.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          )}
        >
          {it.label}
        </Link>
      ))}
    </div>
  );
}

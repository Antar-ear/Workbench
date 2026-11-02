"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import React from "react";
import { DCS } from "@/lib/dc";
import { AREAS } from "@/lib/scoring";

function labelFor(segment: string): string {
  if (segment === "dc") return "Distribution centers";
  if (segment === "sources") return "Sources received";
  if (segment === "matrix") return "Scoring matrix";
  if (segment === "details") return "Details";
  if (segment === "architecture") return "Architecture";
  if (segment === "breakup") return "Breakup";
  const area = AREAS.find((a) => a.id === segment);
  if (area) return area.name;
  const dc = DCS.find((d) => d.slug === segment);
  if (dc) return dc.name;
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href="/" className="flex items-center gap-1 hover:text-foreground">
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>
      {segments.map((segment, i) => {
        const isLast = i === segments.length - 1;
        // "/dc" itself has no page; link it back to the overview.
        const href = segment === "dc" ? "/" : "/" + segments.slice(0, i + 1).join("/");
        return (
          <React.Fragment key={segment + i}>
            <ChevronRight className="h-4 w-4 opacity-50" />
            {isLast ? (
              <span className="font-medium text-foreground">{labelFor(segment)}</span>
            ) : (
              <Link href={href} className="hover:text-foreground">
                {labelFor(segment)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Cog, LayoutGrid, Server, Shield, type LucideIcon } from "lucide-react";

import { DcSwitcher, ViewSwitch } from "@/components/dc-nav";
import { EvidenceChip, ScoreBar, ScoreChip } from "@/components/score-ui";
import { DCS, getDc } from "@/lib/dc";
import { AREAS, MAX_SCORE, areaScore, evidenceCoverage, topDrivers, type AreaId } from "@/lib/scoring";

const ICONS: Record<AreaId, LucideIcon> = {
  wms: Cog,
  infra: Server,
  cyber: Shield,
};

export function generateStaticParams() {
  return DCS.map((d) => ({ slug: d.slug }));
}

export default function BreakupPage({ params }: { params: { slug: string } }) {
  const dc = getDc(params.slug);
  if (!dc) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DcSwitcher slug={dc.slug} section="/breakup" />
        <ViewSwitch slug={dc.slug} active="breakup" />
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{dc.name} breakup</h1>
        <p className="text-muted-foreground">
          {AREAS.length} areas, each scored 1 to {MAX_SCORE}. Open one to see the criteria behind its score.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {AREAS.map((a) => {
          const Icon = ICONS[a.id] ?? LayoutGrid;
          const score = areaScore(dc.slug, a.id);
          const cov = Math.round(evidenceCoverage(dc.slug, a.id) * 100);
          const drivers = topDrivers(dc.slug, a.id, 2);
          return (
            <Link key={a.id} href={`/dc/${dc.slug}/breakup/${a.id}`} className="group">
              <div className="flex h-full flex-col gap-4 rounded-xl border bg-white p-6 transition-all group-hover:border-blue-500 group-hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold">{a.name}</h2>
                  </div>
                  <ScoreChip score={score} />
                </div>

                <ScoreBar score={score} />

                <p className="text-sm leading-relaxed text-slate-600">{a.scope}</p>

                <div className="space-y-2 border-t pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Biggest drivers
                  </p>
                  {drivers.map(({ c, r }) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-800">{c.label}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <EvidenceChip basis={r.basis} />
                        <span className="w-5 text-right font-semibold tabular-nums">{r.score}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
                  <span>Evidence behind score: {cov}%</span>
                  <span className="flex items-center gap-1 font-medium text-blue-700">
                    Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

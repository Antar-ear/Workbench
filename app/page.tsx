import Link from "next/link";
import { ArrowRight, FileStack, Grid3x3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScoreChip, ScoreRing } from "@/components/score-ui";
import { DCS } from "@/lib/dc";
import { SETTINGS } from "@/lib/settings";
import { AREAS, CRITERIA, areaScore, evidenceCoverage, overallScore } from "@/lib/scoring";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6 lg:p-10">
      <section className="space-y-3">
        <Badge variant="secondary" className="w-fit">
          SCM / WMS Modernization Readiness Assessment
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">DC Risk Workbench</h1>
        <p className="max-w-3xl text-muted-foreground">
          Choose a distribution center to see its risk score, from 1 to 10 where 10 is most risk.
          From there you can open its architecture, or break the score into WMS, Infrastructure,
          Enterprise and Cybersecurity. {SETTINGS.overviewNote}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {DCS.map((dc) => {
          const overall = overallScore(dc.slug);
          return (
            <Link key={dc.slug} href={`/dc/${dc.slug}`} className="group">
              <div className="flex h-full flex-col gap-4 rounded-xl border bg-white p-6 transition-all group-hover:border-blue-500 group-hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{dc.name}</h2>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                    <p className="text-sm text-slate-600">{dc.fullName}</p>
                    <p className="text-xs text-slate-500">{dc.platform}</p>
                  </div>
                  <ScoreRing score={overall} size={96} label={false} />
                </div>

                <ul className="grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-4">
                  {AREAS.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-slate-600">{a.name}</span>
                      <ScoreChip score={areaScore(dc.slug, a.id)} className="px-1.5 py-0 text-xs" />
                    </li>
                  ))}
                </ul>

                <p className="mt-auto flex items-center gap-2 text-xs text-slate-500">
                  Evidence behind the score: {Math.round(evidenceCoverage(dc.slug) * 100)}%
                  {evidenceCoverage(dc.slug) * 100 < SETTINGS.provisionalBelow && (
                    <span className="rounded border border-amber-300 bg-amber-50 px-1.5 py-px font-medium text-amber-900">
                      Provisional
                    </span>
                  )}
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/matrix"
          className="flex items-center gap-3 rounded-lg border bg-white p-4 text-sm transition-colors hover:border-blue-500"
        >
          <Grid3x3 className="h-5 w-5 text-blue-600" />
          <span>
            <span className="font-medium">Scoring matrix.</span>{" "}
            <span className="text-muted-foreground">All {CRITERIA.length} criteria for all {DCS.length} DCs, and how the score is built.</span>
          </span>
          <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
        <Link
          href="/sources"
          className="flex items-center gap-3 rounded-lg border bg-white p-4 text-sm transition-colors hover:border-blue-500"
        >
          <FileStack className="h-5 w-5 text-blue-600" />
          <span>
            <span className="font-medium">Sources received.</span>{" "}
            <span className="text-muted-foreground">Every document behind the scores and diagrams.</span>
          </span>
          <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      </section>
    </div>
  );
}

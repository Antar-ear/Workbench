import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Info } from "lucide-react";

import { SETTINGS } from "@/lib/settings";
import { DcSwitcher } from "@/components/dc-nav";
import { ScoreChip, ScoreRing, ScoreBar } from "@/components/score-ui";
import { DCS, getDc } from "@/lib/dc";
import {
  AREAS,
  areaScore,
  evidenceCoverage,
  overallScore,
  topDrivers,
  MAX_SCORE,
  UNVERIFIED_DEFAULT,
} from "@/lib/scoring";

export function generateStaticParams() {
  return DCS.map((d) => ({ slug: d.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const dc = getDc(params.slug);
  return { title: dc ? `${dc.name} risk score · Alcon DC Workbench` : "Not found" };
}

export default function DcScorePage({ params }: { params: { slug: string } }) {
  const dc = getDc(params.slug);
  if (!dc) notFound();

  const overall = overallScore(dc.slug);
  const coverage = Math.round(evidenceCoverage(dc.slug) * 100);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 lg:p-10">
      <DcSwitcher slug={dc.slug} />

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Risk score, 1 to {MAX_SCORE} ({MAX_SCORE} is most risk)
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{dc.name}</h1>
        <p className="text-muted-foreground">{dc.fullName}</p>
        <p className="text-sm text-slate-500">{dc.platform}</p>
      </header>

      <section className="grid gap-6 rounded-xl border bg-white p-6 md:grid-cols-[auto_1fr] md:items-center md:p-8">
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={overall} size={184} />
          <span className="text-xs text-slate-500">Overall risk for {dc.name}</span>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">Score by area</h2>
          <ul className="space-y-3">
            {AREAS.map((a) => {
              const s = areaScore(dc.slug, a.id);
              return (
                <li key={a.id} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3">
                  <span className="text-sm font-medium text-slate-700">{a.name}</span>
                  <ScoreBar score={s} />
                  <ScoreChip score={s} />
                </li>
              );
            })}
          </ul>
          <p className="flex items-start gap-2 rounded-md bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>
              Evidence behind this score: <strong className="text-slate-800">{coverage}%</strong>.
              {coverage < SETTINGS.provisionalBelow && <strong className="text-amber-800">Provisional. </strong>}
              {SETTINGS.scoreNotice} Anything we hold nothing on is scored at{" "}
              {UNVERIFIED_DEFAULT} and marked Not received.
            </span>
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-800">What pushes the score up</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {AREAS.flatMap((a) =>
            topDrivers(dc.slug, a.id, 1).map(({ c, r }) => (
              <li key={c.id} className="rounded-lg border bg-white p-4 text-sm">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {a.name}
                  </span>
                  <ScoreChip score={r.score} />
                </div>
                <p className="font-medium text-slate-900">{c.label}</p>
                <p className="mt-1 leading-relaxed text-slate-600">{r.why}</p>
              </li>
            ))
          )}
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/dc/${dc.slug}/details`}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Show details
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/matrix" className="text-sm text-blue-700 hover:underline">
          How the score is built
        </Link>
      </div>
    </div>
  );
}

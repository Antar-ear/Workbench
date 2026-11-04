import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { DcSwitcher, ViewSwitch } from "@/components/dc-nav";
import { EvidenceChip, ScoreBar, ScoreChip, ScoreRing } from "@/components/score-ui";
import { DCS, getDc } from "@/lib/dc";
import {
  AREAS,
  areaScore,
  criteriaFor,
  evidenceCoverage,
  getArea,
  ratingFor,
  subRatingFor,
  UNVERIFIED_DEFAULT,
  type Rating,
} from "@/lib/scoring";
import { getSource } from "@/lib/sources";

export function generateStaticParams() {
  return DCS.flatMap((d) => AREAS.map((a) => ({ slug: d.slug, area: a.id })));
}

export default function AreaPage({ params }: { params: { slug: string; area: string } }) {
  const dc = getDc(params.slug);
  const area = getArea(params.area);
  if (!dc || !area) notFound();

  const score = areaScore(dc.slug, area.id);
  const cov = Math.round(evidenceCoverage(dc.slug, area.id) * 100);
  const rows = criteriaFor(area.id).map((c) => ({ c, r: ratingFor(dc.slug, c.id) }));
  const nodeLabel = (id: string) => dc.nodes.find((n) => n.id === id)?.label ?? id;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 lg:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DcSwitcher slug={dc.slug} section={`/breakup/${area.id}`} />
        <ViewSwitch slug={dc.slug} active="breakup" />
      </div>

      {/* Other areas */}
      <nav aria-label="Areas" className="flex flex-wrap gap-2">
        {AREAS.map((a) => (
          <Link
            key={a.id}
            href={`/dc/${dc.slug}/breakup/${a.id}`}
            aria-current={a.id === area.id ? "page" : undefined}
            className={
              a.id === area.id
                ? "rounded-md border border-slate-900 bg-slate-900 px-3 py-1 text-sm font-medium text-white"
                : "rounded-md border bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:border-slate-400"
            }
          >
            {a.name}
          </Link>
        ))}
      </nav>

      <header className="flex flex-wrap items-center gap-6 rounded-xl border bg-white p-6">
        <ScoreRing score={score} size={128} />
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {dc.name} · {area.name}
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">{area.scope}</p>
          <p className="text-xs text-slate-500">
            Evidence behind this score: {cov}%.
          </p>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Scoring breakdown ({rows.length} criteria)
        </h2>
        <ul className="space-y-3">
          {rows.map(({ c, r }) => (
            <li key={c.id}>
              <details className="group rounded-lg border bg-white open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center gap-4 p-4 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">{c.id}</span>
                      <span className="font-medium text-slate-900">{c.label}</span>
                      <EvidenceChip basis={r.basis} />
                    </div>
                    <div className="mt-2 max-w-xs">
                      <ScoreBar score={r.score} />
                    </div>
                  </div>
                  <ScoreChip score={r.score} />
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>

                <div className="space-y-4 border-t px-4 py-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Question this answers
                    </p>
                    <p className="mt-1 text-slate-700">{c.asks || "-"}</p>
                  </div>

                  {r.derivedFrom !== undefined && (
                    <p className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-900">
                      This score is the average of {r.derivedFrom} scored sub-categor{r.derivedFrom === 1 ? "y" : "ies"}.
                    </p>
                  )}

                  {c.subs.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Sub-categories ({c.subs.length})
                      </p>
                      <ul className="mt-2 space-y-2">
                        {c.subs.map((s, i) => {
                          const sr = subRatingFor(dc.slug, c.id, i);
                          return (
                            <li key={`${c.id}-${i}`}>
                              <details className="group/sub rounded-md border bg-slate-50">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
                                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-400">
                                      {c.id}.{i + 1}
                                    </span>
                                    <span className="font-medium text-slate-900">{s.label}</span>
                                    <EvidenceChip basis={sr.basis} />
                                  </span>
                                  <span className="flex shrink-0 items-center gap-3">
                                    {sr.scored ? (
                                      <ScoreChip score={sr.score} />
                                    ) : (
                                      <span className="text-xs text-slate-400">Not scored</span>
                                    )}
                                    <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open/sub:rotate-180" />
                                  </span>
                                </summary>
                                <div className="space-y-4 border-t bg-white px-3 py-3">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Question this answers
                                    </p>
                                    <p className="mt-1 text-slate-700">{s.asks || "-"}</p>
                                  </div>
                                  <RatingBody r={sr} dc={dc} nodeLabel={nodeLabel} />
                                </div>
                              </details>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  <RatingBody r={r} dc={dc} nodeLabel={nodeLabel} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function RatingBody({
  r,
  dc,
  nodeLabel,
}: {
  r: Rating;
  dc: { slug: string };
  nodeLabel: (id: string) => string;
}) {
  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Why this score
        </p>
        <p className="mt-1 leading-relaxed text-slate-700">{r.why || "-"}</p>
        {r.basis === "not-received" && (
          <p className="mt-2 rounded bg-rose-50 px-2 py-1 text-xs text-rose-800">
            We hold nothing on this, so it carries the default of {UNVERIFIED_DEFAULT}.
            It is a flag, not a finding.
          </p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Needed to firm it up
        </p>
        <p className="mt-1 leading-relaxed text-slate-700">{r.next || "-"}</p>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3">
        {r.nodes.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Parts of the architecture
            </p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {r.nodes.map((id) => (
                <li key={id}>
                  <Link
                    href={`/dc/${dc.slug}/architecture`}
                    className="rounded border bg-slate-50 px-2 py-0.5 text-xs text-slate-700 hover:border-blue-500"
                  >
                    {nodeLabel(id)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sources
          </p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {r.sources.map((id) => (
              <li key={id}>
                <Link
                  href={`/sources#${id}`}
                  title={getSource(id)?.title ?? id}
                  className="block max-w-[15rem] truncate rounded border bg-slate-50 px-2 py-0.5 text-xs text-slate-700 hover:border-blue-500"
                >
                  {getSource(id)?.title ?? id}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

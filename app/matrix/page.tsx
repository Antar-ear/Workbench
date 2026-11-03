import Link from "next/link";

import { ScoreCell } from "@/components/score-ui";
import { DCS } from "@/lib/dc";
import {
  AREAS,
  BANDS,
  MAX_SCORE,
  UNVERIFIED_DEFAULT,
  areaScore,
  CRITERIA,
  criteriaFor,
  evidenceCoverage,
  overallScore,
  ratingFor,
} from "@/lib/scoring";
import { SETTINGS } from "@/lib/settings";
import { EVIDENCE_META } from "@/lib/types";

export const metadata = { title: "Scoring matrix · Alcon DC Workbench" };

export default function MatrixPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6 lg:p-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Scoring matrix</h1>
        <p className="max-w-3xl text-muted-foreground">
          Every DC is scored from 1 to {MAX_SCORE} on {CRITERIA.length} criteria across {AREAS.length} areas. {MAX_SCORE} is the most
          risk.
        </p>
        {SETTINGS.scoreNotice && (
          <p className="max-w-3xl rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">
            {SETTINGS.scoreNotice} A criterion we hold nothing on is scored at {UNVERIFIED_DEFAULT} and
            shown with a dashed outline. Re-score when answers arrive.
          </p>
        )}
      </header>

      {/* Matrix */}
      <section className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">Criterion</th>
              <th className="px-2 py-3 font-semibold">Question it answers</th>
              <th className="px-2 py-3 text-center font-semibold">Weight</th>
              {DCS.map((d) => (
                <th key={d.slug} className="px-2 py-3 text-center font-semibold">
                  <Link href={`/dc/${d.slug}`} className="hover:text-blue-700 hover:underline">
                    {d.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AREAS.map((a) => (
              <AreaRows key={a.id} areaId={a.id} />
            ))}
            <tr className="border-t-2 border-slate-300 bg-slate-100">
              <td className="px-4 py-3 font-bold" colSpan={3}>
                Overall risk score
              </td>
              {DCS.map((d) => (
                <td key={d.slug} className="px-2 py-3 text-center">
                  <ScoreCell score={overallScore(d.slug)} />
                </td>
              ))}
            </tr>
            <tr className="bg-white">
              <td className="px-4 py-2 text-xs text-slate-500" colSpan={3}>
                Evidence behind the score
              </td>
              {DCS.map((d) => (
                <td key={d.slug} className="px-2 py-2 text-center text-xs text-slate-600">
                  {Math.round(evidenceCoverage(d.slug) * 100)}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      {/* Method */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">How a score is built</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
            <li>Each criterion gets a score from 1 to {MAX_SCORE} for each DC, with the reason and the evidence behind it.</li>
            <li>Criteria carry a weight of 1 to 5 inside their area. An area score is the weighted mean of its criteria.</li>
            <li>
              The overall score is the weighted mean of the areas:{" "}
              {AREAS.map((a) => `${a.name} ${Math.round(a.weight * 100)}%`).join(", ")}.
            </li>
            <li>Scores are shown to one decimal place. Criterion scores are whole numbers.</li>
          </ol>
          <p className="text-xs text-slate-500">
            The weights and the default of {UNVERIFIED_DEFAULT} are judgment calls by the assessor.
            They are set in the Excel data file and can be changed there.
          </p>
        </div>

        <div className="space-y-3 rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Reading a score</h2>
          <ul className="space-y-2 text-sm">
            {(Object.keys(BANDS) as (keyof typeof BANDS)[]).map((k) => (
              <li key={k} className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-sm ${BANDS[k].fill}`} />
                <span className="w-20 font-medium">{BANDS[k].label}</span>
                <span className="text-slate-600">{BANDS[k].range}</span>
              </li>
            ))}
          </ul>
          <h3 className="pt-2 text-sm font-semibold">Evidence behind each criterion</h3>
          <ul className="space-y-1.5 text-sm">
            {(Object.keys(EVIDENCE_META) as (keyof typeof EVIDENCE_META)[]).map((k) => (
              <li key={k} className="flex items-start gap-2 text-slate-700">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${EVIDENCE_META[k].dot}`} />
                <span>
                  <span className="font-medium">{EVIDENCE_META[k].label}.</span>{" "}
                  {EVIDENCE_META[k].hint}.
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500">
            Evidence behind a score counts Documented and Reported as full, Partial as half and Not
            received as zero, weighted by criterion.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What each area covers</h2>
        <dl className="grid gap-3 md:grid-cols-2">
          {AREAS.map((a) => (
            <div key={a.id} className="rounded-lg border bg-white p-4 text-sm">
              <dt className="font-semibold">
                {a.name} <span className="font-normal text-slate-500">({Math.round(a.weight * 100)}% of overall)</span>
              </dt>
              <dd className="mt-1 leading-relaxed text-slate-600">{a.scope}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function AreaRows({ areaId }: { areaId: (typeof AREAS)[number]["id"] }) {
  const area = AREAS.find((a) => a.id === areaId)!;
  return (
    <>
      <tr className="border-t bg-slate-50/70">
        <td className="px-4 py-2 text-sm font-semibold text-slate-800" colSpan={3}>
          {area.name}
        </td>
        {DCS.map((d) => (
          <td key={d.slug} className="px-2 py-2 text-center">
            <ScoreCell score={areaScore(d.slug, area.id)} />
          </td>
        ))}
      </tr>
      {criteriaFor(area.id).map((c) => (
        <tr key={c.id} className="border-t">
          <td className="px-4 py-2 text-slate-800">
            <span className="mr-2 text-xs text-slate-400">{c.id}</span>
            {c.label}
            {c.subs.length > 0 && (
              <ul className="mt-1 list-disc space-y-0.5 pl-9 text-xs text-slate-500">
                {c.subs.map((s, i) => (
                  <li key={i}>{s.label}</li>
                ))}
              </ul>
            )}
          </td>
          <td className="px-2 py-2 text-xs text-slate-500">{c.asks || "-"}</td>
          <td className="px-2 py-2 text-center text-xs text-slate-500">{c.weight}</td>
          {DCS.map((d) => {
            const r = ratingFor(d.slug, c.id);
            return (
              <td key={d.slug} className="px-2 py-2 text-center">
                <Link href={`/dc/${d.slug}/breakup/${area.id}`}>
                  <ScoreCell score={r.score} basis={r.basis} />
                </Link>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

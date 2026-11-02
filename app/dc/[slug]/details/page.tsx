import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, LayoutGrid, Network } from "lucide-react";

import { DcSwitcher } from "@/components/dc-nav";
import { ScoreChip } from "@/components/score-ui";
import { DCS, getDc } from "@/lib/dc";
import { AREAS, CRITERIA, overallScore } from "@/lib/scoring";

export function generateStaticParams() {
  return DCS.map((d) => ({ slug: d.slug }));
}

export default function DetailsMenu({ params }: { params: { slug: string } }) {
  const dc = getDc(params.slug);
  if (!dc) notFound();

  const options = [
    {
      href: `/dc/${dc.slug}/architecture`,
      icon: Network,
      title: "Architecture",
      text: `High-level drawing of ${dc.name}. Click any part to see the data and information received for it.`,
      meta: `${dc.nodes.length} parts`,
    },
    {
      href: `/dc/${dc.slug}/breakup`,
      icon: LayoutGrid,
      title: "Breakup",
      text: `${dc.name} split into WMS, Infrastructure, Enterprise and Cybersecurity. Each has its own score and a scoring breakdown.`,
      meta: `${AREAS.length} areas, ${CRITERIA.length} criteria`,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 lg:p-10">
      <DcSwitcher slug={dc.slug} section="/details" />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{dc.name} details</h1>
          <p className="text-muted-foreground">How would you like to look at {dc.name}?</p>
        </div>
        <Link href={`/dc/${dc.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          Overall score <ScoreChip score={overallScore(dc.slug)} />
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((o) => {
          const Icon = o.icon;
          return (
            <Link key={o.href} href={o.href} className="group">
              <div className="flex h-full flex-col rounded-xl border bg-white p-6 transition-all group-hover:border-blue-500 group-hover:shadow-md">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">{o.title}</h2>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-600">{o.text}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{o.meta}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

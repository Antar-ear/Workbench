import { notFound } from "next/navigation";
import { CheckCircle2, CircleDashed } from "lucide-react";

import { EstateDiagram } from "@/components/estate-diagram";
import { DcSwitcher, ViewSwitch } from "@/components/dc-nav";
import { Badge } from "@/components/ui/badge";
import { DCS, getDc } from "@/lib/dc";

export function generateStaticParams() {
  return DCS.map((d) => ({ slug: d.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const dc = getDc(params.slug);
  return { title: dc ? `${dc.name} architecture · Alcon DC Workbench` : "Not found" };
}

export default function DcPage({ params }: { params: { slug: string } }) {
  const dc = getDc(params.slug);
  if (!dc) notFound();

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-6 lg:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DcSwitcher slug={dc.slug} section="/architecture" />
        <ViewSwitch slug={dc.slug} active="architecture" />
      </div>

      <header className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{dc.name} architecture</h1>
          <span className="text-muted-foreground">{dc.fullName}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{dc.platform}</Badge>
        </div>
        <p className="max-w-4xl text-sm leading-relaxed text-slate-600">
          <span className="font-medium text-slate-800">Hosting: </span>
          {dc.hosting}
        </p>
        <p className="max-w-4xl text-sm leading-relaxed text-slate-600">
          <span className="font-medium text-slate-800">Coverage: </span>
          {dc.coverage}
        </p>
      </header>

      <EstateDiagram />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Received for {dc.name}
          </h2>
          <ul className="space-y-2 text-sm text-slate-700">
            {dc.receivedDocs.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <CircleDashed className="h-4 w-4 text-rose-500" />
            Not yet received for {dc.name}
          </h2>
          <ul className="space-y-2 text-sm text-slate-700">
            {dc.missingDocs.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

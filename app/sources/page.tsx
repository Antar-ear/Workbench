import { SOURCES } from "@/lib/sources";
import { DCS } from "@/lib/dc";
import Link from "next/link";

export const metadata = { title: "Sources received · Alcon DC Workbench" };

export default function SourcesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Sources received</h1>
        <p className="max-w-3xl text-muted-foreground">
          Everything the architecture diagrams are built from, with the DCs each source
          covers and how far it can be relied on. Node panels link here.
        </p>
      </header>

      <ul className="space-y-3">
        {SOURCES.map((s) => (
          <li
            key={s.id}
            id={s.id}
            className="scroll-mt-6 rounded-lg border bg-white p-5 target:border-blue-500 target:ring-2 target:ring-blue-500/20"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{s.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {s.kind} · {s.version}
                </p>
              </div>
              <div className="flex gap-1.5">
                {DCS.map((d) => {
                  const on = s.covers.includes(d.slug);
                  return (
                    <Link
                      key={d.slug}
                      href={`/dc/${d.slug}`}
                      className={
                        on
                          ? "rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700"
                          : "rounded border border-dashed px-2 py-0.5 text-xs text-slate-300"
                      }
                      aria-label={`${d.name}: ${on ? "covered" : "not covered"}`}
                    >
                      {d.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{s.gist}</p>
            {s.caveat && (
              <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900">
                {s.caveat}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

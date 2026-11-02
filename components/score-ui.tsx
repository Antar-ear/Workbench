import { BANDS, bandOf } from "@/lib/scoring";
import { EVIDENCE_META, type Evidence } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Round gauge for a 1 to 10 score. The band name is always printed, never colour alone. */
export function ScoreRing({
  score,
  size = 168,
  label = true,
}: {
  score: number;
  size?: number;
  label?: boolean;
}) {
  const band = BANDS[bandOf(score)];
  const stroke = Math.max(8, Math.round(size / 14));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score, 0), 10) / 10;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Risk score ${score.toFixed(1)} out of 10, ${band.label}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={band.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className={cn("font-bold tabular-nums", band.text)} style={{ fontSize: size * 0.3 }}>
          {score.toFixed(1)}
        </span>
        <span className="mt-1 text-slate-500" style={{ fontSize: Math.max(10, size * 0.075) }}>
          out of 10
        </span>
        {label && (
          <span className={cn("mt-2 font-semibold", band.text)} style={{ fontSize: Math.max(11, size * 0.09) }}>
            {band.label}
          </span>
        )}
      </div>
    </div>
  );
}

export function ScoreChip({ score, className }: { score: number; className?: string }) {
  const band = BANDS[bandOf(score)];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-sm font-semibold tabular-nums",
        band.chip,
        className
      )}
    >
      {Number.isInteger(score) ? score : score.toFixed(1)}
      <span className="text-[11px] font-medium">{band.label}</span>
    </span>
  );
}

/** 10-segment bar. */
export function ScoreBar({ score }: { score: number }) {
  const band = BANDS[bandOf(score)];
  return (
    <div className="flex h-2 w-full gap-0.5" aria-hidden>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={cn("h-full flex-1 rounded-sm", i < Math.round(score) ? band.fill : "bg-slate-200")}
        />
      ))}
    </div>
  );
}

export function EvidenceChip({ basis }: { basis: Evidence }) {
  const m = EVIDENCE_META[basis];
  return (
    <span
      title={m.hint}
      className={cn("inline-flex items-center rounded border px-1.5 py-px text-[11px] font-medium", m.chip)}
    >
      {m.label}
    </span>
  );
}

/** Heatmap cell for the matrix. */
export function ScoreCell({ score, basis }: { score: number; basis?: Evidence }) {
  const b = bandOf(score);
  const tint: Record<string, string> = {
    low: "bg-emerald-100 text-emerald-900",
    moderate: "bg-yellow-100 text-yellow-900",
    high: "bg-orange-100 text-orange-900",
    critical: "bg-red-200 text-red-900",
  };
  return (
    <span
      className={cn(
        "inline-flex min-w-[3rem] items-center justify-center rounded-md px-2 py-1 text-sm font-semibold tabular-nums",
        tint[b],
        basis === "not-received" && "outline-dashed outline-1 outline-slate-500"
      )}
      title={basis ? `${BANDS[b].label}. Evidence: ${EVIDENCE_META[basis].label}` : BANDS[b].label}
    >
      {Number.isInteger(score) ? score : score.toFixed(1)}
    </span>
  );
}

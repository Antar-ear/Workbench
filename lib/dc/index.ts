import type { Dc, Evidence } from "../types";
import data from "../generated/workbench-data.json";

/** Typed in data/Workbench-Data.xlsx (tabs 4 to 6 and 9), not here. */
export const DCS = data.dcs as unknown as Dc[];
export const getDc = (slug: string) => DCS.find((d) => d.slug === slug);

export function evidenceCounts(dc: Dc): Record<Evidence, number> {
  const out: Record<Evidence, number> = {
    documented: 0,
    reported: 0,
    partial: 0,
    "not-received": 0,
  };
  for (const n of dc.nodes) out[n.evidence] += 1;
  return out;
}

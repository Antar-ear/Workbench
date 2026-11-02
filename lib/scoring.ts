import type { Evidence } from "./types";
import data from "./generated/workbench-data.json";

/**
 * Risk scoring matrix.
 *
 * Every distribution center is scored 1 to 10 (10 = most risk) on a set of criteria
 * grouped into areas. Area score = weighted mean of its criteria. Overall score =
 * weighted mean of the areas.
 *
 * NOTHING IS TYPED IN THIS FILE. The areas, criteria, weights and every rating come
 * from data/Workbench-Data.xlsx (see README), via lib/generated/workbench-data.json.
 * This file only holds the types and the maths.
 */

export type AreaId = "wms" | "infra" | "enterprise" | "cyber";

export interface AreaDef {
  id: AreaId;
  name: string;
  /** Weight of the area in the overall score. Sums to 1 across areas. */
  weight: number;
  /** What this area covers, in plain words. */
  scope: string;
  /** Questionnaire sections that feed it. */
  sections: string;
}

export interface CriterionDef {
  id: string;
  area: AreaId;
  label: string;
  /** The question the criterion answers. */
  asks: string;
  /** Questionnaire items that feed it. */
  refs: string;
  /** Weight inside its area (1 to 3). */
  weight: number;
}

export interface Rating {
  score: number;
  /** How well what we hold backs the score. Reuses the evidence levels of the diagrams. */
  basis: Evidence;
  /** Why this score, in one or two sentences. */
  why: string;
  /** What to ask Alcon, or which document to request, to firm the score up. */
  next: string;
  /** Architecture part ids (see lib/dc/*.ts) the score draws on. */
  nodes: string[];
  /** Source ids (see lib/sources.ts). */
  sources: string[];
}

/** Score given when we hold nothing for a criterion. A flag, not a finding. Set in the Excel file. */
export const UNVERIFIED_DEFAULT: number = data.settings.defaultScore;

export const AREAS = data.areas as unknown as AreaDef[];

export const CRITERIA = data.criteria as unknown as CriterionDef[];

export type BandId = "low" | "moderate" | "high" | "critical";

export const BANDS: Record<
  BandId,
  { label: string; range: string; chip: string; fill: string; text: string; ring: string }
> = {
  low: { label: "Low", range: "1 to 3.9", chip: "bg-emerald-50 text-emerald-800 border-emerald-200", fill: "bg-emerald-500", text: "text-emerald-700", ring: "#10b981" },
  moderate: { label: "Moderate", range: "4 to 5.9", chip: "bg-yellow-50 text-yellow-900 border-yellow-300", fill: "bg-yellow-400", text: "text-yellow-700", ring: "#eab308" },
  high: { label: "High", range: "6 to 7.9", chip: "bg-orange-50 text-orange-900 border-orange-300", fill: "bg-orange-500", text: "text-orange-700", ring: "#f97316" },
  critical: { label: "Critical", range: "8 to 10", chip: "bg-red-50 text-red-800 border-red-300", fill: "bg-red-600", text: "text-red-700", ring: "#dc2626" },
};

export function bandOf(score: number): BandId {
  if (score < 4) return "low";
  if (score < 6) return "moderate";
  if (score < 8) return "high";
  return "critical";
}

/** Ratings per DC slug, per criterion id. */
export const RATINGS = data.ratings as unknown as Record<string, Record<string, Rating>>;

// ---------------------------------------------------------------- maths

const EVIDENCE_SHARE: Record<Evidence, number> = {
  documented: 1,
  reported: 1,
  partial: 0.5,
  "not-received": 0,
};

export const criteriaFor = (area: AreaId) => CRITERIA.filter((c) => c.area === area);
export const getArea = (id: string) => AREAS.find((a) => a.id === id);
export const ratingFor = (slug: string, criterionId: string) => RATINGS[slug]?.[criterionId];

const round1 = (n: number) => Math.round(n * 10) / 10;

export function areaScore(slug: string, area: AreaId): number {
  let sum = 0;
  let w = 0;
  for (const c of criteriaFor(area)) {
    const r = ratingFor(slug, c.id);
    if (!r) continue;
    sum += r.score * c.weight;
    w += c.weight;
  }
  return w ? round1(sum / w) : 0;
}

export function overallScore(slug: string): number {
  let sum = 0;
  for (const a of AREAS) sum += areaScore(slug, a.id) * a.weight;
  return round1(sum);
}

/** Share (0 to 1) of the weighted criteria that rest on something we hold. */
export function evidenceCoverage(slug: string, area?: AreaId): number {
  let got = 0;
  let w = 0;
  for (const c of area ? criteriaFor(area) : CRITERIA) {
    const r = ratingFor(slug, c.id);
    if (!r) continue;
    got += EVIDENCE_SHARE[r.basis] * c.weight;
    w += c.weight;
  }
  return w ? got / w : 0;
}

/** Criteria in an area ordered by their pull on the score (weight x score). */
export function topDrivers(slug: string, area: AreaId, n = 2) {
  return criteriaFor(area)
    .map((c) => ({ c, r: ratingFor(slug, c.id)! }))
    .filter((x) => x.r)
    .sort((a, b) => b.r.score * b.c.weight - a.r.score * a.c.weight)
    .slice(0, n);
}
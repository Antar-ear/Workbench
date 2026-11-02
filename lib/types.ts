/**
 * Data model for the Alcon Distribution Center (DC) Architecture Workbench.
 * Every architecture "part" is a node; clicking it opens a panel that
 * summarises the data and information received for that part.
 */

/** How well a part of the architecture is backed by what Alcon has sent us. */
export type Evidence = "documented" | "reported" | "partial" | "not-received";

/** Where in the stack a part sits. Drives colour and the legend. */
export type Layer =
  | "Upstream"
  | "Integration"
  | "WMS core"
  | "Data & platform"
  | "Edge & automation"
  | "External parties"
  | "Support & recovery";

/** Provenance of a single fact, so confirmed and inferred points stay apart. */
export type FactTag = "doc" | "call" | "inferred" | "confirm";

export interface Fact {
  k: string;
  v: string;
  tag: FactTag;
}

export interface DcNode {
  id: string;
  label: string;
  sublabel: string;
  layer: Layer;
  x: number;
  y: number;
  evidence: Evidence;
  /** Other DC slugs that use the same component. */
  shared?: string[];
  /** Rendered with a dashed border to show an absent component or document. */
  absent?: boolean;
  summary: string;
  /** Source ids (see lib/sources.ts). */
  sources: string[];
}

export interface Dc {
  slug: string;
  name: string;
  fullName: string;
  /** Short tag line on cards. */
  tagline: string;
  platform: string;
  hosting: string;
  /** One-paragraph reading of how complete our picture is. */
  coverage: string;
  receivedDocs: string[];
  missingDocs: string[];
  nodes: DcNode[];
}

const fact = (tag: FactTag) => (k: string, v: string): Fact => ({ k, v, tag });

/** Stated in a written Alcon document (spec, handbook, map, deck). */
export const d = fact("doc");
/** Stated by Alcon staff in a discovery session; not yet backed by a document. */
export const r = fact("call");
/** Our own reading. Not stated by Alcon. */
export const i = fact("inferred");
/** Unclear, conflicting or unconfirmed. Confirm before it goes in a deliverable. */
export const c = fact("confirm");

export const EVIDENCE_META: Record<
  Evidence,
  { label: string; hint: string; bar: string; chip: string; dot: string }
> = {
  documented: {
    label: "Documented",
    hint: "Described in a written Alcon document we hold",
    bar: "border-emerald-500",
    chip: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  reported: {
    label: "Reported",
    hint: "Stated in a discovery session; no document yet",
    bar: "border-sky-500",
    chip: "bg-sky-50 text-sky-800 border-sky-200",
    dot: "bg-sky-500",
  },
  partial: {
    label: "Partial",
    hint: "Referenced or incomplete in what we hold",
    bar: "border-amber-500",
    chip: "bg-amber-50 text-amber-900 border-amber-200",
    dot: "bg-amber-500",
  },
  "not-received": {
    label: "Not received",
    hint: "Nothing received for this part yet",
    bar: "border-rose-400",
    chip: "bg-rose-50 text-rose-800 border-rose-200",
    dot: "bg-rose-400",
  },
};

export const LAYER_META: Record<Layer, { dot: string }> = {
  Upstream: { dot: "bg-slate-500" },
  Integration: { dot: "bg-violet-500" },
  "WMS core": { dot: "bg-blue-600" },
  "Data & platform": { dot: "bg-cyan-600" },
  "Edge & automation": { dot: "bg-orange-500" },
  "External parties": { dot: "bg-fuchsia-500" },
  "Support & recovery": { dot: "bg-teal-600" },
};

export const TAG_META: Record<FactTag, { label: string; cls: string }> = {
  doc: { label: "Doc", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  call: { label: "Call", cls: "bg-sky-50 text-sky-800 border-sky-200" },
  inferred: { label: "Our reading", cls: "bg-violet-50 text-violet-800 border-violet-200" },
  confirm: { label: "Confirm", cls: "bg-amber-50 text-amber-900 border-amber-200" },
};

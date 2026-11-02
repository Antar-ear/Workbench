/**
 * Estate architecture view: types and loader.
 * All content (boxes, arrows, notes, text) lives in data/Workbench-Data.xlsx, tabs 11-13,
 * and arrives through lib/generated/workbench-data.json. Nothing is typed in code.
 * Coordinates are inches on a 13.33 x 7.5 canvas (origin top left); the renderer scales them.
 */

import data from "./generated/workbench-data.json";

export type Scope = "in" | "tbc";

export type EstateKind = "card" | "group" | "panel" | "bracket";

export interface EstateNode {
  id: string;
  kind: EstateKind;
  label: string;
  sub?: string;
  /** "in" = blue, in scope. "tbc" = grey, to be clarified if in scope. */
  scope: Scope;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Small chips drawn inside the card (OT only). */
  chips?: string[];
  /** Group boundary style. */
  border?: "dotted" | "solid";
  /** Where the group label sits. */
  labelAt?: "tl" | "tr";
  /** Only drawn in the ADC detail state. */
  detailOnly?: boolean;
}

export interface EstateEdge {
  id: string;
  /** Edge number in the spec. */
  no: number;
  source: string;
  target: string;
  /** Route in inches, corner to corner. */
  points: [number, number][];
  /** Arrowheads at both ends. */
  bi?: boolean;
  /** One-way arrow at the end of the route. */
  oneWay?: boolean;
  dashed?: boolean;
  /** Grey line (attached to a grey-side component). */
  grey?: boolean;
  label?: string;
  labelAt?: [number, number];
  detailOnly?: boolean;
  /** Plain-language note shown in the detail drawer. */
  note?: string;
}

export const CANVAS = { w: 13.33, h: 7.5 };

const estate = data.estate as unknown as {
  nodes: EstateNode[];
  edges: EstateEdge[];
  panelFootnote: string;
  panelSource: string;
  dlxOverview: number;
  dlxDetail: number;
};

export const ESTATE_NODES: EstateNode[] = estate.nodes;
export const ESTATE_EDGES: EstateEdge[] = estate.edges;
export const PANEL_FOOTNOTE = estate.panelFootnote;
export const PANEL_SOURCE = estate.panelSource;
export const DLX_WIDTH = { overview: estate.dlxOverview, detail: estate.dlxDetail };

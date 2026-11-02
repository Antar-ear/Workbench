/**
 * High-level overview for every box in the estate architecture view.
 * The text lives in data/Workbench-Data.xlsx (tab 13 Estate Details) and arrives through
 * lib/generated/workbench-data.json. Nothing is typed in code.
 */
import data from "./generated/workbench-data.json";
import type { Fact } from "@/lib/types";

export interface EstateDetail {
  /** Two or three sentences: what the component is and why it matters. */
  summary: string;
  facts: Fact[];
  /** Questions and gaps still to close. */
  open: string[];
  /** Where the facts came from. */
  sources: string[];
}

export const ESTATE_DETAILS = data.estate.details as unknown as Record<string, EstateDetail>;

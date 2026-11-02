/**
 * Register of everything received so far. Node panels cite these ids.
 * "covers" lists the DCs a source says something about.
 *
 * The content is typed in data/Workbench-Data.xlsx (tab "10 Sources"), not here.
 */
import data from "./generated/workbench-data.json";

export interface Source {
  id: string;
  title: string;
  kind: string;
  version: string;
  covers: string[]; // dc slugs
  gist: string;
  /** Honest note about how much weight it can bear. */
  caveat?: string;
}

export const SOURCES = data.sources as Source[];

export const getSource = (id: string) => SOURCES.find((s) => s.id === id);

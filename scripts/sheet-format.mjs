// Shared by export-to-excel.mts and build-data.mjs: the friendly words used in the Excel file.

export const EVIDENCE_LABELS = {
  documented: "Documented",
  reported: "Reported",
  partial: "Partial",
  "not-received": "Not received",
};

export const TAG_LABELS = {
  doc: "Doc",
  call: "Call",
  inferred: "Our reading",
  confirm: "Confirm",
};

export const LAYERS = [
  "Upstream",
  "Integration",
  "WMS core",
  "Data & platform",
  "Edge & automation",
  "External parties",
  "Support & recovery",
];

/** Excel uses Column 1.. / Row 1.. ; the diagram uses pixels. */
export const GRID_X = 270;
export const GRID_Y = 170;
export const GRID_Y0 = 20;

/**
 * Reads data/Workbench-Data.xlsx, checks it, and writes lib/generated/workbench-data.json,
 * which is what the Workbench actually displays.
 *
 *     npm run data          (also runs automatically before `npm run dev` / `npm run build`)
 *
 * Problems are explained in plain words with the tab and row number. If there is a
 * problem that would break the app, nothing is written and the old data stays in use.
 */
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import { EVIDENCE_LABELS, TAG_LABELS, LAYERS, GRID_X, GRID_Y, GRID_Y0 } from "./sheet-format.mjs";

/** Top of the score scale: every score runs 1 to MAX_SCORE (MAX_SCORE = most risk). */
const MAX_SCORE = 5;

const SRC = "data/Workbench-Data.xlsx";
const OUT = "lib/generated/workbench-data.json";

const errors = [];
const warnings = [];
const err = (sheet, row, msg) => errors.push(`  [${sheet}${row ? `, row ${row}` : ""}] ${msg}`);
const warn = (sheet, row, msg) => warnings.push(`  [${sheet}${row ? `, row ${row}` : ""}] ${msg}`);

if (!fs.existsSync(SRC)) {
  console.error(`\nCannot find ${SRC}. Put the Excel file in the 'data' folder.\n`);
  process.exit(1);
}

const wb = new ExcelJS.Workbook();
try {
  await wb.xlsx.readFile(SRC);
} catch (e) {
  console.error(
    `\nCannot open ${SRC}. If it is open in Excel, save and close it, then try again.\n(${e.message})\n`
  );
  process.exit(1);
}

/** Cell -> trimmed plain string (handles rich text, formulas, hyperlinks, numbers). */
function text(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if (v.richText) return v.richText.map((p) => p.text).join("").trim();
    if (v.result !== undefined) return text(v.result);
    if (v.text !== undefined) return text(v.text);
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return "";
  }
  return String(v).trim();
}

/** Rows of a tab as arrays of strings, starting at Excel row 4. Skips empty rows. */
function rows(name, nCols) {
  const ws = wb.getWorksheet(name);
  if (!ws) {
    err(name, 0, `The tab "${name}" is missing. Do not rename or delete tabs.`);
    return [];
  }
  const out = [];
  for (let r = 4; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const cells = [];
    for (let c = 1; c <= nCols; c++) cells.push(text(row.getCell(c).value));
    if (cells.every((x) => x === "")) continue;
    out.push({ n: r, c: cells });
  }
  return out;
}

const list = (s) =>
  s
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);

const reverse = (map) => Object.fromEntries(Object.entries(map).map(([k, v]) => [v.toLowerCase(), k]));
const EVID = reverse(EVIDENCE_LABELS);
const TAGS = reverse(TAG_LABELS);
const yes = (s) => /^(y|yes|true|1)$/i.test(s.trim());

function num(sheet, n, label, s, { min, max, int } = {}) {
  if (s === "") return null;
  const v = Number(s.replace("%", ""));
  if (!Number.isFinite(v)) {
    err(sheet, n, `${label} must be a number, but it says "${s}".`);
    return null;
  }
  if ((min !== undefined && v < min) || (max !== undefined && v > max)) {
    err(sheet, n, `${label} must be between ${min} and ${max}, but it is ${v}.`);
    return null;
  }
  if (int && !Number.isInteger(v)) {
    err(sheet, n, `${label} must be a whole number, but it is ${v}.`);
    return null;
  }
  return v;
}

// ---------------------------------------------------------------- 1 Settings
const settingsRaw = Object.fromEntries(rows("1 Settings", 2).map((r) => [r.c[0], r]));
const setting = (name, fallback) => (settingsRaw[name] ? settingsRaw[name].c[1] : fallback);
const defaultScore =
  num("1 Settings", settingsRaw["Default score when nothing received"]?.n, "Default score", setting("Default score when nothing received", "0"), { min: 0, max: MAX_SCORE }) ?? 0;
const provisionalBelow =
  num("1 Settings", settingsRaw["Provisional if evidence below (%)"]?.n, "Provisional threshold", setting("Provisional if evidence below (%)", "50"), { min: 0, max: 100 }) ?? 50;
const settings = {
  maxScore: MAX_SCORE,
  defaultScore,
  provisionalBelow,
  scoreNotice: setting("Score notice", ""),
  overviewNote: setting("Overview note", ""),
  topBarTag: setting("Top bar tag", ""),
  sidebarFooter: setting("Sidebar footer", ""),
};
const estateSettings = {
  panelFootnote: setting("Estate panel footnote", ""),
  panelSource: setting("Estate panel source", ""),
  dlxOverview:
    num("1 Settings", settingsRaw["Estate WMS-DLx width, overview (in)"]?.n, "WMS-DLx width", setting("Estate WMS-DLx width, overview (in)", "3.1"), { min: 1, max: 14 }) ?? 3.1,
  dlxDetail:
    num("1 Settings", settingsRaw["Estate WMS-DLx width, ADC detail (in)"]?.n, "WMS-DLx width", setting("Estate WMS-DLx width, ADC detail (in)", "8.1"), { min: 1, max: 14 }) ?? 8.1,
};

// ---------------------------------------------------------------- 2 Areas
const areas = rows("2 Areas", 4).map((r) => ({
  id: r.c[0],
  name: r.c[1],
  weight: (num("2 Areas", r.n, "Weight", r.c[2], { min: 0, max: 100 }) ?? 0) / 100,
  scope: r.c[3],
}));
{
  const total = Math.round(areas.reduce((s, a) => s + a.weight, 0) * 1000) / 10;
  if (areas.length && total !== 100) warn("2 Areas", 0, `The area weights add up to ${total}, not 100. Scores will still be calculated, but check the weights.`);
}
const areaIds = new Set(areas.map((a) => a.id));
areas.forEach((a) => !a.id && err("2 Areas", 0, "An area has no Area ID."));

// ---------------------------------------------------------------- 3 Criteria
// ONE ROW PER SCOREABLE ITEM. Columns: A Criterion ID, B Area ID, C Criterion, D Sub-Criterion,
// E Question, F Score (1-5), G (automatic average, not read).
// Every row repeats its Criterion ID. A row with a Sub-Criterion is one sub-category of that criterion;
// a row with no Sub-Criterion is the criterion's own row. Rows are matched by ID, so they can be in any order.
// The Score here is the starting score for every DC; a scored row on tab 5 overrides it for one DC.
// (Old layout still works: a row with an empty ID belongs to the criterion above it.)
const areaByLower = Object.fromEntries(
  areas.flatMap((a) => [[a.id.toLowerCase(), a.id], [a.name.toLowerCase(), a.id]])
);
const criteria = [];
const baseline = {}; // sheet score per criterion id ("W3") or sub id ("W3.1")
for (const r of rows("3 Criteria", 6)) {
  const [idRaw, areaRaw, label, sub, asks, scoreRaw] = r.c;
  let c = idRaw ? criteria.find((x) => x.id === idRaw) : criteria[criteria.length - 1];
  if (!idRaw && !c) { warn("3 Criteria", r.n, "This row has no Criterion ID, so it is ignored."); continue; }
  if (!c) {
    c = { id: idRaw, area: "", label: "", asks: "", subs: [] };
    criteria.push(c);
  }
  if (areaRaw) {
    const area = areaByLower[areaRaw.toLowerCase()];
    if (!area) err("3 Criteria", r.n, `Area ID "${areaRaw}" does not exist on tab "2 Areas". Use one of: ${areas.map((a) => a.id).join(", ")}.`);
    else if (c.area && c.area !== area) err("3 Criteria", r.n, `Criterion ${c.id} is in area "${c.area}" on an earlier row but "${area}" here.`);
    else c.area = area;
  }
  if (label && !c.label) c.label = label;
  const score = num("3 Criteria", r.n, "Score", scoreRaw, { min: 1, max: MAX_SCORE, int: true });
  if (sub) {
    c.subs.push({ label: sub, asks });
    if (score !== null) baseline[`${c.id}.${c.subs.length}`] = score;
  } else {
    if (asks && !c.asks) c.asks = asks;
    if (score !== null) baseline[c.id] = score;
  }
}
for (const c of criteria) {
  if (!c.area) err("3 Criteria", 0, `Criterion ${c.id} has no Area ID on any of its rows.`);
  if (!c.label) warn("3 Criteria", 0, `Criterion ${c.id} has no name in the Criterion column.`);
}
const critIds = new Set(criteria.map((c) => c.id));
// A sub-category is scored on tab 5 with the ID of its criterion plus its position: W3.1, W3.2 ...
const subIds = new Set(criteria.flatMap((c) => c.subs.map((_, i) => `${c.id}.${i + 1}`)));
criteria.forEach((c, i) => criteria.findIndex((x) => x.id === c.id) !== i && err("3 Criteria", 0, `Criterion ID "${c.id}" is used twice.`));
for (const a of areas)
  if (!criteria.some((c) => c.area === a.id))
    warn("2 Areas", 0, `Area "${a.name}" has no criteria on tab "3 Criteria", so it is hidden and left out of the overall score.`);

// ---------------------------------------------------------------- 10 Sources
const sources = rows("10 Sources", 7).map((r) => ({
  id: r.c[0],
  title: r.c[1],
  kind: r.c[2],
  version: r.c[3],
  covers: list(r.c[4]).map((x) => x.toLowerCase()),
  gist: r.c[5],
  ...(r.c[6] ? { caveat: r.c[6] } : {}),
}));
const sourceIds = new Set(sources.map((s) => s.id));

// ---------------------------------------------------------------- 4 DCs
const dcs = rows("4 Distribution Centers", 7).map((r) => ({
  slug: r.c[0].toLowerCase(),
  name: r.c[1],
  fullName: r.c[2],
  tagline: r.c[3],
  platform: r.c[4],
  hosting: r.c[5],
  coverage: r.c[6],
  receivedDocs: [],
  missingDocs: [],
  nodes: [],
}));
const dcBySlug = Object.fromEntries(dcs.map((d) => [d.slug, d]));
if (!dcs.length) err("4 Distribution Centers", 0, "No distribution centers are listed.");
const dcOf = (sheet, n, code) => {
  const d = dcBySlug[code.toLowerCase()];
  if (!d) err(sheet, n, `DC code "${code}" is not listed on tab "4 Distribution Centers".`);
  return d;
};

// ---------------------------------------------------------------- 6 Parts
for (const r of rows("6 Architecture Parts", 12)) {
  const dc = dcOf("6 Architecture Parts", r.n, r.c[0]);
  if (!dc) continue;
  const id = r.c[1];
  if (!id) { err("6 Architecture Parts", r.n, "Part ID is empty."); continue; }
  if (dc.nodes.some((n) => n.id === id)) { err("6 Architecture Parts", r.n, `Part ID "${id}" is used twice for ${dc.name}.`); continue; }
  const layer = LAYERS.find((l) => l.toLowerCase() === r.c[4].toLowerCase());
  if (!layer) err("6 Architecture Parts", r.n, `Layer "${r.c[4]}" is not one of: ${LAYERS.join(", ")}.`);
  const evidence = EVID[r.c[5].toLowerCase()];
  if (!evidence) err("6 Architecture Parts", r.n, `Evidence "${r.c[5]}" must be one of: ${Object.values(EVIDENCE_LABELS).join(", ")}.`);
  const col = num("6 Architecture Parts", r.n, "Column", r.c[6], { min: 0, max: 20 });
  const row = num("6 Architecture Parts", r.n, "Row", r.c[7], { min: 0, max: 20 });
  if (col === null || row === null) err("6 Architecture Parts", r.n, "Column and Row are both required.");
  const node = {
    id,
    label: r.c[2],
    sublabel: r.c[3],
    layer: layer ?? "Integration",
    x: Math.round(((col ?? 1) - 1) * GRID_X),
    y: Math.round(((row ?? 1) - 1) * GRID_Y + GRID_Y0),
    evidence: evidence ?? "not-received",
    summary: r.c[10],
    sources: list(r.c[11]),
  };
  const shared = list(r.c[9]).map((x) => x.toLowerCase());
  if (shared.length) node.shared = shared;
  if (yes(r.c[8])) node.absent = true;
  dc.nodes.push(node);
}
for (const dc of dcs) {
  if (!dc.nodes.length) warn("6 Architecture Parts", 0, `${dc.name} has no architecture parts.`);
  for (const n of dc.nodes) {
    n.sources.forEach((s) => !sourceIds.has(s) && warn("6 Architecture Parts", 0, `${dc.name} / ${n.id}: Source "${s}" is not on tab "10 Sources".`));
    (n.shared ?? []).forEach((s) => !dcBySlug[s] && warn("6 Architecture Parts", 0, `${dc.name} / ${n.id}: "Also used by" code "${s}" is not a known DC.`));
  }
}

// ---------------------------------------------------------------- 9 Documents
for (const r of rows("9 DC Documents", 3)) {
  const dc = dcOf("9 DC Documents", r.n, r.c[0]);
  if (!dc) continue;
  const status = r.c[1].toLowerCase();
  if (status === "received") dc.receivedDocs.push(r.c[2]);
  else if (status === "not yet received") dc.missingDocs.push(r.c[2]);
  else err("9 DC Documents", r.n, `Status "${r.c[1]}" must be "Received" or "Not yet received".`);
}

// ---------------------------------------------------------------- 5 Scores
const ratings = {};
for (const r of rows("5 Scores", 9)) {
  const dc = dcOf("5 Scores", r.n, r.c[0]);
  if (!dc) continue;
  const cid = r.c[1];
  if (!critIds.has(cid) && !subIds.has(cid)) { warn("5 Scores", r.n, `Criterion ID "${cid}" is not on tab "3 Criteria" (sub-categories are written like W3.1), so this row is ignored.`); continue; }
  if (ratings[dc.slug]?.[cid]) { err("5 Scores", r.n, `${dc.name} / ${cid} appears twice.`); continue; }
  const basis = EVID[r.c[4].toLowerCase()];
  const unscored = r.c[3] === "" && r.c[4] === "";
  if (!basis && !unscored) err("5 Scores", r.n, `Evidence "${r.c[4]}" must be one of: ${Object.values(EVIDENCE_LABELS).join(", ")}.`);
  let score = num("5 Scores", r.n, "Score", r.c[3], { min: 1, max: MAX_SCORE, int: true });
  if (score === null) {
    if (unscored || basis === "not-received") score = defaultScore;
    else if (basis) err("5 Scores", r.n, `${dc.name} / ${cid}: the Score is empty. Enter 1-${MAX_SCORE}, or set Evidence to "Not received" to use the default (${defaultScore}).`);
  }
  const parts = list(r.c[7]);
  parts.forEach((p) => !dc.nodes.some((n) => n.id === p) && warn("5 Scores", r.n, `${dc.name} / ${cid}: part "${p}" does not exist for ${dc.name}.`));
  const srcs = list(r.c[8]);
  srcs.forEach((s) => !sourceIds.has(s) && warn("5 Scores", r.n, `${dc.name} / ${cid}: source "${s}" is not on tab "10 Sources".`));
  (ratings[dc.slug] ??= {})[cid] = {
    score: score ?? defaultScore,
    scored: r.c[3] !== "",
    basis: basis ?? "not-received",
    why: r.c[5],
    next: r.c[6],
    nodes: parts,
    sources: srcs,
  };
}
// Scores typed on tab 3 apply to every DC, unless that DC has a scored row on tab 5 for the same ID.
let fromSheet = 0;
for (const dc of dcs)
  for (const [key, score] of Object.entries(baseline)) {
    const own = ratings[dc.slug]?.[key];
    if (own?.scored) continue;
    (ratings[dc.slug] ??= {})[key] = {
      score,
      scored: true,
      basis: own && own.basis !== "not-received" ? own.basis : "reported",
      why: own?.why || "Score entered on the Criteria tab.",
      next: own?.next ?? "",
      nodes: own?.nodes ?? [],
      sources: own?.sources ?? [],
    };
    fromSheet++;
  }
for (const dc of dcs)
  for (const c of criteria)
    if (!c.subs.length && !ratings[dc.slug]?.[c.id]) warn("5 Scores", 0, `${dc.name} has no row for ${c.id} (${c.label}). It is shown as Not received with the default score until a row is added on tab "5 Scores".`);

// ---------------------------------------------------------------- 11-13 Estate diagram
const estate = { ...estateSettings, nodes: [], edges: [], details: {} };
{
  const T = "11 Estate Boxes";
  const KINDS = ["card", "group", "panel", "bracket"];
  for (const r of rows(T, 13)) {
    const kind = r.c[1].toLowerCase();
    const scope = r.c[4].toLowerCase();
    if (!r.c[0]) { err(T, r.n, "Box ID is empty."); continue; }
    if (estate.nodes.some((n) => n.id === r.c[0])) { err(T, r.n, `Box ID "${r.c[0]}" is used twice.`); continue; }
    if (!KINDS.includes(kind)) err(T, r.n, `Type "${r.c[1]}" must be one of: ${KINDS.join(", ")}.`);
    if (!["in", "tbc"].includes(scope)) err(T, r.n, `Scope "${r.c[4]}" must be "in" or "tbc".`);
    const n4 = ["X", "Y", "Width", "Height"].map((l, i) => num(T, r.n, l, r.c[5 + i], { min: 0, max: 30 }));
    if (n4.some((v) => v === null)) err(T, r.n, "X, Y, Width and Height are all required.");
    const chips = list(r.c[9]);
    estate.nodes.push({
      id: r.c[0], kind, label: r.c[2], ...(r.c[3] ? { sub: r.c[3] } : {}), scope,
      x: n4[0] ?? 0, y: n4[1] ?? 0, w: n4[2] ?? 1, h: n4[3] ?? 1,
      ...(chips.length ? { chips } : {}),
      ...(r.c[10] ? { border: r.c[10].toLowerCase() } : {}),
      ...(r.c[11] ? { labelAt: r.c[11].toLowerCase() } : {}),
      ...(yes(r.c[12]) ? { detailOnly: true } : {}),
    });
  }
  const T2 = "12 Estate Arrows";
  const boxIds = new Set(estate.nodes.map((n) => n.id));
  for (const r of rows(T2, 13)) {
    for (const [label, id] of [["From", r.c[2]], ["To", r.c[3]]])
      if (!boxIds.has(id)) err(T2, r.n, `${label} box "${id}" does not exist on tab "${T}".`);
    const points = r.c[10].split(";").map((p) => p.split(",").map((x) => Number(x.trim())));
    if (points.length < 2 || points.some((p) => p.length !== 2 || p.some((x) => !Number.isFinite(x))))
      err(T2, r.n, `Route "${r.c[10]}" must be at least two points written like 1.6,1.3; 2.4,1.3.`);
    const dir = r.c[4].toLowerCase();
    if (!["both", "one-way", "none", ""].includes(dir)) err(T2, r.n, `Direction "${r.c[4]}" must be Both, One-way or None.`);
    const no = num(T2, r.n, "Number", r.c[1], { min: 0, max: 999, int: true }) ?? 0;
    const lx = num(T2, r.n, "Label X", r.c[8], { min: 0, max: 30 });
    const ly = num(T2, r.n, "Label Y", r.c[9], { min: 0, max: 30 });
    estate.edges.push({
      id: r.c[0], no, source: r.c[2], target: r.c[3], points,
      ...(dir === "both" ? { bi: true } : {}),
      ...(dir === "one-way" ? { oneWay: true } : {}),
      ...(yes(r.c[5]) ? { dashed: true } : {}),
      ...(yes(r.c[6]) ? { grey: true } : {}),
      ...(r.c[7] ? { label: r.c[7] } : {}),
      ...(lx !== null && ly !== null ? { labelAt: [lx, ly] } : {}),
      ...(r.c[11] ? { note: r.c[11] } : {}),
      ...(yes(r.c[12]) ? { detailOnly: true } : {}),
    });
  }
  const T3 = "13 Estate Details";
  for (const r of rows(T3, 5)) {
    if (!boxIds.has(r.c[0])) { err(T3, r.n, `Box "${r.c[0]}" does not exist on tab "${T}".`); continue; }
    const d = (estate.details[r.c[0]] ??= { summary: "", facts: [], open: [], sources: [] });
    const kind = r.c[1].toLowerCase();
    if (kind === "summary") d.summary = r.c[3];
    else if (kind === "open item") d.open.push(r.c[3]);
    else if (kind === "source") d.sources.push(r.c[3]);
    else if (kind === "key fact") {
      const tag = TAGS[r.c[4].toLowerCase()];
      if (!tag) err(T3, r.n, `Fact type "${r.c[4]}" must be one of: ${Object.values(TAG_LABELS).join(", ")}.`);
      d.facts.push({ k: r.c[2], v: r.c[3], tag: tag ?? "confirm" });
    } else err(T3, r.n, `Kind "${r.c[1]}" must be Summary, Key fact, Open item or Source.`);
  }
}

// ---------------------------------------------------------------- report
if (errors.length) {
  console.error(`\nThe Excel file has ${errors.length} problem(s) that must be fixed. Nothing was updated:\n`);
  console.error(errors.join("\n"));
  if (warnings.length) console.error(`\nAlso (not blocking):\n${warnings.join("\n")}`);
  console.error("\nFix them in data/Workbench-Data.xlsx, save, and run this again.\n");
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ settings, areas, criteria, dcs, ratings, sources, estate }, null, 2));
console.log(`Data OK: ${dcs.length} DCs, ${criteria.length} criteria (${Object.keys(baseline).length} scored on the Criteria tab),${Object.values(ratings).reduce((s, r) => s + Object.keys(r).length, 0)} scores, ${dcs.reduce((s, d) => s + d.nodes.length, 0)} parts, ${sources.length} sources, ${estate.nodes.length} estate boxes, ${estate.edges.length} arrows.`);
if (warnings.length) console.log(`\n${warnings.length} note(s) to look at (not blocking):\n${warnings.join("\n")}\n`);

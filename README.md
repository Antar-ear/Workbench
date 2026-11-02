# Alcon DC Architecture Workbench

Interactive portal for the SCM / WMS Modernization Readiness Assessment.
One high-level architecture diagram per distribution center (ADC, JCD, EDC, EL).
Click any part of a diagram to see the data and information received for it,
the key facts (each tagged Doc / Call / Our reading / Confirm), open items, and sources.

## Run

Requires Node.js 18 or newer (https://nodejs.org). The first run needs internet once, for `npm install`.
On Windows, double-click `start-workbench.bat`: it installs on first use and starts the app.

    npm install
    npm run dev        # http://localhost:3000
    # or
    npm run build && npx next start -p 3100

No backend and no internet needed at runtime (system font, all data read from the Excel file).

## Flow

1. Overview: pick a distribution center (ADC, JCD, EDC, EL).
2. Score page: overall risk 1 to 10 (10 is most risk), plus a score for WMS, Infrastructure, Enterprise and Cybersecurity.
3. Show details: choose Architecture or Breakup.
4. Architecture: the diagram. Click any part for the data and information received.
5. Breakup: four area cards. Open one to see its criteria, why each scored what it did, and what is needed to firm it up.
6. Scoring matrix (sidebar): all 20 criteria for all four DCs, with the method.

## Scoring

20 criteria (5 per area) mapped to Pre-Kickoff Questionnaire items. Area score is the weighted mean of its criteria.
Overall score is the weighted mean of areas (WMS 30%, Infrastructure 25%, Enterprise 20%, Cybersecurity 25%).
Alcon has not returned the answered questionnaire, so scores come from the documents and calls we hold.
A criterion with nothing behind it is scored at 6 and flagged Not received.
Everything (criteria, weights, default, per-DC ratings) is in the Excel file.

## Changing the data (no coding needed)

All content is typed in ONE file: **data/Workbench-Data.xlsx**. Open the "START HERE" tab for instructions.

1. Edit the cells in Excel and save.
2. Double-click `update-data.bat`. It checks your entries and explains any mistake in plain words (tab and row).
3. Refresh the browser (or double-click `start-workbench.bat` to start the app).

`npm run dev` and `npm run build` also re-read the Excel file automatically.

## How it works (for developers)

- `data/Workbench-Data.xlsx`: the single input.
- `scripts/build-data.mjs`: validates the workbook and writes `lib/generated/workbench-data.json`.
- `lib/scoring.ts`, `lib/sources.ts`, `lib/settings.ts`, `lib/dc/index.ts`: read that JSON. Scoring maths and colour bands live in code.
- No content is stored in code. `lib/generated/workbench-data.json` is a build output (git-ignored) and is rebuilt from the Excel file.
- `components/estate-diagram.tsx`: the architecture diagram and detail drawer (Excel tabs 11, 12, 13).

## Evidence levels

- Documented: stated in a written Alcon document we hold.
- Reported: described by Alcon staff in a session; no underlying file.
- Partial: fragments only.
- Not received: nothing yet (dashed border).

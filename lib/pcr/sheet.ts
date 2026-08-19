import type { PcrAssignments } from "./types";

export async function fetchFromSheet(): Promise<PcrAssignments | null> {

  const url = process.env.PCR_SHEET_CSV_URL;
  console.log("PCR fetch:", {
  url: process.env.PCR_SHEET_CSV_URL,
  hasUrl: !!process.env.PCR_SHEET_CSV_URL,
});
  if (!url) return null;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;


  const rows = parseCsv(await res.text());

  const pcrPanel = (assignmentR: number, rowsStart: number, col: number) => ({
    assignment: cell(rows, assignmentR, col),
    rows: [
      { label: cell(rows, rowsStart, col) ?? "", value: cell(rows, rowsStart, col + 1) ?? "" },
      { label: cell(rows, rowsStart + 1, col) ?? "", value: cell(rows, rowsStart + 1, col + 1) ?? "" },
    ],
  });

  const rangeRows = (startR: number, endR: number, col: number) => {
    const out = [];
    for (let r = startR; r <= endR; r++) {
      out.push({
        label: cell(rows, r, col) ?? "",
        value: cell(rows, r, col + 1) ?? "",
      });
    }
    return out;
  };

  return {
    eventTitle: cell(rows, 2, 1) ?? "",
    pcr1: pcrPanel(6, 7, 1),
    pcr2: pcrPanel(6, 7, 4),
    pcr3: pcrPanel(11, 12, 1),
    pcr4: pcrPanel(11, 12, 4),
    dreamcatcher: rangeRows(16, 21, 1),
    shading: rangeRows(16, 18, 4),
    audio: rangeRows(20, 21, 4),
  };
}

function parseCsv(csv: string): string[][] {
  // Simple CSV parser — handles quoted fields and commas inside quotes
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (inQuotes) {
      if (c === '"' && csv[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cur += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
      else if (c === "\r") { /* skip */ }
      else { cur += c; }
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

function cell(rows: string[][], r: number, c: number): string | null {
  const v = rows[r]?.[c];
  return v && v.trim() !== "" ? v.trim() : null;
}
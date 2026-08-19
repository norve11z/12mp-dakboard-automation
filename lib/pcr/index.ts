import { db } from "@/lib/db";
import { fetchFromSheet } from "./sheet";
import { fetchFromManual } from "./manual";
import type { PcrAssignments } from "./types";

export type { PcrAssignments };

export async function getPcrAssignments(): Promise<PcrAssignments | null> {
  const res = await db().execute(`SELECT source FROM pcr_state WHERE id = 1`);
  const source = (res.rows[0]?.source as string) ?? "sheet";

  if (source === "manual") return fetchFromManual();
  return fetchFromSheet();
}
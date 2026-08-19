import { db } from "@/lib/db";
import type { PcrAssignments } from "./types";

export async function fetchFromManual(): Promise<PcrAssignments | null> {
  const res = await db().execute(`SELECT data FROM pcr_state WHERE id = 1`);
  const raw = res.rows[0]?.data as string | undefined;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PcrAssignments;
  } catch {
    return null;
  }
}
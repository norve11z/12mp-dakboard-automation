import { db } from "./db";

/**
 * Removes shifts for games that don't exist in game_info.
 * Prevents crews from being staged on non-game days.
 */
export async function pruneShifts() {
  const res = await db().execute(`
    DELETE FROM shifts
    WHERE department IN ('Broadcast', 'Big Screen', 'Engineering')
      AND NOT EXISTS (
        SELECT 1 FROM game_info gi
        WHERE gi.sport = shifts.sport
          AND gi.game_date = substr(shifts.dtstart, 1, 10)
      )
  `);
  return { deleted: res.rowsAffected ?? 0 };
}
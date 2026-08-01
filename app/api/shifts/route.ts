import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sport = url.searchParams.get("sport");
  const department = url.searchParams.get("department");
  const date = url.searchParams.get("date");
  const seedOnly = url.searchParams.get("seed") === "1";
  const limit = Math.min(Number(url.searchParams.get("limit") || 500), 2000);

  const clauses: string[] = [];
  const args: (string | number)[] = [];
  if (sport)      { clauses.push("sport = ?");                         args.push(sport); }
  if (department) { clauses.push("department = ?");                    args.push(department); }
  if (date)       { clauses.push("substr(dtstart,1,10) = ?");          args.push(date); }
  if (seedOnly)   { clauses.push("uid LIKE 'SEED-%'"); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const rows = (await db().execute({
    sql: `SELECT uid, employee_name, position, sport, department, dtstart, dtend, imported_at
          FROM shifts ${where}
          ORDER BY dtstart DESC
          LIMIT ${limit}`,
    args,
  })).rows;
  return NextResponse.json(rows);
}
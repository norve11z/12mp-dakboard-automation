import { importIcs } from "@/lib/ics";
import { rebuildDisplays, autoAssign } from "@/lib/assign";
import { refreshSchedules } from "@/lib/espn";
import { rebuildScheduledRefreshes } from "@/lib/scheduled-refreshes";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const imp = await importIcs();
    const disp = await rebuildDisplays();
    const sched = await refreshSchedules();
    const refreshes = await rebuildScheduledRefreshes();
    const assigns = await autoAssign();
    return NextResponse.json({ ok: true, imp, disp, sched, refreshes, assigns });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
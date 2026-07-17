import { initDb } from "@/lib/init-db";
import { NextResponse } from "next/server";

export async function GET() {
  initDb();
  return NextResponse.json({ ok: true, message: "DB initialized" });
}
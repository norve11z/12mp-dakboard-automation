import { seedTestData } from "@/lib/seed";
import { NextResponse } from "next/server";

export async function POST() {
  const r = seedTestData();
  return NextResponse.json({ ok: true, ...r });
}

export async function GET() {
  return POST();
}
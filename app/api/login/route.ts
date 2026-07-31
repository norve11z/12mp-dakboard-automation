import { setLoginCookie, clearLoginCookie } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
  }
  await setLoginCookie();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearLoginCookie();
  return NextResponse.json({ ok: true });
}

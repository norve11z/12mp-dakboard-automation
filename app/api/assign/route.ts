import { manualAssign, clearAssignment } from "@/lib/assign";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { displayId, controlRoomId } = await req.json();
  if (!displayId || !controlRoomId) return NextResponse.json({ ok: false, error: "displayId and controlRoomId required" }, { status: 400 });
  await manualAssign(Number(displayId), Number(controlRoomId));
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: Request) {
  const { controlRoomId, date } = await req.json();
  if (!controlRoomId || !date) return NextResponse.json({ ok: false, error: "controlRoomId and date required" }, { status: 400 });
  await clearAssignment(Number(controlRoomId), String(date));
  return NextResponse.json({ ok: true });
}
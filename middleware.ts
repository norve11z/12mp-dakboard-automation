import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "cr_session";

async function hmacHex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verify(token: string): Promise<boolean> {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const secret = process.env.SESSION_SECRET || "insecure-dev-secret";
  const expected = (await hmacHex(secret, payload)).slice(0, 32);
  return sig === expected;
}

const PROTECTED_API_PREFIXES = [
  "/api/import", "/api/rebuild", "/api/sync", "/api/seed",
  "/api/assign", "/api/game-info", "/api/position-map",
  "/api/schedule-template", "/api/settings", "/api/maintenance",
  "/api/refresh-schedules", "/api/add-game", "/api/panel-combo-rules",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isProtectedApi = PROTECTED_API_PREFIXES.some(p => pathname.startsWith(p));
  if (!isAdmin && !isProtectedApi) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token && await verify(token)) return NextResponse.next();

  if (isProtectedApi) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
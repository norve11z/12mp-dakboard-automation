import { cookies } from "next/headers";

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

async function sign(payload: string): Promise<string> {
  const secret = process.env.SESSION_SECRET || "insecure-dev-secret";
  const sig = (await hmacHex(secret, payload)).slice(0, 32);
  return `${payload}.${sig}`;
}

async function verify(token: string): Promise<boolean> {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const secret = process.env.SESSION_SECRET || "insecure-dev-secret";
  const expected = (await hmacHex(secret, payload)).slice(0, 32);
  return sig === expected;
}

export async function isLoggedIn(): Promise<boolean> {
  const c = (await cookies()).get(COOKIE_NAME)?.value;
  return !!c && await verify(c);
}

export async function setLoginCookie() {
  const token = await sign("admin-" + Date.now());
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearLoginCookie() {
  (await cookies()).delete(COOKIE_NAME);
}
import { createClient, type Client } from "@libsql/client";

let _db: Client | null = null;

export function db(): Client {
  if (_db) return _db;
  const url = process.env.TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_URL not set");
  _db = createClient({ url, authToken });
  return _db;
}
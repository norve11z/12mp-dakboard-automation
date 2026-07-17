import fs from "fs";
import path from "path";
import db from "./db";

let initialized = false;

export function initDb() {
  if (initialized) return;
  const sql = fs.readFileSync(path.join(process.cwd(), "lib", "schema.sql"), "utf-8");
  db.exec(sql);
  initialized = true;
}
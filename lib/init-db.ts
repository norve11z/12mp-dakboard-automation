import fs from "fs";
import path from "path";
import db from "./db";

let initialized = false;

export function initDb() {
  if (initialized) return;
  const candidates = [
    path.join(process.cwd(), "lib", "schema.sql"),
    path.join(process.cwd(), "..", "lib", "schema.sql"),
    path.join(__dirname, "schema.sql"),
    path.join(__dirname, "..", "lib", "schema.sql"),
  ];
  const found = candidates.find(p => fs.existsSync(p));
  if (!found) throw new Error(`schema.sql not found in: ${candidates.join(", ")}`);
  const sql = fs.readFileSync(found, "utf-8");
  db.exec(sql);
  initialized = true;
}
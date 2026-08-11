import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const dbPath = process.env.DB_PATH || "./data/revizpredict.db";
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

export function initSchema() {
  const schema = fs.readFileSync(
    path.join(__dirname, "schema.sql"),
    "utf-8"
  );
  db.exec(schema);
}

import { extname, isAbsolute, resolve } from "node:path";

const ALLOWED_DATABASE_EXTENSIONS = new Set([".db", ".sqlite", ".sqlite3"]);

export function getDatabasePath(configuredPath?: string, cwd = process.cwd()): string {
  const value = configuredPath?.trim();
  if (!value) return resolve(cwd, "data", "korean.db");
  if (value.includes("\0") || !isAbsolute(value)) {
    throw new Error("KOREAN_DB_PATH must be an absolute filesystem path");
  }
  const normalized = resolve(value);
  if (!ALLOWED_DATABASE_EXTENSIONS.has(extname(normalized).toLowerCase())) {
    throw new Error("KOREAN_DB_PATH must end with .db, .sqlite, or .sqlite3");
  }
  return normalized;
}

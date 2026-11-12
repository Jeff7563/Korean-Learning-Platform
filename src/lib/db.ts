import "server-only";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { getDatabasePath } from "@/lib/database-path";
let singleton: Database.Database | undefined;
export function db() { if (!singleton) { const file = getDatabasePath(); mkdirSync(dirname(file), { recursive: true }); singleton = new Database(file); singleton.pragma("foreign_keys = ON"); } return singleton; }

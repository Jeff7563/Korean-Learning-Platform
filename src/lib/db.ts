import "server-only";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
let singleton: Database.Database | undefined;
export function db() { if (!singleton) { const dir=join(process.cwd(),"data"); mkdirSync(dir,{recursive:true}); singleton=new Database(join(dir,"korean.db")); singleton.pragma("foreign_keys = ON"); } return singleton; }

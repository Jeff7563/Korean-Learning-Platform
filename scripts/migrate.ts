import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { getDatabasePath } from "../src/lib/database-path";
import { removePrivateLessonContent } from "./migrations/0002_public_lesson_content";
const dbPath = getDatabasePath(process.env.KOREAN_DB_PATH);
mkdirSync(dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
const sql = readFileSync(join(process.cwd(), "drizzle", "0001_init.sql"), "utf8");
db.exec(sql);
db.prepare("INSERT OR IGNORE INTO schema_migrations(name) VALUES (?)").run("0001_init.sql");
if (!db.prepare("SELECT 1 FROM schema_migrations WHERE name=?").get("0002_public_lesson_content")) {
  db.transaction(() => { removePrivateLessonContent(db); db.prepare("INSERT INTO schema_migrations(name) VALUES (?)").run("0002_public_lesson_content"); })();
}
const dailyPlannerMigration = "0003_daily_learning_plans.sql";
if (!db.prepare("SELECT 1 FROM schema_migrations WHERE name=?").get(dailyPlannerMigration)) {
  const migrationSql = readFileSync(join(process.cwd(), "scripts", "migrations", dailyPlannerMigration), "utf8");
  db.transaction(() => {
    db.exec(migrationSql);
    db.prepare("INSERT INTO schema_migrations(name) VALUES (?)").run(dailyPlannerMigration);
  })();
}
const vocabularySrsMigration = "0004_vocabulary_srs.sql";
if (!db.prepare("SELECT 1 FROM schema_migrations WHERE name=?").get(vocabularySrsMigration)) {
  const migrationSql = readFileSync(join(process.cwd(), "scripts", "migrations", vocabularySrsMigration), "utf8");
  db.transaction(() => {
    db.exec(migrationSql);
    db.prepare("INSERT INTO schema_migrations(name) VALUES (?)").run(vocabularySrsMigration);
  })();
}
const epsTopikMigration = "0005_eps_topik_simulator.sql";
if (!db.prepare("SELECT 1 FROM schema_migrations WHERE name=?").get(epsTopikMigration)) {
  const migrationSql = readFileSync(join(process.cwd(), "scripts", "migrations", epsTopikMigration), "utf8");
  db.transaction(() => {
    db.exec(migrationSql);
    db.prepare("INSERT INTO schema_migrations(name) VALUES (?)").run(epsTopikMigration);
  })();
}
const epsSectionsMigration = "0006_eps_exam_sections.sql";
if (!db.prepare("SELECT 1 FROM schema_migrations WHERE name=?").get(epsSectionsMigration)) {
  const migrationSql = readFileSync(join(process.cwd(), "scripts", "migrations", epsSectionsMigration), "utf8");
  db.transaction(() => {
    db.exec(migrationSql);
    db.prepare("INSERT INTO schema_migrations(name) VALUES (?)").run(epsSectionsMigration);
  })();
}
console.log(`Migration ready: ${dbPath}`); db.close();

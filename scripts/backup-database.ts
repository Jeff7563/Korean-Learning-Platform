import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { createHash } from "node:crypto";
import { getDatabasePath } from "../src/lib/database-path";

const requestedPath = process.argv[2];
if (!requestedPath || !isAbsolute(requestedPath)) throw new Error("Usage: pnpm db:backup -- <absolute-backup-path-outside-repository>");
const destination = resolve(requestedPath);
const relativePath = relative(process.cwd(), destination);
if (relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath))) throw new Error("Backups must be stored outside the repository.");
if (existsSync(destination)) throw new Error(`Refusing to overwrite an existing backup: ${destination}`);

const sourcePath = getDatabasePath(process.env.KOREAN_DB_PATH);
if (resolve(sourcePath).toLowerCase() === destination.toLowerCase()) throw new Error("Backup path must differ from the active database.");
mkdirSync(dirname(destination), { recursive: true });

const historyTables = [
  "learner_activity_progress", "learner_lesson_progress", "learner_settings", "checkpoint_attempts", "checkpoint_answers",
  "checkpoint_answer_snapshots", "daily_plans", "daily_plan_tasks", "tutor_messages", "vocabulary_review_events",
  "vocabulary_review_state", "eps_attempts", "eps_attempt_answers",
];

function fingerprint(database: Database.Database) {
  const tables = new Set((database.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>).map((row) => row.name));
  const history = Object.fromEntries(historyTables.filter((table) => tables.has(table)).map((table) => [
    table,
    database.prepare(`SELECT * FROM "${table}" ORDER BY rowid`).all(),
  ]));
  return {
    counts: Object.fromEntries(Object.entries(history).map(([table, rows]) => [table, rows.length])),
    sha256: createHash("sha256").update(JSON.stringify(history)).digest("hex"),
  };
}

async function createVerifiedBackup() {
  const source = new Database(sourcePath, { readonly: true, fileMustExist: true });
  try {
    const beforeIntegrity = source.pragma("integrity_check") as Array<{ integrity_check: string }>;
    const beforeForeignKeys = source.pragma("foreign_key_check") as unknown[];
    if (beforeIntegrity.length !== 1 || beforeIntegrity[0].integrity_check !== "ok" || beforeForeignKeys.length !== 0) {
      throw new Error("Source database failed SQLite integrity checks; no backup was created.");
    }
    const before = fingerprint(source);
    await source.backup(destination);

    const backup = new Database(destination, { readonly: true, fileMustExist: true });
    try {
      const integrity = backup.pragma("integrity_check") as Array<{ integrity_check: string }>;
      const foreignKeyViolations = backup.pragma("foreign_key_check") as unknown[];
      const after = fingerprint(backup);
      if (integrity.length !== 1 || integrity[0].integrity_check !== "ok" || foreignKeyViolations.length !== 0 || JSON.stringify(after) !== JSON.stringify(before)) {
        throw new Error("Backup verification failed: integrity, foreign keys, or learner-history fingerprint differs.");
      }
      console.log(JSON.stringify({ path: destination, integrity: "ok", foreignKeyViolations: 0, history: after }, null, 2));
    } finally {
      backup.close();
    }
  } finally {
    source.close();
  }
}

void createVerifiedBackup().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

import Database from "better-sqlite3";
import { existsSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { curriculumModules } from "../src/content/curriculum";
import { getDatabasePath } from "../src/lib/database-path";

const [lessonSlug, rawPosition, backupArgument] = process.argv.slice(2);
const position = Number(rawPosition);
const backupPath = backupArgument ? resolve(backupArgument) : "";

if (!lessonSlug || !Number.isInteger(position) || position < 1 || !backupArgument || !isAbsolute(backupArgument)) {
  throw new Error("Usage: pnpm db:revise-checkpoint -- <lesson-slug> <question-position> <absolute-verified-backup-path>");
}
const backupRelativePath = relative(process.cwd(), backupPath);
if (backupRelativePath === "" || (!backupRelativePath.startsWith("..") && !isAbsolute(backupRelativePath))) {
  throw new Error("The required backup must be outside the repository.");
}
if (!existsSync(backupPath)) throw new Error(`Backup file does not exist: ${backupPath}`);

const lesson = curriculumModules.flatMap((module) => module.lessons).find((item) => item.slug === lessonSlug);
const question = lesson?.questions[position - 1];
if (!question) throw new Error(`No authored checkpoint found at ${lessonSlug} question ${position}.`);

const databasePath = getDatabasePath(process.env.KOREAN_DB_PATH);
if (resolve(databasePath).toLowerCase() === backupPath.toLowerCase()) throw new Error("The backup path must differ from the active database path.");
const historyTables = [
  "learner_activity_progress", "learner_lesson_progress", "learner_settings", "checkpoint_attempts", "checkpoint_answers",
  "checkpoint_answer_snapshots", "daily_plans", "daily_plan_tasks", "tutor_messages", "vocabulary_review_events",
  "vocabulary_review_state", "eps_attempts", "eps_attempt_answers",
];
function historyFingerprint(database: Database.Database) {
  const tables = new Set((database.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>).map((row) => row.name));
  const history = Object.fromEntries(historyTables.filter((table) => tables.has(table)).map((table) => [
    table,
    database.prepare(`SELECT * FROM "${table}" ORDER BY rowid`).all(),
  ]));
  return JSON.stringify(history);
}
const backup = new Database(backupPath, { readonly: true, fileMustExist: true });
try {
  const integrity = backup.pragma("integrity_check") as Array<{ integrity_check: string }>;
  const foreignKeyViolations = backup.pragma("foreign_key_check") as unknown[];
  const hasSnapshotSchema = backup.prepare("SELECT 1 FROM schema_migrations WHERE name=?").get("0008_checkpoint_answer_snapshots.sql");
  const active = new Database(databasePath, { readonly: true, fileMustExist: true });
  const matchingHistory = historyFingerprint(backup) === historyFingerprint(active);
  active.close();
  if (integrity.length !== 1 || integrity[0].integrity_check !== "ok" || foreignKeyViolations.length !== 0 || !hasSnapshotSchema || !matchingHistory) {
    throw new Error("The supplied backup is not a verified V0.7.3-compatible SQLite backup.");
  }
} finally {
  backup.close();
}

const db = new Database(databasePath);
db.pragma("foreign_keys = ON");
try {
  const revise = db.transaction(() => {
    const exercise = db.prepare(`SELECT e.id,e.prompt,e.options_json,e.answer_index,e.explanation
      FROM exercises e JOIN lessons l ON l.id=e.lesson_id WHERE l.slug=? AND e.position=?`).get(lessonSlug, position) as
      { id: number; prompt: string; options_json: string; answer_index: number; explanation: string } | undefined;
    if (!exercise) throw new Error(`No published checkpoint found at ${lessonSlug} question ${position}.`);
    const missingSnapshots = (db.prepare(`SELECT count(*) count FROM checkpoint_answers ca
      LEFT JOIN checkpoint_answer_snapshots s ON s.attempt_id=ca.attempt_id AND s.exercise_id=ca.exercise_id
      WHERE ca.exercise_id=? AND s.attempt_id IS NULL`).get(exercise.id) as { count: number }).count;
    if (missingSnapshots) throw new Error(`${missingSnapshots} historical answers have no snapshot; refusing to revise this question.`);

    const changed = exercise.prompt !== question.prompt || exercise.options_json !== JSON.stringify(question.options) ||
      exercise.answer_index !== question.answer || exercise.explanation !== question.explanation;
    if (changed) db.prepare(`UPDATE exercises SET prompt=?,options_json=?,answer_index=?,explanation=? WHERE id=?`)
      .run(question.prompt, JSON.stringify(question.options), question.answer, question.explanation, exercise.id);
    return { changed, exerciseId: exercise.id };
  });
  console.log(JSON.stringify({ lessonSlug, position, ...revise(), historySnapshotsPreserved: true }));
} finally {
  db.close();
}

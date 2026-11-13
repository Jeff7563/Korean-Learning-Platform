import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("curriculum seeding", () => {
  it("can be repeated without duplicating lessons and preserves learner records", () => {
    const directory = mkdtempSync(join(tmpdir(), "korean-seed-test-"));
    temporaryDirectories.push(directory);
    const dbPath = join(directory, "seed-test.sqlite");
    const cli = join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
    const env = { ...process.env, KOREAN_DB_PATH: dbPath };
    const run = (script: string, ...args: string[]) => execFileSync(process.execPath, [cli, script, ...args], { cwd: process.cwd(), env, stdio: "pipe" });

    run("scripts/migrate.ts");
    run("scripts/seed.ts");
    const database = new Database(dbPath);
    const lessonId = (database.prepare("SELECT id FROM lessons WHERE slug='hangul-intro'").get() as { id: number }).id;
    const exercise = database.prepare("SELECT id,prompt,options_json,answer_index,explanation FROM exercises WHERE lesson_id=? ORDER BY position LIMIT 1").get(lessonId) as { id: number; prompt: string; options_json: string; answer_index: number; explanation: string };
    const exerciseId = exercise.id;
    const activityId = (database.prepare("SELECT id FROM lesson_activities WHERE lesson_id=? ORDER BY position LIMIT 1").get(lessonId) as { id: number }).id;
    database.prepare("INSERT INTO learner_lesson_progress(lesson_id,status) VALUES(?,'completed')").run(lessonId);
    const attemptId = database.prepare("INSERT INTO checkpoint_attempts(lesson_id,score,total,passed) VALUES(?,5,5,1)").run(lessonId).lastInsertRowid;
    database.prepare("INSERT INTO checkpoint_answers(attempt_id,exercise_id,selected_index,correct) VALUES(?,?,0,1)").run(attemptId, exerciseId);
    database.prepare(`INSERT INTO checkpoint_answer_snapshots(attempt_id,exercise_id,prompt,options_json,answer_index,explanation,snapshot_kind)
      VALUES(?,?,?,?,?,?,'captured')`).run(attemptId, exerciseId, exercise.prompt, exercise.options_json, exercise.answer_index, exercise.explanation);
    database.prepare("INSERT INTO learner_activity_progress(activity_id) VALUES(?)").run(activityId);
    const vocabularyId = (database.prepare("SELECT id FROM vocabulary WHERE lesson_id=? ORDER BY id LIMIT 1").get(lessonId) as { id:number }).id;
    database.prepare("INSERT INTO vocabulary_review_state(vocabulary_id,due_date,interval_days,review_count,lapse_count,last_reviewed_date,last_rating) VALUES(?,'2026-11-13',3,2,1,'2026-11-10','hard')").run(vocabularyId);
    database.prepare("INSERT INTO vocabulary_review_events(vocabulary_id,idempotency_key,rating,reviewed_date,previous_interval_days,next_interval_days) VALUES(?,'54e2ab52-c9e2-4db1-9bdc-048879d9a980','hard','2026-11-10',2,3)").run(vocabularyId);
    database.prepare("INSERT INTO tutor_messages(lesson_id,role,content) VALUES(?,'user','preserve me')").run(lessonId);
    database.prepare("INSERT INTO daily_plans(plan_date,mode,lesson_id,recommendation,recommendation_href,planned_minutes) VALUES('2099-01-02','light',?,'saved plan','/learn/hangul-intro',15)").run(lessonId);
    database.prepare("INSERT INTO daily_plan_tasks(plan_date,task_key,title,planned_minutes,href) VALUES('2099-01-02','saved','saved task',5,'/learn/hangul-intro')").run();
    const epsSet = (database.prepare("SELECT id FROM eps_exam_sets ORDER BY id LIMIT 1").get() as { id: string }).id;
    const epsQuestion = (database.prepare("SELECT id FROM eps_questions WHERE exam_set_id=? ORDER BY position LIMIT 1").get(epsSet) as { id: number }).id;
    const epsAttemptId = database.prepare(`INSERT INTO eps_attempts(exam_set_id,kind,status,question_ids_json,started_at,expires_at)
      VALUES(?,'exam','submitted',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).run(epsSet, JSON.stringify([epsQuestion])).lastInsertRowid;
    database.prepare("INSERT INTO eps_attempt_answers(attempt_id,question_id,selected_index) VALUES(?,?,0)").run(epsAttemptId, epsQuestion);

    const learnerSnapshot = () => Object.fromEntries(["learner_lesson_progress", "checkpoint_attempts", "checkpoint_answers", "checkpoint_answer_snapshots", "learner_activity_progress", "tutor_messages", "daily_plans", "daily_plan_tasks", "vocabulary_review_state", "vocabulary_review_events", "eps_attempts", "eps_attempt_answers"].map((table) => [table, database.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()]));
    const before = learnerSnapshot();
    const lessonIds = database.prepare("SELECT id,slug FROM lessons WHERE slug NOT LIKE 'grammar-%' ORDER BY id").all();
    const originalLessons = database.prepare("SELECT id,slug,title,description,content_json,position,module_id FROM lessons WHERE slug NOT LIKE 'grammar-%' ORDER BY id").all();
    const originalExercises = database.prepare("SELECT e.id,e.lesson_id,e.position,e.prompt,e.options_json,e.answer_index,e.explanation FROM exercises e JOIN lessons l ON l.id=e.lesson_id WHERE l.slug NOT LIKE 'grammar-%' ORDER BY e.id").all();
    run("scripts/seed.ts");
    run("scripts/seed.ts");
    expect(learnerSnapshot()).toEqual(before);
    expect(database.prepare("SELECT id,slug FROM lessons WHERE slug NOT LIKE 'grammar-%' ORDER BY id").all()).toEqual(lessonIds);
    expect(database.prepare("SELECT id,slug,title,description,content_json,position,module_id FROM lessons WHERE slug NOT LIKE 'grammar-%' ORDER BY id").all()).toEqual(originalLessons);
    expect(database.prepare("SELECT e.id,e.lesson_id,e.position,e.prompt,e.options_json,e.answer_index,e.explanation FROM exercises e JOIN lessons l ON l.id=e.lesson_id WHERE l.slug NOT LIKE 'grammar-%' ORDER BY e.id").all()).toEqual(originalExercises);
    expect(database.prepare("SELECT count(*) count FROM lessons").get()).toEqual({ count: 50 });
    expect(database.prepare("SELECT count(*) count FROM exercises").get()).toEqual({ count: 250 });
    expect(database.prepare("SELECT slug,position,(SELECT count(*) FROM lessons WHERE module_id=modules.id) lessons FROM modules ORDER BY position").all()).toEqual([
      { slug: "hangul-foundation", position: 1, lessons: 10 }, { slug: "everyday-korean", position: 2, lessons: 10 }, { slug: "korean-grammar", position: 3, lessons: 10 }, { slug: "workplace-korean", position: 4, lessons: 10 }, { slug: "eps-topik-preparation", position: 5, lessons: 10 },
    ]);
    expect(database.prepare("SELECT id FROM vocabulary WHERE lesson_id=? ORDER BY id LIMIT 1").get(lessonId)).toEqual({ id:vocabularyId });
    expect(database.pragma("integrity_check")).toEqual([{ integrity_check: "ok" }]);
    database.close();
  }, 30_000);

  it("fails safe on checkpoint drift and preserves saved question versions through an explicit revision", async () => {
    const directory = mkdtempSync(join(tmpdir(), "korean-checkpoint-revision-"));
    temporaryDirectories.push(directory);
    const dbPath = join(directory, "revision.sqlite");
    const backupPath = join(directory, "verified-backup.sqlite");
    const cli = join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
    const env = { ...process.env, KOREAN_DB_PATH: dbPath };
    const run = (script: string, ...args: string[]) => execFileSync(process.execPath, [cli, script, ...args], { cwd: process.cwd(), env, stdio: "pipe" });
    run("scripts/migrate.ts");
    run("scripts/seed.ts");
    const database = new Database(dbPath);
    const lessonId = (database.prepare("SELECT id FROM lessons WHERE slug='hangul-intro'").get() as { id: number }).id;
    const original = database.prepare("SELECT id,prompt,options_json,answer_index,explanation FROM exercises WHERE lesson_id=? AND position=1").get(lessonId) as { id: number; prompt: string; options_json: string; answer_index: number; explanation: string };
    const attemptId = database.prepare("INSERT INTO checkpoint_attempts(lesson_id,score,total,passed) VALUES(?,5,5,1)").run(lessonId).lastInsertRowid;
    database.prepare("INSERT INTO checkpoint_answers(attempt_id,exercise_id,selected_index,correct) VALUES(?,?,?,1)").run(attemptId, original.id, original.answer_index);
    database.prepare(`INSERT INTO checkpoint_answer_snapshots(attempt_id,exercise_id,prompt,options_json,answer_index,explanation,snapshot_kind)
      VALUES(?,?,?,?,?,?,'captured')`).run(attemptId, original.id, original.prompt, original.options_json, original.answer_index, original.explanation);

    database.prepare("UPDATE exercises SET prompt='unexpected database drift' WHERE id=?").run(original.id);
    expect(() => run("scripts/seed.ts")).toThrow();
    expect(database.prepare("SELECT prompt FROM exercises WHERE id=?").get(original.id)).toEqual({ prompt: "unexpected database drift" });

    await database.backup(backupPath);
    run("scripts/revise-checkpoint.ts", "hangul-intro", "1", backupPath);
    expect(database.prepare("SELECT prompt,options_json,answer_index,explanation FROM checkpoint_answer_snapshots WHERE attempt_id=? AND exercise_id=?")
      .get(attemptId, original.id)).toEqual({ prompt: original.prompt, options_json: original.options_json, answer_index: original.answer_index, explanation: original.explanation });
    expect(database.prepare("SELECT score,total,passed FROM checkpoint_attempts WHERE id=?").get(attemptId)).toEqual({ score: 5, total: 5, passed: 1 });
    expect(database.prepare("SELECT correct,selected_index FROM checkpoint_answers WHERE attempt_id=? AND exercise_id=?").get(attemptId, original.id)).toEqual({ correct: 1, selected_index: original.answer_index });
    run("scripts/seed.ts");
    expect(database.pragma("integrity_check")).toEqual([{ integrity_check: "ok" }]);
    database.close();
  }, 30_000);

  it("backfills legacy checkpoint history as explicitly unverified and is idempotent", () => {
    const directory = mkdtempSync(join(tmpdir(), "korean-checkpoint-backfill-"));
    temporaryDirectories.push(directory);
    const dbPath = join(directory, "legacy.sqlite");
    const cli = join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
    const env = { ...process.env, KOREAN_DB_PATH: dbPath };
    const run = (script: string) => execFileSync(process.execPath, [cli, script], { cwd: process.cwd(), env, stdio: "pipe" });
    run("scripts/migrate.ts");
    run("scripts/seed.ts");
    const database = new Database(dbPath);
    const lessonId = (database.prepare("SELECT id FROM lessons WHERE slug='hangul-intro'").get() as { id: number }).id;
    const exercise = database.prepare("SELECT id,prompt FROM exercises WHERE lesson_id=? AND position=1").get(lessonId) as { id: number; prompt: string };
    const attemptId = database.prepare("INSERT INTO checkpoint_attempts(lesson_id,score,total,passed) VALUES(?,4,5,1)").run(lessonId).lastInsertRowid;
    database.prepare("INSERT INTO checkpoint_answers(attempt_id,exercise_id,selected_index,correct) VALUES(?,?,0,1)").run(attemptId, exercise.id);
    database.exec("DROP TRIGGER checkpoint_answer_snapshots_no_update; DROP TRIGGER checkpoint_answer_snapshots_no_delete; DROP TABLE checkpoint_answer_snapshots;");
    database.prepare("DELETE FROM schema_migrations WHERE name='0008_checkpoint_answer_snapshots.sql'").run();
    database.close();

    run("scripts/migrate.ts");
    const migrated = new Database(dbPath);
    const snapshot = migrated.prepare("SELECT prompt,snapshot_kind FROM checkpoint_answer_snapshots WHERE attempt_id=? AND exercise_id=?").get(attemptId, exercise.id);
    expect(snapshot).toEqual({ prompt: exercise.prompt, snapshot_kind: "legacy_unverified" });
    run("scripts/migrate.ts");
    expect(migrated.prepare("SELECT count(*) count FROM checkpoint_answer_snapshots").get()).toEqual({ count: 1 });
    expect(migrated.pragma("integrity_check")).toEqual([{ integrity_check: "ok" }]);
    migrated.close();
  }, 30_000);
});

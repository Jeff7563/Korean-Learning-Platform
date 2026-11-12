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
    const run = (script: string) => execFileSync(process.execPath, [cli, script], { cwd: process.cwd(), env, stdio: "pipe" });

    run("scripts/migrate.ts");
    run("scripts/seed.ts");
    const database = new Database(dbPath);
    const lessonId = (database.prepare("SELECT id FROM lessons WHERE slug='hangul-intro'").get() as { id: number }).id;
    const exerciseId = (database.prepare("SELECT id FROM exercises WHERE lesson_id=? ORDER BY position LIMIT 1").get(lessonId) as { id: number }).id;
    const activityId = (database.prepare("SELECT id FROM lesson_activities WHERE lesson_id=? ORDER BY position LIMIT 1").get(lessonId) as { id: number }).id;
    database.prepare("INSERT INTO learner_lesson_progress(lesson_id,status) VALUES(?,'completed')").run(lessonId);
    const attemptId = database.prepare("INSERT INTO checkpoint_attempts(lesson_id,score,total,passed) VALUES(?,5,5,1)").run(lessonId).lastInsertRowid;
    database.prepare("INSERT INTO checkpoint_answers(attempt_id,exercise_id,selected_index,correct) VALUES(?,?,0,1)").run(attemptId, exerciseId);
    database.prepare("INSERT INTO learner_activity_progress(activity_id) VALUES(?)").run(activityId);
    const vocabularyId = (database.prepare("SELECT id FROM vocabulary WHERE lesson_id=? ORDER BY id LIMIT 1").get(lessonId) as { id:number }).id;
    database.prepare("INSERT INTO vocabulary_review_state(vocabulary_id,due_date,interval_days,review_count,lapse_count,last_reviewed_date,last_rating) VALUES(?,'2026-11-13',3,2,1,'2026-11-10','hard')").run(vocabularyId);
    database.prepare("INSERT INTO vocabulary_review_events(vocabulary_id,idempotency_key,rating,reviewed_date,previous_interval_days,next_interval_days) VALUES(?,'54e2ab52-c9e2-4db1-9bdc-048879d9a980','hard','2026-11-10',2,3)").run(vocabularyId);
    database.prepare("INSERT INTO tutor_messages(lesson_id,role,content) VALUES(?,'user','preserve me')").run(lessonId);
    database.prepare("INSERT INTO daily_plans(plan_date,mode,lesson_id,recommendation,recommendation_href,planned_minutes) VALUES('2099-01-02','light',?,'saved plan','/learn/hangul-intro',15)").run(lessonId);
    database.prepare("INSERT INTO daily_plan_tasks(plan_date,task_key,title,planned_minutes,href) VALUES('2099-01-02','saved','saved task',5,'/learn/hangul-intro')").run();

    const learnerSnapshot = () => Object.fromEntries(["learner_lesson_progress", "checkpoint_attempts", "checkpoint_answers", "learner_activity_progress", "tutor_messages", "daily_plans", "daily_plan_tasks", "vocabulary_review_state", "vocabulary_review_events"].map((table) => [table, database.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()]));
    const before = learnerSnapshot();
    const lessonIds = database.prepare("SELECT id,slug FROM lessons ORDER BY id").all();
    run("scripts/seed.ts");
    run("scripts/seed.ts");
    expect(learnerSnapshot()).toEqual(before);
    expect(database.prepare("SELECT id,slug FROM lessons ORDER BY id").all()).toEqual(lessonIds);
    expect(database.prepare("SELECT count(*) count FROM lessons").get()).toEqual({ count: 20 });
    expect(database.prepare("SELECT count(*) count FROM exercises").get()).toEqual({ count: 100 });
    expect(database.prepare("SELECT id FROM vocabulary WHERE lesson_id=? ORDER BY id LIMIT 1").get(lessonId)).toEqual({ id:vocabularyId });
    expect(database.pragma("integrity_check")).toEqual([{ integrity_check: "ok" }]);
    database.close();
  }, 30_000);
});

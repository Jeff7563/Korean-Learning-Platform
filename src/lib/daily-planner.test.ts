import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { bangkokDate, changePlanMode, dailyPlanIsComplete, defaultModeForDate, ensureDailyPlan, isLocalDate, recommendStudy, scheduledTasks, weekdayForLocalDate } from "./daily-planner";

function createDb() {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  database.exec(`
    CREATE TABLE lessons(id INTEGER PRIMARY KEY,slug TEXT,title TEXT,position INTEGER);
    CREATE TABLE learner_lesson_progress(lesson_id INTEGER PRIMARY KEY,status TEXT);
    CREATE TABLE learner_activity_progress(id INTEGER PRIMARY KEY,activity_id INTEGER UNIQUE,completed_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE lesson_activities(id INTEGER PRIMARY KEY,lesson_id INTEGER,slug TEXT,title TEXT,position INTEGER);
    CREATE TABLE checkpoint_attempts(id INTEGER PRIMARY KEY,lesson_id INTEGER,score INTEGER,total INTEGER,passed INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE exercises(id INTEGER PRIMARY KEY,lesson_id INTEGER,position INTEGER,prompt TEXT,explanation TEXT);
    CREATE TABLE checkpoint_answers(id INTEGER PRIMARY KEY,attempt_id INTEGER,exercise_id INTEGER,correct INTEGER);
  `);
  database.prepare("INSERT INTO lessons VALUES(1,'lesson-one','Lesson One',1),(2,'lesson-two','Lesson Two',2)").run();
  database.prepare("INSERT INTO lesson_activities(id,lesson_id,slug,title,position) VALUES(1,1,'activity-1','Write a word',1),(2,2,'activity-1','Read a word',1)").run();
  return database;
}

describe("Bangkok planner calendar and schedules", () => {
  it("changes local date at the Asia/Bangkok midnight boundary", () => {
    expect(bangkokDate(new Date("2026-11-11T16:59:59Z"))).toBe("2026-11-11");
    expect(bangkokDate(new Date("2026-11-11T17:00:00Z"))).toBe("2026-11-12");
  });
  it("validates calendar dates and treats Sunday as rest by default", () => {
    expect(isLocalDate("2026-11-12")).toBe(true);
    expect(isLocalDate("2026-02-30")).toBe(false);
    expect(defaultModeForDate("2026-11-08")).toBe("rest");
    expect(defaultModeForDate("2026-11-09")).toBe("standard");
  });
  it("builds the Monday to Saturday 90-minute schedule including the break", () => {
    const tasks = scheduledTasks("standard", "lesson-one");
    expect(weekdayForLocalDate("2026-11-09")).toBe(1);
    expect(weekdayForLocalDate("2026-11-14")).toBe(6);
    expect(tasks.map((task) => [task.startsAt, task.endsAt])).toEqual([["18:00","18:15"],["18:15","18:45"],["18:45","19:00"],["19:00","19:15"],["19:15","19:25"],["19:25","19:30"]]);
    expect(tasks.reduce((sum, task) => sum + task.minutes, 0)).toBe(90);
    expect(tasks.map((task) => task.href)).toEqual(["/learn/lesson-one#vocabulary","/learn/lesson-one#video","/learn/lesson-one#listening","/dashboard#daily-plan","/learn/lesson-one#lesson-activities","/review"]);
  });
  it("keeps Light Mode to three five-minute tasks and Sunday optional", () => {
    const light = scheduledTasks("light", "lesson-one");
    expect(light).toHaveLength(3);
    expect(light.reduce((sum, task) => sum + task.minutes, 0)).toBe(15);
    const rest = scheduledTasks("rest");
    expect(rest).toHaveLength(1);
    expect(rest[0].optional).toBe(true);
    expect(rest[0].minutes).toBe(0);
  });
});

describe("progress-aware recommendations", () => {
  it("recommends review of incorrect concepts after a failed checkpoint", () => {
    const database = createDb();
    database.prepare("INSERT INTO exercises VALUES(1,1,1,'Read ㄱ','Review its sound')").run();
    database.prepare("INSERT INTO checkpoint_attempts(id,lesson_id,score,total,passed) VALUES(1,1,0,1,0)").run();
    database.prepare("INSERT INTO checkpoint_answers(attempt_id,exercise_id,correct) VALUES(1,1,0)").run();
    expect(recommendStudy(database)).toMatchObject({ lesson: { slug: "lesson-one" }, reason: expect.stringContaining("Read ㄱ"), href: "/learn/lesson-one#checkpoint" });
    database.close();
  });
  it("moves to the next unlocked lesson after a pass and never recommends locked lessons", () => {
    const database = createDb();
    database.prepare("INSERT INTO checkpoint_attempts(lesson_id,score,total,passed) VALUES(1,5,5,1)").run();
    expect(recommendStudy(database)).toMatchObject({ lesson: { slug: "lesson-two" }, href: "/learn/lesson-two#lesson-activities" });
    database.prepare("INSERT INTO checkpoint_attempts(lesson_id,score,total,passed) VALUES(2,5,5,1)").run();
    expect(recommendStudy(database)).toMatchObject({ lesson: { slug: "lesson-two" }, href: "/review" });
    database.close();
  });
});

describe("daily plan persistence and learner data safety", () => {
  it("is idempotent, snapshots its first recommendation, and stores mode separately from lesson progress", () => {
    const database = createDb();
    database.exec(readFileSync(join(process.cwd(), "scripts", "migrations", "0003_daily_learning_plans.sql"), "utf8"));
    ensureDailyPlan(database, "2026-11-09");
    const before = database.prepare("SELECT recommendation,planned_minutes FROM daily_plans WHERE plan_date='2026-11-09'").get() as { recommendation: string; planned_minutes: number };
    expect(changePlanMode(database, "2026-11-09", "light")).toBe(true);
    expect(database.prepare("SELECT mode,planned_minutes FROM daily_plans WHERE plan_date='2026-11-09'").get()).toEqual({ mode: "light", planned_minutes: 15 });
    const task = database.prepare("SELECT id FROM daily_plan_tasks WHERE plan_date='2026-11-09' ORDER BY id LIMIT 1").get() as { id: number };
    database.prepare("UPDATE daily_plan_tasks SET completed_at='2026-11-09 18:01:00' WHERE id=?").run(task.id);
    expect(changePlanMode(database, "2026-11-09", "standard")).toBe(false);
    expect(dailyPlanIsComplete(database, "2026-11-09")).toBe(false);
    ensureDailyPlan(database, "2026-11-09");
    expect(database.prepare("SELECT recommendation FROM daily_plans WHERE plan_date='2026-11-09'").get()).toEqual({ recommendation: before.recommendation });
    expect(database.prepare("SELECT count(*) n FROM daily_plan_tasks WHERE plan_date='2026-11-09'").get()).toEqual({ n: 3 });
    expect(database.prepare("SELECT count(*) n FROM learner_lesson_progress").get()).toEqual({ n: 0 });
    database.close();
  });

  it("adds the migration without changing existing lesson, checkpoint, answer, activity, or tutor records", () => {
    const database = new Database(":memory:");
    database.exec(`CREATE TABLE lessons(id INTEGER PRIMARY KEY,slug TEXT); CREATE TABLE learner_lesson_progress(id INTEGER); CREATE TABLE checkpoint_attempts(id INTEGER); CREATE TABLE checkpoint_answers(id INTEGER); CREATE TABLE learner_activity_progress(id INTEGER); CREATE TABLE tutor_messages(id INTEGER);`);
    database.exec("INSERT INTO lessons VALUES(1,'saved'); INSERT INTO learner_lesson_progress VALUES(1); INSERT INTO checkpoint_attempts VALUES(1); INSERT INTO checkpoint_answers VALUES(1); INSERT INTO learner_activity_progress VALUES(1); INSERT INTO tutor_messages VALUES(1);");
    const before = ["lessons","learner_lesson_progress","checkpoint_attempts","checkpoint_answers","learner_activity_progress","tutor_messages"].map((table) => (database.prepare(`SELECT count(*) n FROM ${table}`).get() as { n: number }).n);
    database.exec(readFileSync(join(process.cwd(), "scripts", "migrations", "0003_daily_learning_plans.sql"), "utf8"));
    const after = ["lessons","learner_lesson_progress","checkpoint_attempts","checkpoint_answers","learner_activity_progress","tutor_messages"].map((table) => (database.prepare(`SELECT count(*) n FROM ${table}`).get() as { n: number }).n);
    expect(after).toEqual(before);
    database.close();
  });
});

import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { addLocalDays, bangkokLocalDate, getVocabularyReviewData, recordVocabularyReview, scheduleReview, type ReviewState } from "./vocabulary-srs";

const databases: Database.Database[] = [];
function createDatabase() {
  const database = new Database(":memory:"); databases.push(database); database.pragma("foreign_keys=ON");
  database.exec(`CREATE TABLE courses(id INTEGER PRIMARY KEY,slug TEXT,title TEXT);
    CREATE TABLE modules(id INTEGER PRIMARY KEY,course_id INTEGER,slug TEXT,title TEXT,position INTEGER);
    CREATE TABLE lessons(id INTEGER PRIMARY KEY,module_id INTEGER,slug TEXT,title TEXT,position INTEGER);
    CREATE TABLE vocabulary(id INTEGER PRIMARY KEY,lesson_id INTEGER,korean TEXT,thai TEXT,UNIQUE(lesson_id,korean));
    CREATE TABLE checkpoint_attempts(id INTEGER PRIMARY KEY,lesson_id INTEGER,passed INTEGER);
    CREATE TABLE learner_lesson_progress(lesson_id INTEGER PRIMARY KEY,status TEXT);
    CREATE TABLE lesson_activities(id INTEGER PRIMARY KEY,lesson_id INTEGER);
    CREATE TABLE learner_activity_progress(id INTEGER PRIMARY KEY,activity_id INTEGER);
  `);
  database.exec(`INSERT INTO courses VALUES(1,'course','Course'); INSERT INTO modules VALUES(1,1,'module','Module',1);
    INSERT INTO lessons VALUES(1,1,'one','Lesson One',1),(2,1,'two','Lesson Two',2),(3,1,'three','Locked Lesson',3);
    INSERT INTO vocabulary VALUES(11,1,'안녕','สวัสดี'),(12,2,'학교','โรงเรียน'),(13,3,'잠','นอน');`);
  database.prepare("INSERT INTO checkpoint_attempts VALUES(1,1,1)").run();
  database.exec(readFileSync(join(process.cwd(), "scripts/migrations/0004_vocabulary_srs.sql"), "utf8"));
  return database;
}
afterEach(() => { for (const database of databases.splice(0)) database.close(); });

describe("deterministic spaced repetition schedule", () => {
  it("starts new words and increases Good intervals gradually", () => {
    const first = scheduleReview(null, "good", "2026-11-12");
    const second = scheduleReview(first, "good", first.dueDate);
    const third = scheduleReview(second, "good", second.dueDate);
    expect([first.intervalDays, first.dueDate]).toEqual([1,"2026-11-13"]);
    expect([second.intervalDays, third.intervalDays]).toEqual([3,6]);
  });
  it("gives Hard a smaller increase and Again resets interval and increments lapses", () => {
    const state: ReviewState = { dueDate:"2026-11-20",intervalDays:8,reviewCount:4,lapseCount:1,lastReviewedDate:"2026-11-12",lastRating:"good" };
    const hard = scheduleReview(state,"hard","2026-11-20");
    const again = scheduleReview(hard,"again","2026-11-23");
    expect(hard.intervalDays).toBe(12);
    expect(again).toMatchObject({ intervalDays:1,lapseCount:2,reviewCount:6,dueDate:"2026-11-24" });
    expect(scheduleReview(again,"again","2026-11-24").intervalDays).toBe(1);
  });
  it("uses Bangkok local dates across UTC midnight", () => {
    expect(bangkokLocalDate(new Date("2026-11-12T16:59:59Z"))).toBe("2026-11-12");
    expect(bangkokLocalDate(new Date("2026-11-12T17:00:00Z"))).toBe("2026-11-13");
    expect(addLocalDays("2026-12-31",1)).toBe("2027-01-01");
  });
});

describe("persisted review state and learner privacy", () => {
  it("hides locked vocabulary but includes it after recorded study access", () => {
    const database = createDatabase();
    expect(getVocabularyReviewData(database,"2026-11-12").cards.map((card) => card.id)).toEqual([11,12]);
    database.prepare("INSERT INTO learner_lesson_progress VALUES(3,'in_progress')").run();
    expect(getVocabularyReviewData(database,"2026-11-12").cards.map((card) => card.id)).toEqual([11,12,13]);
  });
  it("persists review history and ignores a duplicate idempotency key", () => {
    const database = createDatabase();
    const key = "8aa54f3a-8eef-40a5-9bbc-89045fc9a4d1";
    expect(recordVocabularyReview(database,11,"again",key,new Date("2026-11-12T17:30:00Z"))).toMatchObject({ duplicate:false,state:{dueDate:"2026-11-14",lapseCount:1} });
    expect(recordVocabularyReview(database,11,"good",key,new Date("2026-11-13T18:00:00Z"))).toMatchObject({ duplicate:true,vocabularyId:11 });
    const data = getVocabularyReviewData(database,"2026-11-13");
    expect(data.history).toHaveLength(1);
    expect(data.history[0]).toMatchObject({ vocabularyId:11,rating:"again",reviewedDate:"2026-11-13",nextIntervalDays:1 });
  });
  it("orders overdue difficult words first", () => {
    const database = createDatabase();
    database.prepare("INSERT INTO vocabulary_review_state(vocabulary_id,due_date,interval_days,review_count,lapse_count,last_reviewed_date,last_rating) VALUES(11,'2026-11-10',3,2,0,'2026-11-07','good'),(12,'2026-11-11',1,4,2,'2026-11-10','again')").run();
    expect(getVocabularyReviewData(database,"2026-11-12").cards.slice(0,2).map((card) => card.id)).toEqual([12,11]);
  });
});

describe("additive migration safety", () => {
  it("is idempotent and leaves existing learner records unchanged", () => {
    const database = new Database(":memory:"); databases.push(database);
    database.exec("CREATE TABLE vocabulary(id INTEGER PRIMARY KEY,lesson_id INTEGER,korean TEXT,thai TEXT); CREATE TABLE learner_lesson_progress(lesson_id INTEGER PRIMARY KEY,status TEXT); CREATE TABLE checkpoint_attempts(id INTEGER PRIMARY KEY,score INTEGER); CREATE TABLE daily_plans(plan_date TEXT PRIMARY KEY,mode TEXT); INSERT INTO learner_lesson_progress VALUES(4,'completed'); INSERT INTO checkpoint_attempts VALUES(9,5); INSERT INTO daily_plans VALUES('2026-11-12','light'); INSERT INTO vocabulary VALUES(44,4,'안녕하세요','สวัสดี');");
    const before = ["learner_lesson_progress","checkpoint_attempts","daily_plans"].map((table) => database.prepare(`SELECT * FROM ${table}`).all());
    const migration = readFileSync(join(process.cwd(), "scripts/migrations/0004_vocabulary_srs.sql"), "utf8");
    database.exec(migration); database.exec(migration);
    expect(["learner_lesson_progress","checkpoint_attempts","daily_plans"].map((table) => database.prepare(`SELECT * FROM ${table}`).all())).toEqual(before);
    expect(database.prepare("SELECT count(*) count FROM vocabulary_review_events").get()).toEqual({ count:0 });
    expect(database.pragma("integrity_check")).toEqual([{ integrity_check:"ok" }]);
  });
});

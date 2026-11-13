import Database from "better-sqlite3";
import { describe, expect, it, vi } from "vitest";
import { curriculumModules } from "../content/curriculum";
import { everydayKoreanLessons } from "../content/everyday-korean";
import { everydayListeningItems } from "../content/everyday-listening";
import { lessonMediaCatalog } from "../content/media-catalog";
import { canAccessLesson, courseProgress } from "./progress";

vi.mock("./db", () => ({ db: vi.fn() }));

function createCourseDatabase() {
  const database = new Database(":memory:");
  database.exec(`
    CREATE TABLE courses(id INTEGER PRIMARY KEY,slug TEXT,title TEXT);
    CREATE TABLE modules(id INTEGER PRIMARY KEY,course_id INTEGER,slug TEXT,title TEXT,position INTEGER);
    CREATE TABLE lessons(id INTEGER PRIMARY KEY,slug TEXT,title TEXT,description TEXT,position INTEGER,module_id INTEGER);
    CREATE TABLE checkpoint_attempts(id INTEGER PRIMARY KEY,lesson_id INTEGER,passed INTEGER);
    CREATE TABLE learner_activity_progress(id INTEGER PRIMARY KEY,activity_id INTEGER);
    CREATE TABLE lesson_activities(id INTEGER PRIMARY KEY,lesson_id INTEGER);
    CREATE TABLE learner_lesson_progress(lesson_id INTEGER,status TEXT);
  `);
  database.exec("INSERT INTO courses VALUES(1,'korean','Korean'); INSERT INTO modules VALUES(1,1,'hangul-foundation','Hangul Foundation',1),(2,1,'everyday-korean','Everyday Korean',2),(3,1,'korean-grammar','Korean Grammar',3),(4,1,'workplace-korean','Workplace Korean',4),(5,1,'eps-topik-preparation','EPS-TOPIK Preparation',5);");
  const addLesson = database.prepare("INSERT INTO lessons(id,slug,title,description,position,module_id) VALUES(?,?,?,?,?,?)");
  for (let position = 1; position <= 10; position += 1) addLesson.run(position, `hangul-${position}`, `Hangul ${position}`, "Hangul lesson", position, 1);
  for (let position = 1; position <= 10; position += 1) addLesson.run(10 + position, `everyday-${position}`, `Everyday ${position}`, "Everyday lesson", position, 2);
  for (let position = 1; position <= 10; position += 1) addLesson.run(20 + position, `grammar-${position}`, `Grammar ${position}`, "Grammar lesson", position, 3);
  for (let position = 1; position <= 10; position += 1) addLesson.run(30 + position, `workplace-${position}`, `Workplace ${position}`, "Workplace lesson", position, 4);
  for (let position = 1; position <= 10; position += 1) addLesson.run(40 + position, `eps-prep-${position}`, `EPS Prep ${position}`, "Exam preparation lesson", position, 5);
  return database;
}

describe("Everyday Korean curriculum content", () => {
  it("has ten authored lessons with objectives, activities, checkpoint items, listening and attributed resources", () => {
    expect(curriculumModules.map((module) => module.lessons.length)).toEqual([10, 10, 10, 10, 10]);
    expect(everydayKoreanLessons.reduce((count, lesson) => count + lesson.questions.length, 0)).toBeGreaterThanOrEqual(50);
    for (const lesson of everydayKoreanLessons) {
      expect(lesson.objectives.length, lesson.slug).toBeGreaterThanOrEqual(3);
      expect(lesson.activities.length, lesson.slug).toBeGreaterThanOrEqual(3);
      expect(lesson.questions.length, lesson.slug).toBeGreaterThanOrEqual(5);
      expect(lesson.vocabulary.length, lesson.slug).toBeGreaterThanOrEqual(5);
      expect(everydayListeningItems[lesson.slug]?.length, lesson.slug).toBeGreaterThanOrEqual(3);
      expect(lessonMediaCatalog[lesson.slug]?.length, lesson.slug).toBeGreaterThan(0);
      expect(lessonMediaCatalog[lesson.slug]?.every((resource) => resource.verification.status === "verified" && resource.creator && resource.url), lesson.slug).toBe(true);
    }
  });
});

describe("multi-module ordering and sequential unlocks", () => {
  it("orders by module position and lesson position with per-module and overall progress", () => {
    const database = createCourseDatabase();
    const progress = courseProgress(database);
    expect(progress.lessons).toHaveLength(50);
    expect(progress.lessons[9]).toMatchObject({ slug: "hangul-10", modulePosition: 1, position: 10 });
    expect(progress.lessons[10]).toMatchObject({ slug: "everyday-1", modulePosition: 2, position: 1, status: "locked" });
    expect(progress.lessons[20]).toMatchObject({ slug: "grammar-1", modulePosition: 3, position: 1, status: "locked" });
    expect(progress.lessons[30]).toMatchObject({ slug: "workplace-1", modulePosition: 4, position: 1, status: "locked" });
    expect(progress.lessons[40]).toMatchObject({ slug: "eps-prep-1", modulePosition: 5, position: 1, status: "locked" });
    expect(progress.modules.map((module) => [module.slug, module.completed, module.total, module.percent])).toEqual([
      ["hangul-foundation", 0, 10, 0], ["everyday-korean", 0, 10, 0], ["korean-grammar", 0, 10, 0], ["workplace-korean", 0, 10, 0],
      ["eps-topik-preparation", 0, 10, 0],
    ]);
    expect(canAccessLesson("everyday-1", database)).toBe(false);
    database.prepare("INSERT INTO checkpoint_attempts(lesson_id,passed) VALUES(11,1)").run();
    expect(canAccessLesson("everyday-2", database)).toBe(false);
    expect(courseProgress(database).lessons[10].status).toBe("locked");
    database.close();
  });

  it("unlocks lesson 41 after the first forty pass, then completes 50/50", () => {
    const database = createCourseDatabase();
    const pass = database.prepare("INSERT INTO checkpoint_attempts(lesson_id,passed) VALUES(?,1)");
    for (let id = 1; id <= 9; id += 1) pass.run(id);
    expect(courseProgress(database).lessons[9].status).toBe("available");
    expect(canAccessLesson("everyday-1", database)).toBe(false);
    pass.run(10);
    expect(canAccessLesson("everyday-1", database)).toBe(true);
    expect(courseProgress(database).lessons[10].status).toBe("available");
    expect(courseProgress(database).lessons[11].status).toBe("locked");
    for (let id = 11; id <= 20; id += 1) pass.run(id);
    expect(canAccessLesson("grammar-1", database)).toBe(true);
    expect(canAccessLesson("grammar-2", database)).toBe(false);
    for (let id = 21; id <= 30; id += 1) pass.run(id);
    expect(canAccessLesson("workplace-1", database)).toBe(true);
    expect(canAccessLesson("workplace-2", database)).toBe(false);
    for (let id = 31; id <= 40; id += 1) pass.run(id);
    expect(canAccessLesson("eps-prep-1", database)).toBe(true);
    expect(canAccessLesson("eps-prep-2", database)).toBe(false);
    expect(courseProgress(database).lessons[40].status).toBe("available");
    for (let id = 41; id <= 50; id += 1) pass.run(id);
    const complete = courseProgress(database);
    expect(complete).toMatchObject({ completed: 50, total: 50, percent: 100 });
    expect(complete.modules.map((module) => [module.completed, module.percent])).toEqual([[10, 100], [10, 100], [10, 100], [10, 100], [10, 100]]);
    expect(complete.next?.slug).toBe("eps-prep-10");
    database.close();
  });
});

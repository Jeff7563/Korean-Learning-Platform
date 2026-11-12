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
  database.exec("INSERT INTO courses VALUES(1,'korean','Korean'); INSERT INTO modules VALUES(1,1,'hangul-foundation','Hangul Foundation',1),(2,1,'everyday-korean','Everyday Korean',2);");
  const addLesson = database.prepare("INSERT INTO lessons(id,slug,title,description,position,module_id) VALUES(?,?,?,?,?,?)");
  for (let position = 1; position <= 10; position += 1) addLesson.run(position, `hangul-${position}`, `Hangul ${position}`, "Hangul lesson", position, 1);
  for (let position = 1; position <= 10; position += 1) addLesson.run(10 + position, `everyday-${position}`, `Everyday ${position}`, "Everyday lesson", position, 2);
  return database;
}

describe("Everyday Korean curriculum content", () => {
  it("has ten authored lessons with objectives, activities, checkpoint items, listening and attributed resources", () => {
    expect(curriculumModules.map((module) => module.lessons.length)).toEqual([10, 10]);
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
    expect(progress.lessons).toHaveLength(20);
    expect(progress.lessons[9]).toMatchObject({ slug: "hangul-10", modulePosition: 1, position: 10 });
    expect(progress.lessons[10]).toMatchObject({ slug: "everyday-1", modulePosition: 2, position: 1, status: "locked" });
    expect(progress.modules.map((module) => [module.slug, module.completed, module.total, module.percent])).toEqual([
      ["hangul-foundation", 0, 10, 0], ["everyday-korean", 0, 10, 0],
    ]);
    expect(canAccessLesson("everyday-1", database)).toBe(false);
    database.prepare("INSERT INTO checkpoint_attempts(lesson_id,passed) VALUES(11,1)").run();
    expect(canAccessLesson("everyday-2", database)).toBe(false);
    expect(courseProgress(database).lessons[10].status).toBe("locked");
    database.close();
  });

  it("unlocks lesson 11 only after all ten Hangul passes and reaches 20/20 after completion", () => {
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
    const complete = courseProgress(database);
    expect(complete).toMatchObject({ completed: 20, total: 20, percent: 100 });
    expect(complete.modules.map((module) => [module.completed, module.percent])).toEqual([[10, 100], [10, 100]]);
    expect(complete.next?.slug).toBe("everyday-10");
    database.close();
  });
});

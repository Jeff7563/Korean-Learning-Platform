import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { curriculumModules } from "../src/content/curriculum";
import { mediaForLesson } from "../src/content/media-catalog";
import { getDatabasePath } from "../src/lib/database-path";
import { publicLessonContent } from "../src/lib/public-lesson";

const dbPath = getDatabasePath(process.env.KOREAN_DB_PATH);
mkdirSync(dirname(dbPath), { recursive: true });
const database = new Database(dbPath);
database.pragma("foreign_keys = ON");

const before = Object.fromEntries(
  ["courses", "modules", "lessons", "exercises", "vocabulary", "lesson_activities", "lesson_resources", "learner_lesson_progress", "checkpoint_attempts", "checkpoint_answers", "learner_activity_progress", "daily_plans", "daily_plan_tasks", "tutor_messages"]
    .map((table) => [table, (database.prepare(`SELECT count(*) count FROM ${table}`).get() as { count: number }).count]),
);

database.transaction(() => {
  const course = database.prepare(
    "INSERT INTO courses(slug,title) VALUES(?,?) ON CONFLICT(slug) DO UPDATE SET title=excluded.title RETURNING id",
  ).get("korean-foundations", "Korean Learning Platform") as { id: number };

  const putModule = database.prepare(
    "INSERT INTO modules(course_id,slug,title,position) VALUES(?,?,?,?) ON CONFLICT(slug) DO UPDATE SET title=excluded.title,position=excluded.position RETURNING id",
  );
  const putHangulLesson = database.prepare(
    "INSERT INTO lessons(module_id,slug,title,description,content_json,position) VALUES(?,?,?,?,?,?) ON CONFLICT(slug) DO NOTHING",
  );
  const putEverydayLesson = database.prepare(
    "INSERT INTO lessons(module_id,slug,title,description,content_json,position) VALUES(?,?,?,?,?,?) ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description,content_json=excluded.content_json",
  );
  const putExercise = database.prepare(
    "INSERT INTO exercises(lesson_id,position,prompt,options_json,answer_index,explanation) SELECT id,?,?,?,?,? FROM lessons WHERE slug=? ON CONFLICT(lesson_id,position) DO UPDATE SET prompt=excluded.prompt,options_json=excluded.options_json,answer_index=excluded.answer_index,explanation=excluded.explanation",
  );
  const putActivity = database.prepare(
    "INSERT INTO lesson_activities(lesson_id,slug,title,position) SELECT id,?,?,? FROM lessons WHERE slug=? ON CONFLICT(lesson_id,slug) DO UPDATE SET title=excluded.title,position=excluded.position",
  );
  const putVocabulary = database.prepare(
    "INSERT INTO vocabulary(lesson_id,korean,thai) SELECT id,?,? FROM lessons WHERE slug=? ON CONFLICT(lesson_id,korean) DO UPDATE SET thai=excluded.thai",
  );
  const putResource = database.prepare(
    "INSERT INTO lesson_resources(lesson_id,kind,title,url,external_id,creator,metadata_json) SELECT id,?,?,?,?,?,? FROM lessons WHERE slug=? AND NOT EXISTS(SELECT 1 FROM lesson_resources WHERE lesson_id=lessons.id AND external_id=?)",
  );

  for (const curriculumModule of curriculumModules) {
    const moduleRow = putModule.get(course.id, curriculumModule.slug, curriculumModule.title, curriculumModule.position) as { id: number };
    for (const [index, lesson] of curriculumModule.lessons.entries()) {
      const writeLesson = curriculumModule.slug === "hangul-foundation" ? putHangulLesson : putEverydayLesson;
      writeLesson.run(moduleRow.id, lesson.slug, lesson.title, lesson.description, JSON.stringify(publicLessonContent(lesson)), index + 1);
      for (const [questionIndex, exercise] of lesson.questions.entries()) {
        putExercise.run(questionIndex + 1, exercise.prompt, JSON.stringify(exercise.options), exercise.answer, exercise.explanation, lesson.slug);
      }
      for (const [activityIndex, activity] of lesson.activities.entries()) {
        putActivity.run(`activity-${activityIndex + 1}`, activity, activityIndex + 1, lesson.slug);
      }
      for (const word of lesson.vocabulary) putVocabulary.run(word.korean, word.thai, lesson.slug);
      if (curriculumModule.slug === "hangul-foundation") {
        if (lesson.video) putResource.run("youtube", lesson.video.title, lesson.video.url, lesson.video.id, lesson.video.creator,
          JSON.stringify({ embedUrl: `https://www.youtube-nocookie.com/embed/${lesson.video.id}` }), lesson.slug, lesson.video.id);
      } else {
        for (const resource of mediaForLesson(lesson.slug)) {
          putResource.run(resource.kind, resource.title, resource.url, resource.id, resource.creator,
            JSON.stringify({ language: resource.language, summary: resource.summary, verification: resource.verification }), lesson.slug, resource.id);
        }
      }
    }
  }
  database.prepare("INSERT OR IGNORE INTO learner_settings(id) VALUES(1)").run();
})();

const after = Object.fromEntries(
  Object.keys(before).map((table) => [table, (database.prepare(`SELECT count(*) count FROM ${table}`).get() as { count: number }).count]),
);
const moduleRows = database.prepare(`SELECT m.slug,m.position,count(l.id) lessonCount FROM modules m LEFT JOIN lessons l ON l.module_id=m.id GROUP BY m.id ORDER BY m.position`).all();
console.log(JSON.stringify({ seeded: curriculumModules.map((module) => ({ module: module.slug, lessons: module.lessons.length })), before, after, modules: moduleRows }, null, 2));
database.close();

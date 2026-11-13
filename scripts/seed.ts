import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { curriculumModules } from "../src/content/curriculum";
import { mediaForLesson } from "../src/content/media-catalog";
import { getDatabasePath } from "../src/lib/database-path";
import { publicLessonContent } from "../src/lib/public-lesson";
import { epsExamDrafts, epsSourceDrafts } from "../src/content/eps-topik-bank";
import { epsExamDraftsV071 } from "../src/content/eps-topik-bank-v071";
import { seedEpsExamDrafts } from "../src/lib/eps-topik-seed";

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
    "INSERT INTO modules(course_id,slug,title,position) VALUES(?,?,?,?) ON CONFLICT(slug) DO NOTHING",
  );
  const getModule = database.prepare("SELECT id,title,position FROM modules WHERE slug=?");
  const putHangulLesson = database.prepare(
    "INSERT INTO lessons(module_id,slug,title,description,content_json,position) VALUES(?,?,?,?,?,?) ON CONFLICT(slug) DO NOTHING",
  );
  const putEverydayLesson = database.prepare(
    "INSERT INTO lessons(module_id,slug,title,description,content_json,position) VALUES(?,?,?,?,?,?) ON CONFLICT(slug) DO NOTHING",
  );
  const putGrammarLesson = database.prepare(
    "INSERT INTO lessons(module_id,slug,title,description,content_json,position) VALUES(?,?,?,?,?,?) ON CONFLICT(slug) DO NOTHING",
  );
  const putWorkplaceLesson = database.prepare(
    "INSERT INTO lessons(module_id,slug,title,description,content_json,position) VALUES(?,?,?,?,?,?) ON CONFLICT(slug) DO NOTHING",
  );
  const getLesson = database.prepare("SELECT id,module_id,title,description,content_json,position FROM lessons WHERE slug=?");
  const putExercise = database.prepare(
    "INSERT INTO exercises(lesson_id,position,prompt,options_json,answer_index,explanation) SELECT id,?,?,?,?,? FROM lessons WHERE slug=? ON CONFLICT(lesson_id,position) DO NOTHING",
  );
  const getExercise = database.prepare(`SELECT e.prompt,e.options_json,e.answer_index,e.explanation
    FROM exercises e JOIN lessons l ON l.id=e.lesson_id WHERE l.slug=? AND e.position=?`);
  const putActivity = database.prepare(
    "INSERT INTO lesson_activities(lesson_id,slug,title,position) SELECT id,?,?,? FROM lessons WHERE slug=? ON CONFLICT(lesson_id,slug) DO NOTHING",
  );
  const getActivity = database.prepare("SELECT title,position FROM lesson_activities WHERE lesson_id=(SELECT id FROM lessons WHERE slug=?) AND slug=?");
  const putVocabulary = database.prepare(
    "INSERT INTO vocabulary(lesson_id,korean,thai) SELECT id,?,? FROM lessons WHERE slug=? ON CONFLICT(lesson_id,korean) DO NOTHING",
  );
  const getVocabulary = database.prepare("SELECT thai FROM vocabulary WHERE lesson_id=(SELECT id FROM lessons WHERE slug=?) AND korean=?");
  const putResource = database.prepare(
    "INSERT INTO lesson_resources(lesson_id,kind,title,url,external_id,creator,metadata_json) SELECT id,?,?,?,?,?,? FROM lessons WHERE slug=? AND NOT EXISTS(SELECT 1 FROM lesson_resources WHERE lesson_id=lessons.id AND external_id=?)",
  );

  for (const curriculumModule of curriculumModules) {
    putModule.run(course.id, curriculumModule.slug, curriculumModule.title, curriculumModule.position);
    const moduleRow = getModule.get(curriculumModule.slug) as { id: number; title: string; position: number } | undefined;
    if (!moduleRow || moduleRow.title !== curriculumModule.title || moduleRow.position !== curriculumModule.position) {
      throw new Error(`Module drift at ${curriculumModule.slug}; refusing to rewrite the published course sequence.`);
    }
    for (const [index, lesson] of curriculumModule.lessons.entries()) {
      const writeLesson = curriculumModule.slug === "hangul-foundation" ? putHangulLesson
        : curriculumModule.slug === "korean-grammar" ? putGrammarLesson
          : curriculumModule.slug === "workplace-korean" ? putWorkplaceLesson : putEverydayLesson;
      const contentJson = JSON.stringify(publicLessonContent(lesson));
      writeLesson.run(moduleRow.id, lesson.slug, lesson.title, lesson.description, contentJson, index + 1);
      const storedLesson = getLesson.get(lesson.slug) as { id: number; module_id: number; title: string; description: string; content_json: string; position: number } | undefined;
      if (!storedLesson || storedLesson.module_id !== moduleRow.id || storedLesson.title !== lesson.title || storedLesson.description !== lesson.description || storedLesson.position !== index + 1) {
        throw new Error(`Lesson metadata drift at ${lesson.slug}; refusing to rewrite a published lesson.`);
      }
      let storedContent = JSON.parse(storedLesson.content_json) as Record<string, unknown>;
      const expectedContent = JSON.parse(contentJson) as Record<string, unknown>;

      // Historical Hangul seed content also copied its video into content_json;
      // the current allowlisted lesson API uses lesson_resources instead.
      if (lesson.slug === "hangul-intro" && storedContent.video) {
        const storedVideo = storedContent.video;
        delete storedContent.video;
        if (JSON.stringify(storedVideo) !== JSON.stringify(lesson.video)) {
          throw new Error("Unexpected media drift at hangul-intro; refusing to change the published lesson.");
        }
      }

      // Apply only the approved V0.9 grammar explanation correction. The update
      // changes no exercise rows, answer keys, attempts, or checkpoint snapshots.
      if (lesson.slug === "grammar-sentence-structure-particles" && JSON.stringify(storedContent) !== JSON.stringify(expectedContent)) {
        const legacyContent = { ...expectedContent, commonMistakes: [
          "อย่าจำว่า 은/는 คือประธานเสมอ: เป็นคำช่วยหัวข้อและใช้เปรียบต่างได้",
          "อย่าวางกริยาก่อนกรรมในประโยคพื้นฐาน: 자연한 순서는 저는 밥을 먹어요",
          "เลือก 은/는, 이/가, 을/를 จากตัวสะกดท้ายคำนาม ไม่ใช่จากความหมาย",
        ] };
        if (JSON.stringify(storedContent) !== JSON.stringify(legacyContent)) {
          throw new Error("Unexpected grammar lesson drift; refusing to update published content.");
        }
        database.prepare("UPDATE lessons SET content_json=? WHERE id=?").run(contentJson, storedLesson.id);
        storedContent = expectedContent;
      }
      if (JSON.stringify(storedContent) !== JSON.stringify(expectedContent)) {
        throw new Error(`Lesson content drift at ${lesson.slug}; refusing to overwrite published content.`);
      }
      for (const [questionIndex, exercise] of lesson.questions.entries()) {
        const position = questionIndex + 1;
        putExercise.run(position, exercise.prompt, JSON.stringify(exercise.options), exercise.answer, exercise.explanation, lesson.slug);
        const stored = getExercise.get(lesson.slug, position) as { prompt: string; options_json: string; answer_index: number; explanation: string } | undefined;
        if (!stored || stored.prompt !== exercise.prompt || stored.options_json !== JSON.stringify(exercise.options) || stored.answer_index !== exercise.answer || stored.explanation !== exercise.explanation) {
          throw new Error(`Checkpoint content drift at ${lesson.slug} question ${position}. Normal seeding never revises published questions; review the change and use the explicit db:revise-checkpoint process.`);
        }
      }
      for (const [activityIndex, activity] of lesson.activities.entries()) {
        putActivity.run(`activity-${activityIndex + 1}`, activity, activityIndex + 1, lesson.slug);
        const savedActivity = getActivity.get(lesson.slug, `activity-${activityIndex + 1}`) as { title: string; position: number } | undefined;
        if (!savedActivity || savedActivity.title !== activity || savedActivity.position !== activityIndex + 1) {
          throw new Error(`Activity drift at ${lesson.slug} activity ${activityIndex + 1}; refusing to rewrite learner activity labels.`);
        }
      }
      for (const word of lesson.vocabulary) {
        putVocabulary.run(word.korean, word.thai, lesson.slug);
        const savedWord = getVocabulary.get(lesson.slug, word.korean) as { thai: string } | undefined;
        if (!savedWord || savedWord.thai !== word.thai) {
          throw new Error(`Vocabulary drift at ${lesson.slug} word ${word.korean}; refusing to rewrite published vocabulary.`);
        }
      }
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

database.transaction(() => {
  const putSource = database.prepare(`INSERT INTO eps_sources(slug,title,edition,url,format,access_status,answer_audio_status,copyright_notes,verification_notes,verified_at)
    VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(slug) DO UPDATE SET title=excluded.title,edition=excluded.edition,url=excluded.url,format=excluded.format,
    access_status=excluded.access_status,answer_audio_status=excluded.answer_audio_status,copyright_notes=excluded.copyright_notes,verification_notes=excluded.verification_notes,verified_at=excluded.verified_at`);
  for (const source of epsSourceDrafts) putSource.run(source.slug,source.title,source.edition,source.url,source.format,source.access_status,source.answer_audio_status,source.copyright_notes,source.verification_notes,"2026-11-12");
  seedEpsExamDrafts(database);
})();

const after = Object.fromEntries(
  Object.keys(before).map((table) => [table, (database.prepare(`SELECT count(*) count FROM ${table}`).get() as { count: number }).count]),
);
const moduleRows = database.prepare(`SELECT m.slug,m.position,count(l.id) lessonCount FROM modules m LEFT JOIN lessons l ON l.module_id=m.id GROUP BY m.id ORDER BY m.position`).all();
console.log(JSON.stringify({ seeded: curriculumModules.map((module) => ({ module: module.slug, lessons: module.lessons.length })), epsSets: [...epsExamDrafts.map((exam)=>({id:exam.id,count:exam.questions.length,active:false})), ...epsExamDraftsV071.map((exam)=>({id:exam.id,count:exam.questions.length,active:true}))], epsSources:epsSourceDrafts.length, before, after, modules: moduleRows }, null, 2));
database.close();

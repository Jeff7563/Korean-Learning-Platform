import Database from "better-sqlite3";
import { join } from "node:path";
import { lessons } from "../src/content/curriculum";
const db = new Database(join(process.cwd(), "data", "korean.db")); db.pragma("foreign_keys = ON");
db.transaction(() => {
 const course = db.prepare("INSERT INTO courses(slug,title) VALUES(?,?) ON CONFLICT(slug) DO UPDATE SET title=excluded.title RETURNING id").get("korean-foundations", "Korean Learning Platform") as {id:number};
 const hangulModule = db.prepare("INSERT INTO modules(course_id,slug,title,position) VALUES(?,?,?,?) ON CONFLICT(slug) DO UPDATE SET title=excluded.title RETURNING id").get(course.id,"hangul-foundation","Hangul Foundation",1) as {id:number};
 const putLesson = db.prepare("INSERT INTO lessons(module_id,slug,title,description,content_json,position) VALUES(?,?,?,?,?,?) ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description,content_json=excluded.content_json");
 const putExercise=db.prepare("INSERT INTO exercises(lesson_id,position,prompt,options_json,answer_index,explanation) SELECT id,?,?,?,?,? FROM lessons WHERE slug=? ON CONFLICT(lesson_id,position) DO UPDATE SET prompt=excluded.prompt,options_json=excluded.options_json,answer_index=excluded.answer_index,explanation=excluded.explanation");
 const putActivity=db.prepare("INSERT INTO lesson_activities(lesson_id,slug,title,position) SELECT id,?,?,? FROM lessons WHERE slug=? ON CONFLICT(lesson_id,slug) DO UPDATE SET title=excluded.title,position=excluded.position");
 const putVocab=db.prepare("INSERT INTO vocabulary(lesson_id,korean,thai) SELECT id,?,? FROM lessons WHERE slug=? ON CONFLICT(lesson_id,korean) DO UPDATE SET thai=excluded.thai");
 const putResource=db.prepare("INSERT INTO lesson_resources(lesson_id,kind,title,url,external_id,creator,metadata_json) SELECT id,?,?,?,?,?,? FROM lessons WHERE slug=? AND NOT EXISTS(SELECT 1 FROM lesson_resources WHERE lesson_id=lessons.id AND external_id=?)");
 for (const [index,l] of lessons.entries()) { putLesson.run(hangulModule.id,l.slug,l.title,l.description,JSON.stringify(l),index+1); for (const [i,e] of l.questions.entries()) putExercise.run(i+1,e.prompt,JSON.stringify(e.options),e.answer,e.explanation,l.slug); for (const [i,a] of l.activities.entries()) putActivity.run(`activity-${i+1}`,a,i+1,l.slug); for(const v of l.vocabulary) putVocab.run(v.korean,v.thai,l.slug); if(l.video)putResource.run("youtube",l.video.title,l.video.url,l.video.id,l.video.creator,JSON.stringify({embedUrl:`https://www.youtube-nocookie.com/embed/${l.video.id}`}),l.slug,l.video.id); }
 db.prepare("INSERT OR IGNORE INTO learner_settings(id) VALUES(1)").run();
})(); console.log(`Seeded ${lessons.length} Hangul lessons (idempotent).`); db.close();

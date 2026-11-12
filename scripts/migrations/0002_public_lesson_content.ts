import type Database from "better-sqlite3";
import { publicLessonContent } from "../../src/lib/public-lesson";

export function removePrivateLessonContent(database: Database.Database) {
  const lessons = database.prepare("SELECT id,content_json FROM lessons").all() as Array<{ id: number; content_json: string }>;
  const update = database.prepare("UPDATE lessons SET content_json=? WHERE id=?");
  for (const lesson of lessons) {
    const publicContent = publicLessonContent(JSON.parse(lesson.content_json));
    update.run(JSON.stringify(publicContent), lesson.id);
  }
}

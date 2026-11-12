import { db } from "./db";
import type Database from "better-sqlite3";

export type CourseLesson = {
  id: number;
  slug: string;
  title: string;
  description: string;
  position: number;
  courseSlug: string;
  courseTitle: string;
  moduleSlug: string;
  moduleTitle: string;
  modulePosition: number;
  status: "locked" | "available" | "in_progress" | "completed";
  passed: boolean;
};

export type CourseModuleProgress = {
  slug: string;
  title: string;
  position: number;
  lessons: CourseLesson[];
  completed: number;
  total: number;
  percent: number;
};

export function courseProgress(database: Database.Database = db()) {
  const rows = database.prepare(`
    SELECT l.id,l.slug,l.title,l.description,l.position,c.slug courseSlug,c.title courseTitle,
      m.slug moduleSlug,m.title moduleTitle,m.position modulePosition,
      EXISTS(SELECT 1 FROM checkpoint_attempts a WHERE a.lesson_id=l.id AND a.passed=1) passed,
      (EXISTS(SELECT 1 FROM learner_activity_progress p JOIN lesson_activities x ON x.id=p.activity_id WHERE x.lesson_id=l.id)
        OR EXISTS(SELECT 1 FROM learner_lesson_progress p WHERE p.lesson_id=l.id AND p.status='in_progress')) active
    FROM lessons l JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id
    ORDER BY c.id,m.position,l.position,l.id
  `).all() as Array<Omit<CourseLesson, "status" | "passed"> & { passed: number; active: number }>;

  let prerequisitesPassed = true;
  const lessons: CourseLesson[] = rows.map((row) => {
    const passed = Boolean(row.passed);
    const unlocked = prerequisitesPassed;
    const status: CourseLesson["status"] = !unlocked ? "locked" : passed ? "completed" : row.active ? "in_progress" : "available";
    prerequisitesPassed = prerequisitesPassed && passed;
    return { ...row, passed, status };
  });

  const modules: CourseModuleProgress[] = [];
  for (const lesson of lessons) {
    let moduleProgress = modules.at(-1);
    if (!moduleProgress || moduleProgress.slug !== lesson.moduleSlug) {
      moduleProgress = { slug: lesson.moduleSlug, title: lesson.moduleTitle, position: lesson.modulePosition, lessons: [], completed: 0, total: 0, percent: 0 };
      modules.push(moduleProgress);
    }
    moduleProgress.lessons.push(lesson);
    moduleProgress.total += 1;
    if (lesson.status === "completed") moduleProgress.completed += 1;
  }
  for (const moduleProgress of modules) moduleProgress.percent = moduleProgress.total ? Math.round((moduleProgress.completed / moduleProgress.total) * 100) : 0;

  const completed = lessons.filter((lesson) => lesson.status === "completed").length;
  const next = lessons.find((lesson) => lesson.status !== "completed") ?? lessons.at(-1);
  return { lessons, modules, next, completed, total: lessons.length, percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0 };
}

export function canAccessLesson(slug: string, database: Database.Database = db()): boolean {
  const rows = database.prepare(`
    SELECT l.id,l.slug,EXISTS(SELECT 1 FROM checkpoint_attempts a WHERE a.lesson_id=l.id AND a.passed=1) passed
    FROM lessons l JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id
    ORDER BY c.id,m.position,l.position,l.id
  `).all() as Array<{ id: number; slug: string; passed: number }>;
  const index = rows.findIndex((lesson) => lesson.slug === slug);
  return index >= 0 && rows.slice(0, index).every((lesson) => Boolean(lesson.passed));
}

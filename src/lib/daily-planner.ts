import type Database from "better-sqlite3";

export const BANGKOK_TIME_ZONE = "Asia/Bangkok";
export type StudyMode = "standard" | "light" | "rest";
export type PlannerTask = { key: string; title: string; startsAt: string | null; endsAt: string | null; minutes: number; href: string; optional?: boolean };

export function bangkokDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: BANGKOK_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function isLocalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function weekdayForLocalDate(value: string): number {
  return new Date(`${value}T00:00:00.000Z`).getUTCDay();
}

export function defaultModeForDate(value: string): StudyMode {
  return weekdayForLocalDate(value) === 0 ? "rest" : "standard";
}

export function scheduledTasks(mode: StudyMode, lessonSlug?: string): PlannerTask[] {
  const lessonSection = (section: string) => lessonSlug ? `/learn/${lessonSlug}#${section}` : "/review";
  if (mode === "rest") return [{ key: "casual", title: "เรียนภาษาเกาหลีแบบสบาย ๆ (เลือกทำได้)", startsAt: null, endsAt: null, minutes: 0, href: "/review", optional: true }];
  if (mode === "light") return [
    { key: "review", title: "ทบทวนคำศัพท์หรือข้อที่ตอบผิด", startsAt: "18:00", endsAt: "18:05", minutes: 5, href: "/review" },
    { key: "video-listening", title: "ดูวิดีโอหรือฝึกฟังภาษาเกาหลี", startsAt: "18:05", endsAt: "18:10", minutes: 5, href: lessonSection("video") },
    { key: "writing-vocabulary", title: "เขียนหรือทบทวนคำศัพท์ 1 ชุด", startsAt: "18:10", endsAt: "18:15", minutes: 5, href: lessonSection("lesson-activities") },
  ];
  return [
    { key: "preparation", title: "เตรียมตัวและทบทวนคำศัพท์", startsAt: "18:00", endsAt: "18:15", minutes: 15, href: lessonSection("vocabulary") },
    { key: "video", title: "เรียนจากวิดีโอสอน", startsAt: "18:15", endsAt: "18:45", minutes: 30, href: lessonSection("video") },
    { key: "listening-reading", title: "ฝึกฟัง พูด และอ่าน", startsAt: "18:45", endsAt: "19:00", minutes: 15, href: lessonSection("listening") },
    { key: "break", title: "พักสายตาและผ่อนคลาย", startsAt: "19:00", endsAt: "19:15", minutes: 15, href: "/dashboard#daily-plan" },
    { key: "writing-checkpoint", title: "ฝึกเขียนและทำแบบทดสอบ", startsAt: "19:15", endsAt: "19:25", minutes: 10, href: lessonSection("lesson-activities") },
    { key: "summary", title: "สรุปสิ่งที่เรียนวันนี้", startsAt: "19:25", endsAt: "19:30", minutes: 5, href: "/review" },
  ];
}

type LessonRow = { id: number; slug: string; title: string; position: number; passed: number; active: number };
type Recommendation = { lesson: LessonRow | null; reason: string; href: string };

export function recommendStudy(database: Database.Database): Recommendation {
  const lessons = database.prepare(`SELECT l.id,l.slug,l.title,l.position,
    EXISTS(SELECT 1 FROM checkpoint_attempts a WHERE a.lesson_id=l.id AND a.passed=1) passed,
    (EXISTS(SELECT 1 FROM learner_activity_progress p JOIN lesson_activities x ON x.id=p.activity_id WHERE x.lesson_id=l.id)
      OR EXISTS(SELECT 1 FROM learner_lesson_progress p WHERE p.lesson_id=l.id AND p.status='in_progress')) active
    FROM lessons l ORDER BY l.position`).all() as LessonRow[];
  if (!lessons.length) return { lesson: null, reason: "ยังไม่มีบทเรียนในหลักสูตร", href: "/courses" };
  const states = lessons.map((lesson, index) => ({ ...lesson, locked: index > 0 && !lessons[index - 1].passed }));
  const target = states.find((lesson) => !lesson.passed && !lesson.locked) ?? states.at(-1)!;
  const latest = database.prepare(`SELECT a.id,a.passed,l.id lessonId,l.slug,l.title FROM checkpoint_attempts a JOIN lessons l ON l.id=a.lesson_id ORDER BY a.id DESC LIMIT 1`).get() as { id: number; passed: number; lessonId: number; slug: string; title: string } | undefined;
  const latestLesson = latest ? states.find((lesson) => lesson.id === latest.lessonId) : undefined;
  if (latest && !latest.passed && latestLesson && !latestLesson.passed && !latestLesson.locked) {
    const mistakes = database.prepare(`SELECT e.prompt FROM checkpoint_answers ca JOIN exercises e ON e.id=ca.exercise_id WHERE ca.attempt_id=? AND ca.correct=0 ORDER BY e.position`).all(latest.id) as Array<{ prompt: string }>;
    const detail = mistakes.length ? `: ${mistakes.map((item) => item.prompt).join(" · ")}` : "";
    return { lesson: latestLesson, reason: `ทบทวนแนวคิดจากข้อที่ตอบผิด${detail}`, href: `/learn/${latestLesson.slug}#checkpoint` };
  }
  if (states.every((lesson) => lesson.passed)) return { lesson: states.at(-1)!, reason: "เรียนครบทุกบทแล้ว แนะนำทบทวนคำศัพท์และข้อที่เคยตอบผิด", href: "/review" };
  const incomplete = database.prepare(`SELECT a.title FROM lesson_activities a WHERE a.lesson_id=? AND NOT EXISTS(SELECT 1 FROM learner_activity_progress p WHERE p.activity_id=a.id) ORDER BY a.position LIMIT 1`).get(target.id) as { title: string } | undefined;
  if (incomplete) return { lesson: target, reason: `ทำกิจกรรมที่ยังเหลือ: ${incomplete.title}`, href: `/learn/${target.slug}#lesson-activities` };
  return { lesson: target, reason: target.active ? "เรียนบทที่กำลังฝึกต่อ" : "เริ่มบทเรียนที่ปลดล็อกถัดไป", href: `/learn/${target.slug}#video` };
}

export function ensureDailyPlan(database: Database.Database, date: string) {
  if (!isLocalDate(date)) throw new Error("Invalid local date");
  const existing = database.prepare("SELECT plan_date FROM daily_plans WHERE plan_date=?").get(date);
  if (existing) return;
  const recommendation = recommendStudy(database);
  const mode = defaultModeForDate(date);
  const plannedMinutes = mode === "standard" ? 90 : mode === "light" ? 15 : 0;
  const create = database.transaction(() => {
    database.prepare("INSERT OR IGNORE INTO daily_plans(plan_date,mode,lesson_id,recommendation,recommendation_href,planned_minutes) VALUES(?,?,?,?,?,?)").run(date, mode, recommendation.lesson?.id ?? null, recommendation.reason, recommendation.href, plannedMinutes);
    const inserted = database.prepare("SELECT mode,lesson_id FROM daily_plans WHERE plan_date=?").get(date) as { mode: StudyMode; lesson_id: number | null };
    const lesson = inserted.lesson_id ? database.prepare("SELECT slug FROM lessons WHERE id=?").get(inserted.lesson_id) as { slug: string } | undefined : undefined;
    const rows = scheduledTasks(inserted.mode, lesson?.slug);
    const insertTask = database.prepare("INSERT OR IGNORE INTO daily_plan_tasks(plan_date,task_key,title,starts_at,ends_at,planned_minutes,href,optional) VALUES(?,?,?,?,?,?,?,?)");
    for (const task of rows) insertTask.run(date, task.key, task.title, task.startsAt, task.endsAt, task.minutes, task.href, task.optional ? 1 : 0);
  });
  create();
}

export function changePlanMode(database: Database.Database, date: string, mode: StudyMode): boolean {
  const hasStarted = database.prepare("SELECT 1 FROM daily_plan_tasks WHERE plan_date=? AND completed_at IS NOT NULL LIMIT 1").get(date);
  if (hasStarted) return false;
  const plan = database.prepare("SELECT lesson_id FROM daily_plans WHERE plan_date=?").get(date) as { lesson_id: number | null } | undefined;
  if (!plan) return false;
  const lesson = plan.lesson_id ? database.prepare("SELECT slug FROM lessons WHERE id=?").get(plan.lesson_id) as { slug: string } | undefined : undefined;
  const tasks = scheduledTasks(mode, lesson?.slug);
  const plannedMinutes = mode === "standard" ? 90 : mode === "light" ? 15 : 0;
  database.transaction(() => {
    database.prepare("UPDATE daily_plans SET mode=?,planned_minutes=? WHERE plan_date=?").run(mode, plannedMinutes, date);
    database.prepare("DELETE FROM daily_plan_tasks WHERE plan_date=?").run(date);
    const add = database.prepare("INSERT INTO daily_plan_tasks(plan_date,task_key,title,starts_at,ends_at,planned_minutes,href,optional) VALUES(?,?,?,?,?,?,?,?)");
    for (const task of tasks) add.run(date, task.key, task.title, task.startsAt, task.endsAt, task.minutes, task.href, task.optional ? 1 : 0);
  })();
  return true;
}

export function dailyPlanIsComplete(database: Database.Database, date: string): boolean {
  const hasCompleted = database.prepare("SELECT 1 FROM daily_plan_tasks WHERE plan_date=? AND completed_at IS NOT NULL LIMIT 1").get(date);
  const hasIncompleteRequired = database.prepare("SELECT 1 FROM daily_plan_tasks WHERE plan_date=? AND optional=0 AND completed_at IS NULL LIMIT 1").get(date);
  return Boolean(hasCompleted && !hasIncompleteRequired);
}

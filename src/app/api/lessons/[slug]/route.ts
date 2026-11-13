import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canAccessLesson } from "@/lib/progress";
import { publicLessonContent } from "@/lib/public-lesson";
import { mediaForLesson } from "@/content/media-catalog";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const database = db();
  const lesson = database.prepare(`SELECT l.*,m.slug moduleSlug,m.title moduleTitle,m.position modulePosition
    FROM lessons l JOIN modules m ON m.id=l.module_id WHERE l.slug=?`).get(slug) as {
      id: number; position: number; content_json: string; moduleSlug: string; moduleTitle: string; modulePosition: number;
    } | undefined;
  if (!lesson) return NextResponse.json({ error: "ไม่พบบทเรียน" }, { status: 404 });
  if (!canAccessLesson(slug)) return NextResponse.json({ error: "ผ่านแบบทดสอบบทก่อนหน้าเพื่อปลดล็อกบทนี้" }, { status: 403 });

  const exercises = database.prepare("SELECT id,position,prompt,options_json FROM exercises WHERE lesson_id=? ORDER BY position")
    .all(lesson.id) as Array<{ id: number; position: number; prompt: string; options_json: string }>;
  const activities = database.prepare(`SELECT a.id,a.slug,a.title,
    EXISTS(SELECT 1 FROM learner_activity_progress p WHERE p.activity_id=a.id) completed
    FROM lesson_activities a WHERE lesson_id=? ORDER BY position`).all(lesson.id);
  const attempts = database.prepare(`SELECT id,score,total,passed,created_at FROM checkpoint_attempts
    WHERE lesson_id=? ORDER BY id DESC LIMIT 10`).all(lesson.id) as Array<{
      id: number; score: number; total: number; passed: number; created_at: string;
    }>;
  const answerHistory = database.prepare(`SELECT ca.exercise_id exerciseId,ca.selected_index selectedIndex,ca.correct,
    s.prompt,s.options_json optionsJson,s.answer_index answerIndex,s.explanation,s.snapshot_kind snapshotKind,e.position
    FROM checkpoint_answers ca JOIN exercises e ON e.id=ca.exercise_id
    LEFT JOIN checkpoint_answer_snapshots s ON s.attempt_id=ca.attempt_id AND s.exercise_id=ca.exercise_id
    WHERE ca.attempt_id=? ORDER BY e.position`);
  const attemptHistory = attempts.map((attempt) => ({
    ...attempt,
    answers: (answerHistory.all(attempt.id) as Array<{
      exerciseId: number; selectedIndex: number; correct: number; prompt: string | null; optionsJson: string | null;
      answerIndex: number | null; explanation: string | null; snapshotKind: "captured" | "legacy_unverified" | null; position: number;
    }>).map((answer) => ({
      ...answer,
      options: answer.optionsJson ? JSON.parse(answer.optionsJson) as string[] : [],
      historicalContentVerified: answer.snapshotKind === "captured",
      optionsJson: undefined,
    })),
  }));

  return NextResponse.json({
    lesson: {
      ...publicLessonContent(JSON.parse(lesson.content_json)),
      position: lesson.position,
      module: { slug: lesson.moduleSlug, title: lesson.moduleTitle, position: lesson.modulePosition },
      videoResources: mediaForLesson(slug),
    },
    exercises: exercises.map((exercise) => ({ ...exercise, options: JSON.parse(exercise.options_json) as string[], options_json: undefined })),
    activities,
    attempts: attemptHistory,
  });
}

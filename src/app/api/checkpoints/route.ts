import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { gradeCheckpoint } from "@/lib/grading";
import { canAccessLesson } from "@/lib/progress";

export const runtime = "nodejs";

const input = z.object({
  slug: z.string().min(1),
  answers: z.array(z.object({
    exerciseId: z.number().int().positive(),
    selectedIndex: z.number().int().nonnegative(),
  })).min(1),
});

type Exercise = {
  id: number;
  position: number;
  prompt: string;
  options_json: string;
  answer_index: number;
  explanation: string;
};

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "คำตอบไม่ถูกต้อง" }, { status: 400 });

  const database = db();
  const lesson = database.prepare("SELECT id FROM lessons WHERE slug=?").get(parsed.data.slug) as { id: number } | undefined;
  if (!lesson) return NextResponse.json({ error: "ไม่พบบทเรียน" }, { status: 404 });
  if (!canAccessLesson(parsed.data.slug)) return NextResponse.json({ error: "บทเรียนนี้ยังล็อกอยู่" }, { status: 403 });

  const items = database.prepare(`SELECT id,position,prompt,options_json,answer_index,explanation
    FROM exercises WHERE lesson_id=? ORDER BY position`).all(lesson.id) as Exercise[];
  const answers = parsed.data.answers;
  if (items.length !== answers.length || new Set(answers.map((answer) => answer.exerciseId)).size !== items.length ||
      items.some((exercise) => !answers.some((answer) => answer.exerciseId === exercise.id))) {
    return NextResponse.json({ error: "กรุณาตอบทุกข้อของแบบทดสอบนี้" }, { status: 400 });
  }

  let optionsByExercise: Map<number, string[]>;
  try {
    optionsByExercise = new Map(items.map((exercise) => [exercise.id, JSON.parse(exercise.options_json) as string[]]));
  } catch {
    return NextResponse.json({ error: "ข้อมูลแบบทดสอบไม่สมบูรณ์" }, { status: 500 });
  }
  if (answers.some((answer) => answer.selectedIndex >= (optionsByExercise.get(answer.exerciseId)?.length ?? 0))) {
    return NextResponse.json({ error: "ตัวเลือกคำตอบอยู่นอกช่วง" }, { status: 400 });
  }

  const indexed = items.map((exercise) => answers.find((answer) => answer.exerciseId === exercise.id)!);
  const grade = gradeCheckpoint(items.map((exercise) => exercise.answer_index), indexed);
  const create = database.transaction(() => {
    const result = database.prepare("INSERT INTO checkpoint_attempts(lesson_id,score,total,passed) VALUES(?,?,?,?)")
      .run(lesson.id, grade.score, grade.total, Number(grade.passed));
    const attemptId = Number(result.lastInsertRowid);
    const putAnswer = database.prepare("INSERT INTO checkpoint_answers(attempt_id,exercise_id,selected_index,correct) VALUES(?,?,?,?)");
    const putSnapshot = database.prepare(`INSERT INTO checkpoint_answer_snapshots(
      attempt_id,exercise_id,prompt,options_json,answer_index,explanation,snapshot_kind
    ) VALUES(?,?,?,?,?,?,'captured')`);
    items.forEach((exercise, index) => {
      putAnswer.run(attemptId, exercise.id, indexed[index].selectedIndex, Number(indexed[index].selectedIndex === exercise.answer_index));
      putSnapshot.run(attemptId, exercise.id, exercise.prompt, exercise.options_json, exercise.answer_index, exercise.explanation);
    });
    database.prepare(`INSERT INTO learner_lesson_progress(lesson_id,status) VALUES(?,?)
      ON CONFLICT(lesson_id) DO UPDATE SET status=CASE WHEN excluded.status='completed' OR status!='completed' THEN excluded.status ELSE status END,
      updated_at=CURRENT_TIMESTAMP`).run(lesson.id, grade.passed ? "completed" : "in_progress");
    return attemptId;
  });
  const attemptId = create();
  return NextResponse.json({
    attemptId,
    ...grade,
    feedback: items.map((exercise, index) => ({ exerciseId: exercise.id, correct: indexed[index].selectedIndex === exercise.answer_index, explanation: exercise.explanation })),
    recommendation: grade.passed ? "ผ่านแล้ว ไปบทถัดไปได้เลย" : "ทบทวนคำอธิบายและลองทำแบบทดสอบอีกครั้ง",
  });
}

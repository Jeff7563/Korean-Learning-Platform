import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getVocabularyReviewData, recordVocabularyReview } from "@/lib/vocabulary-srs";

export const runtime = "nodejs";

const reviewInput = z.object({
  vocabularyId: z.number().int().positive(),
  rating: z.enum(["again", "hard", "good"]),
  idempotencyKey: z.string().uuid(),
});

export async function GET() {
  const database = db();
  const review = getVocabularyReviewData(database);
  const mistakes = database.prepare(`SELECT l.slug,l.title,m.title moduleTitle,e.prompt,e.explanation,a.created_at
    FROM checkpoint_answers ca JOIN exercises e ON e.id=ca.exercise_id JOIN checkpoint_attempts a ON a.id=ca.attempt_id
    JOIN lessons l ON l.id=a.lesson_id JOIN modules m ON m.id=l.module_id WHERE ca.correct=0
    ORDER BY a.id DESC LIMIT 20`).all();
  return NextResponse.json({ ...review, mistakes });
}

export async function POST(request: Request) {
  const parsed = reviewInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลการทบทวนไม่ถูกต้อง" }, { status: 400 });
  const result = recordVocabularyReview(db(), parsed.data.vocabularyId, parsed.data.rating, parsed.data.idempotencyKey);
  if (!result) return NextResponse.json({ error: "ไม่พบคำศัพท์หรือบทเรียนนี้ยังไม่ปลดล็อก" }, { status: 404 });
  if (result.duplicate && result.vocabularyId !== parsed.data.vocabularyId) return NextResponse.json({ error: "รหัสคำขอนี้ถูกใช้แล้ว" }, { status: 409 });
  return NextResponse.json({ ok: true, duplicate: result.duplicate, state: "state" in result ? result.state : undefined });
}

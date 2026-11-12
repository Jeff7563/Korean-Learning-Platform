import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { courseProgress } from "@/lib/progress";
export const runtime = "nodejs";

export async function GET() {
  const p = courseProgress();
  const aiReady = process.env.AI_PROVIDER === "ollama" ? Boolean(process.env.OLLAMA_MODEL) : process.env.AI_PROVIDER === "openai" && Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL);
  return NextResponse.json({ settings: db().prepare("SELECT * FROM learner_settings WHERE id=1").get(), aiReady, progress: { completed: p.completed, total: p.total, percent: p.percent } });
}

export async function POST(req: Request) {
  const schema = z.object({ learning_goal: z.string().trim().min(3).max(160), daily_minutes: z.number().int().min(15).max(360), preferred_language: z.enum(["th", "en"]) });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ตรวจสอบข้อมูลอีกครั้ง" }, { status: 400 });
  db().prepare("UPDATE learner_settings SET learning_goal=?,daily_minutes=?,preferred_language=? WHERE id=1").run(parsed.data.learning_goal, parsed.data.daily_minutes, parsed.data.preferred_language);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canAccessLesson } from "@/lib/progress";

export const runtime = "nodejs";
const input = z.object({ slug: z.string().min(1), message: z.string().trim().min(1).max(1200) });

export async function POST(req: Request) {
  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "กรุณาพิมพ์คำถามไม่เกิน 1,200 ตัวอักษร" }, { status: 400 });
  const lesson = db().prepare("SELECT l.id,l.title,l.content_json,m.title phase FROM lessons l JOIN modules m ON m.id=l.module_id WHERE l.slug=?").get(parsed.data.slug) as { id: number; title: string; content_json: string; phase: string } | undefined;
  if (!lesson) return NextResponse.json({ error: "ไม่พบบทเรียน" }, { status: 404 });
  if (!canAccessLesson(parsed.data.slug)) return NextResponse.json({ error: "บทเรียนนี้ยังล็อกอยู่" }, { status: 403 });

  const provider = process.env.AI_PROVIDER;
  let endpoint = "", model = "", key = "";
  if (provider === "ollama") { endpoint = `${(process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "")}/api/chat`; model = process.env.OLLAMA_MODEL || ""; }
  else if (provider === "openai") { endpoint = "https://api.openai.com/v1/chat/completions"; model = process.env.OPENAI_MODEL || ""; key = process.env.OPENAI_API_KEY || ""; }
  if (!endpoint || !model || (provider === "openai" && !key)) return NextResponse.json({ error: "AI Tutor ยังไม่พร้อม: ตั้งค่า AI_PROVIDER และโมเดลใน .env.local ก่อนใช้งาน" }, { status: 503 });

  const content = JSON.parse(lesson.content_json) as { objectives: string[]; explanation: string; vocabulary: Array<{ korean: string; thai: string }> };
  const errors = db().prepare("SELECT e.prompt,e.explanation FROM checkpoint_answers a JOIN exercises e ON e.id=a.exercise_id JOIN checkpoint_attempts c ON c.id=a.attempt_id WHERE c.lesson_id=? AND a.correct=0 ORDER BY c.id DESC LIMIT 6").all(lesson.id) as Array<{ prompt: string; explanation: string }>;
  const context = `ระดับผู้เรียน: ผู้เริ่มต้น\nบทเรียน: ${lesson.title}\nระยะ: ${lesson.phase}\nวัตถุประสงค์: ${content.objectives.join("; ")}\nเนื้อหายืนยัน: ${content.explanation}\nคำศัพท์: ${content.vocabulary.map(v => `${v.korean}=${v.thai}`).join(", ")}\nคำถามที่ตอบผิดเมื่อเร็ว ๆ นี้: ${errors.map(e => `${e.prompt} — ${e.explanation}`).join("; ") || "ไม่มี"}\nอธิบายภาษาไทยอย่างกระชับและค่อย ๆ แนะนำภาษาเกาหลี ห้ามแต่งแหล่งเรียน วิดีโอ หรือนโยบายข้อสอบ และห้ามอ้างว่าให้คะแนนการออกเสียงได้จริง`;
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const messages = [{ role: "system", content: context }, { role: "user", content: parsed.data.message }];
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) }, body: JSON.stringify(provider === "ollama" ? { model, messages, stream: false } : { model, messages, temperature: 0.4 }), signal: controller.signal });
    if (!response.ok) return NextResponse.json({ error: `AI provider ตอบกลับด้วยสถานะ ${response.status}` }, { status: 502 });
    const payload = await response.json() as { message?: { content?: string }; choices?: Array<{ message: { content: string } }> };
    const reply = payload.message?.content ?? payload.choices?.[0]?.message?.content;
    if (!reply) return NextResponse.json({ error: "AI provider ไม่ได้ส่งคำตอบกลับมา" }, { status: 502 });
    const save = db().prepare("INSERT INTO tutor_messages(lesson_id,role,content) VALUES(?,?,?)");
    save.run(lesson.id, "user", parsed.data.message); save.run(lesson.id, "assistant", reply);
    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "AI ใช้เวลานานเกินไป ลองอีกครั้ง" : "ติดต่อ AI provider ไม่สำเร็จ ตรวจการตั้งค่าและการเชื่อมต่อ";
    return NextResponse.json({ error: message }, { status: 503 });
  } finally { clearTimeout(timer); }
}

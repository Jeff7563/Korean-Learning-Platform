import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { bangkokDate, changePlanMode, dailyPlanIsComplete, ensureDailyPlan, isLocalDate, weekdayForLocalDate, type StudyMode } from "@/lib/daily-planner";

export const runtime = "nodejs";

const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("mode"), date: z.string(), mode: z.enum(["standard", "light", "rest"]) }),
  z.object({ action: z.literal("task"), date: z.string(), taskId: z.number().int().positive(), completed: z.boolean() }),
  z.object({ action: z.literal("time"), date: z.string(), minutes: z.number().int().min(1).max(480) }),
]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? bangkokDate();
  if (!isLocalDate(date)) return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
  const database = db();
  ensureDailyPlan(database, date);
  const plan = database.prepare(`SELECT p.plan_date date,p.mode,p.recommendation,p.recommendation_href recommendationHref,p.planned_minutes plannedMinutes,p.actual_minutes actualMinutes,l.slug lessonSlug,l.title lessonTitle
    FROM daily_plans p LEFT JOIN lessons l ON l.id=p.lesson_id WHERE p.plan_date=?`).get(date) as { date: string; mode: StudyMode; recommendation: string; recommendationHref: string; plannedMinutes: number; actualMinutes: number; lessonSlug: string | null; lessonTitle: string | null };
  const tasks = database.prepare("SELECT id,task_key taskKey,title,starts_at startsAt,ends_at endsAt,planned_minutes plannedMinutes,href,optional,completed_at completedAt FROM daily_plan_tasks WHERE plan_date=? ORDER BY id").all(date) as Array<{ id: number; taskKey: string; title: string; startsAt: string | null; endsAt: string | null; plannedMinutes: number; href: string; optional: number; completedAt: string | null }>;
  const required = tasks.filter((task) => !task.optional);
  const completeCount = required.filter((task) => task.completedAt).length;
  const today = bangkokDate();
  const previousDate = shiftLocalDate(date, -1);
  const previous = previousDate < today ? database.prepare(`SELECT p.plan_date date,p.planned_minutes plannedMinutes,p.actual_minutes actualMinutes,
    (SELECT count(*) FROM daily_plan_tasks t WHERE t.plan_date=p.plan_date AND t.optional=0) taskCount,
    (SELECT count(*) FROM daily_plan_tasks t WHERE t.plan_date=p.plan_date AND t.optional=0 AND t.completed_at IS NOT NULL) completedCount
    FROM daily_plans p WHERE p.plan_date=?`).get(previousDate) as { date: string; plannedMinutes: number; actualMinutes: number; taskCount: number; completedCount: number } | undefined : undefined;
  return NextResponse.json({
    date, today, isToday: date === today,
    dateLabel: new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "full" }).format(new Date(`${date}T12:00:00Z`)),
    mode: plan.mode, recommendation: plan.recommendation, recommendationHref: plan.recommendationHref,
    lesson: plan.lessonSlug ? { slug: plan.lessonSlug, title: plan.lessonTitle } : null,
    plannedMinutes: plan.plannedMinutes, actualMinutes: plan.actualMinutes,
    completedCount: completeCount, requiredCount: required.length,
    completionPercent: required.length ? Math.round((completeCount / required.length) * 100) : 0,
    tasks, previous: previous ? { ...previous, dateLabel: new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "medium" }).format(new Date(`${previous.date}T12:00:00Z`)) } : null,
  });
}

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isLocalDate(parsed.data.date)) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const database = db();
  ensureDailyPlan(database, parsed.data.date);
  const data = parsed.data;
  if (data.action === "mode" && data.mode === "rest" && weekdayForLocalDate(data.date) !== 0) return NextResponse.json({ error: "เลือกวันพักได้เฉพาะวันอาทิตย์" }, { status: 400 });
  if (data.action !== "time" && dailyPlanIsComplete(database, data.date)) {
    return NextResponse.json({ error: "แผนที่ทำครบแล้วเป็นประวัติที่แก้ไขไม่ได้" }, { status: 409 });
  }
  if (data.action === "mode") {
    if (!changePlanMode(database, data.date, data.mode)) return NextResponse.json({ error: "เริ่มกิจกรรมแล้ว จึงเปลี่ยนรูปแบบโดยไม่กระทบประวัติไม่ได้" }, { status: 409 });
  } else if (data.action === "task") {
    const task = database.prepare("SELECT id FROM daily_plan_tasks WHERE id=? AND plan_date=?").get(data.taskId, data.date);
    if (!task) return NextResponse.json({ error: "ไม่พบกิจกรรมในแผนวันนี้" }, { status: 404 });
    if (data.completed) database.prepare("UPDATE daily_plan_tasks SET completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP) WHERE id=? AND plan_date=?").run(data.taskId, data.date);
    else database.prepare("UPDATE daily_plan_tasks SET completed_at=NULL WHERE id=? AND plan_date=?").run(data.taskId, data.date);
  } else {
    database.prepare("UPDATE daily_plans SET actual_minutes=actual_minutes+? WHERE plan_date=?").run(data.minutes, data.date);
  }
  return NextResponse.json({ ok: true });
}

function shiftLocalDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

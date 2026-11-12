import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courseProgress } from "@/lib/progress";
import { schedule } from "@/content/schedule";
export const runtime="nodejs";
export async function GET(){const p=courseProgress();const recent=db().prepare("SELECT l.title,a.score,a.total,a.passed,a.created_at FROM checkpoint_attempts a JOIN lessons l ON l.id=a.lesson_id ORDER BY a.id DESC LIMIT 5").all();const activity=db().prepare("SELECT substr(completed_at,1,10) day,count(*) count FROM learner_activity_progress WHERE completed_at >= date('now','-6 days') GROUP BY day ORDER BY day").all();const day=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Bangkok",weekday:"long"}).format(new Date());const dayIndex=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].indexOf(day);const settings=db().prepare("SELECT * FROM learner_settings WHERE id=1").get();return NextResponse.json({...p,recent,activity,today:schedule[dayIndex],timeZone:"Asia/Bangkok",settings,aiReady:!!(process.env.AI_PROVIDER==="ollama"?process.env.OLLAMA_MODEL:process.env.AI_PROVIDER==="openai"&&process.env.OPENAI_API_KEY&&process.env.OPENAI_MODEL)});}

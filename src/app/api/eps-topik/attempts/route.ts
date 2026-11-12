import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { startExamAttempt, startPracticeAttempt } from "@/lib/eps-topik";
export const runtime = "nodejs";
const schema=z.discriminatedUnion("kind",[z.object({kind:z.literal("exam"),examSetId:z.string().min(1)}),z.object({kind:z.literal("practice"),mode:z.enum(["reading","listening","vocabulary-grammar","everyday","workplace-safety","incorrect"]),count:z.union([z.literal(5),z.literal(10),z.literal(20)])})]);
export async function POST(request:Request){const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return NextResponse.json({error:"ข้อมูลไม่ถูกต้อง"},{status:400});const d=db();if(p.data.kind==="exam"){const attempt=startExamAttempt(d,p.data.examSetId);return attempt?NextResponse.json(attempt):NextResponse.json({error:"ชุดข้อสอบไม่พร้อม"},{status:422});}const attempt=startPracticeAttempt(d,p.data.mode,p.data.count);return attempt?NextResponse.json(attempt):NextResponse.json({error:"ยังไม่มีข้อสำหรับโหมดนี้"},{status:422});}

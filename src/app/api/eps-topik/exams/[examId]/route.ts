import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getExamInfo } from "@/lib/eps-topik";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{examId:string}> }) { const {examId}=await params; const exam=getExamInfo(db(),examId); return exam ? NextResponse.json(exam) : NextResponse.json({error:"ไม่พบชุดข้อสอบ"},{status:404}); }

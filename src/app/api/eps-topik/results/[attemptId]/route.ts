import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEpsResult } from "@/lib/eps-topik";
export const runtime = "nodejs";
export async function GET(_r:Request,{params}:{params:Promise<{attemptId:string}>}){const id=Number((await params).attemptId);if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:"ไม่พบ"},{status:404});const data=getEpsResult(db(),id);return data?NextResponse.json(data):NextResponse.json({error:"ผลยังไม่พร้อม"},{status:409});}

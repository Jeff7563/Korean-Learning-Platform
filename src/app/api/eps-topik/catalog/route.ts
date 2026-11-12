import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEpsCatalog } from "@/lib/eps-topik";
export const runtime = "nodejs";
export async function GET() { return NextResponse.json(getEpsCatalog(db())); }

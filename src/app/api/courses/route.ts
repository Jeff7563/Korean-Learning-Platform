import { NextResponse } from "next/server"; import {courseProgress} from "@/lib/progress";
export const runtime="nodejs";
export async function GET(){return NextResponse.json(courseProgress());}

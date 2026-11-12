import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { epsExamDrafts, epsSourceDrafts } from "../content/eps-topik-bank";
import { getEpsAttempt, getEpsResult, finalizeEpsAttempt, saveEpsAnswer, startExamAttempt, startPracticeAttempt } from "./eps-topik";

function fixture() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys=ON");
  for (const file of ["0005_eps_topik_simulator.sql", "0006_eps_exam_sections.sql", "0005_eps_topik_simulator.sql"]) {
    db.exec(readFileSync(join(process.cwd(), "scripts/migrations", file), "utf8"));
  }
  const source = db.prepare("INSERT INTO eps_sources(slug,title,edition,url,format,access_status,answer_audio_status,copyright_notes,verification_notes,verified_at) VALUES(?,?,?,?,?,?,?,?,?,?)");
  for (const row of epsSourceDrafts) source.run(row.slug,row.title,row.edition,row.url,row.format,row.access_status,row.answer_audio_status,row.copyright_notes,row.verification_notes,"2026-11-12");
  for (const exam of epsExamDrafts) {
    db.prepare("INSERT INTO eps_exam_sets(id,title,style,source_type,description) VALUES(?,?,?,'ORIGINAL_MOCK',?)").run(exam.id,exam.title,exam.style,exam.description);
    const insert = db.prepare("INSERT INTO eps_questions(exam_set_id,position,section,skill,prompt,options_json,answer_index,explanation_th,listening_script,source_type) VALUES(?,?,?,?,?,?,?,?,?,'ORIGINAL_MOCK')");
    exam.questions.forEach((question,index)=>insert.run(exam.id,index+1,question.section,question.skill,question.prompt,JSON.stringify(question.options),question.answer,question.explanation,question.script??null));
  }
  return db;
}

describe("EPS-TOPIK simulator", () => {
  it("seeds two original, balanced 40-question forms and registers five sources", () => {
    expect(epsExamDrafts).toHaveLength(2);
    for (const exam of epsExamDrafts) {
      expect(exam.questions).toHaveLength(40);
      expect(exam.questions.filter(question=>question.section==="reading")).toHaveLength(20);
      expect(exam.questions.filter(question=>question.section==="listening")).toHaveLength(20);
      expect(exam.questions.every(question=>question.options.length===4&&question.answer>=0&&question.answer<4)).toBe(true);
      expect(exam.questions.filter(question=>question.section==="listening").every(question=>question.script)).toBe(true);
    }
    expect(epsSourceDrafts).toHaveLength(5);
  });
  it("keeps keys private before submission and prevents duplicate scoring", () => {
    const db=fixture();const now=new Date("2026-11-12T00:00:00Z");const start=startExamAttempt(db,"legacy-style",now)!;
    const safe=getEpsAttempt(db,start.id,now);if(!safe||safe.status!=="in_progress")throw new Error("attempt not active");
    expect(JSON.stringify(safe)).not.toMatch(/answer.?index|correctIndex|explanation/i);
    expect(saveEpsAnswer(db,start.id,safe.questions[0].id,0,now)).toMatchObject({ok:true});
    const first=finalizeEpsAttempt(db,start.id,new Date("2026-11-12T00:01:00Z"));
    expect(finalizeEpsAttempt(db,start.id,new Date("2026-11-12T00:02:00Z"))).toMatchObject({alreadySubmitted:true});
    expect(db.prepare("SELECT count(*) c FROM eps_attempts").get()).toEqual({c:1});
    const result=getEpsResult(db,start.id)!;expect(result.questions).toHaveLength(40);expect(first?.scorePercent).toBe(3);expect(result.diagnosticOnly).toBe(true);db.close();
  });
  it("resumes saved choices and automatically submits at the 50-minute limit", () => {
    const db=fixture();const now=new Date("2026-11-12T00:00:00Z");const start=startExamAttempt(db,"current-style",now)!;
    const attempt=getEpsAttempt(db,start.id,now);if(!attempt||attempt.status!=="in_progress")throw new Error("attempt not active");
    const question=attempt.questions[0];saveEpsAnswer(db,start.id,question.id,2,now);
    expect(startExamAttempt(db,"current-style",new Date("2026-11-12T00:03:00Z"))).toMatchObject({id:start.id,resumed:true});
    const resumed=getEpsAttempt(db,start.id,new Date("2026-11-12T00:03:00Z"));if(!resumed||resumed.status!=="in_progress")throw new Error("attempt not active");expect(resumed.answers[question.id]).toBe(2);
    expect(getEpsAttempt(db,start.id,new Date("2026-11-12T01:00:00Z"))).toMatchObject({status:"submitted"});db.close();
  });
  it("enforces the reading and listening 25-minute sections", () => {
    const db=fixture();const now=new Date("2026-11-12T00:00:00Z");const start=startExamAttempt(db,"legacy-style",now)!;
    const reading=getEpsAttempt(db,start.id,now);if(!reading||reading.status!=="in_progress")throw new Error("attempt not active");
    expect(reading.activeSection).toBe("reading");expect(reading.questions).toHaveLength(20);expect(reading.sectionExpiresAt).toBe("2026-11-12T00:25:00.000Z");
    const listeningId=db.prepare("SELECT id FROM eps_questions WHERE exam_set_id=? AND section=? ORDER BY position LIMIT 1").pluck().get("legacy-style","listening") as number;
    expect(saveEpsAnswer(db,start.id,listeningId,0,now)).toMatchObject({error:"wrong_section"});
    const listening=getEpsAttempt(db,start.id,new Date("2026-11-12T00:25:00Z"));if(!listening||listening.status!=="in_progress")throw new Error("attempt not active");
    expect(listening.activeSection).toBe("listening");expect(listening.questions).toHaveLength(20);expect(listening.sectionExpiresAt).toBe("2026-11-12T00:50:00.000Z");
    expect(getEpsAttempt(db,start.id,new Date("2026-11-12T00:50:01Z"))).toMatchObject({status:"submitted"});db.close();
  });
  it("prioritizes unseen questions, filters practice mode and respects session size", () => {
    const db=fixture();const practice=startPracticeAttempt(db,"listening",5,new Date("2026-11-12T00:00:00Z"),()=>0)!;
    expect(practice.questionCount).toBe(5);const active=getEpsAttempt(db,practice.id);if(!active||active.status!=="in_progress")throw new Error("practice not active");
    expect(active.questions.every(question=>question.section==="listening")).toBe(true);expect(startPracticeAttempt(db,"workplace-safety",10)).toMatchObject({questionCount:10});db.close();
  });
});

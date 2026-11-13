import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { epsExamDrafts, epsSourceDrafts } from "../content/eps-topik-bank";
import { epsExamDraftsV071, validateEpsExamDrafts } from "../content/eps-topik-bank-v071";
import { getEpsAttempt, getEpsCatalog, getEpsResult, finalizeEpsAttempt, saveEpsAnswer, startExamAttempt, startPracticeAttempt } from "./eps-topik";
import { seedEpsExamDrafts } from "./eps-topik-seed";

function baseFixture() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys=ON");
  for (const file of ["0005_eps_topik_simulator.sql", "0006_eps_exam_sections.sql"]) db.exec(readFileSync(join(process.cwd(), "scripts/migrations", file), "utf8"));
  const source = db.prepare("INSERT INTO eps_sources(slug,title,edition,url,format,access_status,answer_audio_status,copyright_notes,verification_notes,verified_at) VALUES(?,?,?,?,?,?,?,?,?,?)");
  for (const row of epsSourceDrafts) source.run(row.slug,row.title,row.edition,row.url,row.format,row.access_status,row.answer_audio_status,row.copyright_notes,row.verification_notes,"2026-11-12");
  insertDrafts(db, epsExamDrafts);
  return db;
}
function insertDrafts(db: Database.Database, drafts: typeof epsExamDrafts | typeof epsExamDraftsV071) {
  for (const exam of drafts) {
    db.prepare("INSERT INTO eps_exam_sets(id,title,style,source_type,description) VALUES(?,?,?,'ORIGINAL_MOCK',?)").run(exam.id,exam.title,exam.style,exam.description);
    const insert = db.prepare("INSERT INTO eps_questions(exam_set_id,position,section,skill,prompt,options_json,answer_index,explanation_th,listening_script,source_type) VALUES(?,?,?,?,?,?,?,?,?,'ORIGINAL_MOCK')");
    exam.questions.forEach((question,index)=>insert.run(exam.id,index+1,question.section,question.skill,question.prompt,JSON.stringify(question.options),question.answer,question.explanation,question.script??null));
  }
}
function fixture() {
  const db=baseFixture();
  db.exec(readFileSync(join(process.cwd(), "scripts/migrations/0007_eps_immutable_exam_versions.sql"), "utf8"));
  seedEpsExamDrafts(db);
  return db;
}

describe("EPS-TOPIK simulator", () => {
  it("validates two original Korean-language forms with balanced answer positions", () => {
    expect(() => validateEpsExamDrafts()).not.toThrow();
    expect(epsExamDraftsV071).toHaveLength(2);
    for (const exam of epsExamDraftsV071) {
      expect(exam.questions).toHaveLength(40);
      for (const section of ["reading", "listening"] as const) {
        const rows = exam.questions.filter(question => question.section === section);
        expect(rows).toHaveLength(20);
        expect(rows.reduce((counts, question) => { counts[question.answer]++; return counts; }, [0,0,0,0])).toEqual([5,5,5,5]);
        expect(rows.every(question => question.options.length===4 && new Set(question.options).size===4 && question.explanation.trim().length>0)).toBe(true);
        if (section === "reading") expect(rows.every(question => /[가-힣]/u.test(question.prompt) && question.options.every(option => /[가-힣]/u.test(option)))).toBe(true);
        else expect(rows.every(question => question.script?.trim())).toBe(true);
      }
    }
    expect(epsSourceDrafts).toHaveLength(5);
  });
  it("keeps answer keys private and prevents duplicate scoring", () => {
    const db=fixture();const now=new Date("2026-11-12T00:00:00Z");const start=startExamAttempt(db,"eps-topik-v071-a2",now)!;
    const safe=getEpsAttempt(db,start.id,now);if(!safe||safe.status!=="in_progress")throw new Error("attempt not active");
    expect(JSON.stringify(safe)).not.toMatch(/answer.?index|correctIndex|explanation/i);
    const correctIndex=db.prepare("SELECT answer_index FROM eps_questions WHERE id=?").pluck().get(safe.questions[0].id) as number;
    expect(saveEpsAnswer(db,start.id,safe.questions[0].id,correctIndex,now)).toMatchObject({ok:true});
    const first=finalizeEpsAttempt(db,start.id,new Date("2026-11-12T00:01:00Z"));
    expect(finalizeEpsAttempt(db,start.id,new Date("2026-11-12T00:02:00Z"))).toMatchObject({alreadySubmitted:true});
    expect(db.prepare("SELECT count(*) c FROM eps_attempts").get()).toEqual({c:1});
    const result=getEpsResult(db,start.id)!;expect(result.questions).toHaveLength(40);expect(first?.scorePercent).toBe(3);expect(result.diagnosticOnly).toBe(true);db.close();
  });
  it("resumes saved choices and automatically submits at the 50-minute limit", () => {
    const db=fixture();const now=new Date("2026-11-12T00:00:00Z");const start=startExamAttempt(db,"eps-topik-v071-b2",now)!;
    const attempt=getEpsAttempt(db,start.id,now);if(!attempt||attempt.status!=="in_progress")throw new Error("attempt not active");
    const question=attempt.questions[0];saveEpsAnswer(db,start.id,question.id,2,now);
    expect(startExamAttempt(db,"eps-topik-v071-b2",new Date("2026-11-12T00:03:00Z"))).toMatchObject({id:start.id,resumed:true});
    const resumed=getEpsAttempt(db,start.id,new Date("2026-11-12T00:03:00Z"));if(!resumed||resumed.status!=="in_progress")throw new Error("attempt not active");expect(resumed.answers[question.id]).toBe(2);
    expect(getEpsAttempt(db,start.id,new Date("2026-11-12T00:50:00Z"))).toMatchObject({status:"submitted"});
    expect(finalizeEpsAttempt(db,start.id,new Date("2026-11-12T00:51:00Z"))).toMatchObject({alreadySubmitted:true});db.close();
  });
  it("enforces 25-minute sections and supports an explicit early transition", () => {
    const db=fixture();const now=new Date("2026-11-12T00:00:00Z");const start=startExamAttempt(db,"eps-topik-v071-a2",now)!;
    const reading=getEpsAttempt(db,start.id,now);if(!reading||reading.status!=="in_progress")throw new Error("attempt not active");
    expect(reading.activeSection).toBe("reading");expect(reading.questions).toHaveLength(20);expect(reading.sectionExpiresAt).toBe("2026-11-12T00:25:00.000Z");
    const listeningId=db.prepare("SELECT id FROM eps_questions WHERE exam_set_id=? AND section=? ORDER BY position LIMIT 1").pluck().get("eps-topik-v071-a2","listening") as number;
    expect(saveEpsAnswer(db,start.id,listeningId,0,now)).toMatchObject({error:"wrong_section"});
    const listening=getEpsAttempt(db,start.id,new Date("2026-11-12T00:25:00Z"));if(!listening||listening.status!=="in_progress")throw new Error("attempt not active");
    expect(listening.activeSection).toBe("listening");expect(listening.questions).toHaveLength(20);expect(listening.sectionExpiresAt).toBe("2026-11-12T00:50:00.000Z");
    expect(getEpsAttempt(db,start.id,new Date("2026-11-12T00:50:01Z"))).toMatchObject({status:"submitted"});db.close();
  });
  it("retires old forms without changing their question versions or historical scoring", () => {
    const db=baseFixture();db.exec(readFileSync(join(process.cwd(), "scripts/migrations/0007_eps_immutable_exam_versions.sql"), "utf8"));
    db.prepare("UPDATE eps_exam_sets SET is_active=1 WHERE id='legacy-style'").run();const now=new Date("2026-11-12T00:00:00Z");const start=startExamAttempt(db,"legacy-style",now)!;
    const oldQuestion=db.prepare("SELECT id,prompt,options_json,answer_index FROM eps_questions WHERE exam_set_id='legacy-style' AND position=1").get() as {id:number;prompt:string;options_json:string;answer_index:number};
    saveEpsAnswer(db,start.id,oldQuestion.id,oldQuestion.answer_index,now);
    db.prepare("UPDATE eps_exam_sets SET is_active=0 WHERE id='legacy-style'").run();
    seedEpsExamDrafts(db);
    expect(db.prepare("SELECT is_active FROM eps_exam_sets WHERE id='legacy-style'").get()).toEqual({is_active:0});
    expect(startExamAttempt(db,"legacy-style",new Date("2026-11-12T00:01:00Z"))).toMatchObject({id:start.id,resumed:true});
    expect(finalizeEpsAttempt(db,start.id,new Date("2026-11-12T00:02:00Z"))).toMatchObject({scorePercent:3});
    expect(startExamAttempt(db,"legacy-style",new Date("2026-11-12T00:03:00Z"))).toBeNull();
    const result=getEpsResult(db,start.id)!;expect(result.questions[0]).toMatchObject({id:oldQuestion.id,prompt:oldQuestion.prompt,correctIndex:oldQuestion.answer_index,correct:true});
    expect(JSON.stringify(result.questions[0]!.options)).toBe(oldQuestion.options_json);
    expect(() => db.prepare("UPDATE eps_questions SET answer_index=1 WHERE id=?").run(oldQuestion.id)).toThrow(/immutable/i);
    expect(() => db.prepare("DELETE FROM eps_questions WHERE id=?").run(oldQuestion.id)).toThrow(/cannot be deleted/i);
    db.close();
  });
  it("seeds exam forms idempotently and exposes only the new forms for exams", () => {
    const db=fixture();
    const insertOldDraft=db.prepare("INSERT INTO eps_exam_sets(id,title,style,source_type,description,time_minutes,max_score,is_active) VALUES(?,'old draft','old','ORIGINAL_MOCK','old',50,100,1)");
    insertOldDraft.run("eps-topik-v071-a");insertOldDraft.run("eps-topik-v071-b");
    seedEpsExamDrafts(db);
    expect(db.prepare("SELECT is_active FROM eps_exam_sets WHERE id='eps-topik-v071-a'").get()).toEqual({is_active:0});
    const before=db.prepare("SELECT id,title,is_active FROM eps_exam_sets ORDER BY id").all();const count=db.prepare("SELECT count(*) c FROM eps_questions").get();
    seedEpsExamDrafts(db);
    expect(db.prepare("SELECT id,title,is_active FROM eps_exam_sets ORDER BY id").all()).toEqual(before);
    expect(db.prepare("SELECT count(*) c FROM eps_questions").get()).toEqual(count);
    expect(db.prepare("SELECT count(*) c FROM eps_questions WHERE exam_set_id='eps-topik-v071-a2'").get()).toEqual({c:40});
    expect((getEpsCatalog(db).exams as Array<{id:string}>).map(exam=>exam.id)).toEqual(["eps-topik-v071-a2","eps-topik-v071-b2"]);
    db.close();
  });
  it("leaves learner progress, checkpoint answers, and planner history unchanged by the EPS migration", () => {
    const db=new Database(":memory:");db.pragma("foreign_keys=ON");
    db.exec(readFileSync(join(process.cwd(),"drizzle/0001_init.sql"),"utf8"));
    const course=db.prepare("INSERT INTO courses(slug,title) VALUES('test','test')").run().lastInsertRowid;
    const moduleId=db.prepare("INSERT INTO modules(course_id,slug,title,position) VALUES(?,'test','test',1)").run(course).lastInsertRowid;
    const lesson=db.prepare("INSERT INTO lessons(module_id,slug,title,description,content_json,position) VALUES(?,'test','test','test','{}',1)").run(moduleId).lastInsertRowid;
    const exercise=db.prepare("INSERT INTO exercises(lesson_id,position,prompt,options_json,answer_index,explanation) VALUES(?,1,'Q','[]',0,'E')").run(lesson).lastInsertRowid;
    const attempt=db.prepare("INSERT INTO checkpoint_attempts(lesson_id,score,total,passed) VALUES(?,1,1,1)").run(lesson).lastInsertRowid;
    db.prepare("INSERT INTO checkpoint_answers(attempt_id,exercise_id,selected_index,correct) VALUES(?,?,0,1)").run(attempt,exercise);
    db.prepare("INSERT INTO learner_lesson_progress(lesson_id,status) VALUES(?,'completed')").run(lesson);
    db.exec(readFileSync(join(process.cwd(),"scripts/migrations/0003_daily_learning_plans.sql"),"utf8"));
    db.prepare("INSERT INTO daily_plans(plan_date,mode,lesson_id,recommendation,recommendation_href,planned_minutes) VALUES('2026-11-12','standard',?,'Review','/review',90)").run(lesson);
    db.prepare("INSERT INTO daily_plan_tasks(plan_date,task_key,title,planned_minutes,href,completed_at) VALUES('2026-11-12','task','Task',10,'/review','2026-11-12T10:00:00Z')").run();
    db.prepare("INSERT INTO tutor_messages(lesson_id,role,content) VALUES(?,'user','saved message')").run(lesson);
    for(const file of ["0005_eps_topik_simulator.sql","0006_eps_exam_sections.sql"])db.exec(readFileSync(join(process.cwd(),`scripts/migrations/${file}`),"utf8"));
    const tables=["learner_lesson_progress","checkpoint_attempts","checkpoint_answers","daily_plans","daily_plan_tasks","tutor_messages"];
    const snapshot=()=>Object.fromEntries(tables.map(table=>[table,db.prepare(`SELECT * FROM "${table}"`).all()]));
    const before=snapshot();db.exec(readFileSync(join(process.cwd(),"scripts/migrations/0007_eps_immutable_exam_versions.sql"),"utf8"));
    expect(snapshot()).toEqual(before);db.close();
  });
  it("prioritizes unseen questions, filters practice mode and respects session size", () => {
    const db=fixture();const practice=startPracticeAttempt(db,"listening",5,new Date("2026-11-12T00:00:00Z"),()=>0)!;
    expect(practice.questionCount).toBe(5);const active=getEpsAttempt(db,practice.id);if(!active||active.status!=="in_progress")throw new Error("attempt not active");
    expect(active.questions.every(question=>question.section==="listening")).toBe(true);
    const ids=JSON.parse((db.prepare("SELECT question_ids_json FROM eps_attempts WHERE id=?").pluck().get(practice.id) as string));
    expect(db.prepare(`SELECT count(*) c FROM eps_questions q JOIN eps_exam_sets s ON s.id=q.exam_set_id WHERE q.id IN (${ids.map(()=>"?").join(",")}) AND s.is_active=1`).get(...ids)).toEqual({c:0});
    expect(startPracticeAttempt(db,"workplace-safety",10)).toMatchObject({questionCount:10});db.close();
  });
});

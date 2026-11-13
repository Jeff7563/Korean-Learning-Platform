import type Database from "better-sqlite3";
import { epsExamDrafts } from "../content/eps-topik-bank";
import { epsExamDraftsV071 } from "../content/eps-topik-bank-v071";

export function seedEpsExamDrafts(database: Database.Database) {
  database.prepare("UPDATE eps_exam_sets SET is_active=0 WHERE id IN ('eps-topik-v071-a','eps-topik-v071-b')").run();
  const putSet = database.prepare(`INSERT INTO eps_exam_sets(id,title,style,source_type,description,time_minutes,max_score,is_active)
    VALUES(?,?,?,'ORIGINAL_MOCK',?,50,100,?) ON CONFLICT(id) DO NOTHING`);
  const putQuestion = database.prepare(`INSERT INTO eps_questions(exam_set_id,position,section,skill,prompt,options_json,answer_index,explanation_th,listening_script,source_type)
    VALUES(?,?,?,?,?,?,?,?,?,'ORIGINAL_MOCK') ON CONFLICT(exam_set_id,position) DO NOTHING`);
  const seed = (exam: typeof epsExamDrafts[number] | typeof epsExamDraftsV071[number], active: number) => {
    putSet.run(exam.id, exam.title, exam.style, exam.description, active);
    exam.questions.forEach((question, position) => putQuestion.run(exam.id, position + 1, question.section, question.skill,
      question.prompt, JSON.stringify(question.options), question.answer, question.explanation, question.script ?? null));
  };
  for (const exam of epsExamDrafts) seed(exam, 0);
  for (const exam of epsExamDraftsV071) seed(exam, 1);
}

import type Database from "better-sqlite3";

export type PracticeMode = "reading" | "listening" | "vocabulary-grammar" | "everyday" | "workplace-safety" | "incorrect";
type Attempt = { id:number; exam_set_id:string|null; kind:"exam"|"practice"; practice_mode:PracticeMode|null; status:"in_progress"|"submitted"; question_ids_json:string; started_at:string; expires_at:string|null; submitted_at:string|null; elapsed_seconds:number; score_percent:number|null; section_scores_json:string|null; missed_skills_json:string|null; active_section:"reading"|"listening"; section_started_at:string|null };

function shuffle<T>(values:T[],random:()=>number):T[]{const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
function utcIso(date:Date){return date.toISOString();}

export function getEpsCatalog(database:Database.Database){
  const sources=database.prepare("SELECT slug,title,edition,url,format,access_status accessStatus,answer_audio_status answerAudioStatus,copyright_notes copyrightNotes,verification_notes verificationNotes,verified_at verifiedAt FROM eps_sources ORDER BY id").all();
  const exams=database.prepare(`SELECT s.id,s.title,s.style,s.source_type sourceType,s.description,s.time_minutes timeMinutes,s.max_score maxScore,
      count(q.id) questionCount,sum(CASE WHEN q.section='reading' THEN 1 ELSE 0 END) readingCount,sum(CASE WHEN q.section='listening' THEN 1 ELSE 0 END) listeningCount
    FROM eps_exam_sets s LEFT JOIN eps_questions q ON q.exam_set_id=s.id WHERE s.is_active=1 GROUP BY s.id ORDER BY s.id`).all();
  return {sources,exams};
}

export function getExamInfo(database:Database.Database,examSetId:string){
  return database.prepare(`SELECT s.id,s.title,s.style,s.source_type sourceType,s.description,s.time_minutes timeMinutes,s.max_score maxScore,s.is_active isActive,
    count(q.id) questionCount,sum(CASE WHEN q.section='reading' THEN 1 ELSE 0 END) readingCount,sum(CASE WHEN q.section='listening' THEN 1 ELSE 0 END) listeningCount
    FROM eps_exam_sets s LEFT JOIN eps_questions q ON q.exam_set_id=s.id WHERE s.id=? GROUP BY s.id`).get(examSetId) ?? null;
}

export function startExamAttempt(database:Database.Database,examSetId:string,now=new Date()):{id:number;resumed:boolean}|null{
  const exam=getExamInfo(database,examSetId) as {questionCount:number;readingCount:number;listeningCount:number;isActive:number}|null;
  if(!exam||exam.questionCount!==40||exam.readingCount!==20||exam.listeningCount!==20)return null;
  const active=database.prepare("SELECT id,expires_at expiresAt FROM eps_attempts WHERE kind='exam' AND exam_set_id=? AND status='in_progress' ORDER BY id DESC LIMIT 1").get(examSetId) as {id:number;expiresAt:string}|undefined;
  if(active&&Date.parse(active.expiresAt)>now.valueOf())return {id:active.id,resumed:true};
  if(active)finalizeEpsAttempt(database,active.id,now);
  if(exam.isActive!==1)return null;
  const ids=(database.prepare("SELECT id FROM eps_questions WHERE exam_set_id=? ORDER BY position").all(examSetId) as Array<{id:number}>).map(row=>row.id);
  const startedAt=utcIso(now),expiresAt=utcIso(new Date(now.valueOf()+50*60_000));
  const result=database.prepare("INSERT INTO eps_attempts(exam_set_id,kind,practice_mode,status,question_ids_json,started_at,expires_at,active_section,section_started_at) VALUES(?,'exam',NULL,'in_progress',?,?,?,'reading',?)").run(examSetId,JSON.stringify(ids),startedAt,expiresAt,startedAt);
  return {id:Number(result.lastInsertRowid),resumed:false};
}

export function startPracticeAttempt(database:Database.Database,mode:PracticeMode,count:5|10|20,now=new Date(),random=Math.random){
  const modeWhere:Record<PracticeMode,string>={reading:"q.section='reading'",listening:"q.section='listening'", "vocabulary-grammar":"q.skill IN ('vocabulary','grammar')",everyday:"q.skill='everyday'", "workplace-safety":"q.skill IN ('workplace','safety')",incorrect:"EXISTS(SELECT 1 FROM eps_attempt_answers a JOIN eps_attempts t ON t.id=a.attempt_id WHERE a.question_id=q.id AND a.selected_index<>q.answer_index AND t.status='submitted')"};
  const rows=database.prepare(`SELECT q.id,NOT EXISTS(SELECT 1 FROM eps_attempt_answers a WHERE a.question_id=q.id) unseen
    FROM eps_questions q JOIN eps_exam_sets s ON s.id=q.exam_set_id
    WHERE (${modeWhere[mode]}) AND (s.is_active=0 OR ?='incorrect')`).all(mode) as Array<{id:number;unseen:number}>;
  if(!rows.length)return null;
  const unseen=shuffle(rows.filter(row=>row.unseen).map(row=>row.id),random);
  const seen=shuffle(rows.filter(row=>!row.unseen).map(row=>row.id),random);
  const ids=[...unseen,...seen].slice(0,count);
  const result=database.prepare("INSERT INTO eps_attempts(exam_set_id,kind,practice_mode,status,question_ids_json,started_at,expires_at) VALUES(NULL,'practice',?,'in_progress',?,?,NULL)").run(mode,JSON.stringify(ids),utcIso(now));
  return {id:Number(result.lastInsertRowid),questionCount:ids.length};
}

function attemptRow(database:Database.Database,id:number){return database.prepare(`SELECT id,exam_set_id examSetId,kind,practice_mode practiceMode,status,question_ids_json questionIdsJson,
  started_at startedAt,expires_at expiresAt,submitted_at submittedAt,elapsed_seconds elapsedSeconds,score_percent scorePercent,active_section,section_started_at,
  section_scores_json sectionScoresJson,missed_skills_json missedSkillsJson FROM eps_attempts WHERE id=?`).get(id) as (Attempt & {examSetId:string|null;practiceMode:PracticeMode|null;questionIdsJson:string;startedAt:string;expiresAt:string|null;submittedAt:string|null;elapsedSeconds:number;scorePercent:number|null;sectionScoresJson:string|null;missedSkillsJson:string|null})|undefined;}

export function advanceEpsSection(database:Database.Database,attemptId:number,now=new Date()){
  const attempt=attemptRow(database,attemptId);if(!attempt||attempt.status!=="in_progress"||attempt.kind!=="exam"||attempt.active_section!=="reading")return false;
  database.prepare("UPDATE eps_attempts SET active_section='listening',section_started_at=? WHERE id=? AND status='in_progress'").run(utcIso(now),attemptId);return true;
}

export function saveEpsAnswer(database:Database.Database,attemptId:number,questionId:number,selectedIndex:number,now=new Date()):{ok:boolean;expired?:boolean;error?:"not_found"|"submitted"|"not_in_attempt"|"wrong_section"}{
  const attempt=attemptRow(database,attemptId);if(!attempt)return {ok:false,error:"not_found"};if(attempt.status!=="in_progress")return {ok:false,error:"submitted"};
  if(attempt.expiresAt&&Date.parse(attempt.expiresAt)<=now.valueOf()){finalizeEpsAttempt(database,attemptId,now);return {ok:false,expired:true};}
  if(attempt.kind==="exam"&&attempt.active_section==="reading"&&attempt.section_started_at&&now.valueOf()>=Date.parse(attempt.section_started_at)+25*60_000)advanceEpsSection(database,attemptId,new Date(Date.parse(attempt.section_started_at)+25*60_000));
  const current=attemptRow(database,attemptId)!;const ids=JSON.parse(current.questionIdsJson) as number[];if(!ids.includes(questionId))return {ok:false,error:"not_in_attempt"};
  if(current.kind==="exam"){const question=database.prepare("SELECT section FROM eps_questions WHERE id=?").get(questionId) as {section:string}|undefined;if(question?.section!==current.active_section)return {ok:false,error:"wrong_section"};}
  database.prepare(`INSERT INTO eps_attempt_answers(attempt_id,question_id,selected_index) VALUES(?,?,?)
    ON CONFLICT(attempt_id,question_id) DO UPDATE SET selected_index=excluded.selected_index,selected_at=CURRENT_TIMESTAMP`).run(attemptId,questionId,selectedIndex);
  return {ok:true};
}

export function finalizeEpsAttempt(database:Database.Database,attemptId:number,now=new Date()){
  return database.transaction(()=>{
    const attempt=attemptRow(database,attemptId);if(!attempt)return null;if(attempt.status==="submitted")return {id:attemptId,alreadySubmitted:true,scorePercent:attempt.scorePercent};
    const ids=JSON.parse(attempt.questionIdsJson) as number[];
    const questionRows=database.prepare(`SELECT id,section,skill,answer_index answerIndex FROM eps_questions WHERE id IN (${ids.map(()=>"?").join(",")})`).all(...ids) as Array<{id:number;section:"reading"|"listening";skill:string;answerIndex:number}>;
    const selected=new Map((database.prepare("SELECT question_id questionId,selected_index selectedIndex FROM eps_attempt_answers WHERE attempt_id=?").all(attemptId) as Array<{questionId:number;selectedIndex:number}>).map(answer=>[answer.questionId,answer.selectedIndex]));
    let correct=0;const sections={reading:{correct:0,total:0},listening:{correct:0,total:0}};const missed=new Set<string>();
    for(const question of questionRows){sections[question.section].total++;if(selected.get(question.id)===question.answerIndex){correct++;sections[question.section].correct++;}else missed.add(question.skill);}
    const scorePercent=ids.length?Math.round(correct/ids.length*100):0;
    const elapsedSeconds=Math.max(0,Math.floor((now.valueOf()-Date.parse(attempt.startedAt))/1000));
    database.prepare(`UPDATE eps_attempts SET status='submitted',submitted_at=?,elapsed_seconds=?,score_percent=?,section_scores_json=?,missed_skills_json=? WHERE id=? AND status='in_progress'`)
      .run(utcIso(now),elapsedSeconds,scorePercent,JSON.stringify(sections),JSON.stringify([...missed]),attemptId);
    return {id:attemptId,alreadySubmitted:false,scorePercent};
  })();
}

export function getEpsAttempt(database:Database.Database,attemptId:number,now=new Date()){
  let attempt=attemptRow(database,attemptId);if(!attempt)return null;
  if(attempt.status==="in_progress"&&attempt.expiresAt&&Date.parse(attempt.expiresAt)<=now.valueOf()){finalizeEpsAttempt(database,attemptId,now);attempt=attemptRow(database,attemptId);}
  if(attempt?.status==="in_progress"&&attempt.kind==="exam"&&attempt.active_section==="reading"&&attempt.section_started_at&&now.valueOf()>=Date.parse(attempt.section_started_at)+25*60_000){advanceEpsSection(database,attemptId,new Date(Date.parse(attempt.section_started_at)+25*60_000));attempt=attemptRow(database,attemptId);}
  if(!attempt)return null;if(attempt.status==="submitted")return {id:attempt.id,status:attempt.status,kind:attempt.kind,resultUrl:`/eps-topik/results/${attempt.id}`};
  const ids=JSON.parse(attempt.questionIdsJson) as number[];
  const questions=database.prepare(`SELECT q.id,q.position,q.section,q.skill,q.prompt,q.options_json optionsJson,q.listening_script listeningScript,s.source_type sourceType
    FROM eps_questions q JOIN eps_exam_sets s ON s.id=q.exam_set_id WHERE q.id IN (${ids.map(()=>"?").join(",")})`).all(...ids) as Array<{id:number;position:number;section:"reading"|"listening";skill:string;prompt:string;optionsJson:string;listeningScript:string|null;sourceType:string}>;
  const byId=new Map(questions.map(question=>[question.id,question]));
  const answers=database.prepare("SELECT question_id questionId,selected_index selectedIndex FROM eps_attempt_answers WHERE attempt_id=?").all(attemptId) as Array<{questionId:number;selectedIndex:number}>;
  const answerMap=Object.fromEntries(answers.map(answer=>[answer.questionId,answer.selectedIndex]));
  const allItems=ids.map(id=>byId.get(id)).filter((q):q is NonNullable<typeof q>=>Boolean(q)).map(question=>({id:question.id,number:ids.indexOf(question.id)+1,section:question.section,skill:question.skill,prompt:question.prompt,options:JSON.parse(question.optionsJson),listeningScript:question.listeningScript,sourceType:question.sourceType}));
  const items=attempt.kind==="exam"?allItems.filter(question=>question.section===attempt!.active_section).map((question,index)=>({...question,number:index+1})):allItems;
  const sectionDeadline=attempt.kind==="exam"?Math.min(Date.parse(attempt.expiresAt!),Date.parse(attempt.section_started_at!)+25*60_000):null;
  return {id:attempt.id,kind:attempt.kind,practiceMode:attempt.practiceMode,status:attempt.status,startedAt:attempt.startedAt,expiresAt:attempt.expiresAt,elapsedSeconds:attempt.elapsedSeconds,
    activeSection:attempt.active_section,sectionExpiresAt:sectionDeadline===null?null:utcIso(new Date(sectionDeadline)),answeredCount:answers.length,sectionProgress:{reading:{answered:allItems.filter(q=>q.section==="reading"&&answerMap[q.id]!==undefined).length,total:allItems.filter(q=>q.section==="reading").length},listening:{answered:allItems.filter(q=>q.section==="listening"&&answerMap[q.id]!==undefined).length,total:allItems.filter(q=>q.section==="listening").length}},answers:answerMap,questions:items};
}

export function getEpsResult(database:Database.Database,attemptId:number){
  const attempt=attemptRow(database,attemptId);if(!attempt||attempt.status!=="submitted")return null;
  const ids=JSON.parse(attempt.questionIdsJson) as number[];
  const questions=database.prepare(`SELECT q.id,q.section,q.skill,q.prompt,q.options_json optionsJson,q.answer_index answerIndex,q.explanation_th explanation,s.source_type sourceType
    FROM eps_questions q JOIN eps_exam_sets s ON s.id=q.exam_set_id WHERE q.id IN (${ids.map(()=>"?").join(",")})`).all(...ids) as Array<{id:number;section:string;skill:string;prompt:string;optionsJson:string;answerIndex:number;explanation:string;sourceType:string}>;
  const byId=new Map(questions.map(question=>[question.id,question]));
  const answers=database.prepare("SELECT question_id questionId,selected_index selectedIndex FROM eps_attempt_answers WHERE attempt_id=?").all(attemptId) as Array<{questionId:number;selectedIndex:number}>;
  const answerMap=new Map(answers.map(answer=>[answer.questionId,answer.selectedIndex]));
  const items=ids.map((id,index)=>{const question=byId.get(id);if(!question)return null;const selectedIndex=answerMap.get(id)??null;return {id,number:index+1,section:question.section,skill:question.skill,prompt:question.prompt,options:JSON.parse(question.optionsJson),selectedIndex,correctIndex:question.answerIndex,correct:selectedIndex===question.answerIndex,explanation:question.explanation,sourceType:question.sourceType};}).filter(Boolean);
  const examTitle=attempt.examSetId?(database.prepare("SELECT title FROM eps_exam_sets WHERE id=?").get(attempt.examSetId) as {title:string}|undefined)?.title:"ฝึกข้อสอบตามหัวข้อ";
  return {id:attempt.id,kind:attempt.kind,title:examTitle,practiceMode:attempt.practiceMode,scorePercent:attempt.scorePercent,elapsedSeconds:attempt.elapsedSeconds,submittedAt:attempt.submittedAt,
    sectionScores:attempt.sectionScoresJson?JSON.parse(attempt.sectionScoresJson):{reading:{correct:0,total:0},listening:{correct:0,total:0}},missedSkills:attempt.missedSkillsJson?JSON.parse(attempt.missedSkillsJson):[],sourceType:"ORIGINAL MOCK",diagnosticOnly:true,questions:items};
}


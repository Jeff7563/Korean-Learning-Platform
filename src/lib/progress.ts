import { db } from "@/lib/db";
export type CourseLesson = {id:number;slug:string;title:string;description:string;position:number;status:"locked"|"available"|"in_progress"|"completed";passed:boolean};
export function courseProgress() {
 const lessons=db().prepare("SELECT l.id,l.slug,l.title,l.description,l.position, EXISTS(SELECT 1 FROM checkpoint_attempts a WHERE a.lesson_id=l.id AND a.passed=1) passed, (EXISTS(SELECT 1 FROM learner_activity_progress p JOIN lesson_activities x ON x.id=p.activity_id WHERE x.lesson_id=l.id) OR EXISTS(SELECT 1 FROM learner_lesson_progress p WHERE p.lesson_id=l.id AND p.status='in_progress')) active FROM lessons l ORDER BY l.position").all() as Array<Omit<CourseLesson,"status"|"passed"> & {passed:number;active:number}>;
 const list:CourseLesson[]=lessons.map((l,i)=>({...l,passed:Boolean(l.passed),status:l.passed?"completed":(i===0||lessons[i-1].passed)?(l.active?"in_progress":"available"):"locked"}));
 const next=list.find(l=>l.status!=="completed")??list.at(-1); const completed=list.filter(l=>l.status==="completed").length;
 return {lessons:list,next,completed,total:list.length,percent:list.length?Math.round(completed/list.length*100):0};
}
export function canAccessLesson(slug:string){const rows=db().prepare("SELECT slug FROM lessons ORDER BY position").all() as Array<{slug:string}>;const index=rows.findIndex(x=>x.slug===slug);if(index<0)return false;if(index===0)return true;return Boolean(db().prepare("SELECT 1 FROM checkpoint_attempts WHERE lesson_id=(SELECT id FROM lessons WHERE slug=?) AND passed=1").get(rows[index-1].slug));}

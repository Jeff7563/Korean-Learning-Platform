"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Award, BookOpen, CalendarDays, Check, CheckCircle2, Circle, Clock3, Play, Target } from "lucide-react";

type LessonStatus = "locked" | "available" | "in_progress" | "completed";
type CourseLesson = { id:number; slug:string; title:string; description:string; position:number; status:LessonStatus; passed:boolean };
type Activity = { id:number; slug:string; title:string; completed:number };
type Attempt = { title:string; score:number; total:number; passed:number; created_at:string };
type DailyTask = { id:number; taskKey:string; title:string; startsAt:string|null; endsAt:string|null; plannedMinutes:number; href:string; optional:number; completedAt:string|null };
type DailyPlan = { date:string; today:string; isToday:boolean; dateLabel:string; mode:"standard"|"light"|"rest"; recommendation:string; recommendationHref:string; lesson:{slug:string;title:string}|null; plannedMinutes:number; actualMinutes:number; completedCount:number; requiredCount:number; completionPercent:number; tasks:DailyTask[]; previous:{date:string;dateLabel:string;plannedMinutes:number;actualMinutes:number;taskCount:number;completedCount:number}|null };
type DashboardData = { next?:CourseLesson; lessons:CourseLesson[]; completed:number; total:number; percent:number; recent:Attempt[]; activity:{day:string;count:number}[]; today:string; settings:{daily_minutes:number}|null; aiReady:boolean };

export default function Dashboard() {
  const [data,setData]=useState<DashboardData>();
  const [activities,setActivities]=useState<Activity[]>([]);
  const [activitiesLoading,setActivitiesLoading]=useState(true);
  const [plan,setPlan]=useState<DailyPlan>();
  const [selectedDate,setSelectedDate]=useState("");
  const [planError,setPlanError]=useState("");
  const [planSaving,setPlanSaving]=useState(false);
  const [actualMinutes,setActualMinutes]=useState(15);
  const [loadError,setLoadError]=useState("");
  const [saving,setSaving]=useState<number|null>(null);
  useEffect(()=>{
    let active=true;
    fetch("/api/dashboard").then(async response=>{if(!response.ok)throw new Error("โหลดข้อมูลการเรียนไม่สำเร็จ");return response.json() as Promise<DashboardData>}).then(async result=>{
      if(!active)return;setData(result);
      const target=result.next??result.lessons.at(-1);
      if(target){const response=await fetch(`/api/lessons/${target.slug}`);if(response.ok){const lesson=await response.json();if(active)setActivities(lesson.activities??[]);}else if(active)setLoadError("โหลดกิจกรรมของบทเรียนไม่สำเร็จ");}
      else if(active)setActivities([]);
      if(active)setActivitiesLoading(false);
    }).catch(error=>{if(active){setLoadError(error instanceof Error?error.message:"เกิดข้อผิดพลาด");setActivitiesLoading(false);}});
    return()=>{active=false};
  },[]);

  useEffect(()=>{
    let active=true;
    const suffix=selectedDate?`?date=${selectedDate}`:"";
    fetch(`/api/daily-plan${suffix}`).then(async response=>{if(!response.ok)throw new Error("โหลดแผนเรียนไม่สำเร็จ");return response.json() as Promise<DailyPlan>}).then(result=>{if(active){setPlan(result);setSelectedDate(result.date);setPlanError("");}}).catch(error=>{if(active)setPlanError(error instanceof Error?error.message:"เกิดข้อผิดพลาด");});
    return()=>{active=false;};
  },[selectedDate]);

  const recentAccuracy=useMemo(()=>{
    if(!data?.recent.length)return null;
    const score=data.recent.reduce((sum,item)=>sum+item.score,0);
    const total=data.recent.reduce((sum,item)=>sum+item.total,0);
    return total?Math.round(score/total*100):0;
  },[data]);

  async function toggleActivity(activity:Activity,completed:boolean){
    setSaving(activity.id);
    try{const response=await fetch("/api/activities",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({activityId:activity.id,completed})});if(response.ok)setActivities(items=>items.map(item=>item.id===activity.id?{...item,completed:Number(completed)}:item));}
    finally{setSaving(null);}
  }

  async function savePlanChange(payload:Record<string,unknown>){
    if(!plan)return;
    setPlanSaving(true);setPlanError("");
    try{const response=await fetch("/api/daily-plan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,date:plan.date})});const result=await response.json();if(!response.ok)throw new Error(result.error??"บันทึกแผนไม่สำเร็จ");const refreshed=await fetch(`/api/daily-plan?date=${plan.date}`);if(!refreshed.ok)throw new Error("โหลดแผนหลังบันทึกไม่สำเร็จ");setPlan(await refreshed.json());}
    catch(error){setPlanError(error instanceof Error?error.message:"บันทึกแผนไม่สำเร็จ");}
    finally{setPlanSaving(false);}
  }

  async function addActualTime(event:React.FormEvent){event.preventDefault();await savePlanChange({action:"time",minutes:actualMinutes});}

  const next=data?.next??data?.lessons.at(-1);
  const completedActivities=activities.filter(item=>item.completed).length;
  const allActivitiesComplete=activities.length>0&&completedActivities===activities.length;

  return <div className="shell dashboard-v2">
    <header className="dashboard-topline"><div><p className="eyebrow">LEARN AT YOUR PACE</p><h1>ยินดีต้อนรับกลับมา</h1><p className="dashboard-subtitle">เรียนทีละบท ฝึกสม่ำเสมอ แล้วภาษาเกาหลีจะค่อย ๆ เป็นของคุณ</p></div><Link href="/courses" className="text-link">ดูหลักสูตร <ArrowRight size={16}/></Link></header>

    {loadError&&<div className="notice error-notice" role="alert">{loadError}</div>}

    <section className="learning-hero" aria-labelledby="next-lesson-title">
      <div className="hero-copy">
        <div className="hero-kicker"><span className="live-dot"/>บทเรียนถัดไป{next?.status==="completed"?" · ทบทวนบทล่าสุด":" · เส้นทางของคุณ"}</div>
        <p className="hero-course">KOREAN FOUNDATIONS <span>บทที่ {next?.position??"—"}{data?.total?` จาก ${data.total}`:""}</span></p>
        <h2 id="next-lesson-title">{next?.title??"เตรียมบทเรียนถัดไป"}</h2>
        <p className="hero-description">{next?.description??"เริ่มต้นเส้นทางเรียนภาษาเกาหลีของคุณ"}</p>
        <Link href={next?`/learn/${next.slug}`:"/learn/hangul-intro"} className="btn hero-action"><Play size={17} fill="currentColor"/> {next?.status==="completed"?"ทบทวนบทเรียน":"เรียนต่อ"}<ArrowRight size={17}/></Link>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><span className="hero-hangul">한글</span><span className="hero-note note-one">가</span><span className="hero-note note-two">나</span><span className="hero-note note-three">다</span><div className="hero-progress"><div><span>ความคืบหน้าหลักสูตร</span><b>{data?.percent??0}%</b></div><div className="progress-track"><span style={{width:`${data?.percent??0}%`}}/></div></div></div>
    </section>

    <DailyPlanner plan={plan} selectedDate={selectedDate} setSelectedDate={setSelectedDate} saving={planSaving} error={planError} onChange={savePlanChange} onRecordTime={addActualTime} actualMinutes={actualMinutes} setActualMinutes={setActualMinutes}/>

    <section className="learning-stats" aria-label="สถิติการเรียน">
      <Stat icon={<BookOpen/>} label="บทเรียนที่ผ่าน" value={data?`${data.completed} / ${data.total}`:"—"} detail="บทเรียนในหลักสูตร" tone="blue"/>
      <Stat icon={<Award/>} label="ความแม่นยำล่าสุด" value={recentAccuracy===null?"—":`${recentAccuracy}%`} detail={data?.recent.length?`จาก ${data.recent.length} แบบทดสอบล่าสุด`:"เริ่มทำแบบทดสอบเพื่อดูผล"} tone="amber"/>
      <Stat icon={<Target/>} label="เป้าหมายต่อวัน" value={data?.settings?.daily_minutes?`${data.settings.daily_minutes} นาที`:"ยังไม่ตั้งเป้า"} detail="ปรับเป้าหมายได้ในตั้งค่า" tone="teal"/>
      <Stat icon={<CheckCircle2/>} label="กิจกรรมบทเรียน" value={activities.length?`${completedActivities} / ${activities.length}`:"—"} detail={allActivitiesComplete?"ทำกิจกรรมบทเรียนครบแล้ว":"เช็กลิสต์บทเรียนถัดไป"} tone="indigo"/>
    </section>

    <div className="dashboard-workspace">
      <div className="dashboard-main-column">
        <section className="panel daily-panel" aria-labelledby="daily-title">
          <div className="section-heading"><div className="section-icon daily-icon"><CalendarDays size={19}/></div><div><p className="eyebrow">LESSON PROGRESS · PERSISTENT</p><h2 id="daily-title">กิจกรรมฝึกของบทเรียนถัดไป</h2></div><span className="completion-count">{completedActivities}/{activities.length||0}</span></div>
          <p className="section-intro">กิจกรรมที่บันทึกไว้ในบทเรียนถัดไป · ติ๊กเมื่อทำเสร็จ สถานะจะคงอยู่จนกว่าคุณจะเปลี่ยนเอง</p>
          {activities.length?<div className="daily-list">{activities.map((activity,index)=><label key={activity.id} className={`daily-item${activity.completed?" is-complete":""}`}><input type="checkbox" checked={Boolean(activity.completed)} disabled={saving===activity.id} onChange={event=>toggleActivity(activity,event.target.checked)}/><span className="custom-check" aria-hidden="true">{activity.completed?<Check size={15}/>:<span>{index+1}</span>}</span><span className="daily-item-text">{activity.title}</span>{saving===activity.id?<span className="item-meta">กำลังบันทึก</span>:activity.completed?<span className="item-meta done-meta">เสร็จแล้ว</span>:<Circle className="item-circle" size={17}/>}</label>)}</div>:<div className="empty-checklist"><p>{activitiesLoading?"กำลังโหลดกิจกรรมของบทเรียน…":"ยังไม่มีกิจกรรมในบทเรียนนี้"}</p>{!activitiesLoading&&data&&<Link href="/courses" className="text-link">เปิดหลักสูตร <ArrowRight size={15}/></Link>}</div>}
          {activities.length>0&&<div className="daily-footer"><span>กิจกรรมส่วนตัวของบทเรียนนี้</span><Link href={next?`/learn/${next.slug}`:"/courses"}>เปิดบทเรียน <ArrowRight size={15}/></Link></div>}
        </section>

        <section className="panel course-panel" aria-labelledby="path-title">
          <div className="section-heading"><div className="section-icon path-icon"><Target size={19}/></div><div><p className="eyebrow">YOUR LEARNING PATH</p><h2 id="path-title">เส้นทางการเรียน</h2></div><Link href="/courses" className="text-link">ทั้งหมด <ArrowRight size={15}/></Link></div>
          <div className="path-progress-summary"><span>{data?.completed??0} จาก {data?.total??"—"} บทเรียน</span><span>{data?.percent??0}%</span></div><div className="progress-track course-progress"><span style={{width:`${data?.percent??0}%`}}/></div>
          <div className="course-steps">{data?.lessons.map((lesson,index)=><div className={`course-step status-${lesson.status}`} key={lesson.id}><div className="step-marker">{lesson.status==="completed"?<Check size={14}/>:lesson.position}</div>{index<data.lessons.length-1&&<div className="step-connector"/>}<div className="step-content"><span className="step-label">บทที่ {lesson.position}</span>{lesson.status==="locked"?<span className="step-title locked-title">{lesson.title}</span>:<Link href={`/learn/${lesson.slug}`} className="step-title">{lesson.title}</Link>}<span className="step-status">{statusLabel(lesson.status)}</span></div></div>)}</div>
        </section>
      </div>

      <aside className="dashboard-side-column">
        <section className="panel schedule-panel" aria-labelledby="schedule-title"><div className="section-heading compact-heading"><div className="section-icon schedule-icon"><Clock3 size={18}/></div><div><p className="eyebrow">YOUR ROUTINE</p><h2 id="schedule-title">ตารางวันนี้</h2></div></div><div className="schedule-time"><span className="schedule-day">{data?.today??"กำลังโหลด…"}</span><b>{data?.settings?.daily_minutes??"—"}<small> นาที</small></b><p>เวลาเรียนที่คุณตั้งไว้</p></div><div className="timezone-note">เวลาอ้างอิง Asia/Bangkok</div></section>

        <section className="panel performance-panel" aria-labelledby="performance-title"><div className="section-heading compact-heading"><div className="section-icon performance-icon"><Award size={18}/></div><div><p className="eyebrow">KEEP IT UP</p><h2 id="performance-title">ผลการฝึกล่าสุด</h2></div></div>{data?.recent.length?<div className="performance-list">{data.recent.map((attempt,index)=><div className="performance-row" key={`${attempt.created_at}-${index}`}><div className="performance-score"><b>{attempt.score}</b><span>/{attempt.total}</span></div><div className="performance-detail"><strong>{attempt.title}</strong><span>{new Date(`${attempt.created_at.replace(" ","T")}Z`).toLocaleDateString("th-TH",{day:"numeric",month:"short",timeZone:"Asia/Bangkok"})}</span></div><span className={`result-pill ${attempt.passed?"passed":"retry"}`}>{attempt.passed?"ผ่าน":"ฝึกต่อ"}</span></div>)}</div>:<div className="empty-performance"><Award size={24}/><p>ทำแบบทดสอบท้ายบทเพื่อดูพัฒนาการของคุณที่นี่</p></div>}<Link href="/review" className="panel-link">ทบทวนคำตอบ <ArrowRight size={15}/></Link></section>

        <Link href="/learn/hangul-intro#tutor" className="tutor-shortcut"><span className="tutor-spark">✦</span><span><b>ถาม AI Tutor</b><small>{data?.aiReady?"ตั้งค่าผู้ให้บริการไว้แล้ว":"AI Tutor ยังไม่เปิดใช้งาน — จะตั้งค่าภายหลัง"}</small></span><ArrowRight size={17}/></Link>
      </aside>
    </div>
  </div>;
}

function DailyPlanner({plan,selectedDate,setSelectedDate,saving,error,onChange,onRecordTime,actualMinutes,setActualMinutes}:{plan?:DailyPlan;selectedDate:string;setSelectedDate:(date:string)=>void;saving:boolean;error:string;onChange:(payload:Record<string,unknown>)=>Promise<void>;onRecordTime:(event:React.FormEvent)=>void;actualMinutes:number;setActualMinutes:(minutes:number)=>void}){
  const sunday=plan?.date?new Date(`${plan.date}T00:00:00Z`).getUTCDay()===0:false;
  const finished=Boolean(plan&&((plan.requiredCount>0&&plan.completedCount===plan.requiredCount)||(plan.requiredCount===0&&plan.tasks.some(task=>task.completedAt))));
  const modeLocked=Boolean(plan?.tasks.some(task=>task.completedAt));
  return <section className="panel planner-panel" id="daily-plan" aria-labelledby="daily-plan-title">
    <div className="planner-header"><div><p className="eyebrow">YOUR DAILY PLAN · ASIA/BANGKOK</p><h2 id="daily-plan-title">แผนเรียนวันนี้</h2><p>{plan?.dateLabel??"กำลังเตรียมวันที่และแผนเรียน…"}</p></div><label className="planner-date">เลือกวันที่<input aria-label="เลือกวันที่สำหรับดูแผนเรียน" type="date" value={selectedDate} onChange={event=>setSelectedDate(event.target.value)}/></label></div>
    {error&&<p className="notice error-notice" role="alert">{error}</p>}
    {!plan?<div className="planner-loading" role="status">กำลังโหลดแผนประจำวัน…</div>:<>
      <div className="planner-recommendation"><div><span className="recommendation-label">{plan.lesson?"บทเรียนแนะนำ":"คำแนะนำการเรียน"}</span><h3>{plan.lesson?.title??"ทบทวนบทเรียนที่เรียนมา"}</h3><p>{plan.recommendation}</p></div><Link className="btn planner-resume" href={plan.recommendationHref}><Play size={16} fill="currentColor"/> {plan.lesson?"เรียนต่อ":"เริ่มทบทวน"}<ArrowRight size={16}/></Link></div>
      {sunday&&<p className="planner-rest-note">วันอาทิตย์เป็นวันพักตามค่าเริ่มต้น · กิจกรรมภาษาเกาหลีด้านล่างเลือกทำได้</p>}
      <div className="planner-controls"><div className="planner-mode" role="group" aria-label="เลือกรูปแบบการเรียน"><span>รูปแบบวันนี้</span><button type="button" aria-pressed={plan.mode==="standard"} disabled={saving||modeLocked} onClick={()=>onChange({action:"mode",mode:"standard"})}>มาตรฐาน · 90 นาที</button><button type="button" aria-pressed={plan.mode==="light"} disabled={saving||modeLocked} onClick={()=>onChange({action:"mode",mode:"light"})}>วันเหนื่อย · 15 นาที</button>{sunday&&<button type="button" aria-pressed={plan.mode==="rest"} disabled={saving||modeLocked} onClick={()=>onChange({action:"mode",mode:"rest"})}>พัก</button>}</div><div className="planner-duration"><strong>{plan.plannedMinutes} นาที</strong><span>เวลาตามแผน{plan.mode==="standard"?" รวมเวลาพัก":""}</span></div></div>
      <div className="planner-progress"><div><span>ทำสำเร็จ {plan.completedCount} จาก {plan.requiredCount} กิจกรรม</span><strong>{plan.completionPercent}%</strong></div><div className="progress-track"><span style={{width:`${plan.completionPercent}%`}}/></div></div>
      <ol className="planner-task-list">{plan.tasks.map(task=><li className={`planner-task${task.completedAt?" is-complete":""}${task.optional?" is-optional":""}`} key={task.id}><label><input type="checkbox" checked={Boolean(task.completedAt)} disabled={saving||finished} onChange={event=>onChange({action:"task",taskId:task.id,completed:event.target.checked})}/><span className="planner-task-copy"><strong>{task.title}</strong><small>{task.startsAt&&task.endsAt?`${task.startsAt}–${task.endsAt} · ${task.plannedMinutes} นาที`:task.optional?"ไม่บังคับ · วันพัก":""}</small></span></label><div className="planner-task-links"><Link href={task.href} aria-label={`เปิดกิจกรรม: ${task.title}`}>เปิดกิจกรรม <ArrowRight size={14}/></Link>{task.taskKey==="writing-checkpoint"&&plan.lesson&&<Link href={`/learn/${plan.lesson.slug}#checkpoint`}>เปิดแบบทดสอบ <ArrowRight size={14}/></Link>}</div></li>)}</ol>
      <div className="planner-records"><form onSubmit={onRecordTime}><label htmlFor="actual-study-minutes">บันทึกเวลาเรียนจริง</label><div><input id="actual-study-minutes" type="number" min={1} max={480} value={actualMinutes} onChange={event=>setActualMinutes(Number(event.target.value))}/><span>นาที</span><button className="btn btn-outline" type="submit" disabled={saving||!actualMinutes}>บันทึกเวลา</button></div></form><p>เวลาตามแผน {plan.plannedMinutes} นาที <span aria-hidden="true">·</span> บันทึกจริง {plan.actualMinutes} นาที</p></div>
      <div className="planner-previous"><Clock3 size={17}/><div><strong>สรุปวันเรียนก่อนหน้า</strong><span>{plan.previous?`${plan.previous.dateLabel} · ทำได้ ${plan.previous.completedCount}/${plan.previous.taskCount} กิจกรรม · เวลาเรียนจริง ${plan.previous.actualMinutes} นาที`:"ยังไม่มีแผนหรือข้อมูลเวลาที่บันทึกไว้ของวันก่อนหน้า"}</span></div></div>
      {finished&&<p className="planner-complete" role="status">ทำกิจกรรมตามแผนครบแล้ว · แผนวันนี้ถูกเก็บเป็นประวัติ</p>}
    </>}
  </section>;
}

function Stat({icon,label,value,detail,tone}:{icon:React.ReactNode;label:string;value:string;detail:string;tone:string}){return <article className={`stat-tile tone-${tone}`}><span className="stat-tile-icon">{icon}</span><span className="stat-tile-label">{label}</span><strong className="stat-tile-value">{value}</strong><span className="stat-tile-detail">{detail}</span></article>}
function statusLabel(status:LessonStatus){return status==="completed"?"เสร็จแล้ว":status==="in_progress"?"กำลังเรียน":status==="available"?"พร้อมเรียน":"ล็อกอยู่"}

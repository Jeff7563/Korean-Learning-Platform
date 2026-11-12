"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Award, BookOpen, CalendarDays, Check, CheckCircle2, Circle, Clock3, Play, Target } from "lucide-react";

type LessonStatus = "locked" | "available" | "in_progress" | "completed";
type CourseLesson = { id:number; slug:string; title:string; description:string; position:number; status:LessonStatus; passed:boolean };
type Activity = { id:number; slug:string; title:string; completed:number };
type Attempt = { title:string; score:number; total:number; passed:number; created_at:string };
type DashboardData = { next?:CourseLesson; lessons:CourseLesson[]; completed:number; total:number; percent:number; recent:Attempt[]; activity:{day:string;count:number}[]; today:string; settings:{daily_minutes:number}|null; aiReady:boolean };

export default function Dashboard() {
  const [data,setData]=useState<DashboardData>();
  const [activities,setActivities]=useState<Activity[]>([]);
  const [loadError,setLoadError]=useState("");
  const [saving,setSaving]=useState<number|null>(null);
  useEffect(()=>{
    let active=true;
    fetch("/api/dashboard").then(async response=>{if(!response.ok)throw new Error("โหลดข้อมูลการเรียนไม่สำเร็จ");return response.json() as Promise<DashboardData>}).then(async result=>{
      if(!active)return;setData(result);
      const target=result.next??result.lessons.at(-1);
      if(target){const response=await fetch(`/api/lessons/${target.slug}`);if(response.ok){const lesson=await response.json();if(active)setActivities(lesson.activities??[]);}}
    }).catch(error=>{if(active)setLoadError(error instanceof Error?error.message:"เกิดข้อผิดพลาด");});
    return()=>{active=false};
  },[]);

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

    <section className="learning-stats" aria-label="สถิติการเรียน">
      <Stat icon={<BookOpen/>} label="บทเรียนที่ผ่าน" value={data?`${data.completed} / ${data.total}`:"—"} detail="บทเรียนในหลักสูตร" tone="blue"/>
      <Stat icon={<Award/>} label="ความแม่นยำล่าสุด" value={recentAccuracy===null?"—":`${recentAccuracy}%`} detail={data?.recent.length?`จาก ${data.recent.length} แบบทดสอบล่าสุด`:"เริ่มทำแบบทดสอบเพื่อดูผล"} tone="amber"/>
      <Stat icon={<Target/>} label="เป้าหมายต่อวัน" value={data?.settings?.daily_minutes?`${data.settings.daily_minutes} นาที`:"ยังไม่ตั้งเป้า"} detail="ปรับเป้าหมายได้ในตั้งค่า" tone="teal"/>
      <Stat icon={<CheckCircle2/>} label="กิจกรรมบทเรียน" value={activities.length?`${completedActivities} / ${activities.length}`:"—"} detail={allActivitiesComplete?"ทำกิจกรรมบทเรียนครบแล้ว":"เช็กลิสต์บทเรียนถัดไป"} tone="indigo"/>
    </section>

    <div className="dashboard-workspace">
      <div className="dashboard-main-column">
        <section className="panel daily-panel" aria-labelledby="daily-title">
          <div className="section-heading"><div className="section-icon daily-icon"><CalendarDays size={19}/></div><div><p className="eyebrow">NEXT LESSON CHECKLIST</p><h2 id="daily-title">เช็กลิสต์บทเรียนถัดไป</h2></div><span className="completion-count">{completedActivities}/{activities.length||0}</span></div>
          <p className="section-intro">กิจกรรมที่บันทึกไว้ในบทเรียนถัดไป · ติ๊กเมื่อทำเสร็จ สถานะจะคงอยู่จนกว่าคุณจะเปลี่ยนเอง</p>
          {activities.length?<div className="daily-list">{activities.map((activity,index)=><label key={activity.id} className={`daily-item${activity.completed?" is-complete":""}`}><input type="checkbox" checked={Boolean(activity.completed)} disabled={saving===activity.id} onChange={event=>toggleActivity(activity,event.target.checked)}/><span className="custom-check" aria-hidden="true">{activity.completed?<Check size={15}/>:<span>{index+1}</span>}</span><span className="daily-item-text">{activity.title}</span>{saving===activity.id?<span className="item-meta">กำลังบันทึก</span>:activity.completed?<span className="item-meta done-meta">เสร็จแล้ว</span>:<Circle className="item-circle" size={17}/>}</label>)}</div>:<div className="empty-checklist"><p>{data?"ยังไม่มีกิจกรรมในบทเรียนนี้":"กำลังโหลดเช็กลิสต์…"}</p>{data&&<Link href="/courses" className="text-link">เปิดหลักสูตร <ArrowRight size={15}/></Link>}</div>}
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

function Stat({icon,label,value,detail,tone}:{icon:React.ReactNode;label:string;value:string;detail:string;tone:string}){return <article className={`stat-tile tone-${tone}`}><span className="stat-tile-icon">{icon}</span><span className="stat-tile-label">{label}</span><strong className="stat-tile-value">{value}</strong><span className="stat-tile-detail">{detail}</span></article>}
function statusLabel(status:LessonStatus){return status==="completed"?"เสร็จแล้ว":status==="in_progress"?"กำลังเรียน":status==="available"?"พร้อมเรียน":"ล็อกอยู่"}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Lock, PlayCircle } from "lucide-react";

type Lesson = { id: number; slug: string; title: string; description: string; position: number; status: "locked" | "available" | "in_progress" | "completed"; passed: boolean };
type ModuleProgress = { slug: string; title: string; position: number; lessons: Lesson[]; completed: number; total: number; percent: number };
type CourseData = { modules: ModuleProgress[]; completed: number; total: number; percent: number };

export default function Courses() {
  const [data, setData] = useState<CourseData>();
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/courses").then((response) => {
      if (!response.ok) throw new Error("courses request failed");
      return response.json();
    }).then(setData).catch(() => setError(true));
  }, []);

  return <div className="shell courses-page">
    <p className="muted">เส้นทางการเรียน</p>
    <h1>หลักสูตรภาษาเกาหลี</h1>
    <p className="muted">เรียนตามลำดับจากฮันกึลสู่ภาษาเกาหลีในชีวิตประจำวัน · ผ่านแบบทดสอบบทก่อนหน้าเพื่อปลดล็อกบทถัดไป</p>
    {data && <section className="card course-overview" aria-label="ความคืบหน้าหลักสูตร">
      <strong>{data.completed} จาก {data.total} บทเรียน</strong><span>{data.percent}%</span>
      <div className="progress-track"><span style={{ width: `${data.percent}%` }} /></div>
    </section>}
    {error && <p role="alert" className="notice error-notice">โหลดหลักสูตรไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p>}
    {!data && !error && <p role="status" className="card">กำลังโหลดหลักสูตร…</p>}
    {data?.modules.map((module) => <section id={`module-${module.slug}`} key={module.slug} className="card course-module" aria-labelledby={`module-${module.slug}`}>
      <div className="course-module-heading">
        <span className="badge">โมดูล {module.position}</span>
        <h2 id={`module-${module.slug}`}>{module.title}</h2>
        <span className="course-module-progress">{module.completed}/{module.total} บท · {module.percent}%</span>
      </div>
      <div className="progress-track module-progress"><span style={{ width: `${module.percent}%` }} /></div>
      <div className="grid course-lesson-grid">
        {module.lessons.map((lesson) => <Link key={lesson.id} href={lesson.status === "locked" ? "#" : `/learn/${lesson.slug}`} onClick={(event) => lesson.status === "locked" && event.preventDefault()} aria-disabled={lesson.status === "locked"} className={`card course-lesson-card status-${lesson.status}`}>
          <div className="course-lesson-meta"><span className="badge">บท {lesson.position}</span>{lesson.status === "locked" ? <Lock size={17} aria-label="ล็อกอยู่"/> : lesson.status === "completed" ? <CheckCircle2 size={18} aria-label="ผ่านแล้ว"/> : <PlayCircle size={18} aria-label="พร้อมเรียน"/>}</div>
          <h3>{lesson.title}</h3>
          <p className="muted">{lesson.description}</p>
          <span className="course-lesson-status">{lesson.status === "locked" ? "ล็อก · ผ่านบทก่อนหน้าเพื่อปลดล็อก" : lesson.status === "completed" ? "ผ่านแล้ว · เปิดทบทวนได้" : lesson.status === "in_progress" ? "กำลังเรียน" : "พร้อมเรียน"}</span>
        </Link>)}
      </div>
      {module.lessons.length === 0 && <p className="muted"><BookOpen size={14}/> โมดูลนี้ยังไม่มีบทเรียน</p>}
    </section>)}
  </div>;
}

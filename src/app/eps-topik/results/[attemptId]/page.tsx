"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { recommendationsForMissedSkills } from "@/lib/eps-skill-recommendations";

type Result = {
  title: string;
  scorePercent: number;
  elapsedSeconds: number;
  sectionScores: { reading: { correct: number; total: number }; listening: { correct: number; total: number } };
  missedSkills: string[];
  questions: Array<{ id: number; number: number; section: string; prompt: string; options: string[]; selectedIndex: number | null; correctIndex: number; correct: boolean; explanation: string }>;
};

export default function Results() {
  const params = useParams<{ attemptId: string }>();
  const [result, setResult] = useState<Result | null>(null);
  const [unlockedLessons, setUnlockedLessons] = useState<string[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([fetch(`/api/eps-topik/results/${params.attemptId}`), fetch("/api/courses")]).then(async ([response, coursesResponse]) => {
      if (!response.ok) throw new Error("ยังเปิดผลการฝึกไม่ได้");
      const data = await response.json() as Result;
      const course = coursesResponse.ok ? await coursesResponse.json() as { lessons?: Array<{ slug: string; status: string }> } : { lessons: [] };
      return { data, unlocked: course.lessons?.filter((lesson) => lesson.status !== "locked").map((lesson) => lesson.slug) ?? [] };
    }).then(({ data, unlocked }) => { if (active) { setResult(data); setUnlockedLessons(unlocked); } }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "โหลดผลการฝึกไม่สำเร็จ");
    });
    return () => { active = false; };
  }, [params.attemptId]);

  if (error) return <main className="shell eps-shell"><p role="alert">{error}</p><Link className="btn secondary" href="/eps-topik/exams">กลับไปหน้าฝึก</Link></main>;
  if (!result) return <main className="shell eps-shell"><p role="status">กำลังสรุปผล…</p></main>;
  const guidance = recommendationsForMissedSkills(result.missedSkills);

  return <main className="shell eps-shell">
    <p className="eps-kicker">ผลวินิจฉัย · ไม่ใช่ผลสอบผ่าน</p>
    <h1>{result.title}</h1>
    <section className="eps-result-hero">
      <strong>{result.scorePercent}<small>/100</small></strong>
      <div><h2>คะแนนฝึกเพื่อดูจุดที่ควรทบทวน</h2>
        <p>อ่าน {result.sectionScores.reading.correct}/{result.sectionScores.reading.total} · ฟัง {result.sectionScores.listening.correct}/{result.sectionScores.listening.total} · ใช้เวลา {Math.floor(result.elapsedSeconds / 60)} นาที</p>
        <p>หัวข้อที่พลาด: {result.missedSkills.join(" · ") || "ทำได้ดีทุกหัวข้อ"}</p>
      </div>
    </section>
    {guidance.recommendations.length > 0 && <section className="panel eps-recommendations" aria-labelledby="eps-recommendations-title">
      <p className="eps-kicker">ขั้นตอนถัดไปที่แนะนำ</p><h2 id="eps-recommendations-title">กลับไปทบทวนทักษะที่ยังพลาด</h2>
      <ul>{guidance.recommendations.map((item) => <li key={item.lessonSlug}><span>{item.skill}: {item.title}</span>{unlockedLessons.includes(item.lessonSlug) ? <Link className="btn secondary" href={`/learn/${item.lessonSlug}`}>เปิดบทเรียนที่แนะนำ</Link> : <Link className="btn secondary" href="/courses#module-eps-topik-preparation">บทนี้เปิดหลังผ่าน 40 บทแรก · ดูสถานะ</Link>}</li>)}</ul>
      {guidance.unmapped.length > 0 && <p>ยังไม่มีบทเรียนจับคู่สำหรับ: {guidance.unmapped.join(" · ")} กรุณาเลือกหัวข้อจากหน้า Guided practice เอง</p>}
    </section>}
    {result.missedSkills.length === 0 && <p className="panel">ไม่มีหัวข้อที่ระบบทำเครื่องหมายว่าพลาด ลองทบทวนบทเรียนที่เกี่ยวข้องหรือฝึกอีกชุดเพื่อดูความสม่ำเสมอ</p>}
    <div className="eps-actions"><Link className="btn primary" href="/eps-topik/practice">ฝึกอีกครั้ง</Link><Link className="btn secondary" href="/eps-topik/exams">กลับไปชุดข้อสอบ</Link><Link className="btn secondary" href="/courses">ดูหลักสูตร</Link></div>
    <h2 className="eps-review-title">เฉลยและคำอธิบาย</h2>
    <div className="eps-results-list">{result.questions.map((question) => <article className="panel eps-result-card" key={question.id}>
      <span className={`eps-tag ${question.correct ? "good" : "bad"}`}>ข้อ {question.number} · {question.correct ? "ตอบถูก" : "ทบทวนข้อนี้"}</span>
      <h3>{question.prompt}</h3><p>คำตอบที่ถูก: <strong>{question.options[question.correctIndex]}</strong></p>
      {question.selectedIndex !== null && <p>คุณเลือก: {question.options[question.selectedIndex]}</p>}<p>{question.explanation}</p>
    </article>)}</div>
  </main>;
}

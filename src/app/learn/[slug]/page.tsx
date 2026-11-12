"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, ChevronUp, LoaderCircle, LockKeyhole, MessageCircle, Send, Sparkles } from "lucide-react";
import { listeningItemsByLesson } from "@/content/media-catalog";
import { everydayListeningItems } from "@/content/everyday-listening";
import type { LessonMediaResource } from "@/content/media-catalog";
import { LessonMedia } from "@/components/lesson-media";
import { ListeningPractice } from "@/components/listening-practice";

type Lesson = { slug: string; title: string; description: string; position: number; objectives: string[]; explanation: string; examples: string[]; vocabulary: { korean: string; thai: string }[]; module: { slug: string; title: string; position: number }; videoResources: LessonMediaResource[] };
type Exercise = { id: number; prompt: string; options: string[] };
type Activity = { id: number; title: string; completed: number };
type Attempt = { score: number; total: number; passed: number; created_at: string };
type CourseLesson = { slug: string; title: string; position: number; moduleTitle: string; modulePosition: number; status: "locked" | "available" | "in_progress" | "completed" };
type PageData = { lesson: Lesson; exercises: Exercise[]; activities: Activity[]; attempts: Attempt[] };
type Outcome = { score: number; total: number; passed: boolean; recommendation: string; feedback: Array<{ exerciseId: number; correct: boolean; explanation: string }> };

export default function Learn() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PageData>();
  const [course, setCourse] = useState<CourseLesson[]>([]);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [outcome, setOutcome] = useState<Outcome>();
  const [savingActivity, setSavingActivity] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [showExamples, setShowExamples] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([fetch(`/api/lessons/${slug}`), fetch("/api/courses"), fetch("/api/settings")])
      .then(async ([lessonResponse, courseResponse, settingsResponse]) => {
        if (!lessonResponse.ok) throw new Error("ไม่สามารถเปิดบทเรียนนี้ได้ หรือบทเรียนยังล็อกอยู่");
        const lessonData = await lessonResponse.json();
        const courseData = courseResponse.ok ? await courseResponse.json() : { lessons: [] };
        const settingsData = settingsResponse.ok ? await settingsResponse.json() : {};
        if (active) {
          setData(lessonData);
          setCourse(courseData.lessons ?? []);
          setAiConfigured(Boolean(settingsData.aiReady));
          setAnswers({});
          setOutcome(undefined);
          setError("");
        }
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "โหลดบทเรียนไม่สำเร็จ"); });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!data) return;
    const scrollToLessonSection = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id) document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "auto" });
    };
    const frame = window.requestAnimationFrame(scrollToLessonSection);
    window.addEventListener("hashchange", scrollToLessonSection);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", scrollToLessonSection);
    };
  }, [data, slug]);

  async function markActivity(activityId: number, completed: boolean) {
    setSavingActivity(activityId);
    try {
      const response = await fetch("/api/activities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activityId, completed }) });
      if (!response.ok) throw new Error("บันทึกกิจกรรมไม่สำเร็จ");
      setData((current) => current && ({ ...current, activities: current.activities.map((activity) => activity.id === activityId ? { ...activity, completed: Number(completed) } : activity) }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "บันทึกกิจกรรมไม่สำเร็จ");
    } finally {
      setSavingActivity(null);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/checkpoints", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, answers: Object.entries(answers).map(([exerciseId, selectedIndex]) => ({ exerciseId: Number(exerciseId), selectedIndex })) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "ส่งคำตอบไม่สำเร็จ");
      setOutcome(result);
      const refresh = await fetch(`/api/lessons/${slug}`);
      if (refresh.ok) setData(await refresh.json());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ส่งคำตอบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  async function askTutor(event: React.FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setReply("");
    setError("");
    try {
      const response = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, message: question }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Tutor ยังไม่พร้อมตอบ");
      setReply(result.reply);
      setQuestion("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ติดต่อ AI Tutor ไม่สำเร็จ");
    } finally {
      setAsking(false);
    }
  }

  if (!data) return <div className="shell player-loading">{error ? <section className="panel player-error" role="alert"><h1>เปิดบทเรียนไม่ได้</h1><p>{error}</p><Link href="/courses" className="btn">กลับไปยังหลักสูตร</Link></section> : <p role="status"><LoaderCircle className="spin" /> กำลังเตรียมบทเรียน…</p>}</div>;

  const { lesson } = data;
  const currentIndex = course.findIndex((item) => item.slug === slug);
  const previous = currentIndex > 0 ? course[currentIndex - 1] : undefined;
  const next = currentIndex >= 0 ? course[currentIndex + 1] : undefined;
  const completeCount = data.activities.filter((activity) => activity.completed).length;
  const listeningItems = listeningItemsByLesson[slug] ?? everydayListeningItems[slug] ?? lesson.vocabulary;

  return <div className="shell lesson-player">
    <header className="player-header">
      <Link href="/courses" className="back-to-course"><ArrowLeft size={17} /> กลับหลักสูตร</Link>
      <div className="player-title"><span className="player-phase">{lesson.module.title} · โมดูล {lesson.module.position} · บทที่ {lesson.position}</span><h1>{lesson.title}</h1><p>{lesson.description}</p></div>
      <nav className="lesson-nav" aria-label="นำทางบทเรียน">
        <Link href={previous ? `/learn/${previous.slug}` : "/courses"} aria-label={previous ? `บทก่อนหน้า: ${previous.title}` : "กลับหลักสูตร"} className="lesson-nav-button"><ArrowLeft size={17} /><span>ก่อนหน้า</span></Link>
        {next?.status !== "locked" && next ? <Link href={`/learn/${next.slug}`} className="lesson-nav-button">ถัดไป <ArrowRight size={17} /></Link> : <span className="lesson-nav-button nav-disabled" aria-disabled="true"><LockKeyhole size={15} /> ถัดไป</span>}
      </nav>
    </header>

    <div className="player-layout">
      <main className="player-main">
        <section className="panel objective-panel" aria-labelledby="objectives-title">
          <p className="eyebrow">LESSON GOALS</p><h2 id="objectives-title">เริ่มจากเป้าหมายของบทนี้</h2>
          <ul>{lesson.objectives.map((objective) => <li key={objective}><CheckCircle2 size={17} /><span>{objective}</span></li>)}</ul>
        </section>

        <LessonMedia resources={lesson.videoResources ?? []} />

        <ListeningPractice items={listeningItems} officialAudioResource={slug === "hangul-review" ? { url: "https://epstopik.hrdkorea.or.kr/epstopik/book/std/standardBookList.do?lang=en", title: "สื่อฝึกฟัง EPS-TOPIK จาก HRD Korea", description: "แหล่งเสริมสำหรับเป้าหมายสอบในระยะถัดไป · เปิดไฟล์ที่เว็บไซต์ต้นทาง" } : undefined} />

        <section className="lesson-content panel"><div className="lesson-content-heading"><div><p className="eyebrow">LESSON NOTES</p><h2>ทำความเข้าใจบทเรียน</h2></div><span className="content-language">한국어 · ไทย</span></div><p className="lesson-explanation">{lesson.explanation}</p><button className="examples-toggle" type="button" aria-expanded={showExamples} onClick={() => setShowExamples((value) => !value)}>ตัวอย่างประกอบ {showExamples ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button>{showExamples && <div className="lesson-examples">{lesson.examples.map((example, index) => <div className="example-line" key={`${index}-${example}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{example}</p></div>)}</div>}</section>

        <section className="panel activity-panel lesson-activity-panel" id="lesson-activities"><div className="rail-title"><div><p className="eyebrow">LEARNING ACTIVITIES</p><h2>ฝึกทีละขั้น</h2></div><span className="completion-count">{completeCount}/{data.activities.length}</span></div><p className="section-intro">กิจกรรมฝึกอ่าน เขียน และทบทวน · ทำเครื่องหมายเมื่อฝึกเสร็จ สถานะจะถูกบันทึกไว้</p>{data.activities.map((activity, index) => <label className={`player-activity${activity.completed ? " activity-done" : ""}`} key={activity.id}><input type="checkbox" checked={Boolean(activity.completed)} disabled={savingActivity === activity.id} onChange={(event) => markActivity(activity.id, event.target.checked)} /><span className="activity-checkbox" aria-hidden="true">{activity.completed ? <Check size={14} /> : index + 1}</span><span>{activity.title}</span></label>)}</section>

        {lesson.vocabulary.length > 0 && <section className="panel vocabulary-panel" id="vocabulary"><p className="eyebrow">WORD BANK</p><h2>คำศัพท์สำคัญ</h2>{lesson.vocabulary.map((word) => <div className="vocabulary-entry" key={word.korean}><strong lang="ko">{word.korean}</strong><span>{word.thai}</span></div>)}</section>}

        <section className="checkpoint-panel panel" id="checkpoint"><div className="checkpoint-heading"><div className="section-icon checkpoint-icon"><CheckCircle2 size={20} /></div><div><p className="eyebrow">KNOWLEDGE CHECK</p><h2>แบบทดสอบท้ายบท</h2><p>ตอบให้ครบทุกข้อ · ผ่านเมื่อได้คะแนนอย่างน้อย 80%</p></div><span className="question-count">{Object.keys(answers).length}/{data.exercises.length}</span></div><div className="checkpoint-questions">{data.exercises.map((exercise, index) => <fieldset className="question-card" key={exercise.id}><legend><span className="question-number">{String(index + 1).padStart(2, "0")}</span>{exercise.prompt}</legend><div className="answer-options">{exercise.options.map((option, optionIndex) => <label className={`answer-option${answers[exercise.id] === optionIndex ? " selected" : ""}`} key={`${exercise.id}-${optionIndex}`}><input type="radio" name={`q${exercise.id}`} checked={answers[exercise.id] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [exercise.id]: optionIndex }))} /><span className="answer-radio" /><span>{option}</span></label>)}</div></fieldset>)}</div><button className="btn checkpoint-submit" disabled={submitting || Object.keys(answers).length !== data.exercises.length} onClick={submit}>{submitting ? <><LoaderCircle size={18} className="spin" /> กำลังตรวจคำตอบ</> : <>ส่งคำตอบ <ArrowRight size={17} /></>}</button>{outcome && <div className={`checkpoint-result ${outcome.passed ? "result-pass" : "result-retry"}`} role="status"><strong>{outcome.passed ? "ผ่านแล้ว" : "ลองทบทวนอีกครั้ง"} · {outcome.score}/{outcome.total}</strong><p>{outcome.recommendation}</p>{outcome.feedback.map((item, index) => <p className="feedback-line" key={item.exerciseId}><b>{index + 1}. {item.correct ? "ถูกต้อง" : "ทบทวน"}</b> — {item.explanation}</p>)}<button type="button" className="btn btn-outline" onClick={() => { setAnswers({}); setOutcome(undefined); }}>ลองทำแบบทดสอบอีกครั้ง</button></div>}</section>
      </main>

      <aside className="player-rail">
        <section className="tutor-panel" id="tutor"><div className="tutor-heading"><span><Sparkles size={18} /></span><div><p className="eyebrow">YOUR AI STUDY PARTNER</p><h2>ถาม Tutor เกี่ยวกับบทนี้</h2></div></div><p className="tutor-context">Tutor จะตอบโดยอ้างอิงเนื้อหาและเป้าหมายของ “{lesson.title}”</p>{aiConfigured ? <><p className="tutor-context">การตั้งค่ามีอยู่แล้ว แต่ยังไม่ได้ตรวจการเชื่อมต่อจนกว่าจะส่งคำถาม</p><form onSubmit={askTutor}><label className="sr-only" htmlFor="tutor-question">พิมพ์คำถามเกี่ยวกับบทเรียน</label><textarea id="tutor-question" className="input tutor-input" rows={3} maxLength={1200} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="เช่น ช่วยอธิบายเสียงพยัญชนะนี้เพิ่มเติม…" /><button className="btn tutor-send" disabled={asking || !question.trim()}>{asking ? <LoaderCircle size={16} className="spin" /> : <Send size={16} />} ถาม Tutor</button></form>{reply && <div className="tutor-reply" role="status"><MessageCircle size={17} /><p>{reply}</p></div>}{error && <p className="error-text" role="alert">{error}</p>}</> : <p className="tutor-unavailable" role="status">AI Tutor ยังไม่เปิดใช้งาน — จะตั้งค่าภายหลัง บทเรียน วิดีโอ และแบบฝึกทั้งหมดใช้ได้ตามปกติ</p>}</section>
        {data.attempts.length > 0 && <section className="panel attempts-panel"><p className="eyebrow">YOUR HISTORY</p><h2>ประวัติแบบทดสอบ</h2>{data.attempts.map((attempt, index) => <div className="attempt-row" key={`${attempt.created_at}-${index}`}><span>{attempt.score}/{attempt.total}</span><span className={`result-pill ${attempt.passed ? "passed" : "retry"}`}>{attempt.passed ? "ผ่าน" : "ฝึกต่อ"}</span></div>)}</section>}
      </aside>
    </div>
  </div>;
}

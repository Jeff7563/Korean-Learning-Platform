"use client";

import { useState } from "react";
import { BookOpenCheck, CheckCircle2, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import type { TeacherTip as TeacherTipContent } from "@/content/teacher-tips";

export function TeacherTip({ tip }: { tip: TeacherTipContent }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const correct = tip.questions.filter((question, index) => answers[index] === question.answer).length;

  return <section className="teacher-tip panel" id="teacher-tip" aria-labelledby="teacher-tip-title">
    <div className="teacher-tip-heading">
      <div><p className="eyebrow">OPTIONAL MINI LESSON</p><h2 id="teacher-tip-title">{tip.title}</h2><p>{tip.objective}</p></div>
      <button className="teacher-tip-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <BookOpenCheck size={17} /> {open ? "ปิด Mini Lesson" : "เปิด Mini Lesson"} {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </div>
    {open && <div className="teacher-tip-body">
      <p className="teacher-tip-explanation">{tip.explanation}</p>
      <div className="teacher-tip-examples" aria-label="ตัวอย่างประโยค">
        {tip.examples.map((example) => <article key={example.korean}><strong lang="ko">{example.korean}</strong><span>{example.thai}</span>{example.note && <small>{example.note}</small>}</article>)}
      </div>
      <aside className="teacher-tip-memory"><strong>เทคนิคจำ</strong><p>{tip.memoryTip}</p></aside>
      <div className="teacher-tip-practice">
        <div className="teacher-tip-practice-heading"><h3>ลองฝึกสั้น ๆ</h3><span>{Object.keys(answers).length}/{tip.questions.length} ข้อ</span></div>
        {tip.questions.map((question, index) => <fieldset className="teacher-tip-question" key={`${tip.slug}-${index}`}>
          <legend><span>{index + 1}.</span> {question.prompt}</legend>
          <div>{question.options.map((option, optionIndex) => <label className={`teacher-tip-option${answers[index] === optionIndex ? " selected" : ""}`} key={option}>
            <input type="radio" name={`tip-${tip.slug}-${index}`} checked={answers[index] === optionIndex} disabled={submitted} onChange={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))} />
            <span>{option}</span>
          </label>)}</div>
          {submitted && <p className={`teacher-tip-feedback${answers[index] === question.answer ? " correct" : " incorrect"}`} role="status">{answers[index] === question.answer ? "ถูกต้อง" : `คำตอบ: ${question.options[question.answer]}`} — {question.explanation}</p>}
        </fieldset>)}
        {!submitted ? <button className="btn teacher-tip-submit" type="button" disabled={Object.keys(answers).length !== tip.questions.length} onClick={() => setSubmitted(true)}>ตรวจคำตอบ</button> : <div className="teacher-tip-result" role="status"><CheckCircle2 size={18} /><span>ได้ {correct}/{tip.questions.length} ข้อ · Mini Lesson นี้เป็นแบบฝึกเสริม ไม่เปลี่ยนความคืบหน้าบทเรียนหรือ checkpoint</span><button type="button" onClick={() => { setAnswers({}); setSubmitted(false); }}> <RotateCcw size={15} /> ลองอีกครั้ง</button></div>}
      </div>
    </div>}
  </section>;
}

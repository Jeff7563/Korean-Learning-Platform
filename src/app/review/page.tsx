"use client";

import Link from "next/link";
import { Volume2, ChevronLeft, ChevronRight, RotateCcw, BookOpenCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Rating = "again" | "hard" | "good";
type Card = { id: number; korean: string; thai: string; title: string; moduleTitle: string; dueDate: string | null; intervalDays: number | null; reviewCount: number; lapseCount: number; lastReviewedDate: string | null; lastRating: Rating | null; isNew: boolean; isDue: boolean };
type ReviewData = { today: string; cards: Card[]; dueCount: number; newCount: number; reviewedToday: number; nextReviewDate: string | null; history: Array<{ id: number; korean: string; thai: string; title: string; moduleTitle: string; rating: Rating; reviewedDate: string; nextIntervalDays: number }>; mistakes: Array<{ slug: string; title: string; moduleTitle: string; prompt: string; explanation: string }> };
type View = "due" | "new" | "all" | "history";

const ratingText: Record<Rating, string> = { again: "จำไม่ได้", hard: "ยังไม่แม่น", good: "จำได้" };
const viewText: Record<View, string> = { due: "ถึงเวลาทบทวน", new: "คำศัพท์ใหม่", all: "ทบทวนทั้งหมด", history: "ประวัติการทบทวน" };

export default function Review() {
  const [data, setData] = useState<ReviewData>();
  const [view, setView] = useState<View>("due");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/review", { cache: "no-store" });
      if (!response.ok) throw new Error("โหลดคำศัพท์ไม่สำเร็จ ลองใหม่อีกครั้ง");
      setData(await response.json()); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "เกิดข้อผิดพลาด"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const cards = useMemo(() => {
    if (!data) return [];
    if (view === "due") return data.cards.filter((card) => card.isDue);
    if (view === "new") return data.cards.filter((card) => card.isNew);
    return data.cards;
  }, [data, view]);
  const activeCard = cards[index];

  function changeView(next: View) { setView(next); setIndex(0); setRevealed(false); setSavedMessage(""); }
  function speak() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeCard?.korean ?? "");
    utterance.lang = "ko-KR"; window.speechSynthesis.speak(utterance);
  }

  async function rate(rating: Rating) {
    if (!activeCard || !revealed || saving) return;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vocabularyId: activeCard.id, rating, idempotencyKey: crypto.randomUUID() }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "บันทึกผลทบทวนไม่สำเร็จ");
      setSavedMessage(`บันทึกแล้ว: ${ratingText[rating]}`);
      const nextIndex = view === "all" ? index + 1 : index;
      const responseData = await fetch("/api/review", { cache: "no-store" });
      if (!responseData.ok) throw new Error("บันทึกแล้ว แต่โหลดบัตรถัดไปไม่สำเร็จ");
      const refreshed = await responseData.json() as ReviewData;
      setData(refreshed);
      const remaining = view === "due" ? refreshed.cards.filter((card) => card.isDue) : view === "new" ? refreshed.cards.filter((card) => card.isNew) : refreshed.cards;
      setIndex(Math.min(nextIndex, Math.max(remaining.length - 1, 0)));
      setRevealed(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "เกิดข้อผิดพลาด"); }
    finally { setSaving(false); }
  }

  return <main className="shell review-page">
    <header className="review-heading"><div><p className="eyebrow">VOCABULARY PRACTICE</p><h1>ทบทวนคำศัพท์</h1><p className="review-intro">นึกความหมายก่อนเปิดคำแปล แล้วให้คะแนนความจำของตัวเอง</p></div><Link href="/courses" className="review-back-link">กลับไปหลักสูตร</Link></header>
    {error && <p className="review-error" role="alert">{error}<button type="button" onClick={() => void load()}>ลองอีกครั้ง</button></p>}
    <section className="review-stats" aria-label="สรุปการทบทวน">
      <div><strong>{data?.dueCount ?? "—"}</strong><span>ถึงเวลาทบทวน</span></div>
      <div><strong>{data?.reviewedToday ?? "—"}</strong><span>ทบทวนวันนี้</span></div>
      <div><strong>{view === "history" ? "—" : Math.max(cards.length - index, 0)}</strong><span>เหลือในคิวนี้</span></div>
      <div><strong>{data?.cards.filter((card) => card.isNew).length ?? "—"}</strong><span>คำใหม่ที่เรียนแล้ว</span></div>
      <div><strong>{data?.nextReviewDate ?? "—"}</strong><span>กำหนดถัดไป</span></div>
    </section>
    <nav className="review-tabs" aria-label="มุมมองคำศัพท์">{(["due", "new", "all", "history"] as View[]).map((key) => <button key={key} type="button" aria-pressed={view === key} onClick={() => changeView(key)}>{viewText[key]}{key === "due" && data ? ` (${data.dueCount})` : key === "new" && data ? ` (${data.newCount})` : ""}</button>)}</nav>

    {loading ? <section className="review-state" role="status">กำลังโหลดคำศัพท์…</section> : view === "history" ? <section className="review-panel"><h2>ประวัติการทบทวน</h2>{data?.history.length ? <ol className="review-history">{data.history.map((item) => <li key={item.id}><div><strong>{item.korean}</strong><span>{item.thai} · {item.title} · {item.moduleTitle}</span></div><span className={`review-rating-pill ${item.rating}`}>{ratingText[item.rating]}</span><time dateTime={item.reviewedDate}>{item.reviewedDate} · {item.nextIntervalDays} วัน</time></li>)}</ol> : <div className="review-state">ยังไม่มีประวัติ เมื่อให้คะแนนคำแรก ระบบจะบันทึกไว้ที่นี่</div>}</section> : activeCard ? <section className="review-panel" aria-label="บัตรคำศัพท์">
      <div className="review-card-top"><span>{view === "due" ? `คิวทบทวน ${index + 1} / ${cards.length}` : `คำที่ ${index + 1} / ${cards.length}`}</span><span>{activeCard.isDue ? "ถึงกำหนดแล้ว" : activeCard.isNew ? "คำใหม่" : `ทบทวนแล้ว ${activeCard.reviewCount} ครั้ง`}</span></div>
      <article className="vocab-card" aria-live="polite"><p className="vocab-card-label">คำศัพท์ภาษาเกาหลี</p><p className="vocab-korean" lang="ko">{activeCard.korean}</p><p className="vocab-source">{activeCard.title} · {activeCard.moduleTitle}</p>{revealed ? <div className="vocab-answer"><p>{activeCard.thai}</p></div> : <p className="vocab-hidden">ลองนึกความหมายด้วยตัวเองก่อน</p>}
        <div className="vocab-card-actions">{"speechSynthesis" in (typeof window === "undefined" ? {} : window) && <button type="button" className="review-audio" onClick={speak} aria-label="ฟังเสียงภาษาเกาหลี"><Volume2 size={18}/> ฟังเสียง</button>}{!revealed && <button type="button" className="btn review-reveal" onClick={() => setRevealed(true)}>เปิดคำแปล</button>}</div>
      </article>
      {revealed && <div className="review-feedback"><p>นึกได้แค่ไหน? การเปิดคำแปลอย่างเดียวจะยังไม่บันทึกผล</p><div><button type="button" className="rating-button again" disabled={saving} onClick={() => void rate("again")}>จำไม่ได้ <small>ทบทวนพรุ่งนี้</small></button><button type="button" className="rating-button hard" disabled={saving} onClick={() => void rate("hard")}>ยังไม่แม่น <small>เพิ่มช่วงสั้น ๆ</small></button><button type="button" className="rating-button good" disabled={saving} onClick={() => void rate("good")}>จำได้ <small>เพิ่มช่วงทบทวน</small></button></div>{savedMessage && <p role="status" className="review-saved">{savedMessage}</p>}</div>}
      {!revealed && <div className="review-card-nav"><button type="button" disabled={index === 0} onClick={() => {setIndex((value) => value - 1);setRevealed(false)}}><ChevronLeft size={18}/> ก่อนหน้า</button><button type="button" disabled={index >= cards.length - 1} onClick={() => {setIndex((value) => value + 1);setRevealed(false)}}>ข้ามโดยไม่ให้คะแนน <ChevronRight size={18}/></button></div>}
    </section> : <section className="review-panel review-state"><BookOpenCheck size={32}/><h2>{view === "due" ? "ทบทวนครบแล้ว" : "ยังไม่มีคำศัพท์ในรายการนี้"}</h2><p>{view === "due" ? data?.nextReviewDate ? `คำถัดไปจะถึงกำหนดวันที่ ${data.nextReviewDate}` : "เมื่อเรียนและปลดล็อกบทเรียน คำศัพท์จะปรากฏที่นี่" : "คำศัพท์จะแสดงเมื่อคุณเข้าถึงหรือเริ่มเรียนบทนั้นแล้ว"}</p>{view === "due" && <button className="btn secondary" type="button" onClick={() => changeView("new")}>ดูคำศัพท์ใหม่</button>}</section>}

    <section className="review-mistakes"><h2>คำตอบแบบทดสอบที่ควรทบทวน</h2>{data?.mistakes.length ? data.mistakes.map((item, i) => <article key={`${item.slug}-${i}`}><div><small>{item.moduleTitle}</small><h3><Link href={`/learn/${item.slug}`}>{item.title}</Link></h3><p>{item.prompt}</p><p className="review-explanation">{item.explanation}</p></div><Link href={`/learn/${item.slug}#checkpoint`}>เปิดบทเรียน</Link></article>) : <p>ยังไม่มีข้อที่ตอบผิด ลองทำแบบทดสอบท้ายบทเพื่อเริ่มเก็บผลการฝึก</p>}</section>
    <p className="review-algorithm-note"><RotateCcw size={15}/> ตารางนี้เป็นกติกาทบทวนที่เข้าใจง่าย ไม่ใช่การทำนายความจำที่แม่นยำทางวิทยาศาสตร์</p>
  </main>;
}

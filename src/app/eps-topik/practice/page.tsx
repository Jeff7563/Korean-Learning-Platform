"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AttemptPlayer } from "@/components/eps-topik/attempt-player";

const modes = [["reading", "การอ่าน"], ["listening", "การฟัง"], ["vocabulary-grammar", "คำศัพท์และไวยากรณ์"], ["everyday", "ชีวิตประจำวัน"], ["workplace-safety", "ที่ทำงานและความปลอดภัย"], ["incorrect", "ข้อที่เคยตอบผิด"]] as const;
type Mode = (typeof modes)[number][0];

export default function Practice() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState<Mode>("reading");
  const [count, setCount] = useState<5 | 10 | 20>(5);
  const [error, setError] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAttempt(Number(params.get("attemptId")) || 0);
    const requested = params.get("mode");
    if (modes.some(([value]) => value === requested)) setMode(requested as Mode);
  }, []);
  async function start() {
    const response = await fetch("/api/eps-topik/attempts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "practice", mode, count }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error); return; }
    router.push(`/eps-topik/practice?attemptId=${data.id}`);
  }
  if (attempt) return <AttemptPlayer attemptId={attempt} />;
  return <main className="shell eps-shell">
    <p className="eps-kicker">ฝึกเฉพาะจุด · Guided practice</p>
    <h1>เลือกหัวข้อฝึก</h1>
    <p className="eps-lead">โหมดฝึกสำหรับผู้เริ่มต้นคงคำแนะนำภาษาไทยไว้ ส่วนข้อสอบจำลองใช้โจทย์และตัวเลือกภาษาเกาหลี เพื่อให้แยกการเรียนแบบมีตัวช่วยกับการฝึกสอบได้ชัดเจน</p>
    <div className="panel eps-question">
      <fieldset><legend>หัวข้อ</legend><div className="eps-mode-list">{modes.map(([value, label]) => <label key={value}><input type="radio" name="mode" checked={mode === value} onChange={() => setMode(value)} />{label}</label>)}</div></fieldset>
      <fieldset><legend>จำนวนข้อ</legend><div className="eps-mode-list">{([5, 10, 20] as const).map((number) => <label key={number}><input type="radio" name="count" checked={count === number} onChange={() => setCount(number)} />{number} ข้อ</label>)}</div></fieldset>
      <button className="btn primary" onClick={() => void start()}>เริ่มฝึก</button>{error && <p role="alert">{error}</p>}
    </div>
  </main>;
}

"use client";
import { useEffect, useState } from "react";
type Settings = { learning_goal: string; daily_minutes: number; preferred_language: string };
export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ learning_goal: "", daily_minutes: 90, preferred_language: "th" });
  const [aiReady, setAiReady] = useState(false); const [progress, setProgress] = useState({ completed: 0, total: 10, percent: 0 }); const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/settings").then(r => r.json()).then(d => { if (d.settings) setSettings(d.settings); setAiReady(Boolean(d.aiReady)); if (d.progress) setProgress(d.progress); }); }, []);
  async function save(e: React.FormEvent) { e.preventDefault(); const r = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) }); setMessage(r.ok ? "บันทึกการตั้งค่าแล้ว" : "บันทึกไม่สำเร็จ ตรวจสอบข้อมูลอีกครั้ง"); }
  return <div className="shell"><p className="muted">ปรับเป้าหมายการเรียน</p><h1>ตั้งค่า</h1>
    <form className="card" onSubmit={save} style={{ maxWidth: 650, marginTop: 20 }}>
      <label>เป้าหมายการเรียน<input className="input" style={{ marginTop: 7, marginBottom: 18 }} value={settings.learning_goal} onChange={e => setSettings({ ...settings, learning_goal: e.target.value })}/></label>
      <label>เวลาเรียนต่อวัน (นาที)<input className="input" type="number" min={15} max={360} value={settings.daily_minutes} onChange={e => setSettings({ ...settings, daily_minutes: Number(e.target.value) })} style={{ marginTop: 7, marginBottom: 18 }}/></label>
      <label>ภาษาที่ต้องการ<select className="input" value={settings.preferred_language} onChange={e => setSettings({ ...settings, preferred_language: e.target.value })} style={{ marginTop: 7, marginBottom: 18 }}><option value="th">ไทย</option><option value="en">English</option></select></label>
      <button className="btn">บันทึก</button>{message && <p role="status">{message}</p>}
    </form>
    <section className="card" style={{ maxWidth: 650, marginTop: 18 }}><h2 style={{ marginTop: 0 }}>AI Tutor</h2><p>สถานะ: <b>{aiReady ? "ตั้งค่าผู้ให้บริการไว้แล้ว · ยังไม่ได้ตรวจการเชื่อมต่อ" : "AI Tutor ยังไม่เปิดใช้งาน — จะตั้งค่าภายหลัง"}</b></p><p className="muted">V0.3A เน้นบทเรียนและสื่อฝึกภาษา ฟีเจอร์ AI จะตั้งค่าและตรวจสอบใน V0.3B</p><p className="muted">ตั้งค่าในไฟล์ .env.local บนเครื่องนี้เท่านั้น โมเดลและคีย์ไม่แสดงในหน้านี้</p><code>AI_PROVIDER=ollama · OLLAMA_MODEL=ชื่อโมเดล</code><p style={{ fontSize: 14 }}>ความคืบหน้าหลักสูตร: {progress.completed}/{progress.total} บท ({progress.percent}%)</p><p className="muted" style={{ fontSize: 13 }}>กำหนดเวลาเรียน 18:00–19:30 ตามเวลา Asia/Bangkok</p></section>
  </div>;
}

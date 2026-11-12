"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, NotebookPen, Settings, Sparkles, ClipboardCheck } from "lucide-react";

const items = [
  { href: "/dashboard", label: "หน้าแรก", Icon: LayoutDashboard },
  { href: "/courses", label: "หลักสูตร", Icon: BookOpen },
  { href: "/review", label: "ทบทวน", Icon: NotebookPen },
  { href: "/eps-topik", label: "EPS-TOPIK", Icon: ClipboardCheck },
  { href: "/settings", label: "ตั้งค่า", Icon: Settings },
];

export function Navigation() {
  const path = usePathname();
  return (
    <aside className="sidebar" style={{ minHeight: "100vh", position: "sticky", top: 0, alignSelf: "start" }}>
      <Link href="/dashboard" className="sidebar-brand" style={{ display: "flex", gap: 11, alignItems: "center", fontWeight: 800, fontSize: 18, margin: "0 8px 32px" }}>
        <span style={{ background: "#0f766e", color: "white", borderRadius: 11, padding: "8px 10px" }}>한</span>
        <span className="brand-name">ฮันกึล</span><span className="badge brand-badge">MVP</span>
      </Link>
      <nav aria-label="เมนูหลัก" style={{ display: "grid", gap: 6 }}>
        {items.map(({ href, label, Icon }) => {
          const active = path.startsWith(href);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} aria-label={label} className={`sidebar-link${active ? " is-active" : ""}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 13px", borderRadius: 11, color: active ? "#0f766e" : "#475569", background: active ? "#f0fdfa" : "transparent", fontWeight: active ? 700 : 500 }}><Icon size={18} aria-hidden="true"/><span className="sidebar-link-label">{label}</span></Link>;
        })}
      </nav>
      <div className="tutor-card" style={{ marginTop: 28, padding: 14, borderRadius: 13 }}>
        <Sparkles size={17} color="#0f766e" aria-hidden="true"/><p style={{ fontWeight: 700, margin: "8px 0 4px", color: "#0f172a" }}>AI Tutor</p>
        <p className="muted" style={{ fontSize: 13, margin: "0 0 10px" }}>ถามเกี่ยวกับบทเรียนได้</p>
        <Link href="/learn/hangul-intro#tutor" className="btn secondary" style={{ width: "100%" }}>เปิด Tutor</Link>
      </div>
      <p className="muted sidebar-footnote" style={{ position: "absolute", bottom: 12, fontSize: 12, paddingLeft: 10 }}>เรียนวันจันทร์–เสาร์ · 18:00–19:30</p>
    </aside>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpenText, CirclePlay, ExternalLink } from "lucide-react";
import type { LessonMediaResource } from "@/content/media-catalog";

export function LessonMedia({ resources }: { resources: LessonMediaResource[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [embedFailed, setEmbedFailed] = useState(false);
  const selected = resources.find((resource) => resource.id === selectedId) ?? resources[0];

  useEffect(() => {
    setSelectedId(resources[0]?.id ?? "");
    setEmbedFailed(false);
  }, [resources]);

  function selectResource(id: string) {
    setSelectedId(id);
    setEmbedFailed(false);
  }

  return (
    <section className="media-library" id="video" aria-labelledby="media-title">
      <div className="media-heading">
        <div>
          <p className="eyebrow">TEACHING MEDIA</p>
          <h2 id="media-title">วิดีโอและแหล่งเรียนรู้</h2>
        </div>
        {resources.length > 1 && <span className="media-count">{resources.length} แหล่ง</span>}
      </div>
      {selected ? (
        <>
          <div className={`media-frame${selected.kind !== "youtube" ? " media-external" : ""}`}>
            {selected.kind === "youtube" && !embedFailed ? (
              <iframe
                key={selected.id}
                title={`${selected.title} — ${selected.creator}`}
                src={`https://www.youtube-nocookie.com/embed/${selected.id}`}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                loading="lazy"
                onError={() => setEmbedFailed(true)}
              />
            ) : (
              <div className="media-fallback" role="status">
                {selected.kind === "article" ? <BookOpenText size={32} /> : <CirclePlay size={32} />}
                <strong>{selected.kind === "video" ? "วิดีโอจากแหล่งภายนอก" : selected.kind === "article" ? "เอกสารและแหล่งเรียนรู้ภายนอก" : "วิดีโอเล่นในหน้านี้ไม่ได้"}</strong>
                <span>{selected.summary}</span>
                <a href={selected.url} target="_blank" rel="noreferrer">
                  {selected.kind === "video" ? "เปิดวิดีโอต้นฉบับบน Thai PBS ALTV" : selected.kind === "article" ? "เปิดเอกสารต้นฉบับ" : "เปิดวิดีโอต้นฉบับบน YouTube"} <ArrowUpRight size={16} />
                </a>
              </div>
            )}
          </div>
          <div className="media-attribution">
            <div>
              <strong>{selected.title}</strong>
              <span>โดย {selected.creator} · {selected.language === "th" ? "ภาษาไทย" : "ภาษาอังกฤษ"} · ตรวจสอบ {selected.verification.checkedAt}</span>
            </div>
            <a href={selected.url} target="_blank" rel="noreferrer" aria-label={`เปิดแหล่งต้นฉบับ: ${selected.title}`}>
              {selected.kind === "youtube" ? "วิดีโอไม่เล่น? เปิดต้นฉบับ" : selected.kind === "video" ? "เปิดวิดีโอต้นฉบับบน ALTV" : "เปิดเอกสารต้นฉบับ"} <ExternalLink size={15} />
            </a>
          </div>
          {resources.length > 1 && (
            <div className="media-resource-list" role="group" aria-label="เลือกวิดีโอ เอกสาร หรือแหล่งเรียนรู้">
              {resources.map((resource) => (
                <button
                  key={resource.id}
                  type="button"
                  className={`media-resource-option${selected.id === resource.id ? " is-selected" : ""}`}
                  aria-pressed={selected.id === resource.id}
                  onClick={() => selectResource(resource.id)}
                >
                  <span className="media-option-type">{resource.kind === "article" ? "เอกสาร/แหล่งข้อมูล" : "วิดีโอ"}</span>
                  <strong>{resource.title}</strong>
                  <span>{resource.creator}</span>
                </button>
              ))}
            </div>
          )}
          <p className="media-verification">แหล่งข้อมูล: {selected.creator} · {selected.verification.method}</p>
        </>
      ) : (
        <div className="media-unavailable" role="status">
          <BookOpenText size={28} />
          <strong>ยังไม่มีสื่อที่ตรวจสอบแล้วสำหรับบทนี้</strong>
          <span>อ่านคำอธิบายและฝึกฟังคำตัวอย่างด้านล่างได้เลย</span>
        </div>
      )}
    </section>
  );
}

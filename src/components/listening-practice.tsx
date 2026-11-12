"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Headphones, RotateCcw, Volume2 } from "lucide-react";

type PracticeItem = { korean: string; thai: string };

export function ListeningPractice({ items, officialAudioResource }: { items: PracticeItem[]; officialAudioResource?: { url: string; title: string; description: string } }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth || typeof window.SpeechSynthesisUtterance === "undefined") return;
    setSupported(true);
    const updateVoices = () => setVoices(synth.getVoices().filter((voice) => /^ko([_-]|$)/i.test(voice.lang)));
    updateVoices();
    synth.addEventListener("voiceschanged", updateVoices);
    return () => {
      synth.removeEventListener("voiceschanged", updateVoices);
      synth.cancel();
    };
  }, []);

  function speak(text: string) {
    if (!supported || voices.length === 0) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.voice = voices[0];
    utterance.rate = 0.78;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <section className="panel listening-panel" id="listening" aria-labelledby="listening-title">
      <div className="section-heading">
        <div className="section-icon listening-icon"><Headphones size={19} /></div>
        <div><p className="eyebrow">LISTEN & REPEAT</p><h2 id="listening-title">ฟังและฝึกออกเสียง</h2></div>
      </div>
      <p className="listening-instructions">ฟังทีละคำ แล้วพูดตามช้า ๆ 2–3 รอบ สังเกตรูปปากและเสียงเกาหลีโดยตรง ไม่ใช้คำอ่านไทยแทนเสียงจริง</p>
      {supported && voices.length > 0 ? (
        <p className="audio-source-note">เสียงสังเคราะห์จากเบราว์เซอร์ · {voices[0].name} ({voices[0].lang})</p>
      ) : (
        <p className="audio-unavailable" role="status">
          {supported
            ? "เบราว์เซอร์นี้ยังไม่มีเสียงภาษาเกาหลีพร้อมใช้ ตัวอย่างและคำแนะนำยังอ่านและฝึกพูดตามได้"
            : "เบราว์เซอร์นี้ไม่รองรับเสียงสังเคราะห์ ตัวอย่างและคำแนะนำยังอ่านและฝึกพูดตามได้"}
        </p>
      )}
      <div className="listening-items">
        {items.map((item, index) => (
          <article className="listening-item" key={`${item.korean}-${index}`}>
            <div><strong lang="ko">{item.korean}</strong><span>{item.thai}</span></div>
            <div className="listening-actions">
              <button type="button" className="listen-button" disabled={!supported || voices.length === 0} onClick={() => speak(item.korean)} aria-label={`ฟังเสียงสังเคราะห์ ${item.korean}`}>
                <Volume2 size={17} /> ฟัง
              </button>
              <button type="button" className="listen-repeat" disabled={!supported || voices.length === 0} onClick={() => speak(item.korean)} aria-label={`ฟังซ้ำ ${item.korean}`}>
                <RotateCcw size={15} /> ฟังซ้ำ
              </button>
            </div>
          </article>
        ))}
      </div>
      <p className="synth-disclaimer">ปุ่มใช้เสียงสังเคราะห์ ไม่ใช่เสียงบันทึกจากเจ้าของภาษา และไม่มีการให้คะแนนการออกเสียง</p>
      {officialAudioResource && <a className="official-audio-link" href={officialAudioResource.url} target="_blank" rel="noreferrer"><span><strong>{officialAudioResource.title}</strong><small>{officialAudioResource.description}</small></span><ExternalLink size={16} /></a>}
    </section>
  );
}

export type LessonMediaResource = {
  id: string;
  kind: "youtube" | "article";
  title: string;
  creator: string;
  url: string;
  language: "th" | "en";
  summary: string;
  verification: {
    status: "verified";
    checkedAt: string;
    method: string;
  };
};

const checked = {
  status: "verified" as const,
  checkedAt: "2026-11-12",
  method: "ตรวจชื่อ/หัวข้อจากหน้า YouTube หรือหน้าแหล่งเรียนรู้ต้นฉบับ",
};

const video = (id: string, title: string, creator: string, summary: string): LessonMediaResource => ({
  id,
  kind: "youtube",
  title,
  creator,
  url: `https://www.youtube.com/watch?v=${id}`,
  language: "th",
  summary,
  verification: { ...checked, method: "ตรวจชื่อและช่องจาก YouTube oEmbed และเปิดลิงก์ต้นฉบับได้" },
});

const openHangul = (id: string, slug: string, title: string, summary: string): LessonMediaResource => ({
  id,
  kind: "article",
  title,
  creator: "OpenHangul",
  url: `https://hangul.openblog.com/th/lesson/${slug}`,
  language: "th",
  summary,
  verification: { ...checked, method: "ตรวจชื่อบทและเนื้อหาภาษาไทยบนหน้า OpenHangul โดยตรง" },
});

const everydayCourse = (id: string, title: string, summary: string): LessonMediaResource => ({
  id,
  kind: "article",
  title,
  creator: "K-MOOC / Thai MOOC",
  url: "https://lms.thaimooc.org/courses/course-v1:K-MOOC+K-MOOC001+2020/about",
  language: "th",
  summary,
  verification: { ...checked, method: "ตรวจหน้าหลักสูตรและหัวข้อรายสัปดาห์บน Thai MOOC โดยตรง" },
});

const hangulBasicsVideo = video(
  "hVnDpNqWwDc",
  "ภาษาเกาหลี พื้นฐาน 1 : สระ พยัญชนะ ตัวสะกด สำหรับผู้เริ่มต้น 💖 คลิปเดียวอ่านเกาหลีได้!🔥",
  "KHEM KOREA",
  "ภาพรวมสระ พยัญชนะ และตัวสะกด เหมาะสำหรับเริ่มรู้จักระบบฮันกึล",
);
const readingVideo = video(
  "1MMOYfIWcmM",
  "ภาษาเกาหลี พื้นฐาน 2 : 100 แบบฝึกอ่านคำเกาหลี สำหรับคนเริ่มอ่าน! 🥰",
  "KHEM KOREA",
  "ฝึกอ่านคำเกาหลีทีละคำหลังรู้จักรูปพยางค์พื้นฐาน",
);
const hangulOverview = openHangul(
  "openhangul-overview",
  "hangul-overview",
  "ฮันกึลทำงานอย่างไร: ตัวอักษรและพยางค์",
  "อธิบายความสัมพันธ์ระหว่างพยัญชนะ สระ และบล็อกพยางค์เป็นภาษาไทย",
);

export const lessonMediaCatalog: Record<string, LessonMediaResource[]> = {
  "hangul-intro": [
    hangulBasicsVideo,
    openHangul("openhangul-vowels-1", "hangul-vowels-1", "สระพื้นฐาน I: ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ", "บทเรียนไทยเริ่มต้นเรื่องเสียงและรูปสระพื้นฐาน"),
    hangulOverview,
  ],
  "basic-vowels": [
    hangulBasicsVideo,
    openHangul("openhangul-vowels-1", "hangul-vowels-1", "สระพื้นฐาน I: ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ", "ฝึกอ่าน ออกเสียง และสังเกตรูปปากของสระทั้งหก"),
  ],
  "basic-consonants": [
    hangulBasicsVideo,
    openHangul("openhangul-consonants-1", "hangul-consonants-1", "พยัญชนะพื้นฐาน I: ㄱ ㄴ ㄷ ㄹ ㅁ", "ฝึกพยัญชนะต้นพื้นฐานห้าตัวพร้อมตัวอย่างพยางค์"),
    openHangul("openhangul-consonants-2", "hangul-consonants-2", "พยัญชนะพื้นฐาน II: ㅂ ㅅ ㅇ ㅈ ㅎ", "ต่อยอดพยัญชนะต้นอีกห้าตัว พร้อมเสียง ㅇ ในตำแหน่งต้นพยางค์"),
  ],
  combine: [
    hangulOverview,
    openHangul("openhangul-vowels-1", "hangul-vowels-1", "สระพื้นฐาน I: ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ", "ตัวอย่างการวางสระด้านข้างหรือใต้พยัญชนะในบล็อกพยางค์"),
  ],
  "additional-vowels": [
    openHangul("openhangul-compound-vowels-1", "hangul-compound-vowels-1", "สระประสม I: ㅐ ㅔ ㅒ ㅖ", "แนะนำสระประสมกลุ่มแรกพร้อมตัวอย่างการอ่าน"),
    openHangul("openhangul-compound-vowels-2", "hangul-compound-vowels-2", "สระประสม II: ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ", "ฝึกสระประสมที่เหลือและความต่างของเสียง"),
  ],
  "double-aspirated": [
    openHangul("openhangul-aspirated", "hangul-aspirated", "พยัญชนะเสียงหนัก (ลมพ่น): ㅊ ㅋ ㅌ ㅍ", "เปรียบเทียบพยัญชนะลมพ่นกับเสียงพื้นฐาน"),
    openHangul("openhangul-tense", "hangul-tense", "พยัญชนะเสียงตึง: ㄲ ㄸ ㅃ ㅆ ㅉ", "แยกเสียงตึงจากเสียงธรรมดาและเสียงลมพ่น"),
  ],
  "syllable-blocks": [
    hangulOverview,
    openHangul("openhangul-vowels-1", "hangul-vowels-1", "สระพื้นฐาน I: ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ", "ทบทวนรูปแบบพยางค์ที่วางสระด้านข้างและด้านล่าง"),
  ],
  "batchim-intro": [
    hangulBasicsVideo,
    openHangul("openhangul-batchim-1", "hangul-batchim-1", "พยัญชนะท้าย (พัชชิม): 7 เสียงท้าย", "อธิบายตำแหน่งตัวสะกดและเสียงท้ายพื้นฐานเป็นภาษาไทย"),
  ],
  "reading-practice": [
    readingVideo,
    openHangul("openhangul-reading", "hangul-reading", "ฝึกอ่าน: ป้าย เมนู และชื่อ", "ประยุกต์การอ่านฮันกึลกับป้าย เมนู และชื่อที่พบจริง"),
  ],
  "hangul-review": [
    readingVideo,
    hangulBasicsVideo,
    hangulOverview,
    openHangul("openhangul-reading", "hangul-reading", "ฝึกอ่าน: ป้าย เมนู และชื่อ", "ทบทวนการอ่านคำจริงและการประกอบเสียงที่เรียนมา"),
  ],
  "everyday-greetings": [everydayCourse("kmooc-greetings", "ภาษาเกาหลีเบื้องต้น 1: ทักทาย", "หัวข้อสัปดาห์ 1 ระบุ 인사하기 (การทักทาย) พร้อมสำนวนในสถานการณ์ประจำวัน")],
  "everyday-introduction": [everydayCourse("kmooc-introduction", "ภาษาเกาหลีเบื้องต้น 1: แนะนำตัว", "หัวข้อสัปดาห์ 1 ระบุ 자기소개하기 (การแนะนำตัว) พร้อมบทสนทนาสำหรับผู้เริ่มต้น")],
  "everyday-personal-information": [everydayCourse("kmooc-personal-info", "ภาษาเกาหลีเบื้องต้น 1: ข้อมูลส่วนตัว", "คอร์สครอบคลุมบทสนทนาแนะนำตัวและถามตอบข้อมูลพื้นฐาน")],
  "everyday-objects-sentences": [everydayCourse("kmooc-objects", "ภาษาเกาหลีเบื้องต้น 1: สิ่งของและตำแหน่ง", "หัวข้อสัปดาห์ 2 ครอบคลุมการถามว่ามีสิ่งของหรือไม่และถามตำแหน่งสิ่งของ")],
  "everyday-sino-korean-numbers": [everydayCourse("kmooc-sino-numbers", "ภาษาเกาหลีเบื้องต้น 1: ตัวเลขและราคา", "หัวข้อสัปดาห์ 4 ระบุการเรียนตัวเลข หน่วยนับ และการถามตอบราคา")],
  "everyday-native-numbers-counters": [everydayCourse("kmooc-counters", "ภาษาเกาหลีเบื้องต้น 1: จำนวนและลักษณนาม", "หัวข้อสัปดาห์ 4 ครอบคลุมตัวเลขและหน่วยนับ; ใช้ประกอบการฝึกลักษณนามพื้นฐาน")],
  "everyday-days-dates-time": [
    everydayCourse("kmooc-time", "ภาษาเกาหลีเบื้องต้น 1: เวลาและนัดหมาย", "หัวข้อสัปดาห์ 3 ครอบคลุมเวลาและการนัดหมาย; สำหรับการเรียงวันที่ ดูหัวข้อวันและวันที่ในหลักสูตรผู้เริ่มต้นของ Sejong"),
    { id: "iksi-beginner-days-dates", kind: "article", title: "Online King Sejong Institute: Beginner Korean curriculum", creator: "King Sejong Institute Foundation", url: "https://www.iksi.or.kr/lms/main/curriculum.do", language: "en", summary: "หลักสูตรผู้เริ่มต้นระบุวันในสัปดาห์และวันที่เป็นหัวข้อสื่อสารประจำวัน", verification: { ...checked, method: "ตรวจคำอธิบายหลักสูตรผู้เริ่มต้นบนเว็บไซต์ Online KSI โดยตรง" } },
  ],
  "everyday-places-locations": [everydayCourse("kmooc-places", "ภาษาเกาหลีเบื้องต้น 1: สถานที่", "หัวข้อสัปดาห์ 2 ครอบคลุมการถามตำแหน่งและการถามว่าจะไปที่ไหน")],
  "everyday-shopping-food-prices": [everydayCourse("kmooc-shopping", "ภาษาเกาหลีเบื้องต้น 1: ซื้อของและอาหาร", "หัวข้อสัปดาห์ 4 ครอบคลุมการถามราคาและซื้อของ; สัปดาห์ 5 ครอบคลุมอาหารและการสั่งอาหาร")],
  "everyday-review": [
    everydayCourse("kmooc-everyday-review", "ภาษาเกาหลีเบื้องต้น 1: บทสนทนาในชีวิตประจำวัน", "คอร์สระดับต้นรวมหัวข้อแนะนำตัว สิ่งของ สถานที่ เวลา ราคา และอาหาร"),
    { id: "eps-new-textbook-1", kind: "article", title: "EPS-TOPIK NEW Standard Korean Textbook 1 (Everyday Korean)", creator: "HRD Korea", url: "https://epstopik.hrdkorea.or.kr/epstopik/book/std/standardBookList.do?lang=en", language: "en", summary: "หน้ารวมเอกสารทางการระบุหนังสือฉบับปรับปรุง เล่ม 1 สำหรับภาษาเกาหลีในชีวิตประจำวัน; ใช้เป็นแหล่งเรียนเสริมโดยไม่คัดลอกเนื้อหา", verification: { ...checked, method: "ตรวจชื่อและคำอธิบายหนังสือบนเว็บไซต์ EPS-TOPIK/HRD Korea โดยตรง" } },
  ],
};

export function mediaForLesson(slug: string): LessonMediaResource[] {
  return lessonMediaCatalog[slug] ?? [];
}

export const listeningItemsByLesson: Record<string, Array<{ korean: string; thai: string }>> = {
  "hangul-intro": [{ korean: "한글", thai: "อักษรเกาหลี" }, { korean: "한국", thai: "ประเทศเกาหลี" }],
  "basic-vowels": [{ korean: "아", thai: "พยางค์ฝึกเสียงสระ ㅏ" }, { korean: "어", thai: "พยางค์ฝึกเสียงสระ ㅓ" }, { korean: "오", thai: "พยางค์ฝึกเสียงสระ ㅗ" }, { korean: "우", thai: "พยางค์ฝึกเสียงสระ ㅜ" }],
  "basic-consonants": [{ korean: "가", thai: "พยางค์ฝึกเสียง ㄱ" }, { korean: "나", thai: "พยางค์ฝึกเสียง ㄴ" }, { korean: "다", thai: "พยางค์ฝึกเสียง ㄷ" }, { korean: "마", thai: "พยางค์ฝึกเสียง ㅁ" }],
  combine: [{ korean: "가", thai: "พยัญชนะ ㄱ รวมกับสระ ㅏ" }, { korean: "고", thai: "พยัญชนะ ㄱ รวมกับสระ ㅗ" }, { korean: "나", thai: "พยัญชนะ ㄴ รวมกับสระ ㅏ" }],
  "additional-vowels": [{ korean: "애", thai: "พยางค์ฝึกสระ ㅐ" }, { korean: "에", thai: "พยางค์ฝึกสระ ㅔ" }, { korean: "외", thai: "พยางค์ฝึกสระประสม ㅚ" }, { korean: "위", thai: "พยางค์ฝึกสระประสม ㅟ" }],
  "double-aspirated": [{ korean: "가 · 까 · 카", thai: "เปรียบเทียบ ㄱ เสียงพื้นฐาน, ㄲ เสียงตึง และ ㅋ เสียงลมพ่น" }, { korean: "다 · 따 · 타", thai: "เปรียบเทียบ ㄷ เสียงพื้นฐาน, ㄸ เสียงตึง และ ㅌ เสียงลมพ่น" }],
  "syllable-blocks": [{ korean: "가", thai: "พยัญชนะกับสระแนวตั้ง" }, { korean: "고", thai: "พยัญชนะกับสระแนวนอน" }, { korean: "강", thai: "บล็อกพยางค์ที่มีตัวสะกด ㅇ" }],
  "batchim-intro": [{ korean: "간", thai: "ตัวสะกด ㄴ" }, { korean: "감", thai: "ตัวสะกด ㅁ" }, { korean: "강", thai: "ตัวสะกด ㅇ" }],
  "reading-practice": [{ korean: "사과", thai: "แอปเปิล" }, { korean: "바다", thai: "ทะเล" }, { korean: "사람", thai: "คน" }],
  "hangul-review": [{ korean: "한글", thai: "อักษรเกาหลี" }, { korean: "사람", thai: "คน" }, { korean: "한국", thai: "ประเทศเกาหลี" }],
};

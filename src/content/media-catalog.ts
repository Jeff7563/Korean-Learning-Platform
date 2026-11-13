export type LessonMediaResource = {
  id: string;
  kind: "youtube" | "video" | "article";
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

const video = (id: string, title: string, creator: string, summary: string, verification?: LessonMediaResource["verification"]): LessonMediaResource => ({
  id,
  kind: "youtube",
  title,
  creator,
  url: `https://www.youtube.com/watch?v=${id}`,
  language: "th",
  summary,
  verification: verification ?? checked,
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

const altvEpisode = (id: string, title: string, summary: string): LessonMediaResource => ({
  id,
  kind: "video",
  title,
  creator: "Thai PBS ALTV · Korean Pop Up · Jongbae Park",
  url: `https://altv.thaipbs.or.th/programs/tutor-hub/${id}?type=episode`,
  language: "th",
  summary,
  verification: { ...checked, method: "ตรวจชื่อ ตอน หัวข้อ และผู้ดำเนินรายการจากหน้า ALTV ต้นฉบับ; หน้าตอนมีวิดีโอรายการให้รับชม" },
});

const hrdThaiTextbook = (id: string, summary: string): LessonMediaResource => ({
  id,
  kind: "article",
  title: "หนังสือภาษาเกาหลีมาตรฐานสำหรับ EPS-TOPIK เล่ม 1 (ฉบับภาษาไทย)",
  creator: "HRD Korea",
  url: "https://epstopik.hrdkorea.or.kr/epstopik/eps_klt/ebook_pdf/4.%20Thailand%201.pdf",
  language: "th",
  summary,
  verification: { ...checked, method: "ตรวจสารบัญภาษาไทยและบทที่ตรงกับหัวข้อใน PDF ทางการของ HRD Korea; ไม่คัดลอกหรือดัดแปลงเนื้อหา" },
});

const thaiMoocSyllabus: LessonMediaResource = {
  id: "kmooc-korean-beginner-1-syllabus",
  kind: "article",
  title: "ภาษาเกาหลีเบื้องต้น 1 — หน้าแนะนำและโครงสร้างรายวิชา",
  creator: "K-MOOC · Thai MOOC",
  url: "https://lms.thaimooc.org/courses/course-v1:K-MOOC+K-MOOC001+2020/about",
  language: "th",
  summary: "หน้าเว็บสาธารณะแสดงคำอธิบายและหัวข้อรายสัปดาห์ของหลักสูตร แต่ระบุว่าปิดการลงทะเบียนแล้ว จึงใช้ตรวจสอบขอบเขตหัวข้อเท่านั้น ไม่ใช่วิดีโอบทเรียนที่รับชมได้",
  verification: { ...checked, method: "ตรวจชื่อ สถานะลงทะเบียน คำอธิบาย และกำหนดการรายสัปดาห์บนหน้า Thai MOOC โดยตรง" },
};

const sejongCurriculum: LessonMediaResource = {
  id: "iksi-beginner-days-dates",
  kind: "article",
  title: "Online King Sejong Institute: Beginner Korean curriculum",
  creator: "King Sejong Institute Foundation",
  url: "https://www.iksi.or.kr/lms/main/curriculum.do",
  language: "en",
  summary: "หน้าหลักสูตรสาธารณะยืนยันหัวข้อระดับ Beginner และมีภาษาไทยเป็นภาษาสนับสนุน แต่เป็นหน้าหลักสูตร ไม่ใช่บทเรียนวิดีโอ; การเรียนรายวิชาอาจต้องสมัครหรือลงชื่อเข้าใช้",
  verification: { ...checked, method: "ตรวจหน้าหลักสูตรและรายการภาษาที่รองรับจาก Online KSI โดยตรง" },
};

const epsTextbookListing: LessonMediaResource = {
  id: "eps-new-textbook-1",
  kind: "article",
  title: "EPS-TOPIK NEW 한국어 표준교재 1 (일상생활 한국어)",
  creator: "HRD Korea",
  url: "https://epstopik.hrdkorea.or.kr/epstopik/book/std/standardBookList.do?lang=en",
  language: "en",
  summary: "รายการทางการระบุหนังสือฉบับปี 2024 และไฟล์เสียงประกอบ หนังสือและไฟล์เสียงมีเงื่อนไขสัญญาอนุญาตของเกาหลี (KOGL Type 3: ระบุที่มาและห้ามดัดแปลง); ลิงก์นี้เป็นหน้ารายการ ไม่ใช่ไฟล์บทเรียนโดยตรง",
  verification: { ...checked, method: "ตรวจชื่อเอกสาร ไฟล์เสียง และประกาศ KOGL บนเว็บไซต์ EPS-TOPIK/HRD Korea โดยตรง" },
};

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
  "grammar-present-tense": [video("xXKsp0wiYB4", "ไวยากรณ์ภาษาเกาหลี: 아요/어요", "SEOUL HI", "Thai-language teaching video focused on polite present forms, with examples including 가다, 먹다, and 공부하다.", { status: "verified", checkedAt: "2026-11-13", method: "Verified exact title, channel and example verbs from source video metadata; direct player fetch was restricted by the research tool." })],
  "grammar-integrated-review": [hrdThaiTextbook("hrd-thai-grammar-reference", "หนังสือเรียนทางการสำหรับผู้เรียนชาวไทย มีบทสนทนา คำศัพท์ ไวยากรณ์พร้อมคำอธิบายภาษาไทย และสื่อเสียงประกอบ ใช้เป็นแหล่งอ่านเสริมทั่วไป ไม่ได้อ้างว่าแต่ละบทตรงกับไวยากรณ์ในบทเรียนนี้ทั้งหมด")],
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
  "everyday-greetings": [altvEpisode("643507794568cccc2a1a67a8", "ทักทาย แนะนำตัว และบอกลา | Korean Pop Up", "ตอนภาษาไทยโดย Jongbae Park ฝึกคำทักทาย การแนะนำตัว และคำลา เหมาะกับบทเรียนทักทายและแนะนำตัว")],
  "everyday-introduction": [altvEpisode("643507794568cccc2a1a67a8", "ทักทาย แนะนำตัว และบอกลา | Korean Pop Up", "ตอนภาษาไทยโดย Jongbae Park ฝึกการแนะนำตัวในบริบทสนทนาพื้นฐาน")],
  "everyday-personal-information": [hrdThaiTextbook("hrd-thai-personal-info", "หนังสือภาษาไทย บท 6 (หน้า 66 เป็นต้นไป) ฝึกแนะนำชื่อ ประเทศ และอาชีพ; ใช้หมายเลขสมมติในแบบฝึกเพื่อรักษาความเป็นส่วนตัว")],
  "everyday-objects-sentences": [altvEpisode("64bf8a28d889672674a17537", "สิ่งนั้นคืออะไร สิ่งนี้คืออะไร | Korean Pop Up", "ตอนภาษาไทยฝึกคำชี้สิ่งของและบทถามตอบสั้น ๆ; สำหรับไวยากรณ์การมีอยู่และตำแหน่งให้ใช้คำอธิบายในบทเรียนนี้ต่อ")],
  "everyday-sino-korean-numbers": [hrdThaiTextbook("hrd-thai-sino-numbers", "หนังสือภาษาไทยมีตัวเลขและราคาในบท 8, 11 และ 13; ใช้คู่กับรายการเลข 0–20 และเสียงอ่านที่อธิบายในบทเรียนนี้")],
  "everyday-native-numbers-counters": [hrdThaiTextbook("hrd-thai-counters", "หนังสือภาษาไทย บท 9 และ 11 มีแบบนับคน/สิ่งของและตัวอย่างการซื้อสินค้า; ใช้ทบทวนลักษณนามพื้นฐาน")],
  "everyday-days-dates-time": [
    hrdThaiTextbook("hrd-thai-dates-time", "หนังสือภาษาไทย บท 8, 10 และ 13 ครอบคลุมเวลา วัน/วันที่ และการนัดหมาย"),
    sejongCurriculum,
  ],
  "everyday-places-locations": [hrdThaiTextbook("hrd-thai-places", "หนังสือภาษาไทย บท 7 และ 12 ฝึกถามสถานที่ สิ่งของ ตำแหน่ง และเส้นทาง" )],
  "everyday-shopping-food-prices": [
    altvEpisode("64a518dc857c074886f54eb0", "การสั่งอาหารในภาษาเกาหลี | Korean Pop Up", "ตอนภาษาไทยโดย Jongbae Park สอนคำศัพท์และประโยคสั่งอาหาร; การถามราคาและลักษณนามให้ฝึกจากคำอธิบายในบทเรียนนี้"),
    hrdThaiTextbook("hrd-thai-shopping-food", "หนังสือภาษาไทย บท 11 และ 14 ครอบคลุมการซื้อสินค้า ราคา จำนวน และการสั่งอาหาร"),
  ],
  "everyday-review": [
    thaiMoocSyllabus,
    epsTextbookListing,
    hrdThaiTextbook("hrd-thai-review", "หนังสือภาษาไทยฉบับเดิมเป็นแหล่งฝึกเสริม มีบทสนทนาในชีวิตประจำวันและแบบฝึกฟัง; เป็นเนื้อหาสำหรับบริบทแรงงาน จึงไม่แทนหลักสูตรผู้เริ่มต้นทั่วไป"),
  ],
  "eps-exam-structure-strategy": [
    { id: "hrd-eps-test-description", kind: "article", title: "What is EPS-TOPIK? — Test duration and structure", creator: "HRD Korea · EPS-TOPIK", url: "https://epstopik.hrdkorea.or.kr/epstopik/abot/exam/selectTopikDesc.do?lang=en", language: "en", summary: "หน้าเกณฑ์ทางการระบุ 40 ข้อ รวม 50 นาที แบ่ง Reading 20 ข้อและ Listening 20 ข้อ ส่วนละ 25 นาที ใช้เป็นข้อมูลอ้างอิงและตรวจประกาศล่าสุดก่อนสอบ", verification: { status: "verified", checkedAt: "2026-11-13", method: "ตรวจหน้า EPS-TOPIK ทางการโดยตรง" } },
    { id: "hrd-eps-testing-criteria", kind: "article", title: "EPS-TOPIK Testing Module criteria", creator: "HRD Korea · EPS-TOPIK", url: "https://epstopik.hrdkorea.or.kr/epstopik/abot/exam/selectStandardDesc.do?lang=en", language: "en", summary: "เกณฑ์สาธารณะครอบคลุมคำศัพท์/ไวยากรณ์ ข้อมูลใช้งาน ป้ายความปลอดภัย และการฟังบทสนทนา ไม่ใช่คลังข้อสอบจริง", verification: { status: "verified", checkedAt: "2026-11-13", method: "ตรวจหน้าเกณฑ์การอ่านและการฟังทางการโดยตรง" } },
  ],
  "eps-signs-notices-labels": [
    { id: "hrd-eps-public-samples-reading", kind: "article", title: "EPS-TOPIK public sample catalog", creator: "HRD Korea · EPS-TOPIK", url: "https://epstopik.hrdkorea.or.kr/epstopik/book/pub/publicBookReading.do?lang=en", language: "en", summary: "รายการสื่อฝึกสาธารณะจาก HRD Korea; แอปเชื่อมไปยังแหล่งต้นทางเท่านั้น ไม่คัดลอกโจทย์หรือภาพ", verification: { status: "verified", checkedAt: "2026-11-13", method: "ตรวจหน้ารายการข้ออ่านสาธารณะทางการ" } },
    { id: "hrd-eps-new-textbook", kind: "article", title: "EPS-TOPIK NEW Standard Korean textbooks and audio catalog", creator: "HRD Korea · EPS-TOPIK", url: "https://epstopik.hrdkorea.or.kr/epstopik/book/std/standardBookList.do?lang=en", language: "en", summary: "แคตตาล็อกทางการของหนังสือมาตรฐานฉบับปี 2024 และไฟล์เสียง; แสดงประกาศแก้ไขบางส่วนในมิถุนายน 2026 หนังสือ/เสียงยังอยู่ภายนอกและไม่ถูกคัดลอก", verification: { status: "verified", checkedAt: "2026-11-13", method: "ตรวจแคตตาล็อกทางการและประกาศแก้ไขปี 2026" } },
  ],
  "eps-listening-numbers-dates": [
    { id: "hrd-eps-new-textbook-audio", kind: "article", title: "Official EPS-TOPIK textbook and listening audio catalog", creator: "HRD Korea · EPS-TOPIK", url: "https://epstopik.hrdkorea.or.kr/epstopik/book/std/standardBookList.do?lang=en", language: "en", summary: "หน้ารายการทางการเชื่อมหนังสือและไฟล์เสียง; ไฟล์เสียงมีลิขสิทธิ์/เงื่อนไขจากแหล่งต้นทาง ไม่ได้นำมา rehost ในแพลตฟอร์ม", verification: { status: "verified", checkedAt: "2026-11-13", method: "ตรวจรายการหนังสือและเสียงภาษาเกาหลีทางการ" } },
  ],
  "eps-integrated-review": [
    { id: "hrd-eps-test-description-final", kind: "article", title: "EPS-TOPIK official test description", creator: "HRD Korea · EPS-TOPIK", url: "https://epstopik.hrdkorea.or.kr/epstopik/abot/exam/selectTopikDesc.do?lang=en", language: "en", summary: "ตรวจโครงสร้าง เวลา และเกณฑ์การคัดเลือกจากหน้า HRD Korea ก่อนวางแผนสอบจริง; mock score ในแอปไม่ใช่การรับรองผล", verification: { status: "verified", checkedAt: "2026-11-13", method: "ตรวจหน้าคำอธิบายการสอบทางการ" } },
    { id: "hrd-eps-textbook-corrections", kind: "article", title: "Updated Standard Korean textbooks and listening audio", creator: "HRD Korea · EPS-TOPIK", url: "https://epstopik.hrdkorea.or.kr/epstopik/book/std/standardBookList.do?lang=en", language: "en", summary: "แคตตาล็อกแสดงประกาศแก้ไขหนังสือมาตรฐานเล่ม 2 ในมิถุนายน 2026; เนื้อหาไฟล์แนบยังไม่ได้ตรวจสอบทีละหน้า", verification: { status: "verified", checkedAt: "2026-11-13", method: "ตรวจหน้าแคตตาล็อกและประกาศที่แสดงวันที่แก้ไข" } },
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
  "eps-exam-structure-strategy": [{ korean: "시험은 읽기와 듣기로 나뉘어요.", thai: "ข้อสอบแบ่งเป็นการอ่านและการฟัง" }, { korean: "읽기 20문제를 25분 동안 풀어요.", thai: "ทำข้ออ่าน 20 ข้อใน 25 นาที" }, { korean: "점수는 연습 결과예요.", thai: "คะแนนนี้เป็นผลการฝึก" }],
  "eps-signs-notices-labels": [{ korean: "안전모를 착용하세요.", thai: "กรุณาสวมหมวกนิรภัย" }, { korean: "출입 금지", thai: "ห้ามเข้า" }, { korean: "미끄럼 주의", thai: "ระวังพื้นลื่น" }],
  "eps-forms-schedules-tables": [{ korean: "오전 여덟 시에 시작해요.", thai: "เริ่มตอนแปดโมงเช้า" }, { korean: "일요일은 쉬어요.", thai: "วันอาทิตย์หยุด" }, { korean: "수량은 열두 개예요.", thai: "จำนวนสิบสองชิ้น" }],
  "eps-messages-passages": [{ korean: "오늘 오후 세 시에 회의가 있습니다.", thai: "วันนี้มีประชุมบ่ายสามโมง" }, { korean: "자료를 가져오세요.", thai: "กรุณานำเอกสารมา" }, { korean: "도착하면 연락해 주세요.", thai: "เมื่อถึงแล้วกรุณาติดต่อมา" }],
  "eps-vocabulary-grammar-context": [{ korean: "저는 물을 마셔요.", thai: "ฉันดื่มน้ำ" }, { korean: "공장에 가요.", thai: "ไปโรงงาน" }, { korean: "안전모를 써요.", thai: "สวมหมวกนิรภัย" }],
  "eps-safety-instructions": [{ korean: "작업 전에 보호구를 확인하세요.", thai: "กรุณาตรวจอุปกรณ์ป้องกันก่อนทำงาน" }, { korean: "비상구 앞에 물건을 두면 안 됩니다.", thai: "ห้ามวางของหน้าทางออกฉุกเฉิน" }, { korean: "위험하면 즉시 알리세요.", thai: "หากมีอันตรายให้แจ้งทันที" }],
  "eps-listening-numbers-dates": [{ korean: "세 시 십오 분", thai: "สามโมงสิบห้านาที" }, { korean: "오월 십일", thai: "วันที่ 11 พฤษภาคม" }, { korean: "사과 세 개", thai: "แอปเปิลสามผล" }],
  "eps-listening-everyday-dialogues": [{ korean: "어디에서 만날까요?", thai: "เราจะพบกันที่ไหนดี?" }, { korean: "역 앞에서 만나요.", thai: "พบกันหน้าสถานี" }, { korean: "네, 세 시에 만나요.", thai: "ได้ พบกันตอนสามโมง" }],
  "eps-listening-workplace-situations": [{ korean: "먼저 전원을 확인하세요.", thai: "กรุณาตรวจสอบไฟฟ้าก่อน" }, { korean: "확인한 후에 상자를 옮기겠습니다.", thai: "หลังตรวจแล้วจะย้ายกล่อง" }, { korean: "문제가 있으면 관리자에게 알리세요.", thai: "หากมีปัญหาให้แจ้งผู้ดูแล" }],
  "eps-integrated-review": [{ korean: "먼저 약한 부분을 연습해요.", thai: "ฝึกจุดที่ยังไม่แข็งแรงก่อน" }, { korean: "틀린 답을 확인하고 다시 풀어요.", thai: "ตรวจคำตอบที่ผิดแล้วลองทำอีกครั้ง" }, { korean: "모의시험 점수는 참고 자료예요.", thai: "คะแนนสอบจำลองเป็นข้อมูลประกอบ" }],
};

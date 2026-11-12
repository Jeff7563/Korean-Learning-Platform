export type EpsSection = "reading" | "listening";
export type EpsSkill = "vocabulary" | "grammar" | "everyday" | "workplace" | "safety";
export type EpsQuestionDraft = { section: EpsSection; skill: EpsSkill; prompt: string; options: [string,string,string,string]; answer: number; explanation: string; script?: string };
const q = (section:EpsSection,skill:EpsSkill,prompt:string,options:[string,string,string,string],answer:number,explanation:string,script?:string):EpsQuestionDraft=>({section,skill,prompt,options,answer,explanation,...(script?{script}:{})});

const legacyReading:EpsQuestionDraft[]=[
 q("reading","vocabulary","ป้ายนี้หมายถึงอะไร: 금연",["ห้ามสูบบุหรี่","ห้ามเข้า","ระวังไฟ","ทางออก"],0,"금연 แปลว่า ห้ามสูบบุหรี่."),
 q("reading","vocabulary","ป้ายนี้หมายถึงอะไร: 출입 금지",["เปิดประตู","ห้ามเข้า","กรุณารอ","ห้ามถ่ายรูป"],1,"출입 금지 หมายถึงห้ามเข้า."),
 q("reading","everyday","ร้านเปิด 월요일부터 금요일까지 ปิดวันใด",["วันจันทร์","วันพุธ","วันศุกร์","วันเสาร์และอาทิตย์"],3,"월요일부터 금요일까지 คือเปิดตั้งแต่วันจันทร์ถึงวันศุกร์."),
 q("reading","everyday","เวลา 운영 시간 09:00–18:00 ร้านปิดกี่โมง",["9 โมงเช้า","เที่ยง","6 โมงเย็น","3 ทุ่ม"],2,"เวลา 18:00 คือ 6 โมงเย็น."),
 q("reading","vocabulary","พยากรณ์อากาศเขียนว่า 비가 옵니다 ควรเตรียมอะไร",["ร่ม","แว่นกันแดด","พัดลม","ถุงมือกันหนาว"],0,"비가 옵니다 หมายถึงฝนตก จึงควรเตรียมร่ม."),
 q("reading","grammar","เติมคำให้ถูก: 저는 매일 한국어___.",["공부합니다","공부입니다","공부에서","공부하고"],0,"ใช้ 공부하다 เป็นคำกริยา เมื่อพูดสุภาพปัจจุบันใช้ 공부합니다."),
 q("reading","vocabulary","คำว่า 병원 หมายถึงสถานที่ใด",["โรงพยาบาล","โรงเรียน","สถานีรถไฟ","ธนาคาร"],0,"병원 แปลว่าโรงพยาบาล."),
 q("reading","grammar","เลือกประโยคที่สุภาพและเป็นธรรมชาติ",["물을 마셔요.","물이 마셔요.","물을 마셔입니다.","물 마셔가요."],0,"물을 เป็นกรรมของ 마시다 และ 마셔요 เป็นรูปสุภาพไม่เป็นทางการ."),
 q("reading","everyday","อ่านข้อความ: 약국은 병원 옆에 있습니다. ร้านขายยาอยู่ที่ใด",["ข้างโรงพยาบาล","ในโรงพยาบาล","หน้าโรงเรียน","หลังธนาคาร"],0,"옆에 หมายถึงข้าง ๆ."),
 q("reading","everyday","ในแบบฟอร์ม ช่อง 이름 ต้องกรอกข้อมูลใด",["ชื่อ","วันเกิด","ที่อยู่","หมายเลขโทรศัพท์"],0,"이름 หมายถึงชื่อ."),
 q("reading","everyday","ประกาศ: 오늘은 쉽니다. วันนี้สถานที่นี้เป็นอย่างไร",["เปิดทั้งวัน","หยุดทำการ","ลดราคา","เปิดช้า"],1,"쉽니다 ในประกาศร้านค้าหมายถึงหยุดทำการ."),
 q("reading","safety","ป้าย: 안전모를 착용하세요. ต้องทำอะไร",["สวมหมวกนิรภัย","ถอดรองเท้า","ห้ามพูด","ปิดไฟ"],0,"안전모 คือหมวกนิรภัย และ 착용하세요 คือกรุณาสวมใส่."),
 q("reading","safety","เห็นเครื่องจักรผิดปกติ ข้อความใดควรทำตาม",["기계를 멈추세요.","기계를 만지세요.","계속 일하세요.","문을 여세요."],0,"기계를 멈추세요 แปลว่าหยุดเครื่องจักร เป็นการตอบสนองที่ปลอดภัย."),
 q("reading","workplace","พักเวลา 12:00–13:00 พักกี่โมง",["10 โมงถึง 11 โมง","11 โมงถึงเที่ยง","เที่ยงถึงบ่ายโมง","บ่ายโมงถึงบ่ายสอง"],2,"เวลา 12:00–13:00 คือเที่ยงถึงบ่ายโมง."),
 q("reading","vocabulary","คำว่า 망치 หมายถึงอะไร",["ค้อน","ประแจ","ตะปู","เลื่อย"],0,"망치 คือค้อน."),
 q("reading","grammar","เติมคำ: 저는 한국 음식을 먹___ 싶어요.",["고","어서","지만","는"],0,"รูป -고 싶어요 ใช้บอกความต้องการ: 먹고 싶어요 = อยากกิน."),
 q("reading","everyday","ข้อความ: 버스는 10분 후에 옵니다. รถจะมาเมื่อใด",["อีก 10 นาที","อีก 10 ชั่วโมง","เมื่อวาน","พรุ่งนี้เช้า"],0,"10분 후에 หมายถึงอีก 10 นาที."),
 q("reading","safety","ถังดับเพลิงเขียนว่า 소화기. หากเกิดไฟไหม้ควรมองหาอะไร",["ถังดับเพลิง","ตู้เย็น","ลิฟต์","เครื่องแบบ"],0,"소화기 แปลว่าถังดับเพลิง."),
 q("reading","workplace","หากได้รับบาดเจ็บในที่ทำงาน ควรแจ้งใคร",["관리자에게 알리세요.","혼자 참으세요.","기계를 켜세요.","집에 숨으세요."],0,"แจ้งผู้ดูแลหรือหัวหน้างาน (관리자) ทันทีเมื่อบาดเจ็บ."),
 q("reading","grammar","ประโยคใดแปลว่า 'กรุณารอที่นี่'",["여기에서 기다리세요.","여기에서 가세요.","여기에 먹으세요.","여기에서 자요?"],0,"기다리세요 เป็นคำขอสุภาพให้รอ."),
];

const legacyListening:EpsQuestionDraft[]=[
 q("listening","everyday","ผู้พูดจะไปที่ไหน",["ธนาคาร","โรงพยาบาล","ตลาด","โรงเรียน"],1,"บทสนทนาระบุว่ากำลังไปโรงพยาบาล.","가: 어디에 가요? 나: 병원에 가요."),
 q("listening","everyday","นัดพบกันเวลาใด",["9 โมง","10 โมง","เที่ยง","บ่าย 3 โมง"],1,"ผู้พูดนัดพบตอน 10 โมง.","가: 몇 시에 만날까요? 나: 오전 열 시에 만나요."),
 q("listening","vocabulary","ผู้หญิงซื้ออะไร",["ขนมปัง","นม","ข้าว","น้ำ"],3,"บทสนทนาบอกว่าซื้อน้ำหนึ่งขวด.","가: 무엇을 사요? 나: 물 한 병을 사요."),
 q("listening","everyday","วันนี้อากาศเป็นอย่างไร",["หนาว","ร้อน","ฝนตก","มีหิมะ"],2,"ผู้พูดบอกว่าฝนตก.","가: 오늘 날씨가 어때요? 나: 비가 와요. 우산을 가져가세요."),
 q("listening","everyday","รถออกจากสถานีในอีกกี่นาที",["5 นาที","15 นาที","30 นาที","1 ชั่วโมง"],1,"อีก 15 นาทีรถจะออก.","가: 버스가 언제 출발해요? 나: 십오 분 후에 출발해요."),
 q("listening","grammar","ผู้ชายชอบทำอะไร",["อ่านหนังสือ","ดูหนัง","ทำอาหาร","เล่นฟุตบอล"],0,"ได้ยินว่าอ่านหนังสือเป็นงานอดิเรก.","가: 취미가 뭐예요? 나: 책 읽기를 좋아해요."),
 q("listening","workplace","วันนี้ผู้พูดเริ่มงานกี่โมง",["7 โมง","8 โมง","9 โมง","10 โมง"],1,"กะเริ่มเวลา 8 โมง.","가: 오늘 몇 시에 일을 시작해요? 나: 아침 여덟 시에 시작해요."),
 q("listening","workplace","ผู้ฟังได้รับคำสั่งให้ทำอะไร",["เปิดหน้าต่าง","ปิดเครื่องจักร","ยกกล่อง","ทำความสะอาดโต๊ะ"],1,"คำสั่งคือปิดเครื่องจักร.","가: 기계가 이상해요. 먼저 기계를 끄세요. 나: 네, 알겠습니다."),
 q("listening","safety","ก่อนเข้าพื้นที่ทำงานต้องสวมอะไร",["หมวกนิรภัย","ผ้าพันคอ","แว่นกันแดด","หมวกแก๊ป"],0,"สวม 안전모 หรือหมวกนิรภัย.","가: 작업장에 들어가기 전에 무엇을 써야 해요? 나: 안전모를 써야 해요."),
 q("listening","everyday","ผู้พูดต้องการอาหารแบบใด",["ไม่เผ็ด","เผ็ดมาก","หวาน","เย็น"],0,"ขอไม่ใส่พริก จึงต้องการแบบไม่เผ็ด.","가: 이 음식은 매워요? 나: 저는 매운 음식을 못 먹어요. 고추를 넣지 마세요."),
 q("listening","vocabulary","นัดหมายวันใด",["วันจันทร์","วันอังคาร","วันพฤหัสบดี","วันอาทิตย์"],2,"นัดพบวันพฤหัสบดี.","가: 언제 만나요? 나: 목요일 오후에 만나요."),
 q("listening","everyday","ร้านขายยาอยู่ที่ไหน",["ข้างสถานี","หน้าธนาคาร","ข้างโรงพยาบาล","ในตลาด"],2,"เภสัชกรระบุว่าอยู่ข้างโรงพยาบาล.","가: 약국이 어디에 있어요? 나: 병원 옆에 있어요."),
 q("listening","safety","ผู้พูดควรทำอย่างไรเมื่อได้กลิ่นแก๊ส",["เปิดไฟ","แจ้งหัวหน้างาน","จุดไฟ","เดินเข้าไปดูใกล้ ๆ"],1,"ต้องออกจากบริเวณและแจ้งผู้ดูแล; ตัวเลือกที่ตรงคือแจ้งหัวหน้างาน.","가: 가스 냄새가 나요. 어떻게 해요? 나: 밖으로 나가서 관리자에게 알리세요."),
 q("listening","workplace","ผู้หญิงใช้เครื่องมือใด",["ค้อน","ประแจ","กรรไกร","ไขควง"],3,"ผู้พูดขอไขควง.","가: 드라이버가 어디 있어요? 나: 작업대 위에 있어요."),
 q("listening","everyday","ผู้ชายเดินทางไปทำงานอย่างไร",["รถไฟ","รถประจำทาง","แท็กซี่","จักรยาน"],0,"เขาบอกว่านั่งรถไฟไปทำงาน.","가: 어떻게 회사에 가요? 나: 지하철을 타고 가요."),
 q("listening","vocabulary","ผู้พูดต้องซื้อผลไม้อะไร",["แอปเปิล","กล้วย","ส้ม","องุ่น"],1,"ขอกล้วยสองลูก.","가: 과일을 무엇을 살까요? 나: 바나나 두 개 주세요."),
 q("listening","workplace","ผู้ฟังต้องทำอะไรหลังพัก",["กลับบ้าน","กลับไปทำงาน","ไปโรงพยาบาล","โทรหาเพื่อน"],1,"หัวหน้าบอกให้กลับไปทำงานหลังพัก.","가: 점심시간이 끝났어요. 이제 작업장으로 돌아가세요. 나: 네, 바로 가겠습니다."),
 q("listening","grammar","เพื่อนขอให้ทำอะไร",["ปิดประตู","เปิดประตู","ปิดโทรศัพท์","เปิดโทรทัศน์"],1,"ประโยค 문을 열어 주세요 คือกรุณาเปิดประตู.","가: 죄송하지만 문을 열어 주세요. 나: 네, 알겠습니다."),
 q("listening","everyday","พวกเขาจะพบกันที่ไหน",["หน้าร้านกาแฟ","สถานีรถไฟ","หน้าบ้าน","สวนสาธารณะ"],0,"นัดพบหน้าร้านกาแฟ.","가: 어디에서 만날까요? 나: 커피숍 앞에서 만나요."),
 q("listening","safety","เมื่อมีเสียงเตือน ผู้พูดควรทำอย่างไร",["ทำงานต่อ","วิ่งไปที่เครื่อง","หยุดงานและฟังคำสั่ง","ปิดเสียงเตือน"],2,"หยุดงานอย่างปลอดภัยและปฏิบัติตามคำสั่งอพยพ.","가: 경보가 울려요. 어떻게 해야 해요? 나: 일을 멈추고 안내에 따라 대피하세요."),
];

const currentReading:EpsQuestionDraft[]=[
 q("reading","everyday","ข้อความแชต: 오늘 저녁에 같이 밥을 먹을까요? ผู้เขียนต้องการทำอะไร",["ชวนกินข้าวเย็นด้วยกัน","ชวนไปทำงาน","ขอยืมเงิน","ยกเลิกนัด"],0,"같이 밥을 먹을까요? เป็นการชวนกินข้าวด้วยกัน."),
 q("reading","everyday","ประกาศศูนย์บริการ: 번호표를 뽑고 기다리세요. ต้องทำอะไรก่อน",["รับบัตรคิว","จ่ายเงิน","กลับบ้าน","โทรศัพท์"],0,"번호표를 뽑다 คือกดหรือรับบัตรคิว."),
 q("reading","grammar","เลือกคำเชื่อมที่ถูก: 비가 와요. ___ 우산을 가져가세요.",["그래서","하지만","그리고","또는"],0,"ฝนตก ดังนั้นให้เอาร่มไป; 그래서 ใช้แสดงผลตามเหตุ."),
 q("reading","vocabulary","คำว่า 예약 หมายถึงอะไร",["การจอง","การยกเลิก","การชำระเงิน","การซ่อม"],0,"예약 แปลว่าการจองล่วงหน้า."),
 q("reading","everyday","ใบแจ้งนัดเขียนว่า 6월 18일 오전 10시. นัดเมื่อใด",["18 มิถุนายน 10 โมงเช้า","18 กรกฎาคม 10 โมงเช้า","วันที่ 6 เวลา 18 นาฬิกา","18 มิถุนายน 10 โมงคืน"],0,"6월 18일 คือ 18 มิถุนายน และ 오전 10시 คือ 10 โมงเช้า."),
 q("reading","grammar","เติมคำ: 시간이 없___ 택시를 탔어요.",["어서","지만","고","으면"],0,"없어서 หมายถึงเพราะไม่มีเวลา จึงนั่งแท็กซี่."),
 q("reading","workplace","ประกาศงาน: 작업 전 안전교육을 받으세요. ต้องทำเมื่อใด",["ก่อนเริ่มงาน","หลังเลิกงาน","เฉพาะวันหยุด","หลังเกิดอุบัติเหตุ"],0,"작업 전 หมายถึงก่อนทำงาน."),
 q("reading","safety","ป้ายสารเคมี: 보호장갑 착용. ต้องสวมอะไร",["ถุงมือป้องกัน","รองเท้าแตะ","เสื้อกันฝน","ผ้ากันเปื้อน"],0,"보호장갑 คือถุงมือป้องกัน."),
 q("reading","everyday","ข้อความ: 오늘은 재고가 없어서 내일 다시 오세요. สินค้าเป็นอย่างไร",["หมดชั่วคราว","ลดราคา","สั่งจองได้วันนี้","ชำรุด"],0,"재고가 없다 หมายถึงไม่มีสินค้าในคลัง ให้กลับมาพรุ่งนี้."),
 q("reading","grammar","เลือกประโยคขออนุญาตอย่างสุภาพ",["여기 앉아도 돼요?","여기 앉아야 해요?","여기 앉지 마세요?","여기 앉았어요?"],0,"-아/어도 돼요? ใช้ขออนุญาตว่า...ได้ไหม."),
 q("reading","workplace","ข้อความ: 제품에 문제가 있으면 관리자에게 보고하세요. ควรทำอย่างไรเมื่อพบปัญหา",["รายงานผู้ดูแล","ทิ้งสินค้า","ซ่อนสินค้า","หยุดพัก"],0,"보고하세요 หมายถึงกรุณารายงาน."),
 q("reading","safety","ป้ายทางหนีไฟ: 비상구. คำนี้หมายถึงอะไร",["ทางออกฉุกเฉิน","ห้องพัก","ห้องพยาบาล","พื้นที่สูบบุหรี่"],0,"비상구 หมายถึงทางออกฉุกเฉิน."),
 q("reading","everyday","ข้อความการเดินทาง: 막차는 밤 11시에 출발합니다. รถเที่ยวสุดท้ายออกกี่โมง",["5 ทุ่ม","5 โมงเย็น","เที่ยงคืน","4 ทุ่ม"],0,"밤 11시 คือ 23:00 หรือ 5 ทุ่ม."),
 q("reading","vocabulary","คำว่า 환불 หมายถึงอะไร",["คืนเงิน","เปลี่ยนเสื้อ","จองโต๊ะ","ส่งของ"],0,"환불 คือการคืนเงิน."),
 q("reading","grammar","เติมคำ: 몸이 아프___ 병원에 갔어요.",["아서","지만","거나","고"],0,"아파서 บอกเหตุผลว่าเพราะป่วยจึงไปโรงพยาบาล."),
 q("reading","workplace","คำสั่ง: 사용 후 전원을 끄세요. หลังใช้ต้องทำอะไร",["ปิดเครื่อง","เปิดประตู","ล้างมือ","แจ้งลูกค้า"],0,"전원을 끄다 คือปิดสวิตช์ไฟ."),
 q("reading","safety","ประกาศ: 젖은 바닥에서 뛰지 마세요. ข้อควรปฏิบัติคืออะไร",["อย่าวิ่งบนพื้นเปียก","เช็ดรองเท้าบนพื้น","ปิดไฟ","เปิดหน้าต่าง"],0,"뛰지 마세요 คือกรุณาอย่าวิ่ง."),
 q("reading","everyday","แบบฟอร์ม ช่อง 연락처 ให้กรอกอะไร",["ข้อมูลติดต่อ","สัญชาติ","อาชีพ","ลายเซ็น"],0,"연락처 หมายถึงข้อมูลติดต่อ เช่น เบอร์โทรศัพท์."),
 q("reading","grammar","เลือกคำลงท้ายที่เหมาะกับประกาศสุภาพ",["문을 닫아 주세요.","문을 닫아 먹어요.","문이 닫아 주세요.","문을 닫고 싶어요?"],0,"닫아 주세요 เป็นคำขอให้ช่วยปิดประตูอย่างสุภาพ."),
 q("reading","workplace","ตารางกะเขียนว่า 주간 08:00–17:00. กะกลางวันเลิกกี่โมง",["5 โมงเย็น","8 โมงเช้า","เที่ยง","ทุ่ม"],0,"ช่วง 08:00–17:00 จบเวลา 17:00 หรือ 5 โมงเย็น."),
];

const currentListening:EpsQuestionDraft[]=[
 q("listening","everyday","ผู้พูดต้องการเปลี่ยนอะไร",["เวลานัด","ที่อยู่","หมายเลขโทรศัพท์","ชื่อผู้จอง"],0,"ขอเปลี่ยนเวลานัดจากบ่ายสองเป็นบ่ายสาม.","가: 예약 시간을 바꾸고 싶어요. 나: 몇 시로 바꾸실까요? 가: 오후 세 시로 부탁해요."),
 q("listening","everyday","ควรลงจากรถที่ป้ายใด",["시청역","시장역","학교 앞","병원 앞"],0,"ผู้ประกาศบอกให้ลงที่ 시청역.","가: 다음은 시청역입니다. 나: 여기에서 내려요? 가: 네, 여기에서 내리세요."),
 q("listening","workplace","หัวหน้าขอให้ทำอะไร",["ตรวจจำนวนสินค้า","ปิดประตู","ล้างรถ","โทรหาลูกค้า"],0,"คำสั่งคือเช็กจำนวนสินค้า.","가: 출고 전에 제품 수량을 확인하세요. 나: 네, 수량을 확인하겠습니다."),
 q("listening","safety","มีอันตรายอะไรเกิดขึ้น",["พื้นลื่น","ไฟดับ","ประตูล็อก","เครื่องเสียงดัง"],0,"ผู้พูดเตือนว่าพื้นลื่น.","가: 바닥이 미끄러우니까 조심하세요. 나: 네, 천천히 걸을게요."),
 q("listening","everyday","ผู้หญิงต้องการซื้อเสื้อขนาดใด",["ขนาดเล็ก","ขนาดกลาง","ขนาดใหญ่","ไม่ระบุ"],1,"ต้องการไซซ์กลาง.","가: 이 셔츠 중간 사이즈 있어요? 나: 네, 여기 있습니다."),
 q("listening","grammar","เหตุใดผู้ชายจึงมาสาย",["รถติด","ตื่นสาย","ฝนตก","หลงทาง"],0,"รถติดมากจึงมาสาย.","가: 왜 늦었어요? 나: 길이 많이 막혀서 늦었어요. 죄송합니다."),
 q("listening","workplace","ของที่ต้องนำไปทำงานคืออะไร",["เอกสารประจำตัว","ร่ม","อาหาร","หมวกกันน็อกส่วนตัว"],0,"หัวหน้าให้เตรียมเอกสารประจำตัว.","가: 내일 첫 출근이에요. 신분증을 꼭 가져오세요. 나: 네, 준비하겠습니다."),
 q("listening","safety","เมื่อได้ยินเสียงสัญญาณควรทำอย่างไร",["หยุดเครื่องและอพยพตามป้าย","วิ่งไปเก็บของ","โทรหาเพื่อน","ใช้ลิฟต์"],0,"ต้องหยุดทำงานและอพยพตามคำแนะนำ ไม่ใช้ลิฟต์.","가: 화재 경보입니다. 기계를 멈추고 비상구로 대피하세요. 나: 네, 알겠습니다."),
 q("listening","everyday","พวกเขานัดกันที่ใด",["หน้าทางออก 2","ป้ายรถเมล์","ร้านขายยา","ชั้นสาม"],0,"นัดกันที่ทางออกหมายเลข 2.","가: 지하철역 몇 번 출구에서 만날까요? 나: 2번 출구 앞에서 만나요."),
 q("listening","vocabulary","ลูกค้าขอให้ทำอะไรกับอาหาร",["ไม่ใส่เนื้อสัตว์","เพิ่มเกลือ","ใส่พริกเพิ่ม","ห่อกลับบ้าน"],0,"ขออาหารที่ไม่มีเนื้อสัตว์.","가: 고기를 넣지 말아 주세요. 나: 네, 고기 없이 준비해 드릴게요."),
 q("listening","workplace","เครื่องจักรจะกลับมาใช้ได้เมื่อใด",["หลังช่างตรวจแล้ว","ทันที","พรุ่งนี้เช้า","หลังพักกลางวัน"],0,"ต้องรอช่างตรวจและอนุญาตก่อน.","가: 기계가 멈췄어요. 다시 켜도 돼요? 나: 아니요, 기술자가 확인한 후에 사용하세요."),
 q("listening","safety","ผู้ฟังต้องใส่อุปกรณ์ใด",["แว่นตานิรภัย","ถุงมือผ้า","หน้ากากอนามัย","ที่อุดหู"],0,"ก่อนเจียรงานต้องสวมแว่นนิรภัย.","가: 연마 작업을 시작하기 전에 무엇을 써야 해요? 나: 보안경을 꼭 쓰세요."),
 q("listening","everyday","ผู้หญิงจะไปพบแพทย์วันใด",["วันอังคาร","วันพุธ","วันศุกร์","วันเสาร์"],2,"นัดวันศุกร์เวลาเช้า.","가: 진료 예약이 언제예요? 나: 금요일 오전 아홉 시예요."),
 q("listening","grammar","ผู้ชายขอให้ผู้หญิงทำอะไร",["พูดช้า ๆ","เขียนชื่อ","เปิดประตู","โทรกลับ"],0,"천천히 말씀해 주세요 คือกรุณาพูดช้า ๆ.","가: 죄송하지만 천천히 말씀해 주세요. 나: 네, 다시 설명하겠습니다."),
 q("listening","workplace","ผู้พูดจะเริ่มงานส่วนใดก่อน",["ตรวจวัตถุดิบ","บรรจุสินค้า","ทำความสะอาด","ส่งเอกสาร"],0,"เริ่มจากตรวจวัตถุดิบ.","가: 오늘은 먼저 원료를 확인하고 포장하세요. 나: 네, 먼저 원료를 확인하겠습니다."),
 q("listening","safety","น้ำยาที่หกควรจัดการอย่างไร",["แจ้งผู้ดูแลและทำตามขั้นตอน","ใช้มือเช็ด","เทน้ำเพิ่ม","เดินผ่าน"],0,"ให้แจ้งผู้ดูแลและทำตามขั้นตอนความปลอดภัย ห้ามสัมผัสโดยไม่ทราบชนิด.","가: 세제가 바닥에 쏟아졌어요. 나: 만지지 말고 관리자에게 알리세요."),
 q("listening","everyday","ผู้ชายกำลังถามหาอะไร",["ใบเสร็จ","บัตรโดยสาร","กุญแจ","โทรศัพท์"],0,"กำลังหาใบเสร็จ.","가: 영수증을 어디에 두었어요? 나: 계산대 옆에 두었어요."),
 q("listening","vocabulary","ผู้พูดจะจ่ายเงินด้วยวิธีใด",["บัตร","เงินสด","โอนผ่านมือถือ","คูปอง"],1,"จ่ายด้วยเงินสด.","가: 카드로 계산하시겠어요? 나: 아니요, 현금으로 계산할게요."),
 q("listening","workplace","ผู้ฟังต้องไปที่ใดหลังประชุม",["ห้องฝึกอบรม","โรงอาหาร","คลังสินค้า","ป้ายรถ"],0,"หลังประชุมให้ไปห้องฝึกอบรม.","가: 회의 후에 교육실로 오세요. 나: 몇 시까지 가면 돼요? 가: 열한 시까지 오세요."),
 q("listening","safety","ผู้หญิงเจ็บตรงไหน",["มือ","เท้า","ไหล่","หลัง"],0,"ผู้หญิงบอกว่าเจ็บมือ.","가: 어디가 아파요? 나: 손을 다쳤어요. 응급실에 가야 해요? 가: 네, 관리자에게 먼저 알리세요."),
];

export const epsExamDrafts=[
 {id:"legacy-style",title:"แบบจำลองแนวข้อสอบรูปแบบเดิม",style:"legacy",description:"ข้อสอบจำลองต้นฉบับใหม่ ใช้สถานการณ์พื้นฐานและคำสั่งสั้นเพื่อฝึกทำความคุ้นเคยกับรูปแบบที่เผยแพร่ในเอกสารเก่า ไม่ใช่ข้อสอบจริงหรือข้อสอบเก่า",questions:[...legacyReading,...legacyListening]},
 {id:"current-style",title:"แบบจำลองตามแนวหลักสูตรฉบับใหม่",style:"current",description:"ข้อสอบจำลองต้นฉบับใหม่ ครอบคลุมชีวิตประจำวัน งาน และความปลอดภัยตามหัวข้อหลักสูตร EPS-TOPIK ฉบับปรับปรุง 2024/แก้ไข 2026 ไม่ใช่ข้อสอบจริง",questions:[...currentReading,...currentListening]},
] as const;

export const epsSourceDrafts=[
 {slug:"official-public-questions-2025",title:"공개문제집 (Public Question Book)",edition:"2025 public sample set",url:"https://epstopik.hrdkorea.or.kr/epstopik/book/pub/publicWorkBookList.do?lang=ko",format:"HTML catalog; individual HWP questions/answers/scripts; ZIP listening audio",access_status:"Official catalog and download links publicly visible; binary download content not inspected by this audit",answer_audio_status:"Page lists reading answers, listening answers/scripts, and audio downloads",copyright_notes:"Not labelled with a reuse license on the catalog. Keep files external; no copying, conversion, or rehosting without permission.",verification_notes:"Official page states EPS-TOPIK has been 100% confidential since 2013 and the question book is for format familiarization and study; this is sample material, not an authenticated 2025 exam."},
 {slug:"historical-question-book",title:"고용허가제 한국어능력시험 공개문제집 신개정판 / First Revised edition of EPS-TOPIK Question Book",edition:"First revised edition; historical edition commonly dated 2011–2012, but the current official page does not show a publication year",url:"https://www.hrdkorea.or.kr/1/3/3/2/1",format:"Official HTML information page; HWP question/answer/script files and ZIP audio links",access_status:"Public official guide and direct download links; linked binary content not inspected",answer_audio_status:"Official page lists Reading Q/A, Listening Q/A and script, and a ZIP voice file",copyright_notes:"HRDKorea copyright policy prohibits unauthorized copying/distribution and content changes; study externally, do not rehost or transform.",verification_notes:"Official page labels the item First Revised edition. The 2011–2012 dating is not exposed on the current page, so the date is recorded as unconfirmed here."},
 {slug:"reading-archive",title:"공개문제_읽기자료 (Public Question Reading Archive)",edition:"Archive listing, entries 1–10 visible",url:"https://epstopik.hrdkorea.or.kr/epstopik/book/pub/publicBookReading.do?lang=ko",format:"HTML archive listing with linked official reading materials; underlying download format not verified on the listing",access_status:"Public archive listing visible; each item requires opening its detail/download link",answer_audio_status:"Archive list itself does not establish answer key availability",copyright_notes:"HRDKorea policy applies; no reuse license verified for the listed archive items.",verification_notes:"Current page lists 공개문제집1 through 공개문제집10; these are study resources, not evidence of confidential current exam questions."},
 {slug:"listening-archive",title:"공개문제_듣기자료 (Public Question Listening Archive)",edition:"Archive listing, entries 2–11 visible on the current page",url:"https://epstopik.hrdkorea.or.kr/epstopik/book/pub/publicBookListening.do?lang=ko",format:"HTML archive listing with linked official listening materials; underlying file formats not verified on the listing",access_status:"Public archive listing visible; individual files were not fetched/inspected",answer_audio_status:"This is an audio archive; listing does not establish answer-key availability",copyright_notes:"HRDKorea policy applies; no reuse license verified for the listed archive items.",verification_notes:"The public listing is separate from the 2025 sample book and does not authenticate materials as actual recent exams."},
 {slug:"new-standard-textbooks-2024",title:"EPS-TOPIK NEW 한국어 표준교재 (2024 revised standard textbooks)",edition:"2024 revised edition; page reports partial corrections in June 2026",url:"https://epstopik.hrdkorea.or.kr/epstopik/book/std/standardBookList.do?lang=ko",format:"HTML catalog; textbook PDFs distributed as ZIP; separate listening ZIP files",access_status:"Official catalog and file links publicly visible; ZIP contents not downloaded or inspected in this audit",answer_audio_status:"Catalog includes answer/listening-script file and separate Listening ZIPs for books 1 and 2",copyright_notes:"Catalog marks the work KOGL Type 3 (attribution, no modifications). Link to originals; do not adapt or redistribute files as interactive questions.",verification_notes:"The current catalog identifies textbook 1 for everyday life and textbook 2 for work life, and explicitly notes corrections dated June 2026."},
] as const;

# Korean Learning Platform

เครื่องมือเรียนภาษาเกาหลีสำหรับผู้เริ่มต้นที่ใช้ภาษาไทย ออกแบบให้ทำงานบน Windows แบบ local-first และเก็บความคืบหน้าใน SQLite บนเครื่อง

## ระบบปัจจุบัน

- หลักสูตรหลัก 20 บท: Hangul Foundation 10 บท และ Everyday Korean 10 บท พร้อม checkpoint รวม 100 ข้อ
- Teacher Tips แบบเลือกเรียน 5 บท
- Dashboard และ Daily Planner สำหรับวางแผน/บันทึกการเรียน
- Vocabulary SRS พร้อมประวัติการทบทวน
- EPS-TOPIK mock simulator พร้อม Practice Mode และประวัติ attempt
- บทเรียน วิดีโอ/แหล่งอ้างอิง แบบฝึก และความคืบหน้าบันทึกใน SQLite
- AI Tutor endpoint และ provider abstraction ยังอยู่ในระบบ แต่ยังไม่ได้ตั้งค่าใช้งาน AI จริง แอปส่วนอื่นใช้ได้โดยไม่เปิด Tutor

## ความต้องการ

- Windows 10/11
- Node.js 22 ขึ้นไป
- pnpm 12

## เริ่มใช้งานครั้งแรกบน Windows

```powershell
git clone https://github.com/Jeff7563/Korean-Learning-Platform.git
Set-Location Korean-Learning-Platform
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

เปิด `http://127.0.0.1:3000` คำสั่ง `pnpm dev` และ `pnpm start` ผูกกับ loopback เท่านั้น เพื่อใช้ส่วนตัวบนเครื่อง

### เปิดใช้ repository ที่มีฐานข้อมูลผู้เรียนอยู่แล้ว

หยุด server ก่อนสำรองไฟล์ SQLite แล้วตรวจ backup ตาม [ขั้นตอนความปลอดภัยของฐานข้อมูล](docs/DATABASE-SAFETY.md) จากนั้นใช้ `pnpm db:migrate` เมื่อมี migration ใหม่ และเริ่มด้วย `pnpm dev` การ seed ปกติจะไม่เขียนทับข้อ checkpoint ที่เปลี่ยนไปจากฐานข้อมูล หากพบ content drift คำสั่งจะหยุดเพื่อรักษาประวัติ ให้ทบทวนการเปลี่ยนและใช้กระบวนการ `pnpm db:revise-checkpoint` ที่ระบุใน [คู่มือสถาปัตยกรรม](docs/ARCHITECTURE.md)

อย่าใช้ `pnpm db:setup` เป็นคำสั่งเริ่มระบบประจำวัน เพราะคำสั่งนี้ทั้ง migrate และ seed เนื้อหา

## ตรวจคุณภาพ

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Playwright ใช้ SQLite ชั่วคราวแยกจาก `data/korean.db` และเปิด server ของตนเองบน `127.0.0.1:3101` ไม่ใช้ฐานข้อมูลเรียนจริง

## ความปลอดภัยและข้อจำกัดการใช้งาน

แอปนี้ยังไม่มี authentication หรือการแยกเจ้าของข้อมูล API และฐานข้อมูลออกแบบสำหรับผู้ใช้คนเดียวบนเครื่องส่วนตัวเท่านั้น การ bind ที่ `127.0.0.1` ไม่ได้ทำให้ระบบปลอดภัยสำหรับ public deployment หรือการใช้งานหลายคน ห้ามเปิดพอร์ตสู่ LAN/อินเทอร์เน็ตหรือ deploy แบบสาธารณะ ก่อนรองรับการใช้งานร่วมกันต้องออกแบบบัญชี/session, ownership checks สำหรับ progress, Tutor และ exam attempts, authorization, rate limiting และการจัดการฐานข้อมูลถาวรเสียก่อน

สำรองข้อมูล SQLite ไว้นอก repository และอย่าใช้ seeder เพื่อกู้คืนข้อมูล ดู [DATABASE-SAFETY.md](docs/DATABASE-SAFETY.md) และ [WINDOWS-DEV-SERVER.md](docs/WINDOWS-DEV-SERVER.md)

การเชื่อมต่อ AI จริงยังไม่ได้ตั้งค่าหรือยืนยันผล ส่วนสื่อภายนอกขึ้นกับการเข้าถึงและเงื่อนไขของเจ้าของแหล่งข้อมูล รายละเอียดหลักสูตรและสื่ออยู่ใน [CURRICULUM.md](docs/CURRICULUM.md) และ [MEDIA-SOURCES.md](docs/MEDIA-SOURCES.md)

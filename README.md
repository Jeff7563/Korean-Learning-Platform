# Korean Learning Platform

แอปเรียนภาษาเกาหลีสำหรับผู้เริ่มต้นภาษาไทย พร้อมหลักสูตรฮันกึล 10 บท แบบทดสอบที่ให้คะแนนฝั่งเซิร์ฟเวอร์ เช็กลิสต์กิจกรรม และการบันทึกความคืบหน้าใน SQLite บนเครื่อง

## ความต้องการ

- Windows 10/11, Node.js 22 ขึ้นไป และ pnpm 12
- AI Tutor ต้องใช้ Ollama ที่เปิดใช้งานพร้อมโมเดล หรือ OpenAI API ที่ตั้งค่าคีย์ไว้ (ส่วนหลักสูตรทำงานได้โดยไม่ต้องมี AI)

## เริ่มใช้งานบน Windows

```powershell
git clone https://github.com/Jeff7563/Korean-Learning-Platform.git
cd Korean-Learning-Platform
pnpm install
Copy-Item .env.example .env.local
```

เปิด `.env.local` แล้วตั้ง `AI_PROVIDER` และโมเดลตามต้องการ หากใช้ Ollama ให้ติดตั้งและเปิด Ollama แยกต่างหาก จากนั้นกำหนด `OLLAMA_MODEL` ให้ตรงกับโมเดลที่มีอยู่ในเครื่อง หากยังไม่ตั้งค่า Tutor จะแจ้งสถานะการตั้งค่าอย่างชัดเจน

```powershell
pnpm db:setup
pnpm dev
```

เปิด [http://localhost:3000](http://localhost:3000) ฐานข้อมูลอยู่ที่ `data/korean.db` และถูกละเว้นจาก Git การสั่ง `pnpm db:setup` ซ้ำจะอัปเดตเนื้อหาโดยคงความคืบหน้าเดิม

## ตรวจสอบคุณภาพ

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Playwright อาจต้องติดตั้ง browser ครั้งแรกด้วย `pnpm exec playwright install chromium` การทดสอบ E2E จะเปิด dev server และใช้ฐานข้อมูลเดียวกับการพัฒนา จึงไม่ควรใช้กับข้อมูลที่ต้องการเก็บไว้

## ฟังก์ชัน

- Dashboard แนะนำบทถัดไปและแสดงข้อมูลจาก SQLite
- หลักสูตร 5 ระยะ โดยมีเนื้อหาพร้อมเรียนจริงเฉพาะ Hangul Foundation; ระยะอื่นแสดงว่าเป็นแผน
- บทเรียนฮันกึล 10 บทพร้อมคำอธิบายภาษาไทย กิจกรรม คำศัพท์ และ checkpoint อย่างน้อย 5 ข้อ
- บทแรกมีวิดีโอจากช่อง King Sejong Institute Foundation ผ่าน YouTube embed และลิงก์สำรองไปยังหน้าต้นฉบับ
- เช็กลิสต์ แบบทดสอบ ประวัติคำตอบผิด และการตั้งค่าเก็บใน SQLite
- AI Tutor รองรับ Ollama และ OpenAI Chat Completions ผ่าน server-side endpoint; ไม่มีการส่งคีย์ไปหน้าเว็บ
- เวลาเรียนตามตารางจันทร์–เสาร์ 18:00–19:30, Asia/Bangkok; วันอาทิตย์เป็นวันพัก/สื่อเกาหลีตามสมัครใจ

## ข้อจำกัดที่ทราบ

- MVP ใช้ผู้เรียนคนเดียวในเครื่อง ไม่มีระบบบัญชีหรือสำรอง/ซิงก์ข้อมูล
- ตรวจได้เพียงว่ามีการตั้งค่า AI จาก environment; การเชื่อมต่อจริงตรวจเมื่อส่งคำถาม และต้องมีผู้ให้บริการทำงาน
- มีเนื้อหาที่เขียนไว้ครบเฉพาะฮันกึล 10 บท ไม่มีเนื้อหาปลอมในอีกสี่ระยะ
- วิดีโออาจไม่อนุญาตให้ฝังในบางเครือข่าย/เบราว์เซอร์ จึงมีลิงก์ไป YouTube ต้นฉบับ
- SQLite บนเครื่องเหมาะกับการพัฒนาและใช้งานคนเดียว; โฮสต์ serverless แบบไม่เก็บดิสก์ต้องย้ายไปฐานข้อมูล hosted ที่รองรับการเขียนถาวร

## GitHub

Repository: [Jeff7563/Korean-Learning-Platform](https://github.com/Jeff7563/Korean-Learning-Platform) · branch เริ่มต้น `main`

# 🏫 KruSmart - ระบบบริหารงานวัดผลและตัดเกรดครูมืออาชีพ

ระบบรวมศูนย์สำหรับครูผู้สอนหลายวิชาและหลายระดับชั้น จัดการงาน เช็คสถานะส่งงาน ปลดล็อกกรอกคะแนน ตัดเกรดอัตโนมัติ เช็คชื่อคำนวณ มส. ไทม์ไลน์บันทึกการสอน คลังใบงาน AI และระบบตรวจสอบติดตามงานสำหรับนักเรียน

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green.svg)
![React](https://img.shields.io/badge/react-19.0-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)
![Tailwind](https://img.shields.io/badge/tailwindcss-v4-purple.svg)

---

## ✨ คุณสมบัติเด่นของระบบ (Core Features)

1. **📊 หน้าแรก & ภาพรวม (Dashboard & Quick Tracker):**
   - สรุปสถิติภาพรวมคะแนน เกรด และอัตราการส่งงาน
   - ตารางติดตามทวงงานแบบเลือกหลายเงื่อนไข (ตามห้อง, ตามชิ้นงาน, ตามสถานะ)
   - พิมพ์แบบบันทึกและส่งออกข้อมูล

2. **⏱️ เช็คชื่อ & คำนวณ มส. (Attendance & Exam Eligibility):**
   - บันทึกเวลาเรียนประจำคาบ (มา, สาย, ลา, ขาด)
   - คำนวณร้อยละเวลาเรียนอัตโนมัติ พร้อมตรวจจับนักเรียนที่มีเวลาเรียนต่ำกว่า 80% (ติด มส.) และกลุ่มเสี่ยง (80-85%)

3. **📝 ไทม์ไลน์บันทึกการสอน (Teaching Log Timeline):**
   - บันทึกกิจกรรมการเรียนการสอนรายคาบ (วันนี้สอนอะไร, ผลการจัดกิจกรรม, ปัญหาและแนวทางแก้ไข)
   - ผู้ช่วย AI ช่วยร่างและสรุปบันทึกหลังสอนอัตโนมัติ

4. **✍️ งาน วัดผล & ปพ.5 (Submissions & Grading):**
   - **เช็คสถานะส่งงาน:** บันทึก ส่งแล้ว, ส่งช้า, ยังไม่ส่ง, ยกเว้น
   - **กรอกคะแนน ปพ.5:** ล็อกช่องคะแนนอัตโนมัติหากนักเรียนยังไม่ส่งงาน ป้องกันความผิดพลาด
   - **สรุปตัดเกรดอัตโนมัติ:** ตัดเกรด 0 - 4 (และเกรด 1.5, 2.5, 3.5) ตามเกณฑ์ ปพ.5 พร้อมส่งออก Excel
   - **สัดส่วนคะแนน 4 ช่วง:** รองรับสัดส่วน ก่อนกลางภาค / กลางภาค / หลังกลางภาค / ปลายภาค

5. **📚 หลักสูตร & คลังสื่อ (Curriculum & Drive):**
   - โครงสร้างหลักสูตร 3 ชั้น: บทเรียน (Unit) ➔ เรื่อง (Topic) ➔ งานย่อย (Sub-task)
   - คลังสื่อ & สร้างใบงาน AI: ไดร์ฟจัดเก็บไฟล์สื่อการสอน และระบบสร้างใบงานพร้อมเฉลยด้วย Google Gemini

6. **🛡️ ตรวจสอบ & ติดตามขั้นสูง (Audit Trail & Tracking):**
   - **ระบบทวงงาน 1 คลิก (One-Click Follow-up):** คัดลอกข้อความทวงงานสรุปรายบุคคล หรือสรุปทั้งห้องสำหรับส่งผ่าน LINE / แชต ได้ทันที
   - **ดัชนีความกระตือรือร้น 4 ระดับ (SEI):** แบ่งกลุ่มนักเรียนตามเกณฑ์ (🌟 ดาวเด่น, 🟢 สม่ำเสมอ, 🟡 ชะลอตัว, 🔴 วิกฤต/ต้องการช่วยเหลือด่วน)
   - **ระบบตรวจสอบความโปร่งใส (Anti-Cheating & Integrity Radar):** จับเวลาการอ่านใบงานจริง (Read Time Tracking) และตรวจจับการเข้าตรวจงานยามวิกาล (🌙 23:00 - 05:00 น.)

7. **🎨 ธีมสีพาสเทล & โหมดมืด/สว่าง (Pastel Palette & Dark/Light Mode):**
   - ออกแบบด้วยชุดสีพาสเทลสบายตา (Lavender, Mint, Sky, Peach, Rose)
   - สลับโหมด Dark/Light ได้สะดวกรวดเร็วตลอดเวลา

8. **📧 ระบบแจ้งเตือนข้อขัดข้อง:**
   - Global Error Boundary ดักจับข้อผิดพลาดพร้อมปุ่มส่งรายงานตรงไปยัง `nawaratk65@gmail.com` ทันที

---

## 🚀 วิธีนำโปรเจกต์ขึ้น GitHub (Push to GitHub)

หากคุณต้องการนำโค้ดนี้ไปเปิดเป็น Repository บน GitHub ให้ทำตามขั้นตอนดังนี้:

### 1. เตรียม Git Repository บนเครื่องของคุณ
เปิด Terminal ในโฟลเดอร์ของโปรเจกต์ แล้วรันคำสั่ง:

```bash
# ตรวจสอบสถานะ git (หากยังไม่ได้ init ให้สั่ง git init)
git init

# เพิ่มไฟล์ทั้งหมดเข้าสู่ Staging
git add .

# บันทึก Commit แรก
git commit -m "feat: initial commit KruSmart school management system"

# ตั้งชื่อ branch หลักเป็น main
git branch -M main
```

### 2. ลิงก์กับ GitHub Repository
สร้าง Repository ใหม่บน [GitHub](https://github.com/new) (ไม่ต้องติ๊ก Add a README หรือ .gitignore เพราะมีในโปรเจกต์แล้ว) จากนั้นรันคำสั่ง:

```bash
# เปลี่ยน <username> และ <repo-name> เป็นของบัญชีคุณ
git remote add origin https://github.com/<username>/<repo-name>.git

# Push โค้ดขึ้นสู่ GitHub
git push -u origin main
```

---

## 💻 วิธีการติดตั้งและรันในเครื่อง (Local Setup)

### ความต้องการของระบบ (Prerequisites)
- **Node.js**: เวอร์ชัน 20.x หรือ 22.x ขึ้นไป ([ดาวน์โหลด Node.js](https://nodejs.org/))
- **npm** หรือ **yarn** หรือ **bun**

### ขั้นตอนการรัน (Step-by-Step)

1. **โคลนโปรเจกต์ลงมา:**
   ```bash
   git clone https://github.com/<username>/<repo-name>.git
   cd <repo-name>
   ```

2. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```

3. **ตั้งค่า Environment Variables:**
   คัดลอกไฟล์ตัวอย่าง `.env.example` ไปเป็น `.env`:
   ```bash
   cp .env.example .env
   ```
   จากนั้นแก้ไขค่าในไฟล์ `.env` ตามต้องการ:
   ```env
   GEMINI_API_KEY="your-google-gemini-api-key"
   PORT=3000
   ```
   *(หมายเหตุ: สามารถรับ API Key ของ Gemini ได้ฟรีที่ [Google AI Studio](https://aistudio.google.com/))*

4. **เริ่มรันโปรแกรมในโหมด Development:**
   ```bash
   npm run dev
   ```
   เปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

---

## 🛠️ คำสั่ง Scripts ที่สำคัญในโปรเจกต์

| คำสั่ง | การทำงาน |
|---|---|
| `npm run dev` | รันเซิร์ฟเวอร์โหมด Development (Full-stack พร้อม Express + Vite Hot-Reload) |
| `npm run build` | คอมไพล์โปรเจกต์ Frontend สำหรับ Production ไปยังโฟลเดอร์ `dist/` |
| `npm run lint` | ตรวจสอบข้อผิดพลาดของ TypeScript types ด้วย `tsc --noEmit` |
| `npm start` | รันโปรดักชันเซิร์ฟเวอร์ (`node server.ts`) สำหรับเสิร์ฟแอปพลิเคชัน |
| `npm run preview` | พรีวิวผลลัพธ์ของโฟลเดอร์ `dist/` ก่อนนำขึ้นเซิร์ฟเวอร์จริง |

---

## 🐳 การรันด้วย Docker (Docker Deployment)

โปรเจกต์นี้มี `Dockerfile` สำหรับการสร้าง Container พร้อมใช้งาน:

```bash
# 1. Build Docker Image
docker build -t krusmart-app .

# 2. Run Container
docker run -d -p 3000:3000 -e GEMINI_API_KEY="your-api-key" --name krusmart krusmart-app
```
เข้าใช้งานผ่าน `http://localhost:3000`

---

## ☁️ การนำไป Deploy บน Cloud (Deployment Guides)

### 1. Cloudflare Pages (แนะนำสำหรับโฮสติ้งฟรี เร็วทั่วโลก)
อ่านคู่มือฉบับเต็มได้ที่ [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**ข้อควรระวังสำคัญเพื่อไม่ให้ติด Error `MIME type ""`:**
- **หากเชื่อมผ่าน GitHub:** ในหน้าตั้งค่า Cloudflare Pages ให้กำหนด:
  - **Framework preset:** `Vite`
  - **Build command:** `npm run build`
  - **Build output directory:** `dist`
- **หากลากไฟล์อัปโหลดตรง (Direct Upload):** ให้ลากเฉพาะโฟลเดอร์ `dist` เข้าไป (ห้ามลากโฟลเดอร์หลัก)
- มีไฟล์ `_headers`, `_redirects`, และ `wrangler.toml` รองรับ Single Page App และ Serverless Functions ครบถ้วนแล้ว

### 2. Render / Railway / Fly.io / VPS
- กำหนด **Build Command:** `npm install && npm run build`
- กำหนด **Start Command:** `npm start`
- กำหนด **Environment Variables:** `PORT=3000` และ `GEMINI_API_KEY=...`

### 2. Google Cloud Run
โปรเจกต์รองรับ Dynamic `PORT` จาก Cloud Run โดยตรง สามารถ Deploy ได้ง่ายผ่าน Google Cloud Console หรือคำสั่ง:
```bash
gcloud run deploy krusmart \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="your-key"
```

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI Workflow (ตรวจ Build & Lint อัตโนมัติ)
├── src/
│   ├── components/
│   │   ├── common/            # ส่วนประกอบหลัก (Header, Sidebar, ErrorBoundary, ErrorModal)
│   │   ├── student/           # หน้าเว็บสำหรับนักเรียน (StudentPortal, ตรวจงาน, อ่านใบงาน)
│   │   └── teacher/           # หน้าเว็บครูผู้สอน (Dashboard, ปพ.5, มส., ไทม์ไลน์, Logs)
│   ├── context/
│   │   └── AppContext.tsx     # ศูนย์กลาง State Management, Dark Mode, Theme และ Sync ข้อมูล
│   ├── data/
│   │   └── initialData.ts     # โครงสร้างและข้อมูลเริ่มต้น
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces & types ทั้งหมด
│   ├── firebase.ts            # การเชื่อมต่อ Firebase Firestore & Auth
│   ├── firebaseErrors.ts      # ระบบจัดการข้อผิดพลาด Firebase
│   ├── index.css              # สไตล์ Tailwind CSS v4 และโทนสีพาสเทล
│   └── main.tsx               # Entry point ของ React
├── Dockerfile                 # Docker configuration สำหรับ Containerization
├── .dockerignore              # Ignore files สำหรับ Docker build
├── .env.example               # ตัวอย่างการตั้งค่า Environment Variables
├── firestore.rules            # กฎความปลอดภัย Firestore Security Rules
├── package.json               # รายการ Dependencies และ Scripts
├── server.ts                  # Backend Server (Express + Gemini API Proxy + Static Serving)
└── vite.config.ts             # การตั้งค่า Vite build tool
```

---

## 🛡️ การติดต่อและรายงานปัญหา (Support & Bug Report)

หากพบข้อขัดข้องในการใช้งานระบบ มีข้อผิดพลาด 503 หรือต้องการเสนอแนะฟังก์ชันเพิ่มเติม:
- **อีเมลผู้ดูแล:** [nawaratk65@gmail.com](mailto:nawaratk65@gmail.com)
- หรือกดปุ่ม **"แจ้งปัญหา"** จากแถบเมนูด้านบนของเว็บไซต์เพื่อสร้างรายงานอัตโนมัติ

# คู่มือการติดตั้งและ Deploy KruSmart (GitHub & Cloudflare Pages)

## 📌 สาเหตุของ Error ที่เกิดขึ้นก่อนหน้านี้
```
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "". Strict MIME type checking is enforced for module scripts per HTML spec.
```

**สาเหตุ:** 
เกิดจากการอัปโหลดโฟลเดอร์โปรเจกต์ทั้งหมด (Root Folder) ไปยัง Cloudflare Pages โดยตรง ซึ่งในโฟลเดอร์หลักมีไฟล์ `index.html` ที่เรียก `<script type="module" src="/src/main.tsx"></script>`:
1. เว็บบราวเซอร์ไม่สามารถรันไฟล์ TypeScript/React (`.tsx`) ดิบ ๆ ได้
2. เว็บเซิร์ฟเวอร์แบบ Static ของ Cloudflare Pages ไม่รู้จักนามสกุลไฟล์ `.tsx` จึงส่ง Header `Content-Type: ""` (ว่างเปล่า) กลับมา
3. บราวเซอร์มีมาตรฐานความปลอดภัยเข้มงวด (Strict MIME Type Checking) เมื่อพบว่า MIME Type ไม่ใช่ `application/javascript` จึงสั่งระงับการทำงานทันที

---

## 🛠️ สิ่งที่ระบบได้เตรียมและแก้ไขให้แล้วอย่างครบถ้วน

1. **โฟลเดอร์ `dist/` บิลด์สำเร็จพร้อมใช้งานทันที:**
   - โค้ดทั้งหมดถูกคอมไพล์เป็น Vanilla JavaScript และ CSS มาตรฐานเรียบร้อยแล้ว
   - บันเดิลอยู่ใน `dist/assets/` พร้อมใช้งานทันที

2. **การตั้งค่า MIME Type (`_headers` และ `public/_headers`):**
   - กำหนด `Content-Type: application/javascript; charset=utf-8` ให้กับไฟล์ `.js` ทุกไฟล์
   - กำหนด `Content-Type: text/css; charset=utf-8` ให้กับไฟล์ `.css`
   - ใส่ Header ความปลอดภัย `X-Content-Type-Options: nosniff`

3. **การตั้งค่า Single Page Application (`_redirects` และ `public/_redirects`):**
   - รองรับการรีเฟรชหน้าเว็บไม่ให้ติด 404 (`/* /index.html 200`)
   - มี fallback rules ในกรณีอัปโหลดโฟลเดอร์โปรเจกต์ ให้เรียก `/dist/index.html` โดยอัตโนมัติ

4. **Cloudflare Pages Serverless Functions (`functions/api/gemini/[[path]].ts`):**
   - รองรับฟังก์ชัน AI ของ Gemini ทั้ง 6 ตัว ให้รันแบบ Edge Serverless บน Cloudflare ได้ทันทีโดยไม่ต้องมี Node.js Server:
     - บันทึกความเห็น ปพ.5 (`/api/gemini/generate-comment`)
     - ออกแบบใบงาน/ภาระงาน (`/api/gemini/generate-assignment`)
     - วิเคราะห์ห้องเรียนและแผนซ่อมเสริม (`/api/gemini/analyze-class`)
     - แปลงรายชื่อนักเรียนจาก Excel/SchoolMIS (`/api/gemini/parse-roster`)
     - สร้างใบงานมาตรฐานพร้อมเฉลย (`/api/gemini/generate-worksheet`)
     - บันทึกหลังสอน/กิจกรรมการเรียนรู้ (`/api/gemini/generate-lesson-log`)

5. **Cloudflare Configuration (`wrangler.toml`, `.node-version`, `.nvmrc`):**
   - กำหนด `pages_build_output_dir = "dist"`
   - กำหนดคำสั่งบิลด์ `npm run build`
   - ล็อกเวอร์ชัน Node.js 20 LTS

6. **GitHub Actions CI/CD (`.github/workflows/ci.yml`):**
   - ตรวจสอบโค้ดและรันบิลด์อัตโนมัติทุกครั้งที่มีการ Push ขึ้น GitHub

---

## 🚀 วิธีนำโปรเจกต์ขึ้น Cloudflare Pages

### 🌟 วิธีที่ 1: เชื่อมต่อผ่าน GitHub (แนะนำที่สุด - อัปเดตอัตโนมัติเมื่อ Push โค้ด)
1. นำโฟลเดอร์โปรเจกต์นี้ Push ขึ้น GitHub Repository ของคุณ:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for KruSmart"
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git branch -M main
   git push -u origin main
   ```
2. ไปที่ [Cloudflare Dashboard](https://dash.cloudflare.com/) -> เลือก **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**
3. เลือก Repository ที่เพิ่ง Push ขึ้นไป
4. ตั้งค่าหน้า **Build configuration**:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (ปล่อยว่างไว้)
5. (ไม่บังคับ แต่แนะนำสำหรับฟังก์ชัน AI) เพิ่ม **Environment Variable**:
   - ในหน้า Settings -> Environment variables -> เพิ่มตัวแปร `GEMINI_API_KEY` พร้อมใส่ API Key ของคุณ
6. กด **Save and Deploy** รอประมาณ 1 นาที เว็บจะออนไลน์พร้อมใช้งานทันที!

---

### 📦 วิธีที่ 2: อัปโหลดโดยตรง (Direct Upload / Drag & Drop)
1. ตรวจสอบให้แน่ใจว่าโฟลเดอร์ `dist` ถูกสร้างแล้ว (หากรันในคอมให้พิมพ์ `npm run build`)
2. ไปที่ [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Workers & Pages** -> **Create application** -> **Pages** -> เลือกแท็บ **Upload assets**
3. ตั้งชื่อโปรเจกต์ เช่น `smart-grade`
4. **จุดสำคัญ:** ให้ **ลากเฉพาะโฟลเดอร์ `dist`** เข้าไปปล่อย (ไม่ใช่โฟลเดอร์นอกสุด)
5. กด **Deploy site** ใช้งานได้ทันที 100%!

---

## 💻 การรันบนเครื่องคอมพิวเตอร์ (Local Development)
```bash
# ติดตั้ง dependencies
npm install

# รันโหมด Development (Full-stack พร้อม Vite + Server)
npm run dev

# บิลด์สำหรับ Production
npm run build

# ทดสอบรัน Production Server
npm start
```

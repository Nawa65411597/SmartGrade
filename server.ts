import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const GEMINI_MODEL = 'gemini-3.8-flash';

// 1. AI Student Report & ปพ.5 Comment Generator
app.post('/api/gemini/generate-comment', async (req, res) => {
  try {
    const { studentName, seatNumber, studentCode, grade, totalScore, completionRate, pendingCount, periodScores } = req.body;

    const prompt = `คุณคือครูผู้เชี่ยวชาญการศึกษาไทยระดับแนวหน้า กรุณาเขียนความเห็นครูประจำชั้น / บันทึกผลการเรียนรู้และคำแนะนำพัฒนาการรายบุคคล (สำหรับ ปพ.5 และการแจ้งผู้ปกครอง)
ข้อมูลนักเรียน:
- ชื่อ: ${studentName} (เลขที่ ${seatNumber}, รหัส ${studentCode})
- ผลการเรียนรวม: เกรด ${grade} (คะแนนรวม ${totalScore}/100)
- อัตราการส่งงาน: ${completionRate}% (งานค้าง ${pendingCount} ชิ้น)
- คะแนนรายช่วง: ก่อนกลางภาค: ${periodScores?.preMidterm || '-'}, กลางภาค: ${periodScores?.midterm || '-'}, หลังกลางภาค: ${periodScores?.postMidterm || '-'}, ปลายภาค: ${periodScores?.final || '-'}

คำสั่ง:
1. เขียนความคิดเห็นที่เป็นทางการ สุภาพ เสริมสร้างกำลังใจ (เชิงบวก) และสะท้อนผลการเรียนรู้ที่แท้จริง
2. หากมีงานค้างหรือคะแนนต่ำ ให้ระบุข้อควรพัฒนาและวิธีช่วยเหลือซ่อมเสริมอย่างสร้างสรรค์
3. ให้ความยาวประมาณ 2-4 บรรทัด เหมาะสำหรับพิมพ์ลงในช่องความเห็น ปพ.5 หรือสมุดพก
ตอบเฉพาะข้อความความคิดเห็นภาษาไทย โดยไม่ต้องมีคำนำหรือข้อความเปิด/ปิดอื่น`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    res.json({ comment: response.text?.trim() || '' });
  } catch (error) {
    console.error('Error generating AI comment:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate AI comment' });
  }
});

// 2. AI Assignment & Rubric Generator
app.post('/api/gemini/generate-assignment', async (req, res) => {
  try {
    const { subjectName, gradeLevel, topicTitle, period, targetScore } = req.body;

    const prompt = `คุณคือครูผู้เชี่ยวชาญการออกแบบการจัดการเรียนรู้และการวัดผลประเมินผลตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน
ช่วยออกแบบภาระงาน/ชิ้นงานย่อย พร้อมเกณฑ์การให้คะแนนรูบริก (Rubric Scoring Guide):
- วิชา: ${subjectName || 'วิชาทั่วไป'}
- ระดับชั้น: ${gradeLevel || 'มัธยมศึกษา'}
- สาระ/บท/เรื่อง: ${topicTitle}
- ช่วงการประเมิน: ${period === 'pre_midterm' ? 'ก่อนกลางภาค' : period === 'midterm' ? 'กลางภาค' : period === 'post_midterm' ? 'หลังกลางภาค' : 'ปลายภาค'}
- คะแนนเต็มที่ตั้งไว้: ${targetScore || 10} คะแนน

กรุณาตอบเป็น JSON รูปแบบนี้เท่านั้น:
{
  "title": "ชื่องาน/ใบงานย่อยที่น่าสนใจและตรงตัวชี้วัด",
  "category": "หมวดหมู่งาน (เช่น ใบงาน, ชิ้นงาน, แบบฝึกหัด, โครงงาน)",
  "suggestedMaxScore": 10,
  "description": "คำอธิบายภาระงานและคำชี้แจงสำหรับนักเรียนอย่างชัดเจน",
  "subTasks": ["งานย่อยที่ 1...", "งานย่อยที่ 2..."],
  "rubric": [
    { "criteria": "ความถูกต้องของเนื้อหา", "score": 4, "description": "ถูกต้องครบถ้วนตามหลักการ" },
    { "criteria": "กระบวนการทำงาน/ความคิดสร้างสรรค์", "score": 3, "description": "มีความประณีตและคิดเป็นระบบ" },
    { "criteria": "การตรงต่อเวลาและความรับผิดชอบ", "score": 3, "description": "ส่งงานตามกำหนดเวลา" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Error generating AI assignment:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate AI assignment' });
  }
});

// 3. AI Class Diagnostic & Remedial Plan Recommender
app.post('/api/gemini/analyze-class', async (req, res) => {
  try {
    const { subjectName, className, totalStudents, passCount, failCount, meanScore, atRiskStudents, pendingAssignments } = req.body;

    const prompt = `คุณคือศึกษานิเทศก์และผู้เชี่ยวชาญด้านการวัดผลวิเคราะห์ข้อมูลชั้นเรียน
ช่วยวินิจฉัยผลสัมฤทธิ์ทางการเรียนและเสนอแผนช่วยเหลือซ่อมเสริม (Intervention Plan) สำหรับห้องเรียนนี้:
- วิชา: ${subjectName} ห้อง: ${className}
- นักเรียนทั้งหมด: ${totalStudents} คน, ผ่านเกณฑ์: ${passCount} คน, ไม่ผ่าน: ${failCount} คน, คะแนนเฉลี่ย: ${meanScore}
- นักเรียนกลุ่มเสี่ยง/ต้องการการดูแลพิเศษ: ${JSON.stringify(atRiskStudents?.slice(0, 8) || [])}
- งานที่มีนักเรียนค้างส่งมากที่สุด: ${JSON.stringify(pendingAssignments?.slice(0, 5) || [])}

ตอบกลับเป็น JSON ดังนี้:
{
  "summary": "บทวิเคราะห์ภาพรวมผลการเรียนรู้ของห้องใน 2-3 บรรทัด",
  "rootCauses": ["สาเหตุหลักที่อาจส่งผลต่องานค้างหรือคะแนนต่ำ..."],
  "recommendedInterventions": [
    { "targetGroup": "กลุ่มเสี่ยง/ค้างงานสะสม", "action": "แนวทางปฏิบัติการสอนซ่อมเสริมที่ครูควรทำทันที" },
    { "targetGroup": "กลุ่มปานกลาง", "action": "แนวทางกระตุ้นการส่งงานและยกระดับเกรด" },
    { "targetGroup": "กลุ่มคะแนนดีเยี่ยม", "action": "กิจกรรมส่งเสริมการเป็นพี่เลี้ยงช่วยเพื่อน (Peer Tutor)" }
  ],
  "quickTips": ["ข้อแนะนำสั้นๆ 2-3 ข้อสำหรับครูผู้สอน"]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Error analyzing class with AI:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to analyze class' });
  }
});

// 4. AI Roster Parser & Cleaner (Parses messy Excel/SchoolMIS/PDF copied text)
app.post('/api/gemini/parse-roster', async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const prompt = `แปลงข้อความรายชื่อนักเรียนต่อไปนี้ที่คัดลอกมาจาก Excel, SchoolMIS, SGS หรือเอกสารอื่น ให้เป็นตารางข้อมูลนักเรียนที่ถูกต้องและสมบูรณ์
ข้อความต้นฉบับ:
"""
${rawText.slice(0, 10000)}
"""

คำสั่ง:
1. ดึงข้อมูล:
   - seatNumber (เลขที่): เป็นตัวเลข (หากไม่มี ให้รัน 1, 2, 3...)
   - studentCode (รหัสนักเรียน/รหัสประจำตัว): ตัวเลข 4-10 หลัก (หากไม่มี ให้สร้างรหัสสมมุติขึ้นต้นด้วย 5xxxx)
   - prefix (คำนำหน้า): แยกให้ชัดเจน เช่น "เด็กชาย", "เด็กหญิง", "นาย", "นางสาว" (หากในชื่อมีคำนำหน้าติดมา ให้แยกออกมา)
   - fullName (ชื่อ-นามสกุล): ชื่อและนามสกุลโดยไม่มีคำนำหน้า
   - gender (เพศ): "male" (ถ้าเป็นเด็กชาย หรือ นาย) หรือ "female" (ถ้าเป็นเด็กหญิง หรือ นางสาว)
   - note (หมายเหตุ ถ้ามี)
2. กรองบรรทัดหัวตารางหรือข้อความที่ไม่ใช่รายชื่อนักเรียนออกไป

ตอบเป็น JSON array เท่านั้น:
[
  {
    "seatNumber": 1,
    "studentCode": "52101",
    "prefix": "เด็กชาย",
    "fullName": "สมคิด สดใส",
    "gender": "male",
    "note": ""
  }
]`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const students = JSON.parse(response.text || '[]');
    res.json({ students });
  } catch (error) {
    console.error('Error parsing roster with AI:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to parse roster with AI' });
  }
});

// 5. AI Worksheet & Educational Material Generator
app.post('/api/gemini/generate-worksheet', async (req, res) => {
  try {
    const { subjectName, gradeLevel, unitTitle, topicTitle, difficulty, questionCount, schoolName } = req.body;

    const count = Number(questionCount) || 5;
    const diffText = difficulty === 'hard' ? 'ระดับท้าทาย/วิเคราะห์ขั้นสูง' : difficulty === 'easy' ? 'ระดับพื้นฐาน/เข้าใจง่าย' : 'ระดับมาตรฐานตามหลักสูตร';

    const prompt = `คุณคือศึกษานิเทศก์และผู้เชี่ยวชาญการสร้างข้อสอบและใบงานมาตรฐานตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน
ช่วยออกแบบใบงานการเรียนรู้ (Worksheet) คุณภาพสูงพร้อมเฉลยและเกณฑ์รูบริก:
- ชื่อสถานศึกษา: ${schoolName || 'โรงเรียน'}
- รายวิชา: ${subjectName || 'วิชาทั่วไป'} ระดับชั้น: ${gradeLevel || 'มัธยมศึกษา'}
- หน่วยการเรียนรู้/บท: ${unitTitle || 'บทเรียน'}
- หัวเรื่อง/สาระสำคัญ: ${topicTitle || 'เรื่องหลัก'}
- ระดับความยาก: ${diffText}
- จำนวนข้อที่ต้องการ: ${count} ข้อ

กรุณาสร้างและตอบกลับเป็น JSON ที่มีโครงสร้างดังนี้เท่านั้น:
{
  "title": "ใบงานเรื่อง...",
  "gradeLevel": "${gradeLevel || 'มัธยมศึกษา'}",
  "subjectName": "${subjectName || 'วิชา'}",
  "instructions": "คำชี้แจงสำหรับนักเรียนอย่างชัดเจน...",
  "objectives": [
    "จุดประสงค์การเรียนรู้ที่ 1...",
    "จุดประสงค์การเรียนรู้ที่ 2..."
  ],
  "conceptSummary": "สรุปสาระสำคัญสั้นๆ 2-3 บรรทัดเพื่อให้นักเรียนทบทวนก่อนทำใบงาน...",
  "questions": [
    {
      "id": "q-1",
      "type": "multiple_choice",
      "question": "ข้อคำถามปรนัย...",
      "options": ["ก. ...", "ข. ...", "ค. ...", "ง. ..."],
      "correctAnswer": "ก. ... (เหตุผลประกอบสั้นๆ)",
      "points": 1
    },
    {
      "id": "q-2",
      "type": "short_answer",
      "question": "ข้อคำถามอัตนัย/แสดงวิธีทำสั้น...",
      "correctAnswer": "แนวคำตอบและวิธีคิด...",
      "points": 2
    }
  ],
  "answerKeyGuide": "คำอธิบายเฉลยรวมและข้อพึงระวังสำหรับครูผู้สอน...",
  "rubricCriteria": [
    { "criteria": "ความถูกต้องของเนื้อหาและคำตอบ", "score": 4, "description": "ตอบได้ถูกต้องครบถ้วน แสดงวิธีทำชัดเจน" },
    { "criteria": "กระบวนการคิดและการสื่อสารทางวิชาการ", "score": 3, "description": "ใช้ศัพท์และสัญลักษณ์ถูกต้อง เป็นระเบียบ" },
    { "criteria": "ความตรงต่อเวลาและความรับผิดชอบ", "score": 3, "description": "ทำงานสำเร็จเรียบร้อยตามเวลา" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Error generating AI worksheet:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate AI worksheet' });
  }
});

// 6. AI Lesson Timeline & Teaching Log Assistant
app.post('/api/gemini/generate-lesson-log', async (req, res) => {
  try {
    const { subjectName, gradeLevel, unit, topic, sessionNumber } = req.body;

    const prompt = `คุณคือครูผู้เชี่ยวชาญการบันทึกหลังการจัดการเรียนรู้ (Lesson Plan Reflection & Activities Log)
ช่วยร่างกิจกรรมการเรียนการสอนและบันทึกหลังสอนสำหรับคาบเรียนนี้:
- วิชา: ${subjectName} (${gradeLevel})
- คาบที่: ${sessionNumber || 1}
- บท/เรื่อง: ${unit} - ${topic}

ตอบกลับเป็น JSON ดังนี้:
{
  "activities": "1. ขั้นนำ (10 นาที): ...\\n2. ขั้นสอนและกิจกรรม (35 นาที): ...\\n3. ขั้นสรุปและประเมิน (15 นาที): ...",
  "learningOutcomes": "นักเรียนส่วนใหญ่ (>85%) สามารถเข้าใจและปฏิบัติกิจกรรมได้ตามจุดประสงค์การเรียนรู้...",
  "problemsAndSolutions": "ปัญหา: นักเรียนบางคนสับสนเรื่อง... / แนวทางแก้ไข: ให้เพื่อนช่วยเพื่อน (Peer Tutoring) และยกตัวอย่างสถานการณ์จริงเพิ่มเติม"
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Error generating lesson log:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate lesson log' });
  }
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

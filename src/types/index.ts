export type TaskCategory = string; // dynamic categories: การบ้าน, ชิ้นงาน, กิจกรรม, โครงงาน, สมุด, แบบฝึกหัด, etc.

export interface CategoryOption {
  id: string;
  name: string;
  defaultMaxScore: number;
  isExam: boolean;
  color?: string;
}

export type SubmissionStatus = 
  | 'pending'    // ยังไม่ส่ง
  | 'submitted'  // ส่งแล้ว
  | 'late'       // ส่งช้า
  | 'exempt';    // ยกเว้น

export interface GradeCutoff {
  min: number;
  max: number;
  grade: string;
  gpa: number;
  label: string;
}

// 4 Evaluation Periods as requested: ก่อนกลางภาค กลางภาค หลังกลางภาค ปลายภาค
export type EvaluationPeriod = 'pre_midterm' | 'midterm' | 'post_midterm' | 'final';

export interface ScoreProportions {
  preMidterm: number;   // e.g. 30 (ก่อนกลางภาค)
  midterm: number;      // e.g. 20 (กลางภาค)
  postMidterm: number;  // e.g. 30 (หลังกลางภาค)
  final: number;        // e.g. 20 (ปลายภาค)
}

export interface TeacherProfile {
  fullName: string;
  username: string;
  position: string;
  department: string;
  email: string;
  phone?: string;
  academicStanding?: string; // วิทยฐานะ เช่น ชำนาญการพิเศษ
}

export interface SchoolProfile {
  name: string;               // e.g. "โรงเรียนสาธิตวิทยาคม"
  affiliation: string;        // e.g. "สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน"
  areaZone?: string;          // e.g. "สำนักงานเขตพื้นที่การศึกษามัธยมศึกษา กรุงเทพมหานคร เขต 1"
  schoolCode?: string;        // e.g. "1010000001"
  directorName?: string;      // e.g. "ดร.สมศักดิ์ รักการเรียน"
  academicHeadName?: string;  // e.g. "นางวิมล วิชาการ"
  currentTerm: '1' | '2';
  currentAcademicYear: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  defaultProportions: ScoreProportions;
}

export interface UnitDefinition {
  id: string;
  subjectId: string;
  unitNumber: number;
  title: string;              // e.g. "บทที่ 1: จำนวนจริง"
  period: EvaluationPeriod;   // ก่อนกลางภาค หรือ หลังกลางภาค
  targetWeight?: number;      // น้ำหนักคะแนนเก็บของบทนี้ (ถ้ามี)
  description?: string;
}

export interface TopicDefinition {
  id: string;
  unitId: string;
  topicNumber: number;
  title: string;              // e.g. "เรื่องที่ 1: การบวกและลบ"
  description?: string;
}

export interface Subject {
  id: string;
  code: string;           // e.g. "ค22101"
  name: string;           // e.g. "คณิตศาสตร์พื้นฐาน"
  gradeLevel: string;     // e.g. "ม.2"
  classroomId: string;    // e.g. "cls-1"
  academicYear: string;   // e.g. "2567"
  term: '1' | '2';
  color: string;
  credit: number;
  description?: string;
  proportions?: ScoreProportions; // Custom proportions for this subject (defaults to school standard)
}

export interface Classroom {
  id: string;
  name: string;          // e.g. "ม.2/1"
  gradeLevel: string;    // e.g. "ม.2"
  roomNumber?: string;
  advisorName?: string;
}

export interface Student {
  id: string;
  classroomId: string;
  studentCode: string;   // รหัสนักเรียน
  seatNumber: number;    // เลขที่
  prefix: 'เด็กชาย' | 'เด็กหญิง' | 'นาย' | 'นางสาว';
  fullName: string;
  gender: 'male' | 'female';
  note?: string;
}

export interface AssignmentAttachment {
  name: string;
  url: string;      // Base64 data URL or external link
  type: string;     // MIME type or extension e.g. 'application/pdf', 'image/png'
  size?: number;
}

export interface Assignment {
  id: string;
  subjectId: string;
  title: string;
  category: string;
  maxScore: number;
  dueDate: string;        // YYYY-MM-DD
  assignedDate: string;   // YYYY-MM-DD
  description?: string;
  isExam: boolean;        // true = exam -> student can see score; false = regular task
  attachment?: AssignmentAttachment;

  // Hierarchical Organization: บท (Unit) -> เรื่อง (Topic) -> งานย่อย (Sub-task)
  period: EvaluationPeriod; // ก่อนกลางภาค | กลางภาค | หลังกลางภาค | ปลายภาค
  unit?: string;           // e.g. "บทที่ 1: จำนวนจริง"
  topic?: string;          // e.g. "เรื่องที่ 1: การบวกและลบ"
  unitId?: string;
  topicId?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  score: number | null;   // null if not submitted or pending
  submittedAt?: string;
  teacherNote?: string;
  updatedAt: string;
}

export interface PeriodScoreDetail {
  period: EvaluationPeriod;
  periodName: string;
  weight: number;         // e.g. 30
  rawScore: number;       // total raw points obtained
  rawMaxScore: number;    // total max raw points possible
  scaledScore: number;    // normalized score weighted to period weight
  percentage: number;     // rawScore / rawMaxScore * 100
  tasksCount: number;
}

export interface UnitScoreDetail {
  unitName: string;
  period: EvaluationPeriod;
  rawScore: number;
  rawMaxScore: number;
  scaledScore: number;
  targetWeight: number;
  tasksCount: number;
}

export interface StudentScoreSummary {
  student: Student;
  assignmentScores: Record<string, {
    status: SubmissionStatus;
    score: number | null;
    isExam: boolean;
  }>;

  // Detailed breakdowns by 4 periods (ก่อนกลางภาค, กลางภาค, หลังกลางภาค, ปลายภาค)
  preMidtermDetail: PeriodScoreDetail;
  midtermDetail: PeriodScoreDetail;
  postMidtermDetail: PeriodScoreDetail;
  finalDetail: PeriodScoreDetail;

  preMidtermScore: number;  // สัดส่วนก่อนกลางภาค (เช่น เต็ม 30)
  midtermScore: number;     // สัดส่วนกลางภาค (เช่น เต็ม 20)
  postMidtermScore: number; // สัดส่วนหลังกลางภาค (เช่น เต็ม 30)
  finalScore: number;       // สัดส่วนปลายภาค (เช่น เต็ม 20)
  totalCollectedScore: number; // รวมคะแนนเก็บ (ก่อนกลาง + หลังกลาง)

  // Unit breakdown
  unitScores: Record<string, UnitScoreDetail>;

  totalScore: number;             // คะแนนรวมตัดเกรด 100 คะแนน
  grade: string;
  gpa: number;
  submittedCount: number;
  totalAssignmentsCount: number;
  pendingCount: number;
  completionRate: number;
}

// ----------------------------------------------------
// ระบบเช็คชื่อ & คำนวณหมดสิทธิ์สอบ (มส.)
// ----------------------------------------------------
export type AttendanceStatus = 'present' | 'late' | 'leave' | 'absent'; // มา, สาย, ลา, ขาด

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceSession {
  id: string;
  subjectId: string;
  classroomId: string;
  date: string;               // YYYY-MM-DD
  periodNumber: number;       // คาบที่ 1, 2, 3...
  title?: string;             // ชื่อคาบหรือหัวข้อ
  records: Record<string, {
    status: AttendanceStatus;
    note?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentAttendanceSummary {
  student: Student;
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  leaveCount: number;
  absentCount: number;
  effectiveAttendedSessions: number; // present + leave (ตามระเบียบ สพฐ. ถือว่ามีเวลาเรียน) หรือ present + late
  attendancePercentage: number;      // % เวลาเรียนจริง
  isExamIneligible: boolean;         // หมดสิทธิ์สอบ (ติด มส.) เมื่อเวลาเรียน < 80%
  isAtRisk: boolean;                 // เสี่ยงติด มส. เมื่อเวลาเรียน 80% - 85%
  maxAllowedAbsence: number;         // จำนวนครั้งที่ขาดได้สูงสุดตามเกณฑ์ 20%
  remainingAbsenceAllowed: number;   // จำนวนครั้งที่ยังขาดได้อีกก่อนติด มส.
}

// ----------------------------------------------------
// ไทม์ไลน์บันทึกการเรียนการสอน (Teaching Log / Lesson Timeline)
// ----------------------------------------------------
export interface TeachingLog {
  id: string;
  subjectId: string;
  classroomId: string;
  sessionNumber: number;      // คาบเรียนที่ 1, 2, 3...
  date: string;               // YYYY-MM-DD
  unit?: string;              // บทที่
  topic?: string;             // เรื่องที่สอน
  activities: string;         // วันนี้ทำอะไรบ้าง / กิจกรรมการเรียนรู้
  learningOutcomes?: string;  // ผลการจัดกิจกรรมการเรียนรู้
  problemsAndSolutions?: string; // ปัญหา/อุปสรรค และแนวทางแก้ไข
  homeworkOrAssignmentId?: string; // งานหรือแบบฝึกหัดที่สั่งในคาบนี้
  linkedResourceIds?: string[];    // สื่อ/ใบงานที่ใช้ในคาบนี้
  attendanceSessionId?: string;    // ลิงก์กับคาบเช็คชื่อ
  createdAt: string;
}

// ----------------------------------------------------
// ไดร์ฟคลังสื่อ & คลังใบงานครู (Teacher's Teaching Drive & Worksheets)
// ----------------------------------------------------
export type DriveResourceType = 
  | 'worksheet'     // ใบงาน / แบบฝึกหัด
  | 'slide'         // สไลด์นำเสนอ / PowerPoint / PDF
  | 'media_link'    // สื่อคลิป / ลิงก์ภายนอก (YouTube, Canva, เว็บ)
  | 'lesson_plan'   // แผนการจัดการเรียนรู้
  | 'exam'          // แบบทดสอบ / ข้อสอบ
  | 'document';     // เอกสารประกอบการสอน

export interface WorksheetQuestion {
  id: string;
  type: 'multiple_choice' | 'short_answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export interface WorksheetData {
  title: string;
  gradeLevel: string;
  subjectName: string;
  instructions: string;
  objectives?: string[];
  conceptSummary?: string;
  questions: WorksheetQuestion[];
  answerKeyGuide?: string;
  rubricCriteria?: Array<{ criteria: string; score: number; description: string }>;
}

export interface DriveResource {
  id: string;
  subjectId: string;
  classroomId?: string;        // ห้องเรียนที่ได้รับอนุญาต (ระบุเฉพาะห้อง หรือถ้าไม่ระบุจะผูกกับห้องของวิชานั้น)
  title: string;
  type: DriveResourceType;
  unit?: string;
  topic?: string;
  description?: string;
  fileUrl?: string;       // Base64 data URL หรือ external link
  fileName?: string;
  fileSize?: string;
  isPublicToStudents: boolean; // ครูกดอนุญาตให้นักเรียนในห้องดู/ดาวน์โหลดได้
  allowedAt?: string;          // วันเวลาที่ครูกดอนุญาต
  aiGenerated?: boolean;
  worksheetData?: WorksheetData; // หากเป็นใบงานที่ AI สร้างหรือสร้างในระบบ
  createdAt: string;
  updatedAt?: string;
}

// ----------------------------------------------------
// ระบบบันทึกประวัติการใช้งาน (System Activity & Access Logs)
// ----------------------------------------------------
export type ActivityActionType =
  | 'portal_login'            // นักเรียนเข้าสู่ระบบตรวจสอบงาน
  | 'check_scores'             // นักเรียนเข้าตรวจดูคะแนนสอบและเกรด
  | 'check_pending_tasks'      // นักเรียนเข้าตรวจสอบงานที่ค้างส่ง
  | 'check_attendance'         // นักเรียนตรวจสอบเวลาเรียนและสิทธิ์สอบปลายภาค (มส.)
  | 'view_drive_resource'      // นักเรียนเปิดดูสื่อการสอน/ใบงาน
  | 'download_resource'        // นักเรียนดาวน์โหลดสื่อหรือใบงาน
  | 'submit_work'              // นักเรียนส่งงาน/แนบไฟล์งาน
  | 'read_resource_time'       // จับเวลาการอ่านใบงาน/ศึกษาบทเรียน
  | 'portal_session_duration'  // ระยะเวลาอยู่ในระบบตรวจสอบงาน
  | 'integrity_flag'           // ตรวจพบพฤติกรรมผิดปกติ (วิกาล/เปลี่ยนอุปกรณ์)
  | 'followup_sent'            // ครูส่งข้อความติดตามงาน
  | 'teacher_score_entry'      // ครูบันทึก/ปรับปรุงคะแนน ปพ.5
  | 'teacher_attendance_check' // ครูเช็คชื่อประจำคาบ
  | 'teacher_permission_grant' // ครูกดเปิดอนุญาตสื่อ/ใบงานให้นักเรียน
  | 'teacher_alert_sent';      // ครูส่งสัญญาณเตือนติดตามงาน/เวลาเรียน

export interface ActivityDeviceInfo {
  browser: string;
  platform: string;
  isMobile: boolean;
}

export interface UserActivityLog {
  id: string;
  timestamp: string;          // ISO string
  actorType: 'student' | 'teacher' | 'system';
  studentId?: string;
  studentCode?: string;
  studentName?: string;
  classroomId?: string;
  classroomName?: string;
  subjectId?: string;
  subjectName?: string;
  actionType: ActivityActionType;
  title: string;              // หัวข้อสั้น เช่น "เข้าตรวจเช็คงานค้าง", "ดาวน์โหลดใบงานที่ 1"
  details: string;            // รายละเอียดเพิ่มเติม
  durationSeconds?: number;   // ระยะเวลาที่ใช้ (วินาที) สำหรับ read time หรือ session duration
  isIntegrityFlagged?: boolean; // ธงตรวจสอบความโปร่งใส (ผิดปกติ/วิกาล)
  integrityReason?: string;   // เหตุผล เช่น "เข้าใช้งานเวลา 02:45 น. (วิกาล)"
  targetId?: string;          // assignmentId, resourceId, etc.
  targetName?: string;
  deviceInfo?: ActivityDeviceInfo;
  ipInfo?: string;
}

export type ThemeMode = 'light' | 'dark';

export interface SystemErrorReport {
  id: string;
  timestamp: string;
  errorName: string;
  errorMessage: string;
  stack?: string;
  url: string;
  userAgent: string;
  componentName?: string;
  details?: string;
  resolved?: boolean;
}



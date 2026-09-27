import { Subject, Classroom, Student, Assignment, Submission, GradeCutoff, CategoryOption, SchoolProfile, ScoreProportions, TeacherProfile } from '../types';

export const DEFAULT_TEACHER_PROFILE: TeacherProfile = {
  fullName: 'ครูณัฐวุฒิ การศึกษาไทย',
  username: 'krunathawut',
  position: 'ครูผู้สอน',
  department: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
  email: 'teacher@school.ac.th',
  phone: '081-234-5678',
  academicStanding: 'ชำนาญการพิเศษ',
};

export const DEFAULT_GRADE_CUTOFFS: GradeCutoff[] = [
  { min: 80, max: 100, grade: '4', gpa: 4.0, label: 'ดีเยี่ยม' },
  { min: 75, max: 79.99, grade: '3.5', gpa: 3.5, label: 'ดีมาก' },
  { min: 70, max: 74.99, grade: '3', gpa: 3.0, label: 'ดี' },
  { min: 65, max: 69.99, grade: '2.5', gpa: 2.5, label: 'ค่อนข้างดี' },
  { min: 60, max: 64.99, grade: '2', gpa: 2.0, label: 'ปานกลาง' },
  { min: 55, max: 59.99, grade: '1.5', gpa: 1.5, label: 'พอใช้' },
  { min: 50, max: 54.99, grade: '1', gpa: 1.0, label: 'ผ่านเกณฑ์ขั้นต่ำ' },
  { min: 0, max: 49.99, grade: '0', gpa: 0.0, label: 'ต่ำกว่าเกณฑ์' },
];

export const DEFAULT_SCORE_PROPORTIONS: ScoreProportions = {
  preMidterm: 30,   // ก่อนกลางภาค (30 คะแนน)
  midterm: 20,      // กลางภาค (20 คะแนน)
  postMidterm: 30,  // หลังกลางภาค (30 คะแนน)
  final: 20,        // ปลายภาค (20 คะแนน)
};

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  name: 'โรงเรียนสาธิตวิทยาคม',
  affiliation: 'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.)',
  areaZone: 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษา',
  schoolCode: '1010720001',
  directorName: 'ดร.สมศักดิ์ รักการเรียน',
  academicHeadName: 'นางวิมล วิชาการ',
  currentTerm: '1',
  currentAcademicYear: '2567',
  defaultProportions: DEFAULT_SCORE_PROPORTIONS,
};

export const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: 'cat-1', name: 'การบ้าน / แบบฝึกหัด', defaultMaxScore: 10, isExam: false, color: '#3B82F6' },
  { id: 'cat-2', name: 'ใบงาน / ชิ้นงาน', defaultMaxScore: 10, isExam: false, color: '#10B981' },
  { id: 'cat-3', name: 'โครงงาน / รายงาน', defaultMaxScore: 20, isExam: false, color: '#8B5CF6' },
  { id: 'cat-4', name: 'คะแนนสมุด / กิจกรรม', defaultMaxScore: 10, isExam: false, color: '#06B6D4' },
  { id: 'cat-5', name: 'แบบทดสอบย่อย (Quiz)', defaultMaxScore: 10, isExam: true, color: '#F59E0B' },
  { id: 'cat-6', name: 'สอบกลางภาค (Midterm)', defaultMaxScore: 20, isExam: true, color: '#EA580C' },
  { id: 'cat-7', name: 'สอบปลายภาค (Final)', defaultMaxScore: 30, isExam: true, color: '#E11D48' },
];

// Clean slate with empty / minimal structure ready for real school usage
export const INITIAL_CLASSROOMS: Classroom[] = [
  { id: 'cls-1', name: 'ม.2/1', gradeLevel: 'ม.2', roomNumber: '', advisorName: '' }
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-1',
    code: 'ค22101',
    name: 'คณิตศาสตร์พื้นฐาน',
    gradeLevel: 'ม.2',
    classroomId: 'cls-1',
    academicYear: '2567',
    term: '1',
    color: '#3B82F6',
    credit: 1.5,
    description: '',
    proportions: DEFAULT_SCORE_PROPORTIONS,
  }
];

export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_ASSIGNMENTS: Assignment[] = [];
export const INITIAL_SUBMISSIONS: Submission[] = [];
export const INITIAL_ATTENDANCE_SESSIONS: any[] = [];
export const INITIAL_TEACHING_LOGS: any[] = [];
export const INITIAL_DRIVE_RESOURCES: any[] = [];
export const INITIAL_ACTIVITY_LOGS: any[] = [];

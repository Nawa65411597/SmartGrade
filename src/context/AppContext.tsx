import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import {
  Subject,
  Classroom,
  Student,
  Assignment,
  Submission,
  GradeCutoff,
  CategoryOption,
  SubmissionStatus,
  StudentScoreSummary,
  EvaluationPeriod,
  ScoreProportions,
  SchoolProfile,
  TeacherProfile,
  UnitDefinition,
  TopicDefinition,
  PeriodScoreDetail,
  UnitScoreDetail,
  AttendanceStatus,
  AttendanceSession,
  StudentAttendanceSummary,
  TeachingLog,
  DriveResource,
  UserActivityLog,
  ActivityActionType,
  ActivityDeviceInfo,
  ThemeMode,
} from '../types';
import {
  DEFAULT_GRADE_CUTOFFS,
  DEFAULT_CATEGORIES,
  INITIAL_CLASSROOMS,
  INITIAL_SUBJECTS,
  INITIAL_STUDENTS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  DEFAULT_SCORE_PROPORTIONS,
  DEFAULT_SCHOOL_PROFILE,
  DEFAULT_TEACHER_PROFILE,
  INITIAL_ATTENDANCE_SESSIONS,
  INITIAL_TEACHING_LOGS,
  INITIAL_DRIVE_RESOURCES,
  INITIAL_ACTIVITY_LOGS,
} from '../data/initialData';
import { db, auth, testFirebaseConnection } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export type ActiveTabType = 
  | 'dashboard' 
  | 'check_submissions' 
  | 'enter_scores' 
  | 'attendance'
  | 'timeline'
  | 'drive'
  | 'activity_logs'
  | 'assignments' 
  | 'proportions'
  | 'summary' 
  | 'students' 
  | 'classes' 
  | 'tools'
  | 'school_settings';

interface AppContextType {
  mode: 'teacher' | 'student';
  setMode: (mode: 'teacher' | 'student') => void;
  isTeacherAuthenticated: boolean;
  teacherLogin: (password: string) => boolean;
  teacherLogout: () => void;

  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;

  // Theme & Pastel Styling (Light / Dark Mode)
  themeMode: ThemeMode;
  toggleThemeMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;

  // System Error & Glitch Reporting (to nawaratk65@gmail.com)
  systemError: { title: string; message: string; timestamp: string; details?: string } | null;
  reportSystemError: (title: string, message: string, details?: string) => void;
  clearSystemError: () => void;
  showErrorModal: boolean;
  setShowErrorModal: (show: boolean) => void;

  // Sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;

  // School Profile & Configuration
  schoolProfile: SchoolProfile;
  updateSchoolProfile: (patch: Partial<SchoolProfile>) => void;
  
  // Active subject & classroom selection
  selectedSubjectId: string;
  setSelectedSubjectId: (id: string) => void;
  selectedClassroomId: string;
  setSelectedClassroomId: (id: string) => void;

  // Raw data
  subjects: Subject[];
  classrooms: Classroom[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  gradeCutoffs: GradeCutoff[];
  categories: CategoryOption[];
  units: UnitDefinition[];
  topics: TopicDefinition[];
  attendanceSessions: AttendanceSession[];
  teachingLogs: TeachingLog[];
  driveResources: DriveResource[];
  activityLogs: UserActivityLog[];

  // Computed data
  currentSubject: Subject | undefined;
  currentClassroom: Classroom | undefined;
  currentStudents: Student[];
  currentAssignments: Assignment[];
  currentUnits: UnitDefinition[];
  currentScoreProportions: ScoreProportions;
  studentSummaries: StudentScoreSummary[];
  currentAttendanceSessions: AttendanceSession[];
  currentTeachingLogs: TeachingLog[];
  currentDriveResources: DriveResource[];
  classAttendanceSummaries: StudentAttendanceSummary[];

  classStats: {
    mean: number;
    max: number;
    min: number;
    passCount: number;
    failCount: number;
    gradeCounts: Record<string, number>;
  };

  // Actions: Attendance & Exam Ineligibility (มส.)
  addAttendanceSession: (session: Omit<AttendanceSession, 'id' | 'createdAt'>) => void;
  updateAttendanceSession: (id: string, data: Partial<AttendanceSession>) => void;
  deleteAttendanceSession: (id: string) => void;
  recordStudentAttendance: (sessionId: string, studentId: string, status: AttendanceStatus, note?: string) => void;
  batchCheckAttendance: (sessionId: string, status: AttendanceStatus) => void;
  getStudentAttendanceSummary: (studentId: string, subjectId?: string) => StudentAttendanceSummary;

  // Actions: Teaching Logs / Timeline
  addTeachingLog: (log: Omit<TeachingLog, 'id' | 'createdAt'>) => void;
  updateTeachingLog: (id: string, data: Partial<TeachingLog>) => void;
  deleteTeachingLog: (id: string) => void;

  // Actions: Drive & Worksheets
  addDriveResource: (resource: Omit<DriveResource, 'id' | 'createdAt'>) => void;
  updateDriveResource: (id: string, data: Partial<DriveResource>) => void;
  deleteDriveResource: (id: string) => void;

  // Actions: System Activity & Access Logs
  logActivity: (data: Omit<UserActivityLog, 'id' | 'timestamp' | 'deviceInfo'> & { deviceInfo?: Partial<ActivityDeviceInfo> }) => void;
  clearActivityLogs: () => void;
  deleteActivityLog: (id: string) => void;
  sendStudentAlert: (studentId: string, subjectId: string, message: string) => void;

  // Actions: Categories
  addCategory: (cat: Omit<CategoryOption, 'id'>) => void;
  deleteCategory: (id: string) => void;

  // Actions: Subjects & Classrooms
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, data: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addClassroom: (classroom: Omit<Classroom, 'id'>) => void;
  updateClassroom: (id: string, data: Partial<Classroom>) => void;
  deleteClassroom: (id: string) => void;
  updateSubjectProportions: (subjectId: string, proportions: ScoreProportions) => void;

  // Teacher Profile & Authentication
  teacherProfile: TeacherProfile;
  updateTeacherProfile: (patch: Partial<TeacherProfile>) => void;
  changeTeacherPassword: (currentPass: string, newPass: string) => { success: boolean; message: string };
  firebaseSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  syncWithFirebase: () => Promise<boolean>;

  // Actions: Students
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  batchAddStudents: (classroomId: string, data: string | Omit<Student, 'id' | 'classroomId'>[], mode?: 'append' | 'replace') => number;

  // Actions: Units & Topics (บท & เรื่อง)
  addUnit: (unit: Omit<UnitDefinition, 'id'>) => void;
  updateUnit: (id: string, data: Partial<UnitDefinition>) => void;
  deleteUnit: (id: string) => void;
  addTopic: (topic: Omit<TopicDefinition, 'id'>) => void;
  updateTopic: (id: string, data: Partial<TopicDefinition>) => void;
  deleteTopic: (id: string) => void;

  // Actions: Assignments
  addAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  updateAssignment: (id: string, data: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;

  // Actions: Submissions & Grading
  getSubmission: (assignmentId: string, studentId: string) => Submission | undefined;
  updateSubmissionStatus: (assignmentId: string, studentId: string, status: SubmissionStatus) => void;
  updateSubmissionScore: (assignmentId: string, studentId: string, score: number | null) => void;
  updateSubmissionComment: (assignmentId: string, studentId: string, note: string) => void;
  batchMarkStatus: (assignmentId: string, status: SubmissionStatus, onlyPending?: boolean) => void;
  batchGiveScore: (assignmentId: string, score: number) => void;

  // Grade cutoffs
  updateGradeCutoffs: (cutoffs: GradeCutoff[]) => void;
  calculateGrade: (totalScore: number) => { grade: string; gpa: number; label: string };

  // Utilities
  clearAllData: () => void;
  exportBackupData: () => void;
  importBackupData: (jsonStr: string) => boolean;
}

const STORAGE_KEYS = {
  SUBJECTS: 'krusmart_prod_subjects_v3',
  CLASSROOMS: 'krusmart_prod_classrooms_v3',
  STUDENTS: 'krusmart_prod_students_v3',
  ASSIGNMENTS: 'krusmart_prod_assignments_v3',
  SUBMISSIONS: 'krusmart_prod_submissions_v3',
  GRADE_CUTOFFS: 'krusmart_prod_cutoffs_v3',
  CATEGORIES: 'krusmart_prod_categories_v3',
  SELECTED_SUBJECT: 'krusmart_prod_sel_sub_v3',
  MODE: 'krusmart_prod_mode_v3',
  TEACHER_AUTH: 'krusmart_prod_teacher_auth_v3',
  SCHOOL_PROFILE: 'krusmart_prod_school_profile_v3',
  TEACHER_PROFILE: 'krusmart_prod_teacher_profile_v3',
  TEACHER_PASSWORD: 'krusmart_prod_teacher_pw_v3',
  SIDEBAR_COLLAPSED: 'krusmart_prod_sidebar_collapsed_v3',
  UNITS: 'krusmart_prod_units_v3',
  TOPICS: 'krusmart_prod_topics_v3',
  ATTENDANCE: 'krusmart_prod_attendance_v3',
  TEACHING_LOGS: 'krusmart_prod_teaching_logs_v3',
  DRIVE_RESOURCES: 'krusmart_prod_drive_resources_v3',
  ACTIVITY_LOGS: 'krusmart_prod_activity_logs_v3',
  THEME: 'krusmart_prod_theme_v3',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme state: Pastel theme with Light / Dark Mode
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('krusmart_prod_theme_v3') as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') return saved;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  const setThemeMode = useCallback((newTheme: ThemeMode) => {
    setThemeModeState(newTheme);
    localStorage.setItem('krusmart_prod_theme_v3', newTheme);
    if (typeof document !== 'undefined') {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleThemeMode = useCallback(() => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  }, [themeMode, setThemeMode]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (themeMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [themeMode]);

  // System Glitch & Error Reporting state (Contact: nawaratk65@gmail.com)
  const [systemError, setSystemError] = useState<{ title: string; message: string; timestamp: string; details?: string } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);

  const reportSystemError = useCallback((title: string, message: string, details?: string) => {
    setSystemError({
      title,
      message,
      timestamp: new Date().toISOString(),
      details,
    });
    setShowErrorModal(true);
  }, []);

  const clearSystemError = useCallback(() => {
    setSystemError(null);
  }, []);

  // Global uncaught error listener to notify users with email reporting option
  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      console.error('Captured window error:', e.error);
    };

    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      console.warn('Unhandled promise rejection:', e.reason);
      if (e.reason && typeof e.reason === 'object' && e.reason.message && e.reason.message.includes('503')) {
        reportSystemError('เซิร์ฟเวอร์แจ้งสถานะ 503 Service Unavailable', 'ระบบหลังบ้านกำลังประมวลผลหรือโหลดข้อมูลไม่สำเร็จ กรุณากดส่งอีเมลแจ้งทีมงาน', String(e.reason));
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [reportSystemError]);

  // Mode defaults to 'student' per user requirement!
  const [mode, setModeState] = useState<'teacher' | 'student'>(() => {
    return (localStorage.getItem(STORAGE_KEYS.MODE) as 'teacher' | 'student') || 'student';
  });

  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.TEACHER_AUTH) === 'true';
  });

  const [activeTab, setActiveTab] = useState<ActiveTabType>('dashboard');

  // Sidebar collapsible state
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, collapsed ? 'true' : 'false');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // School Profile
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SCHOOL_PROFILE);
    return saved ? JSON.parse(saved) : DEFAULT_SCHOOL_PROFILE;
  });

  const updateSchoolProfile = (patch: Partial<SchoolProfile>) => {
    setSchoolProfile(prev => ({
      ...prev,
      ...patch,
      defaultProportions: {
        ...prev.defaultProportions,
        ...(patch.defaultProportions || {})
      }
    }));
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_PROFILE, JSON.stringify(schoolProfile));
  }, [schoolProfile]);

  // Teacher Profile & Password States
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEACHER_PROFILE);
    return saved ? JSON.parse(saved) : DEFAULT_TEACHER_PROFILE;
  });

  const [teacherPassword, setTeacherPassword] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.TEACHER_PASSWORD) || '1234';
  });

  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEACHER_PROFILE, JSON.stringify(teacherProfile));
  }, [teacherProfile]);

  const updateTeacherProfile = (patch: Partial<TeacherProfile>) => {
    setTeacherProfile(prev => ({ ...prev, ...patch }));
  };

  const changeTeacherPassword = (currentPass: string, newPass: string): { success: boolean; message: string } => {
    if (currentPass !== teacherPassword) {
      return { success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาตรวจสอบใหม่อีกครั้ง' };
    }
    if (!newPass || newPass.trim().length < 4) {
      return { success: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' };
    }
    setTeacherPassword(newPass.trim());
    localStorage.setItem(STORAGE_KEYS.TEACHER_PASSWORD, newPass.trim());
    return { success: true, message: 'เปลี่ยนรหัสผ่านครูผู้สอนสำเร็จเรียบร้อยแล้ว' };
  };

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLASSROOMS);
    return saved ? JSON.parse(saved) : INITIAL_CLASSROOMS;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
  });

  const [gradeCutoffs, setGradeCutoffs] = useState<GradeCutoff[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GRADE_CUTOFFS);
    return saved ? JSON.parse(saved) : DEFAULT_GRADE_CUTOFFS;
  });

  const [categories, setCategories] = useState<CategoryOption[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [units, setUnits] = useState<UnitDefinition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.UNITS);
    return saved ? JSON.parse(saved) : [];
  });

  const [topics, setTopics] = useState<TopicDefinition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TOPICS);
    return saved ? JSON.parse(saved) : [];
  });

  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_SESSIONS;
  });

  const [teachingLogs, setTeachingLogs] = useState<TeachingLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEACHING_LOGS);
    return saved ? JSON.parse(saved) : INITIAL_TEACHING_LOGS;
  });

  const [driveResources, setDriveResources] = useState<DriveResource[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DRIVE_RESOURCES);
    return saved ? JSON.parse(saved) : INITIAL_DRIVE_RESOURCES;
  });

  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_SUBJECT);
    if (saved && subjects.some(s => s.id === saved)) return saved;
    return subjects[0]?.id || '';
  });

  // Keep selected subject valid
  useEffect(() => {
    if (subjects.length > 0 && !subjects.some(s => s.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Derived current subject
  const currentSubject = useMemo(() => {
    return subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  }, [subjects, selectedSubjectId]);

  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(() => {
    return currentSubject ? currentSubject.classroomId : (classrooms[0]?.id || '');
  });

  // Sync classroom when subject changes
  useEffect(() => {
    if (currentSubject && currentSubject.classroomId !== selectedClassroomId) {
      setSelectedClassroomId(currentSubject.classroomId);
    }
  }, [currentSubject]);

  const currentClassroom = useMemo(() => {
    return classrooms.find(c => c.id === selectedClassroomId) || classrooms[0];
  }, [classrooms, selectedClassroomId]);

  // Current students sorted by seatNumber
  const currentStudents = useMemo(() => {
    return students
      .filter(s => s.classroomId === selectedClassroomId)
      .sort((a, b) => a.seatNumber - b.seatNumber);
  }, [students, selectedClassroomId]);

  // Current assignments for this subject
  const currentAssignments = useMemo(() => {
    if (!currentSubject) return [];
    return assignments.filter(a => a.subjectId === currentSubject.id);
  }, [assignments, currentSubject]);

  // Current units for this subject
  const currentUnits = useMemo(() => {
    if (!currentSubject) return [];
    return units.filter(u => u.subjectId === currentSubject.id);
  }, [units, currentSubject]);

  // Current score proportions (from subject or school profile default)
  const currentScoreProportions = useMemo<ScoreProportions>(() => {
    if (currentSubject?.proportions) {
      return currentSubject.proportions;
    }
    return schoolProfile.defaultProportions || DEFAULT_SCORE_PROPORTIONS;
  }, [currentSubject, schoolProfile]);

  // Persist state updates to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASSROOMS, JSON.stringify(classrooms));
  }, [classrooms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GRADE_CUTOFFS, JSON.stringify(gradeCutoffs));
  }, [gradeCutoffs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
  }, [topics]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceSessions));
  }, [attendanceSessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEACHING_LOGS, JSON.stringify(teachingLogs));
  }, [teachingLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DRIVE_RESOURCES, JSON.stringify(driveResources));
  }, [driveResources]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    if (selectedSubjectId) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_SUBJECT, selectedSubjectId);
    }
  }, [selectedSubjectId]);

  const setMode = (newMode: 'teacher' | 'student') => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEYS.MODE, newMode);
  };

  const teacherLogin = (password: string): boolean => {
    // Strictly verify against teacherPassword configured in settings
    if (password === teacherPassword) {
      setIsTeacherAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.TEACHER_AUTH, 'true');
      setMode('teacher');
      return true;
    }
    return false;
  };

  const teacherLogout = () => {
    setIsTeacherAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.TEACHER_AUTH);
    setMode('student');
  };

  // Submission lookup helper
  const getSubmission = (assignmentId: string, studentId: string): Submission | undefined => {
    return submissions.find(s => s.assignmentId === assignmentId && s.studentId === studentId);
  };

  // Grade calculation helper
  const calculateGrade = (totalScore: number): { grade: string; gpa: number; label: string } => {
    const rounded = Math.round(totalScore * 10) / 10;
    for (const cutoff of gradeCutoffs) {
      if (rounded >= cutoff.min) {
        return { grade: cutoff.grade, gpa: cutoff.gpa, label: cutoff.label };
      }
    }
    const lowest = gradeCutoffs[gradeCutoffs.length - 1];
    return lowest 
      ? { grade: lowest.grade, gpa: lowest.gpa, label: lowest.label }
      : { grade: '0', gpa: 0, label: 'ต่ำกว่าเกณฑ์' };
  };

  // =========================================================================
  // COMPUTED STUDENT SUMMARIES: HIERARCHICAL WEIGHTED SCORE CALCULATION
  // Formula:
  // - 4 Periods: ก่อนกลางภาค, กลางภาค, หลังกลางภาค, ปลายภาค (เช่น 30:20:30:20 รวม 100)
  // - Group tasks by Period and Unit (บท)
  // - For each Unit: Unit % = sum(rawScore) / sum(maxScore)
  // - Average across Units in the period to obtain normalized period score:
  //   Period Score = Average(Unit %) * Period Target Weight
  // =========================================================================
  const studentSummaries = useMemo<StudentScoreSummary[]>(() => {
    const weights = currentScoreProportions;

    // Helper to determine assignment period
    const getAssignmentPeriod = (asg: Assignment): EvaluationPeriod => {
      if (asg.period) return asg.period;
      // Heuristic fallback if missing
      const catLower = (asg.category || '').toLowerCase();
      const titleLower = (asg.title || '').toLowerCase();
      if (catLower.includes('กลางภาค') || catLower.includes('midterm') || titleLower.includes('กลางภาค')) {
        return 'midterm';
      }
      if (catLower.includes('ปลายภาค') || catLower.includes('final') || titleLower.includes('ปลายภาค')) {
        return 'final';
      }
      return 'pre_midterm';
    };

    return currentStudents.map(student => {
      const assignmentScores: StudentScoreSummary['assignmentScores'] = {};
      let submittedCount = 0;
      let pendingCount = 0;

      // Group student's assignment data by Period and by Unit
      const periodBuckets: Record<EvaluationPeriod, {
        units: Record<string, { rawScore: number; rawMaxScore: number; count: number }>;
        totalRaw: number;
        totalRawMax: number;
        tasksCount: number;
      }> = {
        pre_midterm: { units: {}, totalRaw: 0, totalRawMax: 0, tasksCount: 0 },
        midterm: { units: {}, totalRaw: 0, totalRawMax: 0, tasksCount: 0 },
        post_midterm: { units: {}, totalRaw: 0, totalRawMax: 0, tasksCount: 0 },
        final: { units: {}, totalRaw: 0, totalRawMax: 0, tasksCount: 0 },
      };

      currentAssignments.forEach(asg => {
        const sub = getSubmission(asg.id, student.id);
        const status = sub?.status || 'pending';
        const score = (status === 'pending') ? null : (sub?.score ?? null);

        assignmentScores[asg.id] = {
          status,
          score,
          isExam: asg.isExam,
        };

        if (status === 'submitted' || status === 'late') {
          submittedCount++;
        } else if (status === 'pending') {
          pendingCount++;
        }

        const validScore = typeof score === 'number' ? score : 0;
        const period = getAssignmentPeriod(asg);
        const unitName = (asg.unit && asg.unit.trim()) ? asg.unit.trim() : 'บทเรียนทั่วไป';

        const bucket = periodBuckets[period];
        bucket.tasksCount++;
        bucket.totalRaw += validScore;
        bucket.totalRawMax += asg.maxScore;

        if (!bucket.units[unitName]) {
          bucket.units[unitName] = { rawScore: 0, rawMaxScore: 0, count: 0 };
        }
        bucket.units[unitName].rawScore += validScore;
        bucket.units[unitName].rawMaxScore += asg.maxScore;
        bucket.units[unitName].count++;
      });

      // Calculate Period Detail & Scaled Score for each of the 4 periods
      const unitScores: Record<string, UnitScoreDetail> = {};

      const calculatePeriodDetail = (
        periodKey: EvaluationPeriod, 
        periodThaiName: string, 
        periodWeight: number
      ): PeriodScoreDetail => {
        const bucket = periodBuckets[periodKey];
        const unitEntries = Object.entries(bucket.units);

        let scaledScore = 0;

        if (unitEntries.length > 0 && bucket.totalRawMax > 0) {
          // Average by unit!
          let sumUnitPercentages = 0;
          const unitWeightAllocation = periodWeight / unitEntries.length;

          unitEntries.forEach(([unitName, uData]) => {
            const unitPct = uData.rawMaxScore > 0 ? (uData.rawScore / uData.rawMaxScore) : 0;
            sumUnitPercentages += unitPct;
            const unitScaled = Math.round(unitPct * unitWeightAllocation * 100) / 100;

            unitScores[`${periodKey}_${unitName}`] = {
              unitName,
              period: periodKey,
              rawScore: uData.rawScore,
              rawMaxScore: uData.rawMaxScore,
              scaledScore: unitScaled,
              targetWeight: unitWeightAllocation,
              tasksCount: uData.count,
            };
          });

          // Average across units in period scaled to target weight
          const avgUnitPercentage = sumUnitPercentages / unitEntries.length;
          scaledScore = Math.round(avgUnitPercentage * periodWeight * 10) / 10;
        } else if (bucket.totalRawMax > 0) {
          scaledScore = Math.round((bucket.totalRaw / bucket.totalRawMax) * periodWeight * 10) / 10;
        }

        const percentage = bucket.totalRawMax > 0 
          ? Math.round((bucket.totalRaw / bucket.totalRawMax) * 100) 
          : 0;

        return {
          period: periodKey,
          periodName: periodThaiName,
          weight: periodWeight,
          rawScore: bucket.totalRaw,
          rawMaxScore: bucket.totalRawMax,
          scaledScore,
          percentage,
          tasksCount: bucket.tasksCount,
        };
      };

      const preMidtermDetail = calculatePeriodDetail('pre_midterm', 'ก่อนกลางภาค', weights.preMidterm);
      const midtermDetail = calculatePeriodDetail('midterm', 'กลางภาค', weights.midterm);
      const postMidtermDetail = calculatePeriodDetail('post_midterm', 'หลังกลางภาค', weights.postMidterm);
      const finalDetail = calculatePeriodDetail('final', 'ปลายภาค', weights.final);

      // Sum of the 4 scaled scores out of 100
      const totalScore = Math.round(
        (preMidtermDetail.scaledScore + 
         midtermDetail.scaledScore + 
         postMidtermDetail.scaledScore + 
         finalDetail.scaledScore) * 10
      ) / 10;

      const { grade, gpa } = calculateGrade(totalScore);
      const totalCount = currentAssignments.length;
      const completionRate = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;

      return {
        student,
        assignmentScores,
        preMidtermDetail,
        midtermDetail,
        postMidtermDetail,
        finalDetail,
        preMidtermScore: preMidtermDetail.scaledScore,
        midtermScore: midtermDetail.scaledScore,
        postMidtermScore: postMidtermDetail.scaledScore,
        finalScore: finalDetail.scaledScore,
        totalCollectedScore: Math.round((preMidtermDetail.scaledScore + postMidtermDetail.scaledScore) * 10) / 10,
        unitScores,
        totalScore,
        grade,
        gpa,
        submittedCount,
        totalAssignmentsCount: totalCount,
        pendingCount,
        completionRate,
      };
    });
  }, [currentStudents, currentAssignments, submissions, gradeCutoffs, currentScoreProportions]);

  // Overall class statistics
  const classStats = useMemo(() => {
    if (studentSummaries.length === 0) {
      return { mean: 0, max: 0, min: 0, passCount: 0, failCount: 0, gradeCounts: {} };
    }
    const scores = studentSummaries.map(s => s.totalScore);
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    const mean = Math.round((sum / scores.length) * 10) / 10;
    const max = Math.max(...scores);
    const min = Math.min(...scores);

    const gradeCounts: Record<string, number> = {
      '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0,
    };
    let passCount = 0;
    let failCount = 0;

    studentSummaries.forEach(s => {
      gradeCounts[s.grade] = (gradeCounts[s.grade] || 0) + 1;
      if (s.totalScore >= 50) {
        passCount++;
      } else {
        failCount++;
      }
    });

    return { mean, max, min, passCount, failCount, gradeCounts };
  }, [studentSummaries]);

  // Current attendance sessions for active subject and classroom
  const currentAttendanceSessions = useMemo(() => {
    if (!currentSubject || !selectedClassroomId) return [];
    return attendanceSessions
      .filter(s => s.subjectId === currentSubject.id && s.classroomId === selectedClassroomId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.periodNumber - a.periodNumber);
  }, [attendanceSessions, currentSubject, selectedClassroomId]);

  // Current teaching logs / timeline
  const currentTeachingLogs = useMemo(() => {
    if (!currentSubject || !selectedClassroomId) return [];
    return teachingLogs
      .filter(l => l.subjectId === currentSubject.id && l.classroomId === selectedClassroomId)
      .sort((a, b) => b.sessionNumber - a.sessionNumber || b.date.localeCompare(a.date));
  }, [teachingLogs, currentSubject, selectedClassroomId]);

  // Current drive resources for active subject
  const currentDriveResources = useMemo(() => {
    if (!currentSubject) return [];
    return driveResources
      .filter(r => r.subjectId === currentSubject.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [driveResources, currentSubject]);

  // Helper to calculate student attendance & exam ineligibility (หมดสิทธิ์สอบ มส.)
  const getStudentAttendanceSummary = useCallback((studentId: string, subjectId?: string): StudentAttendanceSummary => {
    const subId = subjectId || currentSubject?.id || '';
    const relevantSessions = attendanceSessions.filter(s => s.subjectId === subId && s.classroomId === selectedClassroomId);
    const targetStudent = students.find(s => s.id === studentId);

    let presentCount = 0;
    let lateCount = 0;
    let leaveCount = 0;
    let absentCount = 0;

    relevantSessions.forEach(session => {
      const rec = session.records[studentId];
      if (rec) {
        if (rec.status === 'present') presentCount++;
        else if (rec.status === 'late') lateCount++;
        else if (rec.status === 'leave') leaveCount++;
        else if (rec.status === 'absent') absentCount++;
      }
    });

    const totalSessions = relevantSessions.length;
    // Effective attendance: Present + Late + Leave (excused)
    const effectiveAttended = totalSessions === 0 ? 0 : (presentCount + lateCount + leaveCount);
    const attendancePercentage = totalSessions === 0 ? 100 : Math.round((effectiveAttended / totalSessions) * 1000) / 10;

    // Standard 80% attendance rule: max absences allowed = 20%
    const maxAllowedAbsence = totalSessions === 0 ? 0 : Math.floor(totalSessions * 0.2);
    const remainingAbsenceAllowed = Math.max(0, maxAllowedAbsence - absentCount);
    const isExamIneligible = totalSessions > 0 && attendancePercentage < 80;
    const isAtRisk = totalSessions > 0 && attendancePercentage >= 80 && attendancePercentage < 85;

    return {
      student: targetStudent || { id: studentId, studentCode: '', seatNumber: 0, prefix: 'นาย', fullName: 'ไม่พบข้อมูล', gender: 'male', classroomId: '' },
      totalSessions,
      presentCount,
      lateCount,
      leaveCount,
      absentCount,
      effectiveAttendedSessions: effectiveAttended,
      attendancePercentage,
      isExamIneligible,
      isAtRisk,
      maxAllowedAbsence,
      remainingAbsenceAllowed,
    };
  }, [attendanceSessions, currentSubject, selectedClassroomId, students]);

  const classAttendanceSummaries = useMemo<StudentAttendanceSummary[]>(() => {
    return currentStudents.map(student => getStudentAttendanceSummary(student.id));
  }, [currentStudents, getStudentAttendanceSummary]);

  // Attendance Actions
  const addAttendanceSession = (session: Omit<AttendanceSession, 'id' | 'createdAt'>) => {
    const id = `att-${Date.now()}`;
    const newSession: AttendanceSession = {
      ...session,
      id,
      createdAt: new Date().toISOString(),
    };
    setAttendanceSessions(prev => [newSession, ...prev]);
  };

  const updateAttendanceSession = (id: string, data: Partial<AttendanceSession>) => {
    setAttendanceSessions(prev => prev.map(s => s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s));
  };

  const deleteAttendanceSession = (id: string) => {
    setAttendanceSessions(prev => prev.filter(s => s.id !== id));
  };

  const recordStudentAttendance = (sessionId: string, studentId: string, status: AttendanceStatus, note?: string) => {
    setAttendanceSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        records: {
          ...s.records,
          [studentId]: {
            status,
            note: note !== undefined ? note : s.records[studentId]?.note,
          },
        },
        updatedAt: new Date().toISOString(),
      };
    }));
  };

  const batchCheckAttendance = (sessionId: string, status: AttendanceStatus) => {
    setAttendanceSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      const updatedRecords = { ...s.records };
      currentStudents.forEach(st => {
        updatedRecords[st.id] = {
          status,
          note: updatedRecords[st.id]?.note || '',
        };
      });
      return {
        ...s,
        records: updatedRecords,
        updatedAt: new Date().toISOString(),
      };
    }));
  };

  // Teaching Log Actions
  const addTeachingLog = (log: Omit<TeachingLog, 'id' | 'createdAt'>) => {
    const id = `log-${Date.now()}`;
    const newLog: TeachingLog = {
      ...log,
      id,
      createdAt: new Date().toISOString(),
    };
    setTeachingLogs(prev => [newLog, ...prev]);
  };

  const updateTeachingLog = (id: string, data: Partial<TeachingLog>) => {
    setTeachingLogs(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  };

  const deleteTeachingLog = (id: string) => {
    setTeachingLogs(prev => prev.filter(l => l.id !== id));
  };

  // Drive Resource Actions
  const addDriveResource = (resource: Omit<DriveResource, 'id' | 'createdAt'>) => {
    const id = `res-${Date.now()}`;
    const newRes: DriveResource = {
      ...resource,
      id,
      createdAt: new Date().toISOString(),
    };
    setDriveResources(prev => [newRes, ...prev]);
  };

  const updateDriveResource = (id: string, data: Partial<DriveResource>) => {
    setDriveResources(prev => prev.map(r => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r));
  };

  const deleteDriveResource = (id: string) => {
    setDriveResources(prev => prev.filter(r => r.id !== id));
  };

  // Activity Log Actions
  const getClientDeviceInfo = (): ActivityDeviceInfo => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    let browser = 'Web Browser';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';

    let platform = 'Unknown';
    if (/Android/i.test(ua)) platform = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) platform = 'iOS';
    else if (/Mac/i.test(ua)) platform = 'macOS';
    else if (/Win/i.test(ua)) platform = 'Windows';
    else if (/Linux/i.test(ua)) platform = 'Linux';

    return { browser, platform, isMobile };
  };

  const logActivity = useCallback((data: Omit<UserActivityLog, 'id' | 'timestamp' | 'deviceInfo'> & { deviceInfo?: Partial<ActivityDeviceInfo> }) => {
    const { deviceInfo: customDeviceInfo, ...restData } = data;
    const clientInfo = getClientDeviceInfo();
    const newLog: UserActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...restData,
      deviceInfo: {
        browser: customDeviceInfo?.browser || clientInfo.browser,
        platform: customDeviceInfo?.platform || clientInfo.platform,
        isMobile: customDeviceInfo?.isMobile ?? clientInfo.isMobile,
      },
    };

    setActivityLogs(prev => [newLog, ...prev.slice(0, 499)]);

    try {
      const logRef = doc(db, 'activity_logs', newLog.id);
      setDoc(logRef, newLog).catch(() => {});
    } catch {}
  }, []);

  const clearActivityLogs = useCallback(() => {
    setActivityLogs([]);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
  }, []);

  const deleteActivityLog = useCallback((id: string) => {
    setActivityLogs(prev => prev.filter(l => l.id !== id));
  }, []);

  const sendStudentAlert = useCallback((studentId: string, subjectId: string, message: string) => {
    const student = students.find(s => s.id === studentId);
    const subject = subjects.find(sub => sub.id === subjectId);
    const classroom = classrooms.find(c => c.id === student?.classroomId);

    logActivity({
      actorType: 'teacher',
      actionType: 'teacher_alert_sent',
      studentId,
      studentCode: student?.studentCode,
      studentName: student ? `${student.prefix}${student.fullName}` : undefined,
      classroomId: classroom?.id,
      classroomName: classroom?.name,
      subjectId,
      subjectName: subject?.name,
      title: `ส่งสัญญาณเตือนติดตามงานถึง ${student?.prefix || ''}${student?.fullName || ''}`,
      details: message || 'แจ้งเตือนให้นักเรียนเร่งรัดติดตามส่งงานที่ค้างและตรวจสอบเวลาเรียน',
      targetId: studentId,
      targetName: student?.fullName,
    });
  }, [students, subjects, classrooms, logActivity]);

  // --- ACTIONS ---

  // Category Actions
  const addCategory = (cat: Omit<CategoryOption, 'id'>) => {
    const id = `cat-${Date.now()}`;
    setCategories(prev => [...prev, { ...cat, id }]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Submissions (STRICT ENFORCEMENT: ONLY change status here, score is locked if status is pending)
  const updateSubmissionStatus = (assignmentId: string, studentId: string, status: SubmissionStatus) => {
    setSubmissions(prev => {
      const idx = prev.findIndex(s => s.assignmentId === assignmentId && s.studentId === studentId);
      const now = new Date().toISOString();
      if (idx >= 0) {
        const copy = [...prev];
        const existing = copy[idx];
        copy[idx] = {
          ...existing,
          status,
          submittedAt: status === 'pending' ? undefined : (existing.submittedAt || now),
          score: status === 'pending' ? null : existing.score,
          updatedAt: now,
        };
        return copy;
      } else {
        return [
          ...prev,
          {
            id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            assignmentId,
            studentId,
            status,
            score: null,
            submittedAt: status !== 'pending' ? now : undefined,
            updatedAt: now,
          },
        ];
      }
    });
  };

  // Score can ONLY be entered if already submitted or late
  const updateSubmissionScore = (assignmentId: string, studentId: string, score: number | null) => {
    setSubmissions(prev => {
      const idx = prev.findIndex(s => s.assignmentId === assignmentId && s.studentId === studentId);
      const now = new Date().toISOString();
      if (idx >= 0) {
        if (prev[idx].status === 'pending') {
          return prev;
        }
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          score,
          updatedAt: now,
        };
        return copy;
      }
      return prev;
    });
  };

  const updateSubmissionComment = (assignmentId: string, studentId: string, teacherNote: string) => {
    setSubmissions(prev => {
      const idx = prev.findIndex(s => s.assignmentId === assignmentId && s.studentId === studentId);
      const now = new Date().toISOString();
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          teacherNote,
          updatedAt: now,
        };
        return copy;
      }
      return prev;
    });
  };

  // Batch actions
  const batchMarkStatus = (assignmentId: string, status: SubmissionStatus, onlyPending: boolean = false) => {
    const now = new Date().toISOString();
    setSubmissions(prev => {
      const copy = [...prev];
      currentStudents.forEach(std => {
        const idx = copy.findIndex(s => s.assignmentId === assignmentId && s.studentId === std.id);
        if (idx >= 0) {
          if (!onlyPending || copy[idx].status === 'pending') {
            copy[idx] = {
              ...copy[idx],
              status,
              submittedAt: status !== 'pending' ? (copy[idx].submittedAt || now) : undefined,
              score: status === 'pending' ? null : copy[idx].score,
              updatedAt: now,
            };
          }
        } else {
          copy.push({
            id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            assignmentId,
            studentId: std.id,
            status,
            score: null,
            submittedAt: status !== 'pending' ? now : undefined,
            updatedAt: now,
          });
        }
      });
      return copy;
    });
  };

  const batchGiveScore = (assignmentId: string, score: number) => {
    const now = new Date().toISOString();
    setSubmissions(prev => {
      const copy = [...prev];
      currentStudents.forEach(std => {
        const idx = copy.findIndex(s => s.assignmentId === assignmentId && s.studentId === std.id);
        if (idx >= 0 && copy[idx].status !== 'pending') {
          copy[idx] = {
            ...copy[idx],
            score,
            updatedAt: now,
          };
        }
      });
      return copy;
    });
  };

  // Subjects & Classrooms Actions
  const addSubject = (sub: Omit<Subject, 'id'>) => {
    const id = `sub-${Date.now()}`;
    const newSubject: Subject = { 
      ...sub, 
      id,
      proportions: sub.proportions || schoolProfile.defaultProportions || DEFAULT_SCORE_PROPORTIONS 
    };
    setSubjects(prev => [...prev, newSubject]);
    setSelectedSubjectId(id);
  };

  const updateSubject = (id: string, data: Partial<Subject>) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const updateSubjectProportions = (subjectId: string, proportions: ScoreProportions) => {
    setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, proportions } : s));
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setAssignments(prev => prev.filter(a => a.subjectId !== id));
    if (selectedSubjectId === id) {
      const remaining = subjects.filter(s => s.id !== id);
      setSelectedSubjectId(remaining[0]?.id || '');
    }
  };

  const addClassroom = (cls: Omit<Classroom, 'id'>) => {
    const id = `cls-${Date.now()}`;
    setClassrooms(prev => [...prev, { ...cls, id }]);
  };

  const updateClassroom = (id: string, data: Partial<Classroom>) => {
    setClassrooms(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteClassroom = (id: string) => {
    setClassrooms(prev => prev.filter(c => c.id !== id));
    setStudents(prev => prev.filter(s => s.classroomId !== id));
  };

  // Unit & Topic Actions (บท & เรื่อง)
  const addUnit = (unit: Omit<UnitDefinition, 'id'>) => {
    const id = `unit-${Date.now()}`;
    setUnits(prev => [...prev, { ...unit, id }]);
  };

  const updateUnit = (id: string, data: Partial<UnitDefinition>) => {
    setUnits(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  };

  const deleteUnit = (id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    setTopics(prev => prev.filter(t => t.unitId !== id));
  };

  const addTopic = (topic: Omit<TopicDefinition, 'id'>) => {
    const id = `topic-${Date.now()}`;
    setTopics(prev => [...prev, { ...topic, id }]);
  };

  const updateTopic = (id: string, data: Partial<TopicDefinition>) => {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  };

  const deleteTopic = (id: string) => {
    setTopics(prev => prev.filter(t => t.id !== id));
  };

  // Student Actions
  const addStudent = (std: Omit<Student, 'id'>) => {
    const id = `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setStudents(prev => [...prev, { ...std, id }]);
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setSubmissions(prev => prev.filter(s => s.studentId !== id));
  };

  const batchAddStudents = (
    classroomId: string, 
    data: string | Omit<Student, 'id' | 'classroomId'>[], 
    mode: 'append' | 'replace' = 'append'
  ): number => {
    let newStudents: Student[] = [];

    if (Array.isArray(data)) {
      newStudents = data.map((item, idx) => ({
        id: `std-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        classroomId,
        seatNumber: Number(item.seatNumber) || idx + 1,
        studentCode: String(item.studentCode || `STD${String(idx + 1).padStart(3, '0')}`),
        prefix: item.prefix || 'เด็กชาย',
        fullName: item.fullName,
        gender: item.gender || 'male',
        note: item.note || '',
      }));
    } else {
      const lines = data.split('\n').filter(l => l.trim().length > 0);
      const existingSeatNumbers = mode === 'replace' ? [] : students
        .filter(s => s.classroomId === classroomId)
        .map(s => s.seatNumber);
      let nextSeat = existingSeatNumbers.length > 0 ? Math.max(...existingSeatNumbers) + 1 : 1;

      for (const line of lines) {
        const parts = line.split(/[,\t]+/).map(p => p.trim());
        let seat = nextSeat;
        let code = '';
        let name = '';
        let prefix: Student['prefix'] = 'เด็กชาย';

        if (parts.length >= 3) {
          seat = parseInt(parts[0]) || nextSeat;
          code = parts[1];
          name = parts.slice(2).join(' ');
        } else if (parts.length === 2) {
          code = parts[0];
          name = parts[1];
        } else {
          name = parts[0];
          code = `STD${String(nextSeat).padStart(3, '0')}`;
        }

        if (name.startsWith('เด็กชาย')) {
          prefix = 'เด็กชาย';
          name = name.replace(/^เด็กชาย\s*/, '');
        } else if (name.startsWith('เด็กหญิง')) {
          prefix = 'เด็กหญิง';
          name = name.replace(/^เด็กหญิง\s*/, '');
        } else if (name.startsWith('นาย')) {
          prefix = 'นาย';
          name = name.replace(/^นาย\s*/, '');
        } else if (name.startsWith('นางสาว')) {
          prefix = 'นางสาว';
          name = name.replace(/^นางสาว\s*/, '');
        } else if (name.startsWith('ด.ช.')) {
          prefix = 'เด็กชาย';
          name = name.replace(/^ด\.ช\.\s*/, '');
        } else if (name.startsWith('ด.ญ.')) {
          prefix = 'เด็กหญิง';
          name = name.replace(/^ด\.ญ\.\s*/, '');
        }

        const gender = (prefix === 'เด็กหญิง' || prefix === 'นางสาว') ? 'female' : 'male';

        newStudents.push({
          id: `std-${Date.now()}-${newStudents.length}-${Math.random().toString(36).substring(2, 5)}`,
          classroomId,
          studentCode: code,
          seatNumber: seat,
          prefix,
          fullName: name,
          gender,
        });

        nextSeat = Math.max(nextSeat + 1, seat + 1);
      }
    }

    if (mode === 'replace') {
      const removedIds = new Set(students.filter(s => s.classroomId === classroomId).map(s => s.id));
      setStudents(prev => [...prev.filter(s => s.classroomId !== classroomId), ...newStudents]);
      setSubmissions(prev => prev.filter(sub => !removedIds.has(sub.studentId)));
    } else {
      if (newStudents.length > 0) {
        setStudents(prev => [...prev, ...newStudents]);
      }
    }

    return newStudents.length;
  };

  // Sync with Firebase Cloud Firestore
  const syncWithFirebase = async (): Promise<boolean> => {
    setFirebaseSyncStatus('syncing');
    try {
      // 1. School Profile
      await setDoc(doc(db, 'schools', 'default'), {
        ...schoolProfile,
        id: 'default',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 2. Teacher Profile
      await setDoc(doc(db, 'teachers', 'default'), {
        fullName: teacherProfile.fullName,
        username: teacherProfile.username,
        position: teacherProfile.position,
        department: teacherProfile.department,
        email: teacherProfile.email,
        phone: teacherProfile.phone || '',
        academicStanding: teacherProfile.academicStanding || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 3. Classrooms
      for (const cls of classrooms) {
        await setDoc(doc(db, 'classrooms', cls.id), {
          ...cls,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // 4. Subjects
      for (const sub of subjects) {
        await setDoc(doc(db, 'subjects', sub.id), {
          ...sub,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // 5. Students
      for (const std of students) {
        await setDoc(doc(db, 'students', std.id), {
          ...std,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // 6. Assignments
      for (const asg of assignments) {
        await setDoc(doc(db, 'assignments', asg.id), {
          id: asg.id,
          subjectId: asg.subjectId,
          title: asg.title,
          category: asg.category,
          period: asg.period,
          unit: asg.unit || '',
          topic: asg.topic || '',
          maxScore: asg.maxScore,
          dueDate: asg.dueDate || '',
          assignedDate: asg.assignedDate || '',
          isExam: asg.isExam || false,
          description: asg.description || '',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // 7. Submissions
      for (const sub of submissions) {
        await setDoc(doc(db, 'submissions', sub.id), {
          id: sub.id,
          assignmentId: sub.assignmentId,
          studentId: sub.studentId,
          status: sub.status,
          score: sub.score,
          submittedAt: sub.submittedAt || '',
          teacherNote: sub.teacherNote || '',
          updatedAt: sub.updatedAt || new Date().toISOString()
        }, { merge: true });
      }

      // 8. Attendance Sessions
      for (const att of attendanceSessions) {
        await setDoc(doc(db, 'attendance_sessions', att.id), {
          ...att,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // 9. Teaching Logs
      for (const log of teachingLogs) {
        await setDoc(doc(db, 'teaching_logs', log.id), {
          ...log,
        }, { merge: true });
      }

      // 10. Drive Resources
      for (const res of driveResources) {
        await setDoc(doc(db, 'drive_resources', res.id), {
          ...res,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      setFirebaseSyncStatus('synced');
      return true;
    } catch (err) {
      console.error('Firebase sync error:', err);
      setFirebaseSyncStatus('error');
      return false;
    }
  };

  // Assignment Actions
  const addAssignment = (asg: Omit<Assignment, 'id'>) => {
    const id = `asg-${Date.now()}`;
    setAssignments(prev => [...prev, { ...asg, id }]);
  };

  const updateAssignment = (id: string, data: Partial<Assignment>) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    setSubmissions(prev => prev.filter(s => s.assignmentId !== id));
  };

  // Grade cutoffs
  const updateGradeCutoffs = (cutoffs: GradeCutoff[]) => {
    setGradeCutoffs(cutoffs);
  };

  // Utilities
  const clearAllData = () => {
    setStudents([]);
    setAssignments([]);
    setSubmissions([]);
    setUnits([]);
    setTopics([]);
    setAttendanceSessions([]);
    setTeachingLogs([]);
    setDriveResources([]);
    setActivityLogs([]);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS);
    localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
    localStorage.removeItem(STORAGE_KEYS.UNITS);
    localStorage.removeItem(STORAGE_KEYS.TOPICS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.TEACHING_LOGS);
    localStorage.removeItem(STORAGE_KEYS.DRIVE_RESOURCES);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
  };

  const exportBackupData = () => {
    const data = {
      version: '3.0',
      timestamp: new Date().toISOString(),
      schoolProfile,
      subjects,
      classrooms,
      students,
      assignments,
      submissions,
      gradeCutoffs,
      categories,
      units,
      topics,
      attendanceSessions,
      teachingLogs,
      driveResources,
      activityLogs,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `krusmart_backup_${schoolProfile.name || 'school'}_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importBackupData = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.subjects && data.classrooms) {
        if (data.schoolProfile) setSchoolProfile(data.schoolProfile);
        setSubjects(data.subjects);
        setClassrooms(data.classrooms);
        setStudents(data.students || []);
        setAssignments(data.assignments || []);
        setSubmissions(data.submissions || []);
        if (data.gradeCutoffs) setGradeCutoffs(data.gradeCutoffs);
        if (data.categories) setCategories(data.categories);
        if (data.units) setUnits(data.units);
        if (data.topics) setTopics(data.topics);
        if (data.attendanceSessions) setAttendanceSessions(data.attendanceSessions);
        if (data.teachingLogs) setTeachingLogs(data.teachingLogs);
        if (data.driveResources) setDriveResources(data.driveResources);
        if (data.activityLogs) setActivityLogs(data.activityLogs);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        mode,
        setMode,
        isTeacherAuthenticated,
        teacherLogin,
        teacherLogout,
        activeTab,
        setActiveTab,
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        schoolProfile,
        updateSchoolProfile,
        teacherProfile,
        updateTeacherProfile,
        changeTeacherPassword,
        firebaseSyncStatus,
        syncWithFirebase,
        selectedSubjectId,
        setSelectedSubjectId,
        selectedClassroomId,
        setSelectedClassroomId,
        subjects,
        classrooms,
        students,
        assignments,
        submissions,
        gradeCutoffs,
        categories,
        units,
        topics,
        attendanceSessions,
        teachingLogs,
        driveResources,
        activityLogs,
        currentSubject,
        currentClassroom,
        currentStudents,
        currentAssignments,
        currentUnits,
        currentScoreProportions,
        studentSummaries,
        currentAttendanceSessions,
        currentTeachingLogs,
        currentDriveResources,
        classAttendanceSummaries,
        classStats,
        addAttendanceSession,
        updateAttendanceSession,
        deleteAttendanceSession,
        recordStudentAttendance,
        batchCheckAttendance,
        getStudentAttendanceSummary,
        addTeachingLog,
        updateTeachingLog,
        deleteTeachingLog,
        addDriveResource,
        updateDriveResource,
        deleteDriveResource,
        logActivity,
        clearActivityLogs,
        deleteActivityLog,
        sendStudentAlert,
        addCategory,
        deleteCategory,
        addSubject,
        updateSubject,
        deleteSubject,
        addClassroom,
        updateClassroom,
        deleteClassroom,
        updateSubjectProportions,
        addStudent,
        updateStudent,
        deleteStudent,
        batchAddStudents,
        addUnit,
        updateUnit,
        deleteUnit,
        addTopic,
        updateTopic,
        deleteTopic,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        getSubmission,
        updateSubmissionStatus,
        updateSubmissionScore,
        updateSubmissionComment,
        batchMarkStatus,
        batchGiveScore,
        updateGradeCutoffs,
        calculateGrade,
        clearAllData,
        exportBackupData,
        importBackupData,
        themeMode,
        toggleThemeMode,
        setThemeMode,
        systemError,
        reportSystemError,
        clearSystemError,
        showErrorModal,
        setShowErrorModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

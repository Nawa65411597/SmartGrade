import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Lock, 
  Award, 
  Calendar, 
  MessageSquare,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  School,
  KeyRound,
  ArrowRight,
  LogOut,
  Sparkles,
  Paperclip,
  ExternalLink,
  Download,
  FileText,
  UserCheck,
  XCircle,
  FolderGit2,
  Presentation,
  Video,
  Eye,
  BookOpen,
  History,
  Smartphone,
  Laptop,
  BellRing
} from 'lucide-react';
import { SubmissionStatus, WorksheetData } from '../../types';

export const StudentPortal: React.FC = () => {
  const { 
    classrooms, 
    subjects, 
    students, 
    assignments, 
    submissions,
    schoolProfile,
    getStudentAttendanceSummary,
    driveResources,
    activityLogs,
    logActivity
  } = useApp();

  // Search input state
  const [studentCodeInput, setStudentCodeInput] = useState<string>('');
  const [searchedCode, setSearchedCode] = useState<string | null>(() => {
    return localStorage.getItem('krudata_active_student_code') || null;
  });
  const [searchError, setSearchError] = useState<string | null>(null);

  // Active student navigation tab: 'tasks' | 'drive' | 'my_logs'
  const [studentTab, setStudentTab] = useState<'tasks' | 'drive' | 'my_logs'>('tasks');

  // Active subject filter for multi-subject students
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');

  // Worksheet preview modal for student
  const [studentPreviewWorksheet, setStudentPreviewWorksheet] = useState<WorksheetData | null>(null);

  // Read time & session duration tracking refs
  const worksheetOpenTimeRef = useRef<number | null>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Session ref to avoid redundant log calls
  const loggedSessionRef = useRef<string | null>(null);

  // Find the active student strictly by matching studentCode
  const activeStudent = useMemo(() => {
    if (!searchedCode) return null;
    return students.find(s => s.studentCode.trim().toLowerCase() === searchedCode.trim().toLowerCase()) || null;
  }, [students, searchedCode]);

  // Classroom of the student
  const studentClassroom = useMemo(() => {
    if (!activeStudent) return null;
    return classrooms.find(c => c.id === activeStudent.classroomId);
  }, [classrooms, activeStudent]);

  // Subjects available for this student's classroom
  const studentSubjects = useMemo(() => {
    if (!studentClassroom) return [];
    return subjects.filter(s => s.classroomId === studentClassroom.id);
  }, [subjects, studentClassroom]);

  // Current selected subject
  const currentSubject = useMemo(() => {
    if (!studentSubjects.length) return null;
    if (activeSubjectId) {
      return studentSubjects.find(s => s.id === activeSubjectId) || studentSubjects[0];
    }
    return studentSubjects[0];
  }, [studentSubjects, activeSubjectId]);

  // Attendance and Exam Ineligibility (มส.) for this student in current subject
  const attendanceSummary = useMemo(() => {
    if (!activeStudent || !currentSubject) return null;
    return getStudentAttendanceSummary(activeStudent.id, currentSubject.id);
  }, [activeStudent, currentSubject, getStudentAttendanceSummary]);

  // Shared drive resources made public by the teacher for this specific subject AND student's classroom
  const publicDriveResources = useMemo(() => {
    if (!currentSubject || !studentClassroom) return [];
    return driveResources.filter(r => {
      // 1. Must match current subject
      const matchSubject = r.subjectId === currentSubject.id;
      // 2. Must match student's specific classroom
      const targetRoomId = r.classroomId || currentSubject.classroomId;
      const matchClassroom = targetRoomId === studentClassroom.id;
      // 3. Teacher MUST have clicked allow/authorize
      const isAllowed = r.isPublicToStudents === true;
      return matchSubject && matchClassroom && isAllowed;
    });
  }, [driveResources, currentSubject, studentClassroom]);

  // Log student portal session on load or subject change with integrity detection
  useEffect(() => {
    if (activeStudent && currentSubject) {
      const sessionKey = `${activeStudent.id}-${currentSubject.id}`;
      if (loggedSessionRef.current !== sessionKey) {
        loggedSessionRef.current = sessionKey;
        const currentHour = new Date().getHours();
        const isLateNight = currentHour >= 23 || currentHour < 5;
        const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

        logActivity({
          actorType: 'student',
          actionType: 'portal_login',
          studentId: activeStudent.id,
          studentCode: activeStudent.studentCode,
          studentName: `${activeStudent.prefix}${activeStudent.fullName}`,
          classroomId: studentClassroom?.id,
          classroomName: studentClassroom?.name,
          subjectId: currentSubject.id,
          subjectName: currentSubject.name,
          title: `เข้าสู่ระบบตรวจสอบงาน (${currentSubject.name})${isLateNight ? ' 🌙' : ''}`,
          details: `เข้าดูข้อมูลการเรียน ห้อง ${studentClassroom?.name || ''} เลขที่ ${activeStudent.seatNumber}${isLateNight ? ` (เข้าตรวจงานเวลาวิกาล ${timeStr} น.)` : ''}`,
          isIntegrityFlagged: isLateNight,
          integrityReason: isLateNight ? `🌙 เข้าใช้งานยามวิกาล (${timeStr} น.)` : undefined,
        });
      }
    }
  }, [activeStudent, currentSubject, studentClassroom, logActivity]);

  // Continuous Session Duration Logging (every 2 minutes)
  useEffect(() => {
    if (!activeStudent || !currentSubject) return;
    const interval = setInterval(() => {
      const totalSec = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
      if (totalSec >= 120 && totalSec % 120 === 0) {
        const mins = Math.floor(totalSec / 60);
        logActivity({
          actorType: 'student',
          actionType: 'portal_session_duration',
          studentId: activeStudent.id,
          studentCode: activeStudent.studentCode,
          studentName: `${activeStudent.prefix}${activeStudent.fullName}`,
          classroomId: studentClassroom?.id,
          classroomName: studentClassroom?.name,
          subjectId: currentSubject.id,
          subjectName: currentSubject.name,
          title: `อยู่ในระบบต่อเนื่อง (${mins} นาที)`,
          details: `นักเรียนเข้าศึกษาและตรวจงานในระบบต่อเนื่อง ${mins} นาที`,
          durationSeconds: totalSec,
        });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [activeStudent, currentSubject, studentClassroom, logActivity]);

  // Handlers for Worksheet preview with Read Time Tracking
  const handleOpenWorksheetPreview = (worksheet: WorksheetData) => {
    worksheetOpenTimeRef.current = Date.now();
    setStudentPreviewWorksheet(worksheet);

    if (activeStudent && currentSubject) {
      logActivity({
        actorType: 'student',
        actionType: 'view_drive_resource',
        studentId: activeStudent.id,
        studentCode: activeStudent.studentCode,
        studentName: `${activeStudent.prefix}${activeStudent.fullName}`,
        classroomId: studentClassroom?.id,
        classroomName: studentClassroom?.name,
        subjectId: currentSubject.id,
        subjectName: currentSubject.name,
        title: `เปิดดูใบงาน: ${worksheet.title}`,
        details: `เปิดอ่านใบงาน ${worksheet.title} (${worksheet.subjectName})`,
        targetName: worksheet.title,
      });
    }
  };

  const handleCloseWorksheetPreview = () => {
    if (worksheetOpenTimeRef.current && activeStudent && currentSubject && studentPreviewWorksheet) {
      const elapsedSec = Math.round((Date.now() - worksheetOpenTimeRef.current) / 1000);
      if (elapsedSec >= 2) {
        const mins = Math.floor(elapsedSec / 60);
        const secs = elapsedSec % 60;
        const timeStr = mins > 0 ? `${mins} นาที ${secs} วินาที` : `${secs} วินาที`;

        logActivity({
          actorType: 'student',
          actionType: 'read_resource_time',
          studentId: activeStudent.id,
          studentCode: activeStudent.studentCode,
          studentName: `${activeStudent.prefix}${activeStudent.fullName}`,
          classroomId: studentClassroom?.id,
          classroomName: studentClassroom?.name,
          subjectId: currentSubject.id,
          subjectName: currentSubject.name,
          title: `บันทึกเวลาศึกษาใบงาน: ${studentPreviewWorksheet.title}`,
          details: `ใช้เวลาศึกษาอ่านเนื้อหาใบงานไป ${timeStr}`,
          durationSeconds: elapsedSec,
          targetName: studentPreviewWorksheet.title,
        });
      }
    }
    worksheetOpenTimeRef.current = null;
    setStudentPreviewWorksheet(null);
  };


  // My activity logs
  const myActivityLogs = useMemo(() => {
    if (!activeStudent) return [];
    return activityLogs.filter(
      l => l.studentId === activeStudent.id || (l.studentCode && l.studentCode === activeStudent.studentCode)
    );
  }, [activityLogs, activeStudent]);

  // My alerts from teacher
  const myAlerts = useMemo(() => {
    return myActivityLogs.filter(l => l.actionType === 'teacher_alert_sent');
  }, [myActivityLogs]);

  // Download worksheet as clean text / printable format
  const handleDownloadWorksheet = (worksheet: WorksheetData) => {
    if (activeStudent && currentSubject) {
      logActivity({
        actorType: 'student',
        actionType: 'download_resource',
        studentId: activeStudent.id,
        studentCode: activeStudent.studentCode,
        studentName: `${activeStudent.prefix}${activeStudent.fullName}`,
        classroomId: studentClassroom?.id,
        classroomName: studentClassroom?.name,
        subjectId: currentSubject.id,
        subjectName: currentSubject.name,
        title: `ดาวน์โหลดใบงาน: ${worksheet.title}`,
        details: `ดาวน์โหลดไฟล์ใบงานวิชา ${currentSubject.name}`,
        targetName: worksheet.title,
      });
    }

    const textContent = `=======================================================
${schoolProfile.name || 'โรงเรียน'}
${worksheet.title}
รายวิชา: ${worksheet.subjectName} ระดับชั้น: ${worksheet.gradeLevel}
ชื่อ-สกุล: ${activeStudent?.fullName || ''} เลขที่: ${activeStudent?.seatNumber || ''} ห้อง: ${studentClassroom?.name || ''}
=======================================================

คำชี้แจง:
${worksheet.instructions}

${worksheet.conceptSummary ? `💡 สรุปสาระสำคัญ:\n${worksheet.conceptSummary}\n\n` : ''}${worksheet.objectives && worksheet.objectives.length > 0 ? `จุดประสงค์การเรียนรู้:\n${worksheet.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n` : ''}-------------------------------------------------------
คำถามและแบบฝึกหัด:
-------------------------------------------------------
${worksheet.questions.map((q, idx) => {
  let qText = `ข้อที่ ${idx + 1}: ${q.question} (${q.points || 1} คะแนน)\n`;
  if (q.options && q.options.length > 0) {
    qText += q.options.map(opt => `   ${opt}`).join('\n') + '\n';
  } else {
    qText += '   ตอบ: __________________________________________________\n';
  }
  return qText;
}).join('\n')}
=======================================================
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${worksheet.title.replace(/[\/\\?%*:|"<>]/g, '_')}_${studentClassroom?.name || 'room'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAttachment = (asg: any) => {
    if (activeStudent && currentSubject && asg.attachment) {
      logActivity({
        actorType: 'student',
        actionType: 'download_resource',
        studentId: activeStudent.id,
        studentCode: activeStudent.studentCode,
        studentName: `${activeStudent.prefix}${activeStudent.fullName}`,
        classroomId: studentClassroom?.id,
        classroomName: studentClassroom?.name,
        subjectId: currentSubject.id,
        subjectName: currentSubject.name,
        title: `ดาวน์โหลดไฟล์แนบ: ${asg.title}`,
        details: `เปิด/ดาวน์โหลดไฟล์ ${asg.attachment.name}`,
        targetId: asg.id,
        targetName: asg.title,
      });
    }
  };

  // Assignments for current subject
  const subjectAssignments = useMemo(() => {
    if (!currentSubject) return [];
    return assignments.filter(a => a.subjectId === currentSubject.id);
  }, [assignments, currentSubject]);

  // Regular assignments (Homework, Project, Activity) -> Scores strictly HIDDEN!
  const regularTasks = useMemo(() => {
    return subjectAssignments.filter(a => !a.isExam);
  }, [subjectAssignments]);

  // Exam assignments (Midterm, Final, Quiz) -> Scores VISIBLE!
  const examTasks = useMemo(() => {
    return subjectAssignments.filter(a => a.isExam);
  }, [subjectAssignments]);

  // Statistics for this student in current subject
  const studentStats = useMemo(() => {
    if (!activeStudent || !currentSubject) {
      return { total: 0, submitted: 0, late: 0, pending: 0, rate: 0 };
    }
    let submitted = 0;
    let late = 0;
    let pending = 0;

    subjectAssignments.forEach(asg => {
      const sub = submissions.find(s => s.assignmentId === asg.id && s.studentId === activeStudent.id);
      const status = sub?.status || 'pending';
      if (status === 'submitted') submitted++;
      else if (status === 'late') late++;
      else pending++;
    });

    const total = subjectAssignments.length;
    const completed = submitted + late;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, submitted, late, pending, rate };
  }, [activeStudent, currentSubject, subjectAssignments, submissions]);

  // Pending tasks list for active student
  const pendingTasks = useMemo(() => {
    if (!activeStudent) return [];
    return subjectAssignments.filter(asg => {
      const sub = submissions.find(s => s.assignmentId === asg.id && s.studentId === activeStudent.id);
      return !sub || sub.status === 'pending';
    });
  }, [activeStudent, subjectAssignments, submissions]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = studentCodeInput.trim();
    if (!cleanCode) {
      setSearchError('กรุณากรอกเลขประจำตัวนักเรียน');
      return;
    }

    const matched = students.find(s => s.studentCode.trim().toLowerCase() === cleanCode.toLowerCase());
    if (matched) {
      setSearchedCode(matched.studentCode);
      localStorage.setItem('krudata_active_student_code', matched.studentCode);
      setSearchError(null);
    } else {
      setSearchError('ไม่พบข้อมูลนักเรียนที่มีเลขประจำตัวนี้ในระบบ โปรดตรวจสอบเลขประจำตัวอีกครั้ง');
    }
  };

  const handleLogout = () => {
    setSearchedCode(null);
    setStudentCodeInput('');
    localStorage.removeItem('krudata_active_student_code');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 font-formal pb-10">
      {/* Top Banner (Formal Mobile) */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-emerald-200 tracking-wider uppercase">
              {schoolProfile.name || 'ระบบตรวจสอบสถานะส่งงานและคะแนนสอบ'}
            </span>
            <h1 className="text-lg sm:text-xl font-bold leading-tight">
              ระบบบริการข้อมูลนักเรียนรายบุคคล
            </h1>
          </div>
        </div>
      </div>

      {/* STATE 1: SEARCH BY STUDENT CODE ONLY */}
      {!activeStudent ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-100 shadow-inner">
            <KeyRound className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800">
              ค้นหาข้อมูลเฉพาะของตนเอง
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              เพื่อความปลอดภัยและความเป็นส่วนตัว ระบบจะแสดงเฉพาะสถานะการส่งงานและคะแนนสอบของนักเรียนตามเลขประจำตัวเท่านั้น
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="max-w-sm mx-auto space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="กรอกเลขประจำตัวนักเรียน"
                value={studentCodeInput}
                onChange={(e) => {
                  setStudentCodeInput(e.target.value);
                  setSearchError(null);
                }}
                className="w-full pl-4 pr-10 py-3 text-center text-base sm:text-lg font-mono font-bold tracking-wider rounded-xl border-2 border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 bg-slate-50"
              />
              <Search className="w-5 h-5 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            {searchError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{searchError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ตรวจสอบข้อมูล</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>นักเรียนจะไม่สามารถมองเห็นข้อมูลหรือคะแนนของเพื่อนคนอื่นได้</span>
          </div>
        </div>
      ) : (
        /* STATE 2: STUDENT PORTAL (Only showing active student's private data) */
        <div className="space-y-4">
          {/* Student Profile Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg shrink-0">
                  {activeStudent.seatNumber}
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-mono">
                    รหัสประจำตัว: <strong className="text-slate-800 font-bold">{activeStudent.studentCode}</strong>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {activeStudent.prefix}{activeStudent.fullName}
                  </h2>
                  <div className="text-xs text-slate-500">
                    ห้อง {studentClassroom?.name} (เลขที่ {activeStudent.seatNumber})
                  </div>
                </div>
              </div>

              {/* Exit / Switch Student */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
                title="ออกจากระบบ เพื่อค้นหารหัสอื่น"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออก</span>
              </button>
            </div>

            {/* Subject Selector (If multiple subjects) */}
            {studentSubjects.length > 1 && (
              <div className="pt-3">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  เลือกวิชาที่ต้องการตรวจสอบ:
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {studentSubjects.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubjectId(sub.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 border ${
                        currentSubject?.id === sub.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: currentSubject?.id === sub.id ? '#ffffff' : sub.color }} 
                      />
                      <span>{sub.code} {sub.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Progress Cards */}
            <div className="grid grid-cols-3 gap-2 pt-3 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-[11px] text-slate-500 font-medium">ภาระงานทั้งหมด</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">
                  {studentStats.total} <span className="text-xs font-normal">งาน</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-[11px] text-slate-500 font-medium">ความก้าวหน้า</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">
                  {studentStats.rate}%
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                studentStats.pending > 0 
                  ? 'bg-rose-50 border-rose-200 text-rose-800 font-bold' 
                  : 'bg-slate-50 border-slate-100 text-slate-700'
              }`}>
                <div className="text-[11px] font-medium">งานค้าง</div>
                <div className="text-lg font-bold mt-0.5">
                  {studentStats.pending} <span className="text-xs font-normal">งาน</span>
                </div>
              </div>
            </div>

            {/* Attendance & Exam Ineligibility Status Card */}
            {attendanceSummary && attendanceSummary.totalSessions > 0 && (
              <div className={`mt-3 p-3.5 rounded-xl border transition-all ${
                attendanceSummary.isExamIneligible
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : attendanceSummary.isAtRisk
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className={`w-4 h-4 ${
                      attendanceSummary.isExamIneligible ? 'text-rose-600' : attendanceSummary.isAtRisk ? 'text-amber-600' : 'text-emerald-600'
                    }`} />
                    <span className="font-bold text-xs">เวลาเรียน & สิทธิ์สอบปลายภาค:</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    attendanceSummary.isExamIneligible
                      ? 'bg-rose-200 text-rose-800'
                      : attendanceSummary.isAtRisk
                      ? 'bg-amber-200 text-amber-800'
                      : 'bg-emerald-200 text-emerald-800'
                  }`}>
                    {attendanceSummary.isExamIneligible ? '⛔ หมดสิทธิ์สอบ (มส.)' : attendanceSummary.isAtRisk ? '⚠️ เสี่ยงหมดสิทธิ์สอบ' : '✓ มีสิทธิ์สอบปกติ'}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <div>
                    เวลาเรียนสะสม: <strong className="text-base">{attendanceSummary.attendancePercentage}%</strong>
                    <span className="text-[11px] text-slate-500 ml-1.5">(เกณฑ์ สพฐ. &ge; 80%)</span>
                  </div>
                  <div className="text-[11px]">
                    มา {attendanceSummary.presentCount} • สาย {attendanceSummary.lateCount} • ลา {attendanceSummary.leaveCount} • ขาด {attendanceSummary.absentCount}
                  </div>
                </div>

                {attendanceSummary.isAtRisk && !attendanceSummary.isExamIneligible && (
                  <div className="mt-2 text-[11px] text-amber-800 bg-amber-100/60 p-2 rounded-lg font-medium">
                    ⚠️ คำเตือน: เวลาเรียนของคุณใกล้ต่ำกว่าเกณฑ์ 80% ยังสามารถขาดได้อีกไม่เกิน {attendanceSummary.remainingAbsenceAllowed} ครั้ง
                  </div>
                )}

                {attendanceSummary.isExamIneligible && (
                  <div className="mt-2 text-[11px] text-rose-800 bg-rose-100/80 p-2 rounded-lg font-semibold">
                    ⛔ แจ้งเตือน: เวลาเรียนของคุณต่ำกว่า 80% (ติด มส.) กรุณาติดต่อครูผู้สอนเพื่อยื่นคำร้องขอสอบซ่อมเสริมเวลาเรียน
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Teacher Alerts Banner for this Student */}
          {myAlerts.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-4 text-white shadow-md space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <BellRing className="w-4 h-4 text-amber-100 animate-bounce" />
                <span>ข้อความแจ้งเตือนจากครูผู้สอน ({myAlerts.length} รายการ)</span>
              </div>
              <div className="space-y-1.5">
                {myAlerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className="bg-black/15 p-2.5 rounded-xl border border-white/10 text-xs">
                    <div className="font-semibold text-white">{alert.details}</div>
                    <div className="text-[10px] text-amber-100 mt-1 flex items-center justify-between">
                      <span>{alert.subjectName || ''}</span>
                      <span>
                        {new Date(alert.timestamp).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Segmented Tab Navigation for Student */}
          <div className="flex bg-slate-200/80 p-1 rounded-2xl text-xs font-bold gap-1 shadow-inner">
            <button
              onClick={() => setStudentTab('tasks')}
              className={`flex-1 py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                studentTab === 'tasks'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>ภาระงาน & ผลสอบ</span>
              {studentStats.pending > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {studentStats.pending}
                </span>
              )}
            </button>

            <button
              onClick={() => setStudentTab('drive')}
              className={`flex-1 py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                studentTab === 'drive'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>คลังสื่อ & ใบงาน</span>
              {publicDriveResources.length > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {publicDriveResources.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setStudentTab('my_logs')}
              className={`flex-1 py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                studentTab === 'my_logs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-600" />
              <span>ประวัติของฉัน</span>
              <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-1.5 py-0.2 rounded-full">
                {myActivityLogs.length}
              </span>
            </button>
          </div>

          {/* ==================================================== */}
          {/* SUB-VIEW 1: TASKS & SCORES                           */}
          {/* ==================================================== */}
          {studentTab === 'tasks' && (
            <div className="space-y-4">
              {/* Pending Work Alert (Priority 1) with Direct Download/View Link */}
              {pendingTasks.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>งานค้างที่ต้องรีบส่ง ({pendingTasks.length} รายการ)</span>
                  </div>
                  <div className="space-y-2">
                    {pendingTasks.map((asg) => (
                      <div key={asg.id} className="bg-white p-3 rounded-xl border border-rose-100 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-xs text-slate-900 leading-snug">{asg.title}</div>
                          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 shrink-0">
                            ส่งใน {asg.dueDate}
                          </span>
                        </div>
                        {asg.description && (
                          <div className="text-[11px] text-slate-600">{asg.description}</div>
                        )}
                        {/* Attached file for pending work so student can download and do the task! */}
                        {asg.attachment && (
                          <div className="pt-1">
                            <a
                              href={asg.attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={asg.attachment.name}
                              onClick={() => handleDownloadAttachment(asg)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition shadow-2xs"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>เปิดดู / ดาวน์โหลดใบงาน: {asg.attachment.name}</span>
                              <ExternalLink className="w-3 h-3 text-indigo-400" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 1: EXAM SCORES (Visible to this student!) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">คะแนนสอบ (Exam Scores)</h3>
                      <p className="text-[11px] text-slate-500">ผลการสอบกลางภาค / ปลายภาค / สอบย่อย</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    เปิดเผยคะแนนสอบ
                  </span>
                </div>

                {examTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">ยังไม่มีรายการสอบในวิชานี้</p>
                ) : (
                  <div className="space-y-2">
                    {examTasks.map((asg) => {
                      const sub = submissions.find(s => s.assignmentId === asg.id && s.studentId === activeStudent.id);
                      const score = sub?.score;
                      const isSubmitted = sub?.status === 'submitted' || sub?.status === 'late';

                      return (
                        <div key={asg.id} className="p-3 rounded-xl border border-amber-200 bg-amber-50/20 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                {asg.category}
                              </span>
                              <div className="font-bold text-xs text-slate-900 mt-1">{asg.title}</div>
                            </div>

                            {/* Score Display */}
                            <div className="text-right shrink-0">
                              {score !== null && score !== undefined ? (
                                <div>
                                  <span className="text-xl font-black text-amber-700">{score}</span>
                                  <span className="text-xs text-slate-400 font-bold ml-1">/ {asg.maxScore}</span>
                                </div>
                              ) : isSubmitted ? (
                                <span className="text-xs font-semibold text-blue-600">ส่งแล้ว รอตรวจ</span>
                              ) : (
                                <span className="text-xs font-semibold text-rose-500">ยังไม่สอบ / ขาดสอบ</span>
                              )}
                            </div>
                          </div>

                          {asg.attachment && (
                            <div>
                              <a
                                href={asg.attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={asg.attachment.name}
                                onClick={() => handleDownloadAttachment(asg)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-900 bg-amber-100/70 hover:bg-amber-200/80 rounded-lg border border-amber-300 transition"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>เอกสารข้อสอบ/แบบทดสอบ: {asg.attachment.name}</span>
                              </a>
                            </div>
                          )}

                          {sub?.teacherNote && (
                            <div className="text-[11px] text-amber-900 bg-amber-100/50 p-2 rounded-lg flex items-start gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                              <span>ครูบันทึก: {sub.teacherNote}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: REGULAR ASSIGNMENTS (Status Visible, Scores strictly HIDDEN!) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">สถานะการส่งการบ้านและชิ้นงาน</h3>
                      <p className="text-[11px] text-slate-500">ตรวจสอบสถานะส่งงานและการตรวจของครู</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>คะแนนเก็บไม่เปิดเผย</span>
                  </div>
                </div>

                {regularTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">ไม่มีรายการงานเก็บคะแนน</p>
                ) : (
                  <div className="space-y-2">
                    {regularTasks.map((asg) => {
                      const sub = submissions.find(s => s.assignmentId === asg.id && s.studentId === activeStudent.id);
                      const status: SubmissionStatus = sub?.status || 'pending';

                      return (
                        <div
                          key={asg.id}
                          className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/60 transition space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-xs text-slate-900 leading-snug">{asg.title}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>กำหนดส่ง: {asg.dueDate}</span>
                                <span>•</span>
                                <span>{asg.category}</span>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="shrink-0">
                              {status === 'submitted' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  ส่งแล้ว
                                </span>
                              ) : status === 'late' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  ส่งช้า
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                  ยังไม่ส่ง
                                </span>
                              )}
                            </div>
                          </div>

                          {/* File attachment so student can download the worksheet */}
                          {asg.attachment && (
                            <div>
                              <a
                                href={asg.attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={asg.attachment.name}
                                onClick={() => handleDownloadAttachment(asg)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>ดูไฟล์ใบงาน: {asg.attachment.name}</span>
                                <ExternalLink className="w-3 h-3 text-indigo-400" />
                              </a>
                            </div>
                          )}

                          {/* Teacher Inspect Confirmation (Score is strictly hidden) */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">ผลการตรวจงาน:</span>
                            {status === 'submitted' || status === 'late' ? (
                              <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-medium">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>ตรวจแล้ว (คะแนนเก็บไม่เปิดเผย)</span>
                              </span>
                            ) : (
                              <span className="text-rose-600 font-semibold">รอส่งงาน</span>
                            )}
                          </div>

                          {sub?.teacherNote && (
                            <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 flex items-start gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                              <span>ข้อเสนอแนะครู: {sub.teacherNote}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SUB-VIEW 2: DRIVE & WORKSHEETS                       */}
          {/* ==================================================== */}
          {studentTab === 'drive' && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">คลังสื่อ & ใบงานจากครูผู้สอน</h3>
                    <p className="text-[11px] text-slate-500">เอกสาร สไลด์ และใบงานสำหรับดาวน์โหลดและฝึกทำ ({publicDriveResources.length} รายการ)</p>
                  </div>
                </div>
              </div>

              {publicDriveResources.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  ยังไม่มีสื่อหรือใบงานที่ได้รับอนุญาตสำหรับห้อง {studentClassroom?.name} ในขณะนี้
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {publicDriveResources.map(res => (
                    <div key={res.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-2.5 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs text-slate-900 line-clamp-1">{res.title}</div>
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded shrink-0">
                          {res.type === 'worksheet' ? 'ใบงาน' : res.type === 'slide' ? 'สไลด์' : res.type === 'media_link' ? 'วิดีโอ/สื่อ' : 'เอกสาร'}
                        </span>
                      </div>

                      {res.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-2">{res.description}</div>
                      )}

                      <div className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 font-semibold w-fit border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>ครูอนุญาตให้นักเรียนห้อง {studentClassroom?.name} เข้าถึงได้</span>
                      </div>

                      <div className="pt-1 flex flex-wrap items-center gap-1.5">
                        {res.worksheetData ? (
                          <>
                            <button
                              onClick={() => res.worksheetData && handleOpenWorksheetPreview(res.worksheetData)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>เปิดดูใบงาน</span>
                            </button>
                            <button
                              onClick={() => res.worksheetData && handleDownloadWorksheet(res.worksheetData)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>ดาวน์โหลด</span>
                            </button>
                          </>
                        ) : res.fileUrl ? (
                          <>
                            <a
                              href={res.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1 transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>เปิดดู</span>
                            </a>
                            <a
                              href={res.fileUrl}
                              download={res.fileName || res.title}
                              onClick={() => {
                                if (activeStudent && currentSubject) {
                                  logActivity({
                                    actorType: 'student',
                                    actionType: 'download_resource',
                                    studentId: activeStudent.id,
                                    studentCode: activeStudent.studentCode,
                                    studentName: `${activeStudent.prefix}${activeStudent.fullName}`,
                                    classroomId: studentClassroom?.id,
                                    classroomName: studentClassroom?.name,
                                    subjectId: currentSubject.id,
                                    subjectName: currentSubject.name,
                                    title: `ดาวน์โหลดไฟล์สื่อ: ${res.title}`,
                                    details: `ดาวน์โหลดไฟล์ ${res.fileName || res.title}`,
                                    targetId: res.id,
                                    targetName: res.title,
                                  });
                                }
                              }}
                              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>ดาวน์โหลดไฟล์</span>
                            </a>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* SUB-VIEW 3: MY ACTIVITY HISTORY                      */}
          {/* ==================================================== */}
          {studentTab === 'my_logs' && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">ประวัติการเข้าใช้งานของฉัน</h3>
                    <p className="text-[11px] text-slate-500">บันทึกวันเวลาที่เข้ามาตรวจงาน และข้อความแจ้งเตือนจากครู</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {myActivityLogs.length} รายการ
                </span>
              </div>

              {myActivityLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">ยังไม่มีประวัติการเข้าใช้งาน</p>
              ) : (
                <div className="space-y-2">
                  {myActivityLogs.map(log => {
                    const isAlert = log.actionType === 'teacher_alert_sent';
                    const isDownload = log.actionType === 'download_resource';
                    const isLogin = log.actionType === 'portal_login';

                    return (
                      <div
                        key={log.id}
                        className={`p-3 rounded-xl border transition flex items-start gap-2.5 ${
                          isAlert
                            ? 'bg-amber-50/70 border-amber-200'
                            : isDownload
                            ? 'bg-emerald-50/50 border-emerald-100'
                            : 'bg-slate-50/60 border-slate-100'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isAlert ? 'bg-amber-100 text-amber-700' : isDownload ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isAlert ? <BellRing className="w-3.5 h-3.5" /> : isDownload ? <Download className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <div className="font-bold text-xs text-slate-900 leading-snug">
                              {log.title}
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                              {new Date(log.timestamp).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {log.details && (
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {log.details}
                            </div>
                          )}

                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                            {log.deviceInfo?.isMobile ? (
                              <span className="inline-flex items-center gap-1">
                                <Smartphone className="w-2.5 h-2.5" /> มือถือ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <Laptop className="w-2.5 h-2.5" /> คอมพิวเตอร์
                              </span>
                            )}
                            {log.subjectName && <span>• {log.subjectName}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STUDENT MODAL: WORKSHEET PREVIEW */}
      {studentPreviewWorksheet && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-indigo-600">ใบงานการเรียนรู้</span>
                <h3 className="font-bold text-lg text-slate-900">{studentPreviewWorksheet.title}</h3>
              </div>
              <button
                onClick={handleCloseWorksheetPreview}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {studentPreviewWorksheet.conceptSummary && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>💡 สรุปเนื้อหาสำคัญ:</strong> {studentPreviewWorksheet.conceptSummary}
              </div>
            )}

            <div className="text-xs text-slate-600 font-medium">
              <strong>คำชี้แจง:</strong> {studentPreviewWorksheet.instructions}
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {studentPreviewWorksheet.questions.map((q, idx) => (
                <div key={q.id || idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-start gap-1.5">
                    <span className="text-indigo-600">ข้อ {idx + 1}.</span>
                    <span>{q.question}</span>
                    <span className="text-slate-400 font-normal">({q.points || 1} คะแนน)</span>
                  </div>

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-4 pt-1">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700">
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadWorksheet(studentPreviewWorksheet)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  ดาวน์โหลดไฟล์ใบงาน (.txt)
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition"
                >
                  พิมพ์ใบงานนี้
                </button>
              </div>
              <button
                onClick={handleCloseWorksheetPreview}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  History,
  Search,
  Filter,
  Download,
  Printer,
  Trash2,
  Calendar,
  Clock,
  UserCheck,
  AlertTriangle,
  FileText,
  Smartphone,
  Laptop,
  CheckCircle2,
  Eye,
  Award,
  BellRing,
  Send,
  Sparkles,
  Users,
  ShieldCheck,
  FolderGit2,
  TrendingUp,
  RefreshCw,
  X,
  Moon,
  Copy,
  BookOpen,
  Zap,
  Mail,
  ShieldAlert
} from 'lucide-react';
import { UserActivityLog, ActivityActionType } from '../../types';

export const ActivityLogsView: React.FC = () => {
  const {
    activityLogs,
    clearActivityLogs,
    deleteActivityLog,
    sendStudentAlert,
    currentClassroom,
    currentSubject,
    classrooms,
    subjects,
    students,
    assignments,
    submissions,
    getStudentAttendanceSummary,
    schoolProfile,
    setShowErrorModal,
    logActivity
  } = useApp();

  // Sub-tabs: 'logs' | 'inactive_radar' | 'engagement' | 'integrity' | 'analytics'
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'inactive_radar' | 'engagement' | 'integrity' | 'analytics'>('logs');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState<'all' | 'mobile' | 'desktop'>('all');

  // Modal for sending alert to student
  const [alertModalStudent, setAlertModalStudent] = useState<{ id: string; name: string; pendingCount: number } | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSuccessToast, setAlertSuccessToast] = useState<string | null>(null);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      // 1. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = log.title?.toLowerCase().includes(q);
        const matchDetails = log.details?.toLowerCase().includes(q);
        const matchName = log.studentName?.toLowerCase().includes(q);
        const matchCode = log.studentCode?.toLowerCase().includes(q);
        const matchSubject = log.subjectName?.toLowerCase().includes(q);
        if (!matchTitle && !matchDetails && !matchName && !matchCode && !matchSubject) {
          return false;
        }
      }

      // 2. Action type
      if (selectedActionType !== 'all' && log.actionType !== selectedActionType) {
        return false;
      }

      // 3. Classroom
      if (selectedClassFilter !== 'all') {
        if (log.classroomId !== selectedClassFilter) {
          return false;
        }
      }

      // 4. Device
      if (selectedDeviceFilter !== 'all') {
        const isMobile = log.deviceInfo?.isMobile;
        if (selectedDeviceFilter === 'mobile' && !isMobile) return false;
        if (selectedDeviceFilter === 'desktop' && isMobile) return false;
      }

      // 5. Date range
      if (selectedDateRange !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        if (selectedDateRange === 'today' && logDate < startOfToday) return false;
        if (selectedDateRange === 'yesterday') {
          if (logDate < startOfYesterday || logDate >= startOfToday) return false;
        }
        if (selectedDateRange === 'week' && logDate < sevenDaysAgo) return false;
        if (selectedDateRange === 'month' && logDate < thirtyDaysAgo) return false;
      }

      return true;
    });
  }, [activityLogs, searchQuery, selectedActionType, selectedClassFilter, selectedDeviceFilter, selectedDateRange]);

  // Overall Statistics KPIs
  const stats = useMemo(() => {
    const totalLogs = activityLogs.length;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayLogs = activityLogs.filter(l => new Date(l.timestamp) >= startOfToday);
    const activeStudentIdsToday = new Set(
      todayLogs.filter(l => l.actorType === 'student' && l.studentId).map(l => l.studentId)
    );

    const downloadsCount = activityLogs.filter(l => l.actionType === 'download_resource').length;
    const viewsCount = activityLogs.filter(l => l.actionType === 'view_drive_resource').length;

    // Student engagement rate in current classroom
    const currentClassStudents = students.filter(s => s.classroomId === currentClassroom?.id);
    const engagedStudentsInClass = new Set(
      activityLogs
        .filter(l => l.actorType === 'student' && currentClassStudents.some(cs => cs.id === l.studentId))
        .map(l => l.studentId)
    );

    const classEngagementRate = currentClassStudents.length > 0
      ? Math.round((engagedStudentsInClass.size / currentClassStudents.length) * 100)
      : 0;

    return {
      totalLogs,
      activeTodayCount: activeStudentIdsToday.size,
      downloadsCount,
      viewsCount,
      classEngagementRate,
      totalClassStudents: currentClassStudents.length,
      engagedClassStudentsCount: engagedStudentsInClass.size,
    };
  }, [activityLogs, students, currentClassroom]);

  // Inactive / At-Risk Students Radar analysis for current classroom
  const inactiveRadar = useMemo(() => {
    const classStudents = students.filter(s => s.classroomId === currentClassroom?.id);
    const now = new Date().getTime();

    return classStudents.map(student => {
      // Find logs for this student
      const studentLogs = activityLogs.filter(
        l => l.studentId === student.id || (l.studentCode && l.studentCode === student.studentCode)
      );

      // Latest log timestamp
      const latestLog = studentLogs[0]; // array is newest first
      const lastActiveDate = latestLog ? new Date(latestLog.timestamp) : null;
      const daysSinceActive = lastActiveDate ? Math.floor((now - lastActiveDate.getTime()) / (24 * 3600 * 1000)) : 999;

      // Pending assignments in current subject
      const subjectAssignments = assignments.filter(a => a.subjectId === currentSubject?.id);
      let pendingCount = 0;
      const pendingTaskList: string[] = [];
      subjectAssignments.forEach(asg => {
        const sub = submissions.find(s => s.assignmentId === asg.id && s.studentId === student.id);
        if (!sub || sub.status === 'pending') {
          pendingCount++;
          pendingTaskList.push(asg.title);
        }
      });

      // Attendance summary
      const attendance = currentSubject ? getStudentAttendanceSummary(student.id, currentSubject.id) : null;

      // Risk score:
      // High risk: Never active OR inactive >= 7 days OR exam ineligible OR pending >= 3
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (!lastActiveDate || daysSinceActive >= 7 || pendingCount >= 3 || attendance?.isExamIneligible) {
        riskLevel = 'high';
      } else if (daysSinceActive >= 3 || pendingCount > 0 || attendance?.isAtRisk) {
        riskLevel = 'medium';
      }

      return {
        student,
        lastActiveDate,
        daysSinceActive,
        totalActionsCount: studentLogs.length,
        pendingCount,
        pendingTaskList,
        attendance,
        riskLevel,
        lastActionTitle: latestLog?.title || 'ยังไม่เคยเข้าตรวจสอบงาน',
      };
    }).sort((a, b) => {
      // Sort high risk first, then by days since active descending
      const riskOrder = { high: 0, medium: 1, low: 2 };
      if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }
      return b.daysSinceActive - a.daysSinceActive;
    });
  }, [students, currentClassroom, currentSubject, activityLogs, assignments, submissions, getStudentAttendanceSummary]);

  // 4-Tier Student Engagement Index (SEI) calculation
  const engagementIndexData = useMemo(() => {
    const classStudents = students.filter(s => s.classroomId === currentClassroom?.id);
    const now = Date.now();

    return classStudents.map(student => {
      const studentLogs = activityLogs.filter(
        l => l.studentId === student.id || (l.studentCode && l.studentCode === student.studentCode)
      );

      const subjectAssignments = assignments.filter(a => a.subjectId === currentSubject?.id);
      let pendingCount = 0;
      const pendingTaskList: string[] = [];
      subjectAssignments.forEach(asg => {
        const sub = submissions.find(s => s.assignmentId === asg.id && s.studentId === student.id);
        if (!sub || sub.status === 'pending') {
          pendingCount++;
          pendingTaskList.push(asg.title);
        }
      });

      const attendance = currentSubject ? getStudentAttendanceSummary(student.id, currentSubject.id) : null;
      const attRate = attendance ? attendance.attendancePercentage : 100;

      const latestLog = studentLogs[0];
      const daysSinceActive = latestLog ? Math.floor((now - new Date(latestLog.timestamp).getTime()) / (24 * 3600 * 1000)) : 999;
      const actionsCount = studentLogs.length;

      // Total Read Seconds
      const totalReadSeconds = studentLogs
        .filter(l => l.durationSeconds && l.durationSeconds > 0)
        .reduce((sum, l) => sum + (l.durationSeconds || 0), 0);

      // Score Calculation (0-100)
      const subScore = subjectAssignments.length > 0
        ? Math.round(((subjectAssignments.length - pendingCount) / subjectAssignments.length) * 40)
        : 40;
      const attScore = Math.round((attRate / 100) * 30);
      let actScore = 0;
      if (daysSinceActive <= 1) actScore = 30;
      else if (daysSinceActive <= 3) actScore = 24;
      else if (daysSinceActive <= 5) actScore = 18;
      else if (daysSinceActive <= 7) actScore = 10;
      else if (daysSinceActive < 999) actScore = 5;
      else actScore = 0;

      const seiScore = Math.min(100, Math.max(0, subScore + attScore + actScore));

      // 4 Tiers
      let tier: 1 | 2 | 3 | 4 = 2;
      let tierTitle = 'สม่ำเสมอปกติ';
      let tierColor = 'emerald';
      let tierBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';

      if (seiScore >= 85 && pendingCount === 0) {
        tier = 1;
        tierTitle = 'ดาวเด่น (High Active)';
        tierColor = 'indigo';
        tierBadgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
      } else if (seiScore >= 70 && pendingCount <= 1) {
        tier = 2;
        tierTitle = 'สม่ำเสมอตามเกณฑ์';
        tierColor = 'emerald';
        tierBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      } else if (seiScore >= 50 || pendingCount <= 2) {
        tier = 3;
        tierTitle = 'เริ่มชะลอตัว (เฝ้าระวัง)';
        tierColor = 'amber';
        tierBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      } else {
        tier = 4;
        tierTitle = 'วิกฤต / ต้องการช่วยเหลือด่วน';
        tierColor = 'rose';
        tierBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      }

      return {
        student,
        seiScore,
        tier,
        tierTitle,
        tierColor,
        tierBadgeClass,
        pendingCount,
        pendingTaskList,
        attendance,
        attRate,
        daysSinceActive,
        actionsCount,
        totalReadSeconds,
        latestLog,
      };
    }).sort((a, b) => {
      // Sort Tier 4 first, then 3, then ascending by score
      if (b.tier !== a.tier) return b.tier - a.tier;
      return a.seiScore - b.seiScore;
    });
  }, [students, currentClassroom, currentSubject, assignments, submissions, activityLogs, getStudentAttendanceSummary]);

  // Integrity & Anti-cheating logs radar
  const integrityLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const h = new Date(log.timestamp).getHours();
      const isLateNight = h >= 23 || h < 5;
      const isTimeLog = log.actionType === 'read_resource_time' || log.actionType === 'portal_session_duration';
      return log.isIntegrityFlagged || isLateNight || isTimeLog || log.actionType === 'integrity_flag';
    });
  }, [activityLogs]);

  const totalReadingSeconds = useMemo(() => {
    return activityLogs
      .filter(l => l.actionType === 'read_resource_time' && l.durationSeconds)
      .reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
  }, [activityLogs]);

  const lateNightChecksCount = useMemo(() => {
    return activityLogs.filter(l => {
      const h = new Date(l.timestamp).getHours();
      return h >= 23 || h < 5;
    }).length;
  }, [activityLogs]);

  // One-Click Follow-up: Individual copy
  const handleCopyPersonalFollowup = (item: any) => {
    const { student, pendingCount, pendingTaskList, attRate } = item;
    const taskText = pendingTaskList.length > 0 ? pendingTaskList.join(', ') : 'งานค้าง';
    const msg = [
      `📢 [แจ้งเตือนการส่งงานและเวลาเรียน - KruSmart]`,
      `เรียน น้อง${student.prefix}${student.fullName} (เลขที่ ${student.seatNumber}) ห้อง ${currentClassroom?.name}`,
      `รายวิชา: ${currentSubject?.code} ${currentSubject?.name}`,
      `---------------------------------`,
      `คุณครูขอติดตามงานที่ยังค้างส่ง ${pendingCount} งาน:`,
      `👉 ${taskText}`,
      attRate < 80 ? `⚠️ เวลาเรียนสะสมขณะนี้ ${attRate}% (เสี่ยงติด มส.)` : `✅ เวลาเรียนสะสม ${attRate}%`,
      `---------------------------------`,
      `💡 ขอให้นักเรียนรีบดำเนินการและตรวจสอบสถานะได้ที่ระบบตรวจสอบงานของโรงเรียน`,
      `หากมีข้อสงสัยหรือติดปัญหาขัดข้อง กรุณาติดต่อคุณครูได้เลยครับ/ค่ะ 🙏`
    ].join('\n');

    navigator.clipboard.writeText(msg);
    setAlertSuccessToast(`คัดลอกข้อความติดตามงานของ ${student.fullName} เรียบร้อยแล้ว (สามารถวางใน LINE หรือแชทได้ทันที)`);
    setTimeout(() => setAlertSuccessToast(null), 3500);

    logActivity({
      actorType: 'teacher',
      actionType: 'followup_sent',
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: `${student.prefix}${student.fullName}`,
      classroomId: currentClassroom?.id,
      classroomName: currentClassroom?.name,
      subjectId: currentSubject?.id,
      subjectName: currentSubject?.name,
      title: `ติดตามงาน 1 คลิก ถึง ${student.fullName}`,
      details: `คัดลอก/ส่งข้อความติดตามงานค้าง ${pendingCount} งาน (${taskText})`,
    });
  };

  // One-Click Follow-up: Bulk copy
  const handleCopyAllOverdueNotice = () => {
    const atRiskStudents = engagementIndexData.filter(item => item.pendingCount > 0);
    if (atRiskStudents.length === 0) {
      alert('ไม่มีนักเรียนค้างส่งงานในห้องนี้');
      return;
    }

    const lines = [
      `📢 [สรุปรายชื่อนักเรียนค้างส่งงาน - KruSmart]`,
      `วิชา: ${currentSubject?.code} ${currentSubject?.name}`,
      `ระดับชั้น: ห้อง ${currentClassroom?.name}`,
      `ประจำวันที่: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      `---------------------------------`,
      `ขอความร่วมมือนักเรียนที่มีรายชื่อต่อไปนี้ ส่งงานที่ค้างให้เรียบร้อย:`,
      ''
    ];

    atRiskStudents.forEach(item => {
      const tasks = item.pendingTaskList.slice(0, 3).join(', ') + (item.pendingTaskList.length > 3 ? ' และอื่นๆ' : '');
      lines.push(`• เลขที่ ${item.student.seatNumber} ${item.student.prefix}${item.student.fullName} (ค้าง ${item.pendingCount} งาน: ${tasks})`);
    });

    lines.push('');
    lines.push(`💡 ตรวจสอบรายละเอียดงานและคะแนนสอบได้ที่ระบบตรวจสอบงานของโรงเรียน`);
    lines.push(`หากพบระบบขัดข้อง แจ้งเมลหา nawaratk65@gmail.com หรือติดต่อครูผู้สอน`);

    navigator.clipboard.writeText(lines.join('\n'));
    setAlertSuccessToast(`คัดลอกข้อความสรุปงานค้างทั้งห้อง (${atRiskStudents.length} คน) เรียบร้อยแล้ว`);
    setTimeout(() => setAlertSuccessToast(null), 3500);
  };

  // Analytics: Peak Hours distribution (24 hours)
  const peakHoursData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    activityLogs.forEach(log => {
      const h = new Date(log.timestamp).getHours();
      if (hours[h]) hours[h].count++;
    });
    const maxCount = Math.max(...hours.map(h => h.count), 1);
    return { hours, maxCount };
  }, [activityLogs]);

  // Top Most Downloaded Resources
  const topDownloadedResources = useMemo(() => {
    const counts: Record<string, { title: string; count: number; subject?: string }> = {};
    activityLogs.filter(l => l.actionType === 'download_resource').forEach(l => {
      const name = l.targetName || l.title || 'เอกสารทั่วไป';
      if (!counts[name]) {
        counts[name] = { title: name, count: 0, subject: l.subjectName };
      }
      counts[name].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [activityLogs]);

  // Top Active Students Leaderboard
  const topActiveStudents = useMemo(() => {
    const counts: Record<string, { name: string; code?: string; count: number; className?: string }> = {};
    activityLogs.filter(l => l.actorType === 'student' && l.studentId).forEach(l => {
      const id = l.studentId!;
      if (!counts[id]) {
        counts[id] = {
          name: l.studentName || 'นักเรียน',
          code: l.studentCode,
          count: 0,
          className: l.classroomName,
        };
      }
      counts[id].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [activityLogs]);

  // Send alert to student handler
  const handleOpenAlertModal = (student: { id: string; name: string; pendingCount: number }) => {
    setAlertModalStudent(student);
    setAlertMessage(`แจ้งเตือนจากครูผู้สอน: พบว่ามีงานค้าง ${student.pendingCount} งาน โปรดรีบเข้าสู่ระบบเพื่อตรวจสอบและส่งงานให้เรียบร้อย`);
  };

  const handleSendAlertSubmit = () => {
    if (!alertModalStudent || !currentSubject) return;
    sendStudentAlert(alertModalStudent.id, currentSubject.id, alertMessage);
    setAlertSuccessToast(`ส่งข้อความเตือนไปยัง ${alertModalStudent.name} และบันทึกลงระบบเรียบร้อย`);
    setAlertModalStudent(null);
    setAlertMessage('');
    setTimeout(() => setAlertSuccessToast(null), 4000);
  };

  // Export logs to CSV
  const handleExportCSV = () => {
    if (activityLogs.length === 0) {
      alert('ไม่มีข้อมูลประวัติการใช้งานสำหรับส่งออก');
      return;
    }

    const headers = ['วันเวลา', 'ประเภทผู้ใช้', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ห้องเรียน', 'วิชา', 'ประเภทกิจกรรม', 'หัวข้อ', 'รายละเอียด', 'ระยะเวลา(วิกาที)', 'ธงตรวจสอบ', 'อุปกรณ์', 'เบราว์เซอร์'];
    const rows = activityLogs.map(l => [
      `"${new Date(l.timestamp).toLocaleString('th-TH')}"`,
      `"${l.actorType === 'student' ? 'นักเรียน' : l.actorType === 'teacher' ? 'ครูผู้สอน' : 'ระบบ'}"`,
      `"${l.studentCode || ''}"`,
      `"${l.studentName || ''}"`,
      `"${l.classroomName || ''}"`,
      `"${l.subjectName || ''}"`,
      `"${l.actionType}"`,
      `"${(l.title || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.durationSeconds || ''}"`,
      `"${l.isIntegrityFlagged ? l.integrityReason || 'ผิดปกติ' : 'ปกติ'}"`,
      `"${l.deviceInfo?.isMobile ? 'Mobile' : 'Desktop'}"`,
      `"${l.deviceInfo?.browser || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${schoolProfile.name || 'school'}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // Format relative time in Thai
  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'เมื่อสักครู่';
      if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
      if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
      if (diffDay < 7) return `${diffDay} วันที่แล้ว`;

      return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getActionBadge = (type: ActivityActionType) => {
    switch (type) {
      case 'portal_login':
        return { label: 'เข้าสู่ระบบ', bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800', icon: Users };
      case 'check_scores':
        return { label: 'ตรวจคะแนน/เกรด', bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800', icon: Award };
      case 'check_pending_tasks':
        return { label: 'ตรวจงานค้าง', bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800', icon: AlertTriangle };
      case 'check_attendance':
        return { label: 'เช็คเวลาเรียน (มส.)', bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800', icon: UserCheck };
      case 'download_resource':
        return { label: 'ดาวน์โหลดสื่อ', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800', icon: Download };
      case 'view_drive_resource':
        return { label: 'เปิดดูสื่อ', bg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800', icon: Eye };
      case 'read_resource_time':
        return { label: 'เวลาศึกษาใบงาน', bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800', icon: BookOpen };
      case 'portal_session_duration':
        return { label: 'เวลาอยู่ในระบบ', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800', icon: Clock };
      case 'followup_sent':
        return { label: 'ทวงงาน 1 คลิก', bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800', icon: Send };
      case 'integrity_flag':
        return { label: 'ตรวจจับวิกาล/โปร่งใส', bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800', icon: Moon };
      case 'submit_work':
        return { label: 'แจ้งส่งงาน', bg: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800', icon: CheckCircle2 };
      case 'teacher_alert_sent':
        return { label: 'ส่งเตือนนักเรียน', bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800', icon: BellRing };
      case 'teacher_score_entry':
        return { label: 'กรอกคะแนน ปพ.5', bg: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', icon: FileText };
      default:
        return { label: 'กิจกรรมทั่วไป', bg: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', icon: History };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {alertSuccessToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{alertSuccessToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Audit Trail & Student Engagement Tracking Hub</span>
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Tracking
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              บันทึกประวัติการใช้งาน & ติดตามนักเรียน
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              ระบบตรวจสอบประวัติการเข้าดูคะแนน งานค้าง เวลาอ่านใบงาน เรดาร์ดัชนีความกระตือรือร้น และทวงงาน 1 คลิก
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 backdrop-blur-xs border border-white/10 cursor-pointer shadow-sm"
              title="ส่งออกบันทึก Log เป็นไฟล์ CSV"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 backdrop-blur-xs border border-white/10 cursor-pointer shadow-sm"
              title="พิมพ์รายงานสรุป"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์รายงาน</span>
            </button>
            <button
              onClick={() => setShowErrorModal(true)}
              className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-rose-500/30 cursor-pointer shadow-sm"
              title="หากระบบขัดข้อง ส่งเมลหา nawaratk65@gmail.com"
            >
              <Mail className="w-4 h-4" />
              <span>แจ้งขัดข้อง</span>
            </button>
            <button
              onClick={() => {
                if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลบันทึกประวัติการใช้งานทั้งหมด?')) {
                  clearActivityLogs();
                }
              }}
              className="px-3 py-2 bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 text-xs font-medium rounded-xl transition flex items-center gap-1.5 border border-white/10 cursor-pointer shadow-sm"
              title="ล้างประวัติการใช้งานทั้งหมด"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 KPI Engagement Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-indigo-200 flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              <span>บันทึกทั้งหมด</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {stats.totalLogs.toLocaleString()} <span className="text-xs font-normal text-slate-300">ครั้ง</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-emerald-200 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>นักเรียนเข้าเช็คงานวันนี้</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              {stats.activeTodayCount} <span className="text-xs font-normal text-slate-300">คน</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-amber-200 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>เวลาศึกษาใบงานสะสม</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
              {Math.round(totalReadingSeconds / 60)} <span className="text-xs font-normal text-slate-300">นาที</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-indigo-200 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>ความใส่ใจห้อง {currentClassroom?.name}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-300 mt-1">
              {stats.classEngagementRate}%
              <span className="text-xs font-normal text-slate-300 ml-1.5">
                ({stats.engagedClassStudentsCount}/{stats.totalClassStudents} คน)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'logs'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>ประวัติกิจกรรมล่าสุด (Audit Logs)</span>
          <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full text-xs font-semibold">
            {filteredLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('inactive_radar')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'inactive_radar'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400 dark:border-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>เรดาร์ทวงงาน 1 คลิก (Follow-up Hub)</span>
          <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full text-xs font-bold">
            {inactiveRadar.filter(r => r.riskLevel === 'high').length} เสี่ยงสูง
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('engagement')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'engagement'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>ดัชนีความกระตือรือร้น 4 ระดับ (SEI)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('integrity')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'integrity'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Moon className="w-4 h-4 text-purple-500" />
          <span>ความโปร่งใส & เวลาอ่านใบงาน ({lateNightChecksCount} วิกาล)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>สถิติเชิงลึก & Peak Hours</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: AUDIT LOGS FEED & TABLE                               */}
      {/* ============================================================ */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ, รหัสนักเรียน, กิจกรรม..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action Type Filter */}
              <div>
                <select
                  value={selectedActionType}
                  onChange={(e) => setSelectedActionType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="all">📌 ทุกประเภทกิจกรรม</option>
                  <option value="portal_login">🔑 นักเรียนเข้าสู่ระบบ</option>
                  <option value="check_scores">🏆 ตรวจสอบคะแนน/เกรด</option>
                  <option value="check_pending_tasks">⚠️ ตรวจสอบงานค้าง</option>
                  <option value="check_attendance">⏰ เช็คเวลาเรียน (มส.)</option>
                  <option value="read_resource_time">📖 เวลาศึกษาใบงาน</option>
                  <option value="portal_session_duration">⏱️ เวลาอยู่ในระบบ</option>
                  <option value="followup_sent">📢 ทวงงาน 1 คลิก</option>
                  <option value="download_resource">📥 ดาวน์โหลดสื่อ/ใบงาน</option>
                  <option value="view_drive_resource">👁️ เปิดดูสื่อ</option>
                  <option value="submit_work">📤 แจ้งส่งงาน</option>
                  <option value="teacher_alert_sent">🔔 ครูส่งแจ้งเตือน</option>
                  <option value="teacher_score_entry">✏️ ครูบันทึกคะแนน</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="all">📅 ช่วงเวลาทั้งหมด</option>
                  <option value="today">☀️ วันนี้</option>
                  <option value="yesterday">🌙 เมื่อวาน</option>
                  <option value="week">🗓️ 7 วันล่าสุด</option>
                  <option value="month">📆 30 วันล่าสุด</option>
                </select>
              </div>

              {/* Device Filter */}
              <div>
                <select
                  value={selectedDeviceFilter}
                  onChange={(e) => setSelectedDeviceFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="all">💻 ทุกอุปกรณ์</option>
                  <option value="mobile">📱 มือถือ / แท็บเล็ต</option>
                  <option value="desktop">💻 คอมพิวเตอร์ (PC/Mac)</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Classroom tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-xs">
              <span className="text-slate-400 dark:text-slate-500 font-semibold shrink-0 text-[11px]">ห้องเรียน:</span>
              <button
                onClick={() => setSelectedClassFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedClassFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                ทุกห้อง
              </button>
              {classrooms.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassFilter(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedClassFilter === c.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  ห้อง {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                <History className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-semibold text-sm">ไม่พบบันทึกกิจกรรมตามเงื่อนไขที่เลือก</p>
                <p className="text-xs mt-1">ประวัติการเข้าใช้งานจะปรากฏขึ้นอัตโนมัติเมื่อนักเรียนเข้าสู่ระบบหรือเปิดอ่านใบงาน</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3 px-4">วันเวลา</th>
                      <th className="py-3 px-4">ผู้ใช้งาน</th>
                      <th className="py-3 px-4">กิจกรรม</th>
                      <th className="py-3 px-4">รายละเอียด</th>
                      <th className="py-3 px-4">เวลา/ธงตรวจสอบ</th>
                      <th className="py-3 px-4">อุปกรณ์</th>
                      <th className="py-3 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLogs.map(log => {
                      const badge = getActionBadge(log.actionType);
                      const BadgeIcon = badge.icon;
                      const isStudent = log.actorType === 'student';
                      const h = new Date(log.timestamp).getHours();
                      const isLateNight = h >= 23 || h < 5;

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                          {/* Timestamp */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {formatRelativeTime(log.timestamp)}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">
                              {new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                          </td>

                          {/* Actor */}
                          <td className="py-3 px-4">
                            {isStudent ? (
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                  {log.studentName || 'นักเรียน'}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>รหัส {log.studentCode || '-'}</span>
                                  {log.classroomName && <span>• ห้อง {log.classroomName}</span>}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-indigo-700 dark:text-indigo-400 font-bold">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>ครูผู้สอน</span>
                              </div>
                            )}
                          </td>

                          {/* Activity Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-2xs ${badge.bg}`}>
                              <BadgeIcon className="w-3 h-3 shrink-0" />
                              <span>{badge.label}</span>
                            </span>
                          </td>

                          {/* Title & Details */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={log.title}>
                              {log.title}
                            </div>
                            {log.details && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={log.details}>
                                {log.details}
                              </div>
                            )}
                          </td>

                          {/* Time & Integrity Flag */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {log.durationSeconds ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800">
                                <Clock className="w-3 h-3" />
                                {Math.floor(log.durationSeconds / 60) > 0 ? `${Math.floor(log.durationSeconds / 60)} น. ` : ''}
                                {log.durationSeconds % 60} วินาที
                              </span>
                            ) : log.isIntegrityFlagged || isLateNight ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800">
                                <Moon className="w-3 h-3" />
                                วิกาล
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">-</span>
                            )}
                          </td>

                          {/* Device info */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              {log.deviceInfo?.isMobile ? (
                                <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                                  <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>มือถือ</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                                  <Laptop className="w-3.5 h-3.5 text-slate-500" />
                                  <span>คอมพิวเตอร์</span>
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                ({log.deviceInfo?.browser || 'เบราว์เซอร์'})
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => deleteActivityLog(log.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                              title="ลบบันทึกนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: ONE-CLICK FOLLOW-UP & INACTIVE RADAR                  */}
      {/* ============================================================ */}
      {activeSubTab === 'inactive_radar' && (
        <div className="space-y-4">
          {/* Header Action Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-indigo-50 dark:from-rose-950/30 dark:via-amber-950/30 dark:to-indigo-950/30 border border-rose-200/80 dark:border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
                  ระบบทวงงาน 1 คลิก (One-Click Follow-up)
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  ห้อง {currentClassroom?.name} • วิชา {currentSubject?.name}
                </span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                เรดาร์ติดตามนักเรียน & ส่งข้อความทวงงานอัตโนมัติ
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                กดปุ่ม <strong>"คัดลอกข้อความทวงงานบุคคล"</strong> เพื่อนำข้อความพร้อมรายละเอียดงานค้างไปส่งใน LINE หรือกดปุ่มทวงงานรวมเพื่อสรุปทั้งห้อง
              </p>
            </div>

            <button
              onClick={handleCopyAllOverdueNotice}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer shrink-0 active:scale-95"
            >
              <Copy className="w-4 h-4" />
              <span>คัดลอกข้อความทวงงานทั้งห้อง</span>
            </button>
          </div>

          {/* Inactive Radar Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4">เลขที่</th>
                    <th className="py-3 px-4">รหัส / ชื่อ-สกุล</th>
                    <th className="py-3 px-4 text-center">ระดับความเสี่ยง</th>
                    <th className="py-3 px-4 text-center">งานค้าง</th>
                    <th className="py-3 px-4 text-center">เวลาเรียนสะสม</th>
                    <th className="py-3 px-4">เข้าใช้งานล่าสุด</th>
                    <th className="py-3 px-4 text-right">ดำเนินการ 1 คลิก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {inactiveRadar.map(row => {
                    const { student, daysSinceActive, lastActiveDate, riskLevel, pendingCount, attendance } = row;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-bold text-slate-600 dark:text-slate-400">{student.seatNumber}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {student.prefix}{student.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">รหัส {student.studentCode}</div>
                        </td>

                        {/* Risk Level Badge */}
                        <td className="py-3 px-4 text-center">
                          {riskLevel === 'high' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              ⚠️ เสี่ยงสูง / ไม่เช็คงาน
                            </span>
                          ) : riskLevel === 'medium' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                              เริ่มชะลอตัว
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                              ✓ ติดตามสม่ำเสมอ
                            </span>
                          )}
                        </td>

                        {/* Pending count */}
                        <td className="py-3 px-4 text-center">
                          {pendingCount > 0 ? (
                            <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                              {pendingCount} งาน
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">ครบถ้วน</span>
                          )}
                        </td>

                        {/* Attendance % */}
                        <td className="py-3 px-4 text-center">
                          {attendance ? (
                            <div>
                              <span className={`font-bold ${attendance.isExamIneligible ? 'text-rose-600 dark:text-rose-400' : attendance.isAtRisk ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                {attendance.attendancePercentage}%
                              </span>
                              {attendance.isExamIneligible && (
                                <span className="block text-[9px] font-bold text-rose-600 dark:text-rose-400">(มส.)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Last Active Date */}
                        <td className="py-3 px-4">
                          {lastActiveDate ? (
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {formatRelativeTime(lastActiveDate.toISOString())}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                {row.lastActionTitle}
                              </div>
                            </div>
                          ) : (
                            <span className="text-rose-500 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded">
                              ไม่เคยเข้าใช้งาน
                            </span>
                          )}
                        </td>

                        {/* 1-Click Action Buttons */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1-Click LINE Personal Notice Copy */}
                            <button
                              onClick={() => handleCopyPersonalFollowup(row)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                              title="คัดลอกข้อความทวงงานบุคคลสำหรับ LINE"
                            >
                              <Copy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="hidden sm:inline">คัดลอกข้อความ</span>
                            </button>

                            {/* System Alert Trigger */}
                            <button
                              onClick={() => handleOpenAlertModal({
                                id: student.id,
                                name: `${student.prefix}${student.fullName}`,
                                pendingCount
                              })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                              title="ส่งแจ้งเตือนในระบบ"
                            >
                              <BellRing className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span className="hidden sm:inline">เตือนในระบบ</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: 4-TIER STUDENT ENGAGEMENT INDEX (SEI)                 */}
      {/* ============================================================ */}
      {activeSubTab === 'engagement' && (
        <div className="space-y-5">
          {/* Overview Explanation */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                ดัชนีความกระตือรือร้น 4 ระดับ (Student Engagement Index - SEI)
              </span>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-1">
                การแบ่งกลุ่มความใส่ใจในการเรียนห้อง {currentClassroom?.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                วิเคราะห์จากการส่งงานตรงเวลา (40 คะแนน) + เวลาเรียนสะสม (30 คะแนน) + ความถี่การเข้าตรวจสอบงานในระบบ (30 คะแนน)
              </p>
            </div>

            {/* 4 Tiers KPI Banner */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/50">
                <div className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                  <span>🌟 Tier 1: ดาวเด่น (85-100)</span>
                </div>
                <div className="text-2xl font-black text-indigo-900 dark:text-white mt-1">
                  {engagementIndexData.filter(s => s.tier === 1).length} <span className="text-xs font-normal text-slate-500">คน</span>
                </div>
                <p className="text-[10px] text-indigo-700 dark:text-indigo-300/80 mt-1">ส่งงานครบ เข้าดูงานบ่อย เวลาเรียนดีเยี่ยม</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <span>🟢 Tier 2: สม่ำเสมอ (70-84)</span>
                </div>
                <div className="text-2xl font-black text-emerald-900 dark:text-white mt-1">
                  {engagementIndexData.filter(s => s.tier === 2).length} <span className="text-xs font-normal text-slate-500">คน</span>
                </div>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300/80 mt-1">เกาะกลุ่มปกติ มีส่งช้าบ้างแต่ติดตามทัน</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50">
                <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <span>🟡 Tier 3: ชะลอตัว (50-69)</span>
                </div>
                <div className="text-2xl font-black text-amber-900 dark:text-white mt-1">
                  {engagementIndexData.filter(s => s.tier === 3).length} <span className="text-xs font-normal text-slate-500">คน</span>
                </div>
                <p className="text-[10px] text-amber-700 dark:text-amber-300/80 mt-1">ค้าง 1-2 งาน ไม่เข้าเช็คเกิน 4 วัน</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50">
                <div className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <span>🔴 Tier 4: วิกฤต (&lt;50)</span>
                </div>
                <div className="text-2xl font-black text-rose-900 dark:text-white mt-1">
                  {engagementIndexData.filter(s => s.tier === 4).length} <span className="text-xs font-normal text-slate-500">คน</span>
                </div>
                <p className="text-[10px] text-rose-700 dark:text-rose-300/80 mt-1">ค้างหลายงาน เสี่ยง มส. ไม่เข้าดูระบบ</p>
              </div>
            </div>
          </div>

          {/* Student Engagement List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4">เลขที่</th>
                    <th className="py-3 px-4">นักเรียน</th>
                    <th className="py-3 px-4 text-center">ดัชนี SEI</th>
                    <th className="py-3 px-4 text-center">ระดับ Tier</th>
                    <th className="py-3 px-4 text-center">งานค้าง</th>
                    <th className="py-3 px-4 text-center">เวลาเรียน</th>
                    <th className="py-3 px-4">เวลาศึกษาใบงาน</th>
                    <th className="py-3 px-4 text-right">ทวงงาน 1 คลิก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {engagementIndexData.map(item => (
                    <tr key={item.student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-bold text-slate-600 dark:text-slate-400">{item.student.seatNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.student.prefix}{item.student.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400">รหัส {item.student.studentCode}</div>
                      </td>

                      {/* SEI Score Bar */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                item.tier === 1 ? 'bg-indigo-600' : item.tier === 2 ? 'bg-emerald-500' : item.tier === 3 ? 'bg-amber-500' : 'bg-rose-500'
                              }`} 
                              style={{ width: `${item.seiScore}%` }} 
                            />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{item.seiScore}</span>
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.tierBadgeClass}`}>
                          <span>{item.tierTitle}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-bold">
                        {item.pendingCount > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">{item.pendingCount} งาน</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">0</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                        {item.attRate}%
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {item.totalReadSeconds > 0 ? (
                          <span className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-300 font-semibold">
                            <BookOpen className="w-3 h-3" />
                            {Math.round(item.totalReadSeconds / 60)} นาที
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleCopyPersonalFollowup(item)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                        >
                          ทวงงานบุคคล
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: ANTI-CHEATING & INTEGRITY LOGS RADAR                  */}
      {/* ============================================================ */}
      {activeSubTab === 'integrity' && (
        <div className="space-y-5">
          {/* Integrity Header */}
          <div className="bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50 dark:from-purple-950/30 dark:via-slate-900/50 dark:to-indigo-950/30 p-5 rounded-3xl border border-purple-200 dark:border-purple-900/50 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>ระบบตรวจสอบความโปร่งใส & พฤติกรรมการอ่าน (Anti-Cheating & Integrity Radar)</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-1">
                  บันทึกการเข้าตรวจงานยามวิกาล & สถิติเวลาศึกษาใบงานจริง
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  ตรวจจับการเข้าตรวจงานยามวิกาล (23:00 - 05:00 น.), การเปิดดูใบงานแบบรวดเร็วผิดปกติ, และการสลับอุปกรณ์
                </p>
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/50">
                <div className="text-xs font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-purple-500" />
                  <span>การเข้าตรวจงานยามวิกาล (23:00-05:00)</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                  {lateNightChecksCount} <span className="text-xs font-normal text-slate-400">ครั้ง</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">นักเรียนที่เข้าเช็คคะแนนหรืองานช่วงดึก</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/50">
                <div className="text-xs font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-teal-500" />
                  <span>เวลาศึกษาใบงานสะสมทั้งหมด</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                  {Math.round(totalReadingSeconds / 60)} <span className="text-xs font-normal text-slate-400">นาที</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">เวลาจริงที่นักเรียนเปิดอ่านเนื้อหา</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50">
                <div className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>เวลาเฉลี่ยต่อการอ่าน 1 ครั้ง</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                  {activityLogs.filter(l => l.actionType === 'read_resource_time').length > 0
                    ? Math.round(totalReadingSeconds / activityLogs.filter(l => l.actionType === 'read_resource_time').length)
                    : 0}{' '}
                  <span className="text-xs font-normal text-slate-400">วินาที</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">สถิติความละเอียดในการอ่าน</p>
              </div>
            </div>
          </div>

          {/* Integrity Logs Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>รายการบันทึกที่มีธงความโปร่งใสหรือมีเวลาศึกษา ({integrityLogs.length} รายการ)</span>
              <span className="text-[11px] text-slate-500 font-normal">ระบบบันทึกเวลาจริงในหน่วยวินาที</span>
            </div>
            {integrityLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
                <p className="font-semibold text-xs">ยังไม่พบรายการกิจกรรมยามวิกาล</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4">วันเวลา</th>
                      <th className="py-2.5 px-4">นักเรียน</th>
                      <th className="py-2.5 px-4">ประเภท</th>
                      <th className="py-2.5 px-4">หัวข้อ / วัตถุประสงค์</th>
                      <th className="py-2.5 px-4">เวลาที่ใช้</th>
                      <th className="py-2.5 px-4">ธงแจ้งเตือน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {integrityLogs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                        <td className="py-2.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {new Date(l.timestamp).toLocaleString('th-TH')}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {l.studentName || 'นักเรียน'} (ห้อง {l.classroomName || '-'})
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {l.actionType === 'read_resource_time' ? (
                            <span className="text-teal-700 dark:text-teal-300 font-semibold">เวลาศึกษาใบงาน</span>
                          ) : l.actionType === 'portal_session_duration' ? (
                            <span className="text-indigo-700 dark:text-indigo-300 font-semibold">เวลาในระบบ</span>
                          ) : (
                            <span className="text-purple-700 dark:text-purple-300 font-semibold">เข้าตรวจงาน</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">{l.title}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {l.durationSeconds ? `${l.durationSeconds} วินาที` : '-'}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {l.isIntegrityFlagged || new Date(l.timestamp).getHours() >= 23 || new Date(l.timestamp).getHours() < 5 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              🌙 วิกาล
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium">✓ ปกติ</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: ANALYTICS & VISUAL GRAPHS                             */}
      {/* ============================================================ */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Peak Hours (24H) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>ช่วงเวลาที่นักเรียนเข้าดูงานบ่อยที่สุด (24 ชั่วโมง)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">ช่วยให้ครูกำหนดเวลาสั่งงานและทวงงานได้อย่างตรงจังหวะ</p>
              </div>
            </div>

            <div className="h-44 flex items-end gap-1 pt-6 px-2 border-b border-slate-200 dark:border-slate-800">
              {peakHoursData.hours.map(item => {
                const heightPct = peakHoursData.maxCount > 0 ? (item.count / peakHoursData.maxCount) * 100 : 0;
                const isHighlight = item.count > 0 && item.count === peakHoursData.maxCount;

                return (
                  <div key={item.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-7 px-1.5 py-0.5 bg-slate-800 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-20">
                      {item.hour}:00 น. ({item.count} ครั้ง)
                    </div>

                    <div
                      className={`w-full rounded-t transition-all ${
                        isHighlight
                          ? 'bg-gradient-to-t from-indigo-600 to-pink-500'
                          : item.count > 0
                          ? 'bg-indigo-300 dark:bg-indigo-700 hover:bg-indigo-400'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 transform -rotate-45 sm:rotate-0 origin-center mt-1">
                      {item.hour % 3 === 0 ? `${item.hour}h` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaderboard: Top Active Students */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>นักเรียนที่ใส่ใจตรวจสอบงานสูงสุด (Top Active Leaderboard)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">นักเรียนที่มีวินัยในการเข้าตรวจเช็คคะแนนและงานค้าง</p>
            </div>

            <div className="space-y-2.5">
              {topActiveStudents.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">ยังไม่มีข้อมูลนักเรียนที่เข้าใช้งาน</p>
              ) : (
                topActiveStudents.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0 ? 'bg-amber-400 text-slate-900' : idx === 1 ? 'bg-slate-300 text-slate-900' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{st.name}</div>
                        <div className="text-[10px] text-slate-400">รหัส {st.code || '-'} {st.className ? `• ห้อง ${st.className}` : ''}</div>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">
                      {st.count} ครั้ง
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Send Alert to Student */}
      {alertModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <BellRing className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">ส่งสัญญาณเตือนติดตามงาน</h3>
              </div>
              <button
                onClick={() => setAlertModalStudent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                ส่งข้อความเตือนไปยัง <strong className="text-slate-900 dark:text-white">{alertModalStudent.name}</strong> (ค้าง {alertModalStudent.pendingCount} งาน)
              </p>
              <textarea
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                rows={4}
                className="w-full mt-2 p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="พิมพ์ข้อความเตือน..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setAlertModalStudent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSendAlertSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่งข้อความเตือน</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

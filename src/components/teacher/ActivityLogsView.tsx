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
  X
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
    schoolProfile
  } = useApp();

  // Sub-tabs: 'logs' | 'inactive_radar' | 'analytics'
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'inactive_radar' | 'analytics'>('logs');

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
      subjectAssignments.forEach(asg => {
        const sub = submissions.find(s => s.assignmentId === asg.id && s.studentId === student.id);
        if (!sub || sub.status === 'pending') {
          pendingCount++;
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

  // Visual Analytics: Peak Hours distribution (24 hours)
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

    const headers = ['วันเวลา', 'ประเภทผู้ใช้', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ห้องเรียน', 'วิชา', 'ประเภทกิจกรรม', 'หัวข้อ', 'รายละเอียด', 'อุปกรณ์', 'เบราว์เซอร์'];
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
    URL.revokeObjectURL(url);
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
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
        return { label: 'เข้าสู่ระบบ', bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: Users };
      case 'check_scores':
        return { label: 'ตรวจคะแนน/เกรด', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: Award };
      case 'check_pending_tasks':
        return { label: 'ตรวจงานค้าง', bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: AlertTriangle };
      case 'check_attendance':
        return { label: 'เช็คเวลาเรียน (มส.)', bg: 'bg-purple-100 text-purple-800 border-purple-200', icon: UserCheck };
      case 'download_resource':
        return { label: 'ดาวน์โหลดสื่อ/ใบงาน', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Download };
      case 'view_drive_resource':
        return { label: 'เปิดดูสื่อ', bg: 'bg-teal-100 text-teal-800 border-teal-200', icon: Eye };
      case 'submit_work':
        return { label: 'แจ้งส่งงาน', bg: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 };
      case 'teacher_alert_sent':
        return { label: 'ส่งเตือนนักเรียน', bg: 'bg-orange-100 text-orange-800 border-orange-200', icon: BellRing };
      case 'teacher_permission_grant':
        return { label: 'อนุมัติเปิดสื่อ', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: FolderGit2 };
      case 'teacher_score_entry':
        return { label: 'กรอกคะแนน ปพ.5', bg: 'bg-slate-100 text-slate-800 border-slate-200', icon: FileText };
      default:
        return { label: 'กิจกรรมทั่วไป', bg: 'bg-slate-100 text-slate-800 border-slate-200', icon: History };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {alertSuccessToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-bold">{alertSuccessToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Audit Trail & Student Engagement Tracking System</span>
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              บันทึกประวัติการใช้งาน & ติดตามนักเรียน
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              ระบบตรวจสอบประวัติการเข้าดูคะแนน งานค้าง การดาวน์โหลดสื่อใบงาน และพฤติกรรมการติดตามงานของนักเรียนแบบเรียลไทม์
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 backdrop-blur-xs border border-white/10 cursor-pointer shadow-sm"
              title="ส่งออกบันทึก Log เป็นไฟล์ CSV สำหรับ Excel"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 backdrop-blur-xs border border-white/10 cursor-pointer shadow-sm"
              title="พิมพ์รายงานสรุปประวัติการใช้งาน"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์รายงาน</span>
            </button>
            <button
              onClick={() => {
                if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลบันทึกประวัติการใช้งานทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
                  clearActivityLogs();
                }
              }}
              className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-rose-500/30 cursor-pointer shadow-sm"
              title="ล้างประวัติการใช้งานทั้งหมด"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างประวัติ</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Engagement Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-indigo-200 flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              <span>รายการบันทึกทั้งหมด</span>
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
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>สื่อ/ใบงานถูกโหลด</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
              {stats.downloadsCount} <span className="text-xs font-normal text-slate-300">ครั้ง</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-indigo-200 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>อัตราการติดตามงานห้อง {currentClassroom?.name}</span>
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
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'logs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>ประวัติกิจกรรมล่าสุด (Audit Logs)</span>
          <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-semibold">
            {filteredLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('inactive_radar')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'inactive_radar'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>ตรวจจับนักเรียนที่ไม่เข้าเช็คงาน (At-Risk Radar)</span>
          <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-xs font-bold">
            {inactiveRadar.filter(r => r.riskLevel === 'high').length} เสี่ยงสูง
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>วิเคราะห์พฤติกรรม & สถิติเชิงลึก (Analytics)</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: AUDIT LOGS FEED & TABLE                               */}
      {/* ============================================================ */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ, รหัสนักเรียน, กิจกรรม..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="all">📌 ทุกประเภทกิจกรรม</option>
                  <option value="portal_login">🔑 นักเรียนเข้าสู่ระบบ</option>
                  <option value="check_scores">🏆 ตรวจสอบคะแนน/เกรด</option>
                  <option value="check_pending_tasks">⚠️ ตรวจสอบงานค้าง</option>
                  <option value="check_attendance">⏰ เช็คเวลาเรียน (มส.)</option>
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="all">💻 ทุกอุปกรณ์</option>
                  <option value="mobile">📱 มือถือ / แท็บเล็ต</option>
                  <option value="desktop">💻 คอมพิวเตอร์ (PC/Mac)</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Classroom tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-xs">
              <span className="text-slate-400 font-semibold shrink-0 text-[11px]">ห้องเรียน:</span>
              <button
                onClick={() => setSelectedClassFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedClassFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด
              </button>
              {classrooms.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassFilter(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedClassFilter === c.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ห้อง {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Logs List Table */}
          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <History className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">ไม่พบข้อมูลประวัติการใช้งานที่ตรงตามเงื่อนไข</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                เมื่อนักเรียนเข้าสู่ระบบ ตรวจสอบคะแนน หรือดาวน์โหลดใบงาน ระบบจะบันทึกประวัติอัตโนมัติทันที
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  const badge = getActionBadge(log.actionType);
                  const Icon = badge.icon;
                  const isMobile = log.deviceInfo?.isMobile;

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Action Icon */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${badge.bg}`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Log Main Info */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Actor Badge */}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                              {badge.label}
                            </span>

                            {/* Student Name */}
                            {log.studentName && (
                              <span className="font-bold text-xs text-slate-900">
                                {log.studentName}
                                {log.studentCode && (
                                  <span className="text-[11px] text-slate-500 font-normal ml-1">
                                    (รหัส {log.studentCode})
                                  </span>
                                )}
                              </span>
                            )}

                            {/* Class badge */}
                            {log.classroomName && (
                              <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                ห้อง {log.classroomName}
                              </span>
                            )}

                            {/* Subject badge */}
                            {log.subjectName && (
                              <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                {log.subjectName}
                              </span>
                            )}
                          </div>

                          {/* Title and details */}
                          <div className="text-xs text-slate-800 font-semibold leading-relaxed">
                            {log.title}
                          </div>
                          {log.details && (
                            <div className="text-[11px] text-slate-500 line-clamp-2">
                              {log.details}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Meta: Device, Time & Delete */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pl-12 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">
                            {formatRelativeTime(log.timestamp)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Device badge */}
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            {isMobile ? (
                              <>
                                <Smartphone className="w-3 h-3 text-slate-600" />
                                <span>มือถือ ({log.deviceInfo?.platform || 'Mobile'})</span>
                              </>
                            ) : (
                              <>
                                <Laptop className="w-3 h-3 text-slate-600" />
                                <span>{log.deviceInfo?.browser || 'PC'}</span>
                              </>
                            )}
                          </div>

                          {/* Delete action */}
                          <button
                            onClick={() => deleteActivityLog(log.id)}
                            className="text-slate-300 hover:text-rose-500 p-1 rounded transition"
                            title="ลบรายการบันทึกนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: INACTIVE & AT-RISK STUDENTS RADAR                     */}
      {/* ============================================================ */}
      {activeSubTab === 'inactive_radar' && (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-rose-900">
                ระบบตรวจจับนักเรียนที่ไม่เข้าเช็คงานและติดตามการเรียน (ห้อง {currentClassroom?.name})
              </h3>
              <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                ระบบวิเคราะห์ข้อมูลเวลาที่นักเรียนเข้ามาดูงานครั้งล่าสุด เทียบกับจำนวนงานค้างและสิทธิ์สอบปลายภาค (มส.)
                คุณครูสามารถกดปุ่ม <strong>"ส่งสัญญาณเตือน"</strong> เพื่อส่งข้อความแจ้งเตือนให้นักเรียนและผู้ปกครองรับทราบทันที
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">เลขที่</th>
                    <th className="py-3 px-4">รหัส / ชื่อ-สกุล</th>
                    <th className="py-3 px-4 text-center">ระดับความเสี่ยง</th>
                    <th className="py-3 px-4 text-center">งานค้าง</th>
                    <th className="py-3 px-4 text-center">เวลาเรียนสะสม</th>
                    <th className="py-3 px-4">เข้าใช้งานล่าสุด</th>
                    <th className="py-3 px-4 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inactiveRadar.map(row => {
                    const { student, daysSinceActive, lastActiveDate, riskLevel, pendingCount, attendance } = row;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-600">{student.seatNumber}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">
                            {student.prefix}{student.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500">รหัส {student.studentCode}</div>
                        </td>

                        {/* Risk Level Badge */}
                        <td className="py-3 px-4 text-center">
                          {riskLevel === 'high' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              ⚠️ เสี่ยงสูง / ไม่เช็คงาน
                            </span>
                          ) : riskLevel === 'medium' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              เริ่มเฉื่อยชา
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✓ ติดตามสม่ำเสมอ
                            </span>
                          )}
                        </td>

                        {/* Pending count */}
                        <td className="py-3 px-4 text-center">
                          {pendingCount > 0 ? (
                            <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                              {pendingCount} งาน
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">ครบถ้วน</span>
                          )}
                        </td>

                        {/* Attendance % */}
                        <td className="py-3 px-4 text-center">
                          {attendance ? (
                            <div>
                              <span className={`font-bold ${attendance.isExamIneligible ? 'text-rose-600' : attendance.isAtRisk ? 'text-amber-600' : 'text-slate-800'}`}>
                                {attendance.attendancePercentage}%
                              </span>
                              {attendance.isExamIneligible && (
                                <span className="block text-[9px] font-bold text-rose-600">(มส.)</span>
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
                              <div className="font-semibold text-slate-800">
                                {formatRelativeTime(lastActiveDate.toISOString())}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {row.lastActionTitle}
                              </div>
                            </div>
                          ) : (
                            <span className="text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded">
                              ไม่เคยเข้าใช้งาน
                            </span>
                          )}
                        </td>

                        {/* Send Alert Action Button */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenAlertModal({
                              id: student.id,
                              name: `${student.prefix}${student.fullName}`,
                              pendingCount
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition cursor-pointer shadow-2xs"
                          >
                            <BellRing className="w-3.5 h-3.5 text-indigo-600" />
                            <span>สะกิดเตือน</span>
                          </button>
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
      {/* TAB 3: VISUAL ANALYTICS & INSIGHTS                           */}
      {/* ============================================================ */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Peak Usage Hours Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>ช่วงเวลาที่นักเรียนเข้ามาดูงานบ่อยที่สุด (24 ชั่วโมง)</span>
                </div>
                <span className="text-[11px] text-slate-400">00:00 - 23:00 น.</span>
              </div>

              {/* Bar graph */}
              <div className="h-44 flex items-end gap-1 pt-6 px-1 border-b border-slate-200 pb-1">
                {peakHoursData.hours.map(h => {
                  const heightPercent = peakHoursData.maxCount > 0 ? (h.count / peakHoursData.maxCount) * 100 : 0;
                  const isPeak = h.count > 0 && h.count === peakHoursData.maxCount;

                  return (
                    <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-20">
                        {h.hour}:00 น. - {h.count} ครั้ง
                      </div>

                      <div
                        className={`w-full rounded-t transition-all ${
                          isPeak ? 'bg-indigo-600' : h.count > 0 ? 'bg-indigo-400' : 'bg-slate-100'
                        }`}
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 px-1 font-semibold">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:00</span>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                💡 <strong>บทวิเคราะห์:</strong> ช่วงเวลาที่มีการเข้าใช้งานสูงสุดคือช่วงหลังเลิกเรียนและช่วงค่ำ (16:00 - 21:00 น.) ซึ่งเป็นช่วงที่นักเรียนกำลังทำการบ้านหรือเตรียมตัวสำหรับวันถัดไป
              </div>
            </div>

            {/* Top Downloaded Resources */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>สื่อและใบงานยอดนิยมที่ถูกดาวน์โหลดมากที่สุด</span>
                </div>
              </div>

              {topDownloadedResources.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">ยังไม่มีประวัติการดาวน์โหลดสื่อในระบบ</p>
              ) : (
                <div className="space-y-2.5">
                  {topDownloadedResources.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">{res.title}</div>
                          {res.subject && <div className="text-[10px] text-slate-500">{res.subject}</div>}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-sm font-black text-emerald-700">{res.count}</span>
                        <span className="text-[10px] text-slate-400 ml-1">ดาวน์โหลด</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Active Students Leaderboard */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Award className="w-4 h-4 text-amber-500" />
                <span>นักเรียนที่มีความกระตือรือร้นและติดตามงานสูงสุด (Top Active Students)</span>
              </div>
              <span className="text-xs text-slate-400">พิจารณาจากความถี่ในการเข้าตรวจงานและส่งงาน</span>
            </div>

            {topActiveStudents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">ยังไม่มีประวัติการเข้าใช้งานของนักเรียน</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {topActiveStudents.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 relative overflow-hidden space-y-1.5 text-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center mx-auto shadow-xs">
                      #{idx + 1}
                    </div>
                    <div className="font-bold text-xs text-slate-900 truncate">{st.name}</div>
                    <div className="text-[10px] text-slate-500">
                      ห้อง {st.className || 'ม.2/1'} {st.code && `• ${st.code}`}
                    </div>
                    <div className="text-xs font-black text-amber-800 pt-1">
                      เข้าเช็คงาน {st.count} ครั้ง
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for sending reminder alert */}
      {alertModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                <BellRing className="w-5 h-5 text-indigo-600" />
                <span>ส่งสัญญาณเตือนติดตามงาน</span>
              </div>
              <button
                onClick={() => setAlertModalStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                <div>นักเรียนเป้าหมาย: <strong className="text-slate-900">{alertModalStudent.name}</strong></div>
                <div>วิชา: <strong className="text-indigo-600">{currentSubject?.code} {currentSubject?.name}</strong></div>
                <div>ภาระงานค้าง: <strong className="text-rose-600">{alertModalStudent.pendingCount} งาน</strong></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ข้อความเตือน (จะปรากฏในหน้าเช็คงานของนักเรียนและถูกบันทึกลง Log):
                </label>
                <textarea
                  rows={3}
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAlertModalStudent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSendAlertSubmit}
                disabled={!alertMessage.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่งสัญญาณเตือนทันที</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceStatus } from '../../types';
import {
  UserCheck,
  Calendar,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  Trash2,
  Printer,
  ChevronRight,
  FileSpreadsheet,
  HelpCircle,
  ArrowRight,
  History,
  BookOpen,
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const {
    currentSubject,
    currentClassroom,
    currentStudents,
    currentAttendanceSessions,
    classAttendanceSummaries,
    addAttendanceSession,
    deleteAttendanceSession,
    recordStudentAttendance,
    batchCheckAttendance,
    schoolProfile,
    teacherProfile,
    setActiveTab,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'checkin' | 'ineligibility_report' | 'student_history'>('checkin');
  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    return currentAttendanceSessions[0]?.id || '';
  });

  // Modal to add new attendance session
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newPeriodNumber, setNewPeriodNumber] = useState(1);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  // Search & Filter in Exam Ineligibility Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'ineligible' | 'at_risk' | 'perfect'>('all');

  // Student history modal
  const [historyStudentId, setHistoryStudentId] = useState<string | null>(null);

  // If selected session doesn't exist, pick the first
  const activeSession = useMemo(() => {
    if (selectedSessionId) {
      const found = currentAttendanceSessions.find(s => s.id === selectedSessionId);
      if (found) return found;
    }
    return currentAttendanceSessions[0] || null;
  }, [selectedSessionId, currentAttendanceSessions]);

  // Overall classroom attendance statistics
  const attendanceStats = useMemo(() => {
    const total = classAttendanceSummaries.length;
    if (total === 0) return { total: 0, normal: 0, atRisk: 0, ineligible: 0, perfect: 0 };

    let normal = 0;
    let atRisk = 0;
    let ineligible = 0;
    let perfect = 0;

    classAttendanceSummaries.forEach(s => {
      if (s.isExamIneligible) ineligible++;
      else if (s.isAtRisk) atRisk++;
      else normal++;

      if (s.totalSessions > 0 && s.attendancePercentage === 100) perfect++;
    });

    return { total, normal, atRisk, ineligible, perfect };
  }, [classAttendanceSummaries]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return classAttendanceSummaries.filter(item => {
      const name = `${item.student.prefix || ''} ${item.student.fullName}`.toLowerCase();
      const code = item.student.studentCode.toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || code.includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filterMode === 'ineligible') return item.isExamIneligible;
      if (filterMode === 'at_risk') return item.isAtRisk;
      if (filterMode === 'perfect') return item.totalSessions > 0 && item.attendancePercentage === 100;
      return true;
    });
  }, [classAttendanceSummaries, searchQuery, filterMode]);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubject || !currentClassroom) return;

    // Default all students to 'present' initially
    const initialRecords: Record<string, { status: AttendanceStatus; note?: string }> = {};
    currentStudents.forEach(st => {
      initialRecords[st.id] = { status: 'present', note: '' };
    });

    addAttendanceSession({
      subjectId: currentSubject.id,
      classroomId: currentClassroom.id,
      date: newDate,
      periodNumber: Number(newPeriodNumber),
      title: newSessionTitle.trim() || `คาบเรียนที่ ${newPeriodNumber}`,
      records: initialRecords,
    });

    setShowAddModal(false);
    setNewSessionTitle('');
  };

  const handleQuickCheckAll = (status: AttendanceStatus) => {
    if (!activeSession) return;
    batchCheckAttendance(activeSession.id, status);
  };

  const selectedStudentForHistory = useMemo(() => {
    if (!historyStudentId) return null;
    return currentStudents.find(s => s.id === historyStudentId) || null;
  }, [historyStudentId, currentStudents]);

  const studentSessionHistory = useMemo(() => {
    if (!historyStudentId) return [];
    return currentAttendanceSessions.map(session => {
      const rec = session.records[historyStudentId];
      return {
        session,
        status: rec?.status || 'absent',
        note: rec?.note || '',
      };
    });
  }, [historyStudentId, currentAttendanceSessions]);

  if (!currentSubject || !currentClassroom) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>กรุณาเลือกวิชาและห้องเรียนที่ต้องการบันทึกข้อมูลเวลาเรียน</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Subject Info & Exam Ineligibility Rules */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/30 text-indigo-200">
                  {currentSubject.code}
                </span>
                <span className="text-xs text-slate-300">ห้อง {currentClassroom.name}</span>
                <span className="text-xs text-slate-400">({currentStudents.length} คน)</span>
              </div>
              <h2 className="text-xl font-bold mt-0.5">{currentSubject.name}</h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                เกณฑ์ สพฐ.: เวลาเรียนต้องไม่น้อยกว่า 80% จึงจะมีสิทธิ์เข้าสอบปลายภาค (ต่ำกว่า 80% = หมดสิทธิ์สอบ มส.)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl flex items-center gap-2 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              เช็คชื่อคาบใหม่
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <History className="w-4 h-4 text-emerald-400" />
              ไทม์ไลน์การสอน
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              พิมพ์ใบสรุป มส.
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-indigo-900/30">
          <div className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-3 border border-slate-700/60">
            <div className="text-xs text-slate-400">คาบที่บันทึกแล้ว</div>
            <div className="text-2xl font-bold text-white mt-1">{currentAttendanceSessions.length} <span className="text-xs font-normal text-slate-400">คาบ</span></div>
          </div>
          <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-800/40">
            <div className="text-xs text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> มีสิทธิ์สอบปกติ
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{attendanceStats.normal} <span className="text-xs font-normal text-emerald-300">คน</span></div>
          </div>
          <div className="bg-amber-950/40 rounded-xl p-3 border border-amber-800/40">
            <div className="text-xs text-amber-300 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> เสี่ยงติด มส. (80-85%)
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{attendanceStats.atRisk} <span className="text-xs font-normal text-amber-300">คน</span></div>
          </div>
          <div className="bg-rose-950/40 rounded-xl p-3 border border-rose-800/40">
            <div className="text-xs text-rose-300 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> หมดสิทธิ์สอบ (มส. &lt;80%)
            </div>
            <div className="text-2xl font-bold text-rose-400 mt-1">{attendanceStats.ineligible} <span className="text-xs font-normal text-rose-300">คน</span></div>
          </div>
          <div className="bg-indigo-950/40 rounded-xl p-3 border border-indigo-800/40 col-span-2 sm:col-span-1">
            <div className="text-xs text-indigo-300 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> มาเรียน 100% เต็ม
            </div>
            <div className="text-2xl font-bold text-indigo-300 mt-1">{attendanceStats.perfect} <span className="text-xs font-normal text-indigo-300">คน</span></div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveSubTab('checkin')}
          className={`pb-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'checkin'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          เช็คชื่อรายคาบ ({currentAttendanceSessions.length})
        </button>
        <button
          onClick={() => setActiveSubTab('ineligibility_report')}
          className={`pb-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'ineligibility_report'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          วิเคราะห์เวลาเรียน & สิทธิ์สอบปลายภาค (มส.)
          {attendanceStats.ineligible > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-rose-500 text-white">
              {attendanceStats.ineligible}
            </span>
          )}
        </button>
      </div>

      {/* SUB-TAB 1: CHECK-IN BY SESSION */}
      {activeSubTab === 'checkin' && (
        <div className="space-y-4">
          {currentAttendanceSessions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">ยังไม่มีบันทึกการเช็คชื่อในวิชานี้</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
                เริ่มสร้างคาบเรียนแรกเพื่อบันทึกเวลาเรียน การมา สาย ลา ขาด และคำนวณสิทธิ์การสอบอัตโนมัติ
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl inline-flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                สร้างคาบเช็คชื่อคาบแรก
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Session List Column */}
              <div className="lg:col-span-1 space-y-2">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">เลือกคาบเรียน</span>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> เพิ่มคาบ
                  </button>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {currentAttendanceSessions.map((session, idx) => {
                    const isSelected = activeSession?.id === session.id;
                    // Count statuses in this session
                    let present = 0;
                    let absent = 0;
                    Object.values(session.records).forEach(r => {
                      if (r.status === 'present') present++;
                      else if (r.status === 'absent') absent++;
                    });

                    return (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                              คาบที่ {session.periodNumber}
                            </span>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">
                              {session.title || `วันที่ ${session.date}`}
                            </h4>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {session.date}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`ต้องการลบการเช็คชื่อคาบวันที่ ${session.date} ใช่หรือไม่?`)) {
                                deleteAttendanceSession(session.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                            title="ลบคาบนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">มา {present}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-rose-600 dark:text-rose-400 font-medium">ขาด {absent}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Check-In Details Column */}
              <div className="lg:col-span-3 space-y-4">
                {activeSession ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    {/* Header bar of the active session */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                            คาบที่ {activeSession.periodNumber}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {activeSession.date}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
                          {activeSession.title || `เช็คชื่อวันที่ ${activeSession.date}`}
                        </h3>
                      </div>

                      {/* Quick check buttons */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-slate-500 font-medium mr-1">เช็คด่วนทุกคน:</span>
                        <button
                          onClick={() => handleQuickCheckAll('present')}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900 transition-colors"
                        >
                          ✓ มาทุกคน
                        </button>
                        <button
                          onClick={() => handleQuickCheckAll('absent')}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900 transition-colors"
                        >
                          ✕ ขาดทุกคน
                        </button>
                      </div>
                    </div>

                    {/* Student List for this session */}
                    <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                      {currentStudents.map(student => {
                        const rec = activeSession.records[student.id] || { status: 'present' };
                        const summary = classAttendanceSummaries.find(s => s.student.id === student.id);

                        return (
                          <div
                            key={student.id}
                            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-xs flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                                {student.seatNumber}
                              </span>
                              <div>
                                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                  {student.prefix || ''} {student.fullName}
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-2">
                                  <span>รหัส {student.studentCode}</span>
                                  {summary && (
                                    <>
                                      <span>•</span>
                                      <span
                                        className={`font-semibold ${
                                          summary.isExamIneligible
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : summary.isAtRisk
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-emerald-600 dark:text-emerald-400'
                                        }`}
                                      >
                                        เวลาเรียนสะสม {summary.attendancePercentage}%
                                        {summary.isExamIneligible && ' (มส.)'}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Status Pills */}
                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <button
                                onClick={() => recordStudentAttendance(activeSession.id, student.id, 'present')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                  rec.status === 'present'
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                }`}
                              >
                                มา
                              </button>
                              <button
                                onClick={() => recordStudentAttendance(activeSession.id, student.id, 'late')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                  rec.status === 'late'
                                    ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                }`}
                              >
                                สาย
                              </button>
                              <button
                                onClick={() => recordStudentAttendance(activeSession.id, student.id, 'leave')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                  rec.status === 'leave'
                                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                }`}
                              >
                                ลา
                              </button>
                              <button
                                onClick={() => recordStudentAttendance(activeSession.id, student.id, 'absent')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                  rec.status === 'absent'
                                    ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                }`}
                              >
                                ขาด
                              </button>

                              {/* Student history quick view */}
                              <button
                                onClick={() => setHistoryStudentId(student.id)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors ml-1"
                                title="ดูประวัติขาดลามาสายสะสม"
                              >
                                <History className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: EXAM INELIGIBILITY REPORT (หมดสิทธิ์สอบ มส.) */}
      {activeSubTab === 'ineligibility_report' && (
        <div className="space-y-4">
          {/* Controls: Search and Filter Pills */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, สกุล, หรือรหัสนักเรียน..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  filterMode === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                ทั้งหมด ({classAttendanceSummaries.length})
              </button>
              <button
                onClick={() => setFilterMode('ineligible')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all ${
                  filterMode === 'ineligible'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                หมดสิทธิ์สอบ มส. ({attendanceStats.ineligible})
              </button>
              <button
                onClick={() => setFilterMode('at_risk')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all ${
                  filterMode === 'at_risk'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                เสี่ยง มส. ({attendanceStats.atRisk})
              </button>
              <button
                onClick={() => setFilterMode('perfect')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all ${
                  filterMode === 'perfect'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% ({attendanceStats.perfect})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">เลขที่</th>
                    <th className="py-3.5 px-4 w-28">รหัส</th>
                    <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3.5 px-3 text-center text-emerald-600 dark:text-emerald-400">มา</th>
                    <th className="py-3.5 px-3 text-center text-amber-600 dark:text-amber-400">สาย</th>
                    <th className="py-3.5 px-3 text-center text-blue-600 dark:text-blue-400">ลา</th>
                    <th className="py-3.5 px-3 text-center text-rose-600 dark:text-rose-400">ขาด</th>
                    <th className="py-3.5 px-4 text-center">% เวลาเรียน</th>
                    <th className="py-3.5 px-4 text-center">โควตาขาดได้อีก</th>
                    <th className="py-3.5 px-4 text-center">สถานะสิทธิ์สอบ</th>
                    <th className="py-3.5 px-4 text-right">ประวัติ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSummaries.map(item => (
                    <tr
                      key={item.student.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        item.isExamIneligible
                          ? 'bg-rose-50/40 dark:bg-rose-950/20'
                          : item.isAtRisk
                          ? 'bg-amber-50/30 dark:bg-amber-950/15'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {item.student.seatNumber}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                        {item.student.studentCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                        {item.student.prefix || ''} {item.student.fullName}
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.presentCount}
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-amber-600 dark:text-amber-400">
                        {item.lateCount}
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-blue-600 dark:text-blue-400">
                        {item.leaveCount}
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-rose-600 dark:text-rose-400">
                        {item.absentCount}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.isExamIneligible
                                  ? 'bg-rose-500'
                                  : item.isAtRisk
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, item.attendancePercentage)}%` }}
                            />
                          </div>
                          <span
                            className={`font-bold text-xs ${
                              item.isExamIneligible
                                ? 'text-rose-600 dark:text-rose-400'
                                : item.isAtRisk
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {item.attendancePercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.isExamIneligible ? (
                          <span className="text-xs font-semibold text-rose-500">ขาดเกินเกณฑ์แล้ว</span>
                        ) : (
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            ยังขาดได้อีก <strong className="text-indigo-600 dark:text-indigo-400">{item.remainingAbsenceAllowed}</strong> ครั้ง
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.isExamIneligible ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center justify-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> หมดสิทธิ์สอบ (มส.)
                          </span>
                        ) : item.isAtRisk ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> เสี่ยงติด มส.
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> มีสิทธิ์สอบปกติ
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setHistoryStudentId(item.student.id)}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
                        >
                          รายละเอียด <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSummaries.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW ATTENDANCE SESSION */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                สร้างคาบเช็คชื่อใหม่
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  วันที่เช็คชื่อ
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  คาบเรียนที่
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  required
                  value={newPeriodNumber}
                  onChange={e => setNewPeriodNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  หัวข้อ / เนื้อหาการสอนในคาบนี้ (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  placeholder="เช่น เรื่อง สมการเชิงเส้นสองตัวแปร..."
                  value={newSessionTitle}
                  onChange={e => setNewSessionTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md"
                >
                  สร้างและเริ่มเช็คชื่อ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STUDENT ATTENDANCE HISTORY */}
      {selectedStudentForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                  ประวัติเวลาเรียน: {selectedStudentForHistory.prefix || ''} {selectedStudentForHistory.fullName}
                </h3>
                <p className="text-xs text-slate-400">
                  เลขที่ {selectedStudentForHistory.seatNumber} • รหัส {selectedStudentForHistory.studentCode}
                </p>
              </div>
              <button
                onClick={() => setHistoryStudentId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
              {studentSessionHistory.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-sm">ยังไม่มีบันทึกเวลาเรียน</div>
              ) : (
                studentSessionHistory.map(({ session, status, note }) => {
                  return (
                    <div
                      key={session.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-500">
                          คาบที่ {session.periodNumber} • {session.date}
                        </div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                          {session.title || 'คาบเรียนปกติ'}
                        </div>
                        {note && <div className="text-xs text-slate-500 italic mt-0.5">หมายเหตุ: {note}</div>}
                      </div>

                      <div>
                        {status === 'present' && (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            มา
                          </span>
                        )}
                        {status === 'late' && (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            สาย
                          </span>
                        )}
                        {status === 'leave' && (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            ลา
                          </span>
                        )}
                        {status === 'absent' && (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            ขาด
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setHistoryStudentId(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl"
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

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TeachingLog } from '../../types';
import {
  History,
  Calendar,
  Sparkles,
  Plus,
  BookOpen,
  CheckCircle2,
  FileText,
  Trash2,
  Edit2,
  Layers,
  Printer,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Search,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const TimelineView: React.FC = () => {
  const {
    currentSubject,
    currentClassroom,
    currentTeachingLogs,
    currentAssignments,
    currentDriveResources,
    currentAttendanceSessions,
    addTeachingLog,
    updateTeachingLog,
    deleteTeachingLog,
    schoolProfile,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Form states
  const [sessionNumber, setSessionNumber] = useState<number>(() => (currentTeachingLogs.length + 1) || 1);
  const [logDate, setLogDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [unitTitle, setUnitTitle] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [activities, setActivities] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [problemsAndSolutions, setProblemsAndSolutions] = useState('');
  const [homeworkId, setHomeworkId] = useState('');
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [attendanceSessionId, setAttendanceSessionId] = useState('');

  // AI Assistant states
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return currentTeachingLogs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchTopic = (log.topic || '').toLowerCase().includes(q);
      const matchUnit = (log.unit || '').toLowerCase().includes(q);
      const matchAct = (log.activities || '').toLowerCase().includes(q);
      return matchTopic || matchUnit || matchAct;
    });
  }, [currentTeachingLogs, searchQuery]);

  // Open modal for new log
  const handleOpenNewModal = () => {
    setEditingLogId(null);
    setSessionNumber(currentTeachingLogs.length + 1);
    setLogDate(new Date().toISOString().slice(0, 10));
    setUnitTitle('');
    setTopicTitle('');
    setActivities('');
    setLearningOutcomes('');
    setProblemsAndSolutions('');
    setHomeworkId('');
    setSelectedResourceIds([]);
    setAttendanceSessionId('');
    setAiError(null);
    setShowLogModal(true);
  };

  // Open modal for editing existing log
  const handleOpenEditModal = (log: TeachingLog) => {
    setEditingLogId(log.id);
    setSessionNumber(log.sessionNumber);
    setLogDate(log.date);
    setUnitTitle(log.unit || '');
    setTopicTitle(log.topic || '');
    setActivities(log.activities);
    setLearningOutcomes(log.learningOutcomes || '');
    setProblemsAndSolutions(log.problemsAndSolutions || '');
    setHomeworkId(log.homeworkOrAssignmentId || '');
    setSelectedResourceIds(log.linkedResourceIds || []);
    setAttendanceSessionId(log.attendanceSessionId || '');
    setAiError(null);
    setShowLogModal(true);
  };

  // AI draft assistant
  const handleAiDraftLesson = async () => {
    if (!topicTitle.trim()) {
      alert('กรุณากรอก "เรื่องที่สอน" ก่อน เพื่อให้ AI ช่วยร่างบันทึกการสอนได้ตรงจุดครับ');
      return;
    }

    try {
      setIsAiGenerating(true);
      setAiError(null);

      const res = await fetch('/api/gemini/generate-lesson-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: currentSubject?.name || 'วิชาทั่วไป',
          gradeLevel: currentSubject?.gradeLevel || 'มัธยมศึกษา',
          unit: unitTitle.trim() || 'หน่วยการเรียนรู้ที่กำหนด',
          topic: topicTitle.trim(),
          sessionNumber,
        }),
      });

      if (!res.ok) throw new Error('AI generation failed');
      const data = await res.json();

      if (data.activities) setActivities(data.activities);
      if (data.learningOutcomes) setLearningOutcomes(data.learningOutcomes);
      if (data.problemsAndSolutions) setProblemsAndSolutions(data.problemsAndSolutions);
    } catch (err) {
      console.error(err);
      setAiError('ไม่สามารถสร้างข้อความอัตโนมัติได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubject || !currentClassroom) return;

    if (!activities.trim()) {
      alert('กรุณากรอกกิจกรรมการเรียนรู้ของคาบนี้');
      return;
    }

    if (editingLogId) {
      updateTeachingLog(editingLogId, {
        sessionNumber: Number(sessionNumber),
        date: logDate,
        unit: unitTitle.trim(),
        topic: topicTitle.trim(),
        activities: activities.trim(),
        learningOutcomes: learningOutcomes.trim(),
        problemsAndSolutions: problemsAndSolutions.trim(),
        homeworkOrAssignmentId: homeworkId || undefined,
        linkedResourceIds: selectedResourceIds,
        attendanceSessionId: attendanceSessionId || undefined,
      });
    } else {
      addTeachingLog({
        subjectId: currentSubject.id,
        classroomId: currentClassroom.id,
        sessionNumber: Number(sessionNumber),
        date: logDate,
        unit: unitTitle.trim(),
        topic: topicTitle.trim(),
        activities: activities.trim(),
        learningOutcomes: learningOutcomes.trim(),
        problemsAndSolutions: problemsAndSolutions.trim(),
        homeworkOrAssignmentId: homeworkId || undefined,
        linkedResourceIds: selectedResourceIds,
        attendanceSessionId: attendanceSessionId || undefined,
      });
    }

    setShowLogModal(false);
  };

  if (!currentSubject || !currentClassroom) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>กรุณาเลือกวิชาและห้องเรียน</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/30 text-emerald-200">
                  {currentSubject.code}
                </span>
                <span className="text-xs text-slate-300">ห้อง {currentClassroom.name}</span>
                <span className="text-xs text-slate-400">({currentTeachingLogs.length} คาบที่บันทึกแล้ว)</span>
              </div>
              <h2 className="text-xl font-bold mt-0.5">ไทม์ไลน์บันทึกการสอน (Lesson Timeline)</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                บันทึกความก้าวหน้าการเรียนรู้ ว่าสอนถึงไหน วันนี้ทำกิจกรรมอะไร พร้อมเชื่อมโยงการบ้าน สื่อ และการเช็คชื่อ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenNewModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              บันทึกคาบเรียนวันนี้
            </button>
            <button
              onClick={() => setActiveTab('drive')}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              คลังสื่อ & ใบงาน
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              พิมพ์บันทึกการสอน
            </button>
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาตามบท, เรื่องที่สอน, หรือกิจกรรม..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
          />
        </div>

        <div className="text-xs text-slate-500">
          แสดง <strong>{filteredLogs.length}</strong> จาก {currentTeachingLogs.length} บันทึก
        </div>
      </div>

      {/* Timeline Stream */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">ยังไม่มีบันทึกการสอนในวิชานี้</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            เริ่มบันทึกคาบแรกเพื่อเก็บไทม์ไลน์กิจกรรมการเรียนรู้ และนำเสนอหัวหน้ากลุ่มสาระฯ หรือผู้บริหาร
          </p>
          <button
            onClick={handleOpenNewModal}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl inline-flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            บันทึกคาบเรียนแรก
          </button>
        </div>
      ) : (
        <div className="relative border-l-2 border-emerald-500/30 dark:border-emerald-500/20 ml-4 md:ml-8 pl-6 space-y-6">
          {filteredLogs.map(log => {
            const linkedAssignment = currentAssignments.find(a => a.id === log.homeworkOrAssignmentId);
            const linkedSession = currentAttendanceSessions.find(s => s.id === log.attendanceSessionId);

            return (
              <div key={log.id} className="relative group">
                {/* Timeline node bullet */}
                <div className="absolute -left-[35px] top-4 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-md ring-4 ring-white dark:ring-slate-950">
                  {log.sessionNumber}
                </div>

                {/* Card Container */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          คาบที่ {log.sessionNumber}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {log.date}
                        </span>
                        {log.unit && (
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {log.unit}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1.5">
                        {log.topic || 'เนื้อหาการสอนประจำคาบ'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(log)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`ต้องการลบบันทึกคาบที่ ${log.sessionNumber} ใช่หรือไม่?`)) {
                            deleteTeachingLog(log.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="mt-3.5 space-y-3 text-sm">
                    {/* Activities */}
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        🎯 กิจกรรมการเรียนรู้ (วันนี้ทำอะไรบ้าง):
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-slate-700 dark:text-slate-300 whitespace-pre-line text-sm leading-relaxed border border-slate-100 dark:border-slate-800">
                        {log.activities}
                      </div>
                    </div>

                    {/* Learning Outcomes */}
                    {log.learningOutcomes && (
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          📊 ผลการจัดกิจกรรมการเรียนรู้:
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-xs bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 whitespace-pre-line">
                          {log.learningOutcomes}
                        </div>
                      </div>
                    )}

                    {/* Problems and Solutions */}
                    {log.problemsAndSolutions && (
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          💡 ปัญหา/อุปสรรค และแนวทางแก้ไข:
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-xs bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/30 whitespace-pre-line">
                          {log.problemsAndSolutions}
                        </div>
                      </div>
                    )}

                    {/* Linked items footer */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                      {linkedAssignment && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          <span>งานที่สั่ง: <strong>{linkedAssignment.title}</strong></span>
                        </div>
                      )}

                      {linkedSession && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>ลิงก์เช็คชื่อ: คาบที่ {linkedSession.periodNumber} ({linkedSession.date})</span>
                        </div>
                      )}

                      {log.linkedResourceIds && log.linkedResourceIds.length > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                          <span>สื่อ/ใบงานแนบ {log.linkedResourceIds.length} รายการ</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD / EDIT TEACHING LOG */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                {editingLogId ? 'แก้ไขบันทึกการสอน' : 'บันทึกการสอนรายคาบใหม่'}
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    คาบที่
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={sessionNumber}
                    onChange={e => setSessionNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    วันที่สอน
                  </label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={e => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    หน่วยการเรียนรู้ / บทที่
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น บทที่ 2: ระบบสมการ"
                    value={unitTitle}
                    onChange={e => setUnitTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เรื่องที่สอน (สาระสำคัญ) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น การแก้สมการโดยการแทนค่า"
                    value={topicTitle}
                    onChange={e => setTopicTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              {/* AI Draft Button Banner */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    ผู้ช่วย AI ร่างบันทึกการสอน & แผนกิจกรรมอัตโนมัติ
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    กดปุ่มเพื่อให้ AI วิเคราะห์และช่วยเขียน ขั้นนำ ขั้นสอน ขั้นสรุป และผลการประเมิน
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAiDraftLesson}
                  disabled={isAiGenerating || !topicTitle.trim()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-1.5 shrink-0 transition-all"
                >
                  {isAiGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังร่าง...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      ให้ AI ช่วยเขียน
                    </>
                  )}
                </button>
              </div>

              {aiError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">
                  {aiError}
                </div>
              )}

              {/* Activities textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  กิจกรรมการเรียนรู้ (วันนี้ทำอะไรบ้าง / ขั้นนำ ขั้นสอน ขั้นสรุป) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="เช่น 1. ครูทบทวนบทเรียนเดิมและตั้งประเด็นคำถามกระตุ้นคิด 2. นักเรียนแบ่งกลุ่มทำใบกิจกรรมที่ 1 3. ร่วมกันอภิปรายสรุป..."
                  value={activities}
                  onChange={e => setActivities(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {/* Outcomes & Problems */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ผลการจัดกิจกรรมการเรียนรู้
                  </label>
                  <textarea
                    rows={2}
                    placeholder="เช่น นักเรียนมีความเข้าใจและสามารถแก้โจทย์ได้ถูกต้องมากกว่า 85%..."
                    value={learningOutcomes}
                    onChange={e => setLearningOutcomes(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ปัญหา/อุปสรรค และแนวทางแก้ไข
                  </label>
                  <textarea
                    rows={2}
                    placeholder="เช่น มีนักเรียน 2-3 คนยังคำนวณช้า ได้นัดหมายซ่อมเสริมนอกเวลา..."
                    value={problemsAndSolutions}
                    onChange={e => setProblemsAndSolutions(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Link with Assignment & Attendance Session */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เชื่อมโยงภาระงาน/การบ้านที่สั่งในคาบนี้
                  </label>
                  <select
                    value={homeworkId}
                    onChange={e => setHomeworkId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="">-- ไม่มีการบ้าน/งานในคาบนี้ --</option>
                    {currentAssignments.map(asg => (
                      <option key={asg.id} value={asg.id}>
                        {asg.title} ({asg.category || 'ภาระงาน'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เชื่อมโยงกับคาบเช็คชื่อ
                  </label>
                  <select
                    value={attendanceSessionId}
                    onChange={e => setAttendanceSessionId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {currentAttendanceSessions.map(session => (
                      <option key={session.id} value={session.id}>
                        คาบที่ {session.periodNumber} ({session.date}) - {session.title || 'เช็คชื่อ'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
                >
                  บันทึกลงไทม์ไลน์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

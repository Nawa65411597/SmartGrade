import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Check, 
  Clock, 
  AlertCircle, 
  Lock, 
  Unlock, 
  MessageSquare, 
  Search, 
  Filter, 
  Sparkles, 
  CheckCheck, 
  MoreVertical,
  ChevronRight,
  HelpCircle,
  Award
} from 'lucide-react';
import { SubmissionStatus, TaskCategory } from '../../types';

export const GradebookView: React.FC = () => {
  const {
    currentSubject,
    currentClassroom,
    currentStudents,
    currentAssignments,
    studentSummaries,
    getSubmission,
    updateSubmissionStatus,
    updateSubmissionScore,
    updateSubmissionComment,
    batchMarkStatus,
    batchGiveScore,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pending_only' | 'low_grade'>('all');
  const [activeCommentModal, setActiveCommentModal] = useState<{
    assignmentId: string;
    studentId: string;
    studentName: string;
    assignmentTitle: string;
  } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [openColumnMenu, setOpenColumnMenu] = useState<string | null>(null);

  // Filter students based on search and selected filter
  const filteredSummaries = studentSummaries.filter(({ student, grade, pendingCount }) => {
    const matchesSearch =
      student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentCode.includes(searchQuery) ||
      student.seatNumber.toString() === searchQuery;

    if (!matchesSearch) return false;

    if (filterMode === 'pending_only') return pendingCount > 0;
    if (filterMode === 'low_grade') return grade === '0' || grade === '1' || grade === '1.5';
    return true;
  });

  const getCategoryBadge = (category: TaskCategory, isExam: boolean) => {
    if (isExam) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Award className="w-2.5 h-2.5" />
          ข้อสอบ
        </span>
      );
    }
    switch (category) {
      case 'homework':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">การบ้าน</span>;
      case 'project':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700">ชิ้นงาน</span>;
      case 'activity':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">กิจกรรม</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">งาน</span>;
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case '4':
        return 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300';
      case '3.5':
      case '3':
        return 'bg-blue-100 text-blue-800 font-bold border border-blue-300';
      case '2.5':
      case '2':
        return 'bg-indigo-100 text-indigo-800 font-medium border border-indigo-200';
      case '1.5':
      case '1':
        return 'bg-amber-100 text-amber-800 font-medium border border-amber-300';
      case '0':
        return 'bg-rose-100 text-rose-800 font-bold border border-rose-300 animate-pulse';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const handleOpenComment = (assignmentId: string, studentId: string, studentName: string, assignmentTitle: string) => {
    const sub = getSubmission(assignmentId, studentId);
    setCommentText(sub?.teacherNote || '');
    setActiveCommentModal({ assignmentId, studentId, studentName, assignmentTitle });
  };

  const handleSaveComment = () => {
    if (activeCommentModal) {
      updateSubmissionComment(activeCommentModal.assignmentId, activeCommentModal.studentId, commentText);
      setActiveCommentModal(null);
    }
  };

  if (!currentSubject) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">ยังไม่มีรายวิชาในระบบ</h3>
        <p className="text-sm text-slate-500 mt-1">กรุณาสร้างรายวิชาและกำหนดห้องเรียนก่อนเริ่มใช้งาน</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner Info & Teacher Workload Reducer Tooltip */}
      <div className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
          <Sparkles className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs">
                {currentSubject.code}
              </span>
              <span className="text-xs text-indigo-100">
                ห้อง {currentClassroom?.name} • ภาคเรียนที่ {currentSubject.term}/{currentSubject.academicYear}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
              แบบบันทึกคะแนนและการส่งงาน (ปพ.5 ดิจิทัล)
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 mt-0.5 max-w-2xl">
              ระบบตรวจสอบสถานะส่งงานก่อนปลดล็อกกรอกคะแนนอัตโนมัติ คิดคะแนนและตัดเกรดสดทุกครั้งที่มีการบันทึก
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/20">
            <div className="text-center px-3 py-1">
              <div className="text-xs text-indigo-200">นักเรียน</div>
              <div className="text-lg font-bold">{currentStudents.length} คน</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-3 py-1">
              <div className="text-xs text-indigo-200">ภาระงาน/สอบ</div>
              <div className="text-lg font-bold">{currentAssignments.length} รายการ</div>
            </div>
          </div>
        </div>

        {/* System Rule Notice Bar */}
        <div className="mt-3 pt-3 border-t border-white/15 flex items-center gap-2 text-xs text-indigo-100">
          <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>
            <strong className="text-white">กฎระบบ:</strong> นักเรียนต้องมีสถานะ 
            <span className="inline-block mx-1 px-1.5 py-0.2 rounded bg-emerald-500/30 text-white font-medium">ส่งแล้ว</span> 
            หรือ 
            <span className="inline-block mx-1 px-1.5 py-0.2 rounded bg-amber-500/30 text-white font-medium">ส่งช้า</span> 
            ช่องคะแนนจึงจะอนุญาตให้กรอกได้ (หากยังไม่ส่ง ช่องคะแนนจะล็อกไว้เพื่อป้องกันข้อผิดพลาด)
          </span>
        </div>
      </div>

      {/* Control bar: Search, Filter, Quick Batch Actions */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่, รหัสนักเรียน, หรือชื่อ-สกุล..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ล้าง
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium mr-1">
            <Filter className="w-3 h-3" /> กรอง:
          </span>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
              filterMode === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({studentSummaries.length})
          </button>
          <button
            onClick={() => setFilterMode('pending_only')}
            className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 ${
              filterMode === 'pending_only'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            มีงานค้าง ({studentSummaries.filter(s => s.pendingCount > 0).length})
          </button>
          <button
            onClick={() => setFilterMode('low_grade')}
            className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
              filterMode === 'low_grade'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50'
            }`}
          >
            เกรดต่ำกว่า 2 ({studentSummaries.filter(s => s.grade === '0' || s.grade === '1' || s.grade === '1.5').length})
          </button>
        </div>
      </div>

      {/* Gradebook Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {currentAssignments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 font-medium">ยังไม่มีรายการงานหรือแบบทดสอบในวิชานี้</p>
            <button
              onClick={() => setActiveTab('assignments')}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
            >
              + เพิ่มภาระงานหรือข้อสอบแรก
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left text-xs border-collapse">
              {/* Header */}
              <thead className="bg-slate-100/80 sticky top-0 z-20 backdrop-blur-md text-slate-700 border-b border-slate-200">
                <tr>
                  {/* Student Info Sticky Columns */}
                  <th className="p-2.5 w-12 text-center font-bold sticky left-0 bg-slate-100 z-20 border-r border-slate-200">
                    เลขที่
                  </th>
                  <th className="p-2.5 w-20 text-center font-bold sticky left-12 bg-slate-100 z-20 border-r border-slate-200">
                    รหัส
                  </th>
                  <th className="p-2.5 w-44 font-bold sticky left-32 bg-slate-100 z-20 border-r border-slate-200 shadow-xs">
                    ชื่อ - นามสกุล
                  </th>

                  {/* Assignment Columns */}
                  {currentAssignments.map((asg) => (
                    <th
                      key={asg.id}
                      className={`p-2 min-w-[150px] max-w-[170px] text-center border-r border-slate-200 relative ${
                        asg.isExam ? 'bg-amber-50/60' : 'bg-slate-50/80'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-between w-full mb-1">
                          {getCategoryBadge(asg.category, asg.isExam)}
                          
                          {/* Column Menu Button */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenColumnMenu(openColumnMenu === asg.id ? null : asg.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition cursor-pointer"
                              title="เครื่องมือด่วนประจำคอลัมน์"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {openColumnMenu === asg.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setOpenColumnMenu(null)}
                                />
                                <div className="absolute right-0 top-6 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-30 text-left">
                                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase">
                                    จัดการงานด่วน
                                  </div>
                                  <button
                                    onClick={() => {
                                      batchMarkStatus(asg.id, 'submitted');
                                      setOpenColumnMenu(null);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-1.5 transition text-left cursor-pointer"
                                  >
                                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    ทำเครื่องหมาย "ส่งแล้ว" ทั้งห้อง
                                  </button>
                                  <button
                                    onClick={() => {
                                      batchGiveScore(asg.id, asg.maxScore);
                                      setOpenColumnMenu(null);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-800 flex items-center gap-1.5 transition text-left cursor-pointer"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                    ให้คะแนนเต็ม ({asg.maxScore}) ทุกคน
                                  </button>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                    onClick={() => {
                                      batchMarkStatus(asg.id, 'pending');
                                      setOpenColumnMenu(null);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition text-left cursor-pointer"
                                  >
                                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                                    รีเซ็ตเป็น "ยังไม่ส่ง" ทั้งห้อง
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="font-semibold text-slate-800 text-xs line-clamp-2 leading-tight" title={asg.title}>
                          {asg.title}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <span className="text-indigo-600 font-bold">เต็ม {asg.maxScore}</span>
                          <span>•</span>
                          <span>ส่ง {asg.dueDate}</span>
                        </div>
                      </div>
                    </th>
                  ))}

                  {/* Calculated Columns */}
                  <th className="p-2 text-center min-w-[70px] bg-slate-100 font-bold border-r border-slate-200">
                    <div>คะแนนเก็บ</div>
                    <div className="text-[10px] text-slate-400 font-normal">ก่อนสอบ</div>
                  </th>
                  <th className="p-2 text-center min-w-[70px] bg-amber-50/70 font-bold border-r border-slate-200 text-amber-900">
                    <div>กลางภาค</div>
                    <div className="text-[10px] text-amber-700 font-normal">สอบ</div>
                  </th>
                  <th className="p-2 text-center min-w-[70px] bg-amber-50/70 font-bold border-r border-slate-200 text-amber-900">
                    <div>ปลายภาค</div>
                    <div className="text-[10px] text-amber-700 font-normal">สอบ</div>
                  </th>
                  <th className="p-2 text-center min-w-[80px] bg-indigo-50 font-bold border-r border-slate-200 text-indigo-900">
                    <div>รวม 100</div>
                    <div className="text-[10px] text-indigo-600 font-normal">ตัดเกรด</div>
                  </th>
                  <th className="p-2 text-center min-w-[70px] bg-indigo-100 font-bold sticky right-0 z-20 text-indigo-950 shadow-xs">
                    <div>เกรด</div>
                    <div className="text-[10px] text-indigo-700 font-normal">ผลการเรียน</div>
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-slate-200">
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={currentAssignments.length + 8} className="p-8 text-center text-slate-400">
                      ไม่พบข้อมูลนักเรียนที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredSummaries.map(({ student, assignmentScores, totalCollectedScore, midtermScore, finalScore, totalScore, grade }) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition group">
                      {/* Seat Number */}
                      <td className="p-2 text-center font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200">
                        {student.seatNumber}
                      </td>

                      {/* Student Code */}
                      <td className="p-2 text-center text-slate-500 font-mono text-[11px] sticky left-12 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200">
                        {student.studentCode}
                      </td>

                      {/* Full Name */}
                      <td className="p-2 sticky left-32 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200 shadow-xs">
                        <div className="font-semibold text-slate-900 text-xs">
                          {student.prefix}{student.fullName}
                        </div>
                        {student.note && (
                          <div className="text-[10px] text-indigo-600">{student.note}</div>
                        )}
                      </td>

                      {/* Assignment cells */}
                      {currentAssignments.map((asg) => {
                        const cellData = assignmentScores[asg.id] || { status: 'pending', score: null, isExam: asg.isExam };
                        const sub = getSubmission(asg.id, student.id);
                        const isPending = cellData.status === 'pending';
                        const isSubmitted = cellData.status === 'submitted';
                        const isLate = cellData.status === 'late';

                        return (
                          <td
                            key={asg.id}
                            className={`p-2 border-r border-slate-200 transition ${
                              isPending
                                ? 'bg-slate-50/50'
                                : isLate
                                ? 'bg-amber-50/20'
                                : 'bg-white'
                            }`}
                          >
                            <div className="flex flex-col gap-1.5">
                              {/* Status Toggle Buttons */}
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-0.5">
                                  <button
                                    onClick={() => updateSubmissionStatus(asg.id, student.id, 'submitted')}
                                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded transition flex items-center gap-0.5 cursor-pointer ${
                                      isSubmitted
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                                    title="ส่งแล้ว"
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                    ส่ง
                                  </button>
                                  <button
                                    onClick={() => updateSubmissionStatus(asg.id, student.id, 'late')}
                                    className={`px-1 py-0.5 text-[10px] font-semibold rounded transition flex items-center gap-0.5 cursor-pointer ${
                                      isLate
                                        ? 'bg-amber-500 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                                    }`}
                                    title="ส่งช้า"
                                  >
                                    <Clock className="w-2.5 h-2.5" />
                                    ช้า
                                  </button>
                                  <button
                                    onClick={() => updateSubmissionStatus(asg.id, student.id, 'pending')}
                                    className={`px-1 py-0.5 text-[10px] font-medium rounded transition cursor-pointer ${
                                      isPending
                                        ? 'bg-rose-500 text-white shadow-2xs font-semibold'
                                        : 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-700'
                                    }`}
                                    title="ยังไม่ส่ง (จะล็อกช่องคะแนน)"
                                  >
                                    ค้าง
                                  </button>
                                </div>

                                {/* Teacher note indicator/button */}
                                <button
                                  onClick={() =>
                                    handleOpenComment(
                                      asg.id,
                                      student.id,
                                      `${student.prefix}${student.fullName}`,
                                      asg.title
                                    )
                                  }
                                  className={`p-1 rounded hover:bg-slate-100 transition cursor-pointer ${
                                    sub?.teacherNote ? 'text-indigo-600 font-bold' : 'text-slate-300 hover:text-slate-600'
                                  }`}
                                  title={sub?.teacherNote ? `หมายเหตุ: ${sub.teacherNote}` : 'เพิ่มบันทึก/ข้อความถึงนักเรียน'}
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Score Field - Enforcing the Rule! */}
                              {isPending ? (
                                /* When status is 'pending', score is strictly LOCKED */
                                <div
                                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-100/90 text-slate-400 rounded-md border border-slate-200 text-xs cursor-not-allowed select-none"
                                  title="ต้องส่งก่อน! กรุณาไปปรับสถานะเป็น 'ส่งแล้ว' ในหน้าเช็คสถานะส่งงานก่อน จึงจะกรอกคะแนนได้"
                                >
                                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="text-[11px] font-medium">ต้องส่งก่อน</span>
                                </div>
                              ) : (
                                /* When status is 'submitted' or 'late', score is UNLOCKED */
                                <div className="flex items-center gap-1">
                                  <div className="relative flex-1">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      max={asg.maxScore}
                                      value={cellData.score !== null ? cellData.score : ''}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                        if (val !== null && val > asg.maxScore) {
                                          updateSubmissionScore(asg.id, student.id, asg.maxScore);
                                        } else {
                                          updateSubmissionScore(asg.id, student.id, val);
                                        }
                                      }}
                                      placeholder="-"
                                      className="w-full text-center py-1 px-1.5 font-bold text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                                    />
                                  </div>
                                  <span className="text-[10px] text-slate-400">/{asg.maxScore}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Calculated Columns */}
                      <td className="p-2 text-center font-bold text-slate-700 bg-slate-50/50 border-r border-slate-200">
                        {totalCollectedScore}
                      </td>
                      <td className="p-2 text-center font-bold text-amber-800 bg-amber-50/30 border-r border-slate-200">
                        {midtermScore}
                      </td>
                      <td className="p-2 text-center font-bold text-amber-800 bg-amber-50/30 border-r border-slate-200">
                        {finalScore}
                      </td>
                      <td className="p-2 text-center font-bold text-indigo-700 bg-indigo-50/40 border-r border-slate-200 text-sm">
                        {totalScore}
                      </td>
                      <td className="p-2 text-center sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-xs">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${getGradeColor(grade)}`}>
                          {grade}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comment Modal */}
      {activeCommentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-800 text-base">บันทึกข้อความ / หมายเหตุการส่งงาน</h3>
            <p className="text-xs text-slate-500 mt-1">
              {activeCommentModal.studentName} • {activeCommentModal.assignmentTitle}
            </p>
            <div className="mt-3">
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="เช่น ส่งช้ากว่ากำหนด 2 วัน เนื่องจากป่วย, งานเขียนดีมาก ลายมือเรียบร้อย..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                *ข้อความนี้จะแสดงในระบบตรวจสอบสถานะของนักเรียนด้วย เพื่อให้นักเรียนทราบข้อเสนอแนะของครู
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setActiveCommentModal(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveComment}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs cursor-pointer"
              >
                บันทึกหมายเหตุ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

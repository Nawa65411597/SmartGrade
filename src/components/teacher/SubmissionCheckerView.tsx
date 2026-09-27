import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CheckCheck, 
  Search, 
  MessageSquare, 
  ArrowRight,
  ScanBarcode,
  Layers,
  Sparkles,
  Volume2,
  Table as TableIcon,
  HelpCircle,
  X,
  Lock
} from 'lucide-react';
import { SubmissionStatus, Assignment } from '../../types';

export const SubmissionCheckerView: React.FC = () => {
  const {
    currentSubject,
    currentClassroom,
    currentStudents,
    currentAssignments,
    getSubmission,
    updateSubmissionStatus,
    updateSubmissionComment,
    batchMarkStatus,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanMessage, setScanMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
    studentName?: string;
  } | null>(null);

  // Active assignment for single-column barcode scanning or default focus
  const [selectedAsgId, setSelectedAsgId] = useState<string>(() => {
    return currentAssignments[0]?.id || '';
  });

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Keep selected assignment valid
  const activeAssignment = currentAssignments.find(a => a.id === selectedAsgId) || currentAssignments[0];

  // Comment Modal state
  const [commentModal, setCommentModal] = useState<{
    assignmentId: string;
    assignmentTitle: string;
    studentId: string;
    studentName: string;
    seatNumber: number;
    currentNote: string;
  } | null>(null);
  const [noteText, setNoteText] = useState('');

  // Auto focus barcode input on load or when clicking scanner box
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Play audio beep indicator when scanning
  const playScanSound = (success = true) => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (success) {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else {
        osc.frequency.setValueAtTime(320, audioCtx.currentTime); // Low pitch error
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch {
      // AudioContext not allowed without user gesture in some browsers
    }
  };

  // Barcode Handler (Handles handheld USB barcode scanner which types code + presses Enter)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCode = barcodeInput.trim();
    if (!rawCode || !activeAssignment) return;

    // Search student by code, seatNumber, or id
    const foundStudent = currentStudents.find(
      s => s.studentCode === rawCode || s.seatNumber.toString() === rawCode || s.id === rawCode
    );

    if (foundStudent) {
      updateSubmissionStatus(activeAssignment.id, foundStudent.id, 'submitted');
      playScanSound(true);
      setScanMessage({
        text: `สแกนสำเร็จ! บันทึก "ส่งแล้ว" สำหรับงาน "${activeAssignment.title}"`,
        type: 'success',
        studentName: `เลขที่ ${foundStudent.seatNumber} : ${foundStudent.prefix}${foundStudent.fullName} (${foundStudent.studentCode})`,
      });
    } else {
      playScanSound(false);
      setScanMessage({
        text: `ไม่พบนักเรียนรหัส "${rawCode}" ในห้องนี้`,
        type: 'error',
      });
    }

    setBarcodeInput('');
    // Auto refocus
    barcodeInputRef.current?.focus();
  };

  // Filter students based on search query
  const filteredStudents = currentStudents.filter(std => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      std.fullName.toLowerCase().includes(q) ||
      std.studentCode.includes(q) ||
      std.seatNumber.toString() === q
    );
  });

  const handleOpenComment = (assignment: Assignment, studentId: string, studentName: string, seatNumber: number) => {
    const sub = getSubmission(assignment.id, studentId);
    setNoteText(sub?.teacherNote || '');
    setCommentModal({
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      studentId,
      studentName,
      seatNumber,
      currentNote: sub?.teacherNote || '',
    });
  };

  const handleSaveComment = () => {
    if (commentModal) {
      updateSubmissionComment(commentModal.assignmentId, commentModal.studentId, noteText);
      setCommentModal(null);
    }
  };

  if (!currentSubject) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">ยังไม่มีรายวิชาในระบบ</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step Banner: Window 1 of 2 */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                  หน้าต่างที่ 1: เช็คสถานะส่งงาน (ตาราง ปพ.5)
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentSubject.code} {currentSubject.name} (ห้อง {currentClassroom?.name})
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                ตารางบันทึกการส่งงาน & ระบบสแกนบาร์โค้ด
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                คลิกเปลี่ยนสถานะส่งงานในตาราง หรือใช้เครื่องสแกนบาร์โค้ดยิงรหัสนักเรียนบนสมุด/ใบงานเพื่อเช็คส่งงานอัตโนมัติ
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('enter_scores')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>ไปหน้าต่างที่ 2 : กรอกคะแนน ปพ.5</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Barcode Scanner Box (Hardware scanner compatible) */}
        <div className="mt-4 bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-3 sm:p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <ScanBarcode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    โหมดสแกนบาร์โค้ด / รหัสนักเรียน (เช็คส่งงานด่วน)
                  </span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                    พร้อมสแกน
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  เช็คส่งสำหรับงาน:{' '}
                  <select
                    value={activeAssignment?.id || ''}
                    onChange={(e) => setSelectedAsgId(e.target.value)}
                    className="font-bold text-emerald-800 bg-white border border-emerald-300 rounded px-1.5 py-0.5 text-xs focus:outline-none"
                  >
                    {currentAssignments.map(a => (
                      <option key={a.id} value={a.id}>{a.title} ({a.maxScore} คะแนน)</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Barcode Input Form */}
            <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 max-w-md w-full">
              <div className="relative flex-1">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="ยิงบาร์โค้ด หรือพิมพ์รหัสนักเรียน..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl border border-emerald-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
                <ScanBarcode className="w-4 h-4 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer shrink-0"
              >
                บันทึกส่ง
              </button>
            </form>
          </div>

          {/* Scan Result Notice Banner */}
          {scanMessage && (
            <div className={`mt-3 p-2.5 rounded-xl text-xs flex items-center justify-between border ${
              scanMessage.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : 'bg-rose-100 text-rose-900 border-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {scanMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                )}
                <span>
                  <strong>{scanMessage.text}</strong>
                  {scanMessage.studentName && (
                    <span className="block sm:inline sm:ml-2 font-bold underline">
                      {scanMessage.studentName}
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={() => setScanMessage(null)}
                className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Control bar: Search & Quick Batch Tool */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่, รหัส, ชื่อ-สกุล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          {activeAssignment && (
            <button
              onClick={() => batchMarkStatus(activeAssignment.id, 'submitted')}
              className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1.5 transition cursor-pointer"
              title="ทำเครื่องหมายส่งแล้วทุกคนเฉพาะงานที่เลือกด้านบน"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ส่งแล้วทุกคน (งาน "{activeAssignment.title.slice(0, 18)}...")</span>
            </button>
          )}
        </div>
      </div>

      {/* Phor.Phor.5 Style Submission Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-emerald-600" />
            <span>ตารางเช็คส่งงาน ปพ.5 (แยกตามภาระงานแต่ละชิ้น)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-normal">
            คลิกปุ่มสถานะในแต่ละช่องเพื่อเปลี่ยน: ส่งแล้ว / ส่งช้า / ยังไม่ส่ง
          </span>
        </div>

        <div className="overflow-x-auto max-h-[65vh]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 sticky top-0 z-20 text-slate-700 border-b border-slate-300">
              <tr>
                <th className="p-2.5 w-12 text-center font-bold sticky left-0 bg-slate-100 z-20 border-r border-slate-300">
                  ที่
                </th>
                <th className="p-2.5 w-20 text-center font-bold sticky left-12 bg-slate-100 z-20 border-r border-slate-300">
                  รหัส
                </th>
                <th className="p-2.5 w-44 font-bold sticky left-32 bg-slate-100 z-20 border-r border-slate-300 shadow-xs">
                  ชื่อ - สกุล
                </th>

                {/* Assignment Columns */}
                {currentAssignments.map((asg, idx) => (
                  <th
                    key={asg.id}
                    className={`p-2 min-w-[130px] max-w-[150px] text-center border-r border-slate-300 ${
                      activeAssignment?.id === asg.id ? 'bg-emerald-100/70 border-b-2 border-b-emerald-600' : 'bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-slate-900 line-clamp-1" title={asg.title}>
                      ง.{idx + 1} {asg.title}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {asg.dueDate} • เต็ม {asg.maxScore}
                    </div>
                  </th>
                ))}

                {/* Submission Total Column */}
                <th className="p-2.5 text-center w-24 bg-emerald-50 text-emerald-900 font-bold sticky right-0 z-20 border-l border-slate-300 shadow-xs">
                  ส่งครบ (%)
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={currentAssignments.length + 4} className="p-8 text-center text-slate-400">
                    ไม่พบข้อมูลนักเรียน
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => {
                  let submittedCount = 0;

                  return (
                    <tr key={std.id} className="hover:bg-slate-50 transition group">
                      {/* Seat */}
                      <td className="p-2 text-center font-bold text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200">
                        {std.seatNumber}
                      </td>

                      {/* Code */}
                      <td className="p-2 text-center font-mono text-[11px] text-slate-600 sticky left-12 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200">
                        {std.studentCode}
                      </td>

                      {/* Name */}
                      <td className="p-2 sticky left-32 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200 shadow-xs font-semibold text-slate-900 text-xs">
                        {std.prefix}{std.fullName}
                      </td>

                      {/* Assignment cells */}
                      {currentAssignments.map((asg) => {
                        const sub = getSubmission(asg.id, std.id);
                        const status: SubmissionStatus = sub?.status || 'pending';
                        const isSubmitted = status === 'submitted';
                        const isLate = status === 'late';
                        const isPending = status === 'pending';

                        if (isSubmitted || isLate) {
                          submittedCount++;
                        }

                        return (
                          <td
                            key={asg.id}
                            className={`p-1.5 text-center border-r border-slate-200 transition ${
                              isSubmitted ? 'bg-emerald-50/40' : isLate ? 'bg-amber-50/40' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              {/* Quick 1-click Toggle */}
                              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => updateSubmissionStatus(asg.id, std.id, 'submitted')}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                    isSubmitted
                                      ? 'bg-emerald-600 text-white'
                                      : 'text-slate-600 hover:bg-emerald-50'
                                  }`}
                                  title="ส่งแล้ว"
                                >
                                  ส่ง
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateSubmissionStatus(asg.id, std.id, 'late')}
                                  className={`px-1 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                    isLate
                                      ? 'bg-amber-500 text-white'
                                      : 'text-slate-600 hover:bg-amber-50'
                                  }`}
                                  title="ส่งช้า"
                                >
                                  ช้า
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateSubmissionStatus(asg.id, std.id, 'pending')}
                                  className={`px-1 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                    isPending
                                      ? 'bg-rose-500 text-white'
                                      : 'text-slate-400 hover:bg-rose-50'
                                  }`}
                                  title="ยังไม่ส่ง (ค้าง)"
                                >
                                  ค้าง
                                </button>
                              </div>

                              {/* Comment button */}
                              <button
                                type="button"
                                onClick={() => handleOpenComment(asg, std.id, `${std.prefix}${std.fullName}`, std.seatNumber)}
                                className={`p-1 rounded hover:bg-slate-100 transition cursor-pointer ${
                                  sub?.teacherNote ? 'text-indigo-600 font-bold' : 'text-slate-300'
                                }`}
                                title={sub?.teacherNote ? `โน้ต: ${sub.teacherNote}` : 'เพิ่มข้อความโน้ต'}
                              >
                                <MessageSquare className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        );
                      })}

                      {/* Percentage complete */}
                      <td className="p-2 text-center font-bold text-xs sticky right-0 bg-emerald-50/50 group-hover:bg-emerald-100/60 z-10 border-l border-slate-300 shadow-xs">
                        <span className={submittedCount === currentAssignments.length ? 'text-emerald-700' : 'text-slate-700'}>
                          {currentAssignments.length > 0 ? Math.round((submittedCount / currentAssignments.length) * 100) : 0}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comment Modal */}
      {commentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-800 text-base">บันทึกข้อเสนอแนะการส่งงาน</h3>
            <p className="text-xs text-slate-500 mt-1">
              เลขที่ {commentModal.seatNumber} : {commentModal.studentName} • {commentModal.assignmentTitle}
            </p>
            <div className="mt-3">
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="เช่น ส่งช้าเนื่องจากลาป่วย, เนื้อหาถูกต้อง ลายมือประณีต..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                *ข้อความนี้จะแสดงในมุมมองนักเรียนด้วย
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setCommentModal(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveComment}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs cursor-pointer"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

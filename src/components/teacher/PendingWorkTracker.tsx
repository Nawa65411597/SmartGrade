import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  AlertCircle, 
  Copy, 
  Check, 
  Send, 
  FileText, 
  Printer, 
  Calendar, 
  ChevronRight,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

export const PendingWorkTracker: React.FC = () => {
  const { 
    currentSubject, 
    currentClassroom, 
    currentStudents, 
    currentAssignments, 
    submissions 
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [filterView, setFilterView] = useState<'by_student' | 'by_assignment'>('by_student');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate missing assignments per student
  const studentsWithPending = useMemo(() => {
    return currentStudents.map(student => {
      const pendingTasks = currentAssignments.filter(asg => {
        const sub = submissions.find(s => s.assignmentId === asg.id && s.studentId === student.id);
        return !sub || sub.status === 'pending';
      });

      return {
        student,
        pendingTasks,
        pendingCount: pendingTasks.length,
      };
    }).filter(item => item.pendingCount > 0);
  }, [currentStudents, currentAssignments, submissions]);

  // Assignments with their pending students
  const assignmentsWithPending = useMemo(() => {
    return currentAssignments.map(asg => {
      const missingStudents = currentStudents.filter(std => {
        const sub = submissions.find(s => s.assignmentId === asg.id && s.studentId === std.id);
        return !sub || sub.status === 'pending';
      });

      return {
        assignment: asg,
        missingStudents,
        missingCount: missingStudents.length,
      };
    }).filter(item => item.missingCount > 0);
  }, [currentAssignments, currentStudents, submissions]);

  // Generate polite LINE notice message
  const generatedLineMessage = useMemo(() => {
    if (!currentSubject || studentsWithPending.length === 0) {
      return 'ไม่มีนักเรียนค้างส่งงานในวิชานี้';
    }

    const lines = [
      `📢 [แจ้งเตือนการส่งงานค้าง]`,
      `วิชา: ${currentSubject.code} ${currentSubject.name}`,
      `ระดับชั้น: ห้อง ${currentClassroom?.name}`,
      `ประจำวันที่: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      `---------------------------------`,
      `ขอความร่วมมือนักเรียนที่มีรายชื่อต่อไปนี้ ส่งงานที่ค้างให้เรียบร้อยเพื่อบันทึกคะแนน:`,
      '',
    ];

    studentsWithPending.forEach(({ student, pendingTasks }) => {
      const taskNames = pendingTasks.map(t => `"${t.title}"`).join(', ');
      lines.push(`• เลขที่ ${student.seatNumber} ${student.prefix}${student.fullName} (ค้าง ${pendingTasks.length} งาน: ${taskNames})`);
    });

    lines.push('');
    lines.push(`💡 นักเรียนสามารถตรวจสอบสถานะงานและคะแนนสอบได้ที่ระบบตรวจสอบของโรงเรียน`);
    lines.push(`ขอบคุณครับ/ค่ะ 🙏`);

    return lines.join('\n');
  }, [currentSubject, currentClassroom, studentsWithPending]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generatedLineMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              ระบบติดตามงานค้าง & สร้างข้อความแจ้งเตือน (ลดภาระงานครู)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            รวบรวมรายชื่อผู้ที่ยังไม่ส่งงาน พร้อมสร้างข้อความแจ้งผู้ปกครองหรือนักเรียนผ่านไลน์กลุ่มได้ในคลิกเดียว
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterView('by_student')}
              className={`px-3 py-1 font-semibold rounded-lg transition cursor-pointer ${
                filterView === 'by_student' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ดูตามรายชื่อนักเรียน ({studentsWithPending.length})
            </button>
            <button
              onClick={() => setFilterView('by_assignment')}
              className={`px-3 py-1 font-semibold rounded-lg transition cursor-pointer ${
                filterView === 'by_assignment' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ดูตามภาระงาน ({assignmentsWithPending.length})
            </button>
          </div>
        </div>
      </div>

      {/* LINE Announcement Generator Box */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-bold text-sm tracking-tight">ข้อความสำเร็จรูปสำหรับส่ง LINE / ประกาศในกลุ่ม</h3>
              <p className="text-[11px] text-emerald-100">คัดลอกไปวางในกลุ่มไลน์ห้องเรียนหรือไลน์ผู้ปกครองได้ทันที</p>
            </div>
          </div>
          <button
            onClick={handleCopyMessage}
            className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                คัดลอกสำเร็จแล้ว!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-emerald-700" />
                คัดลอกข้อความ
              </>
            )}
          </button>
        </div>

        <div className="mt-3 bg-white/10 backdrop-blur-md rounded-xl p-3.5 font-mono text-xs text-emerald-50 max-h-40 overflow-y-auto whitespace-pre-wrap border border-white/15">
          {generatedLineMessage}
        </div>
      </div>

      {/* Detail Content */}
      {filterView === 'by_student' ? (
        <div className="space-y-3">
          {studentsWithPending.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">ยอดเยี่ยม! ไม่มีงานค้างในห้องนี้</h3>
              <p className="text-xs text-slate-500 mt-1">นักเรียนทุกคนส่งงานครบถ้วนสมบูรณ์</p>
            </div>
          ) : (
            studentsWithPending.map(({ student, pendingTasks }) => (
              <div key={student.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-sm">
                    {student.seatNumber}
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-mono">รหัส {student.studentCode}</div>
                    <div className="font-bold text-slate-900 text-sm">{student.prefix}{student.fullName}</div>
                    <div className="text-xs text-rose-600 font-semibold mt-0.5">
                      ค้างส่ง {pendingTasks.length} รายการ
                    </div>
                  </div>
                </div>

                <div className="flex-1 max-w-xl">
                  <div className="text-xs font-semibold text-slate-500 mb-1.5">รายการงานที่ยังไม่ได้ส่ง:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {pendingTasks.map(t => (
                      <span key={t.id} className="px-2 py-1 rounded-md bg-rose-50 text-rose-700 text-xs border border-rose-200/60 font-medium">
                        {t.title} (ครบกำหนด {t.dueDate})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignmentsWithPending.map(({ assignment, missingStudents, missingCount }) => (
            <div key={assignment.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{assignment.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    ขาด {missingCount} คน
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">กำหนดส่ง: {assignment.dueDate} • เต็ม {assignment.maxScore} คะแนน</div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500 font-medium mb-1.5">นักเรียนที่ยังไม่ส่ง:</div>
                <div className="flex flex-wrap gap-1">
                  {missingStudents.map(std => (
                    <span key={std.id} className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      เลขที่ {std.seatNumber} {std.fullName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

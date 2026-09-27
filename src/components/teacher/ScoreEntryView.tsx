import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle2, 
  Lock, 
  Search, 
  ArrowLeft, 
  AlertCircle, 
  Award,
  Table as TableIcon,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

export const ScoreEntryView: React.FC = () => {
  const {
    currentSubject,
    currentClassroom,
    currentStudents,
    currentAssignments,
    getSubmission,
    updateSubmissionScore,
    batchGiveScore,
    setActiveTab,
    calculateGrade,
    currentScoreProportions,
    studentSummaries,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

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

  if (!currentSubject) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">ยังไม่มีรายวิชาในระบบ</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step Banner: Window 2 of 2 */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              2
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800">
                  หน้าต่างที่ 2: กรอกคะแนน ปพ.5 (ต้องส่งงานก่อน)
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentSubject.code} {currentSubject.name} (ห้อง {currentClassroom?.name})
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                ตารางบันทึกและกรอกคะแนนแบบ ปพ.5
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                กรอกคะแนนในตารางได้เฉพาะนักเรียนที่ส่งงานแล้ว หากยังไม่ส่งช่องจะล็อก 🔒 (ต้องปรับสถานะที่หน้าเช็คส่งงานก่อนเท่านั้น ไม่สามารถกดข้ามขั้นตอนได้)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('check_submissions')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold border border-emerald-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ไปปรับสถานะที่หน้าเช็คส่งงาน</span>
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer"
            >
              <span>ดูสรุปตัดเกรด</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Strict Rule Notice Bar */}
        <div className="mt-3 bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-900">
          <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>กฎความถูกต้องเข้มงวด:</strong> นักเรียนที่ยังไม่ส่งงาน ช่องคะแนนจะล็อกอย่างถาวร 🔒 และไม่สามารถคลิกเพื่อข้ามขั้นตอนได้ หากต้องการกรอกคะแนน ครูผู้สอนต้องเข้าไปเช็คสถานะเป็น "ส่งแล้ว" ใน 
            <button
              onClick={() => setActiveTab('check_submissions')}
              className="font-bold underline text-indigo-700 mx-1 hover:text-indigo-900 cursor-pointer"
            >
              หน้าต่างที่ 1: เช็คสถานะส่งงาน
            </button>
            ก่อนเท่านั้น
          </div>
        </div>
      </div>

      {/* Control Bar: Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่, รหัส, ชื่อ-สกุล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          จำนวนนักเรียน: <strong className="text-slate-800">{filteredStudents.length}</strong> คน • ภาระงาน/สอบ: <strong className="text-slate-800">{currentAssignments.length}</strong> ช่อง
        </div>
      </div>

      {/* Phor.Phor.5 Style Score Table Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-indigo-600" />
            <span>ตารางกรอกคะแนน ปพ.5 (คำนวณคะแนนรวมและเกรดอัตโนมัติ)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-normal">
            ระบบบันทึกคะแนนและคำนวณตัดเกรดอัตโนมัติ
          </span>
        </div>

        <div className="overflow-x-auto max-h-[70vh]">
          {currentStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              ยังไม่มีรายชื่อนักเรียนในห้องนี้ กรุณาไปที่แท็บ "รายชื่อนักเรียน" เพื่อเพิ่มนักเรียน
            </div>
          ) : currentAssignments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              ยังไม่มีภาระงานหรือข้อสอบในวิชานี้ กรุณาไปที่แท็บ "ภาระงาน & แบบทดสอบ" เพื่อสร้างงาน
            </div>
          ) : (
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

                  {/* Assignment Score Columns */}
                  {currentAssignments.map((asg, idx) => (
                    <th
                      key={asg.id}
                      className={`p-2 min-w-[110px] max-w-[140px] text-center border-r border-slate-300 ${
                        asg.period === 'midterm' || asg.isExam ? 'bg-amber-50/80 text-amber-950' :
                        asg.period === 'final' ? 'bg-rose-50/80 text-rose-950' :
                        asg.period === 'post_midterm' ? 'bg-indigo-50/80 text-indigo-950' :
                        'bg-blue-50/80 text-blue-950'
                      }`}
                    >
                      <div className="font-bold line-clamp-1" title={asg.title}>
                        ง.{idx + 1} {asg.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5 flex items-center justify-center gap-1">
                        <span className="font-semibold text-slate-700">เต็ม {asg.maxScore}</span>
                        {asg.unit && <span className="truncate max-w-[60px]" title={asg.unit}>• {asg.unit}</span>}
                      </div>
                    </th>
                  ))}

                  {/* Calculated 4-Period Columns */}
                  <th className="p-2 text-center w-20 bg-blue-100/70 font-bold border-r border-slate-300 text-blue-950">
                    <div>ก่อนกลาง</div>
                    <div className="text-[10px] font-normal">({currentScoreProportions.preMidterm})</div>
                  </th>
                  <th className="p-2 text-center w-16 bg-amber-100/70 font-bold border-r border-slate-300 text-amber-950">
                    <div>กลาง</div>
                    <div className="text-[10px] font-normal">({currentScoreProportions.midterm})</div>
                  </th>
                  <th className="p-2 text-center w-20 bg-indigo-100/70 font-bold border-r border-slate-300 text-indigo-950">
                    <div>หลังกลาง</div>
                    <div className="text-[10px] font-normal">({currentScoreProportions.postMidterm})</div>
                  </th>
                  <th className="p-2 text-center w-16 bg-rose-100/70 font-bold border-r border-slate-300 text-rose-950">
                    <div>ปลาย</div>
                    <div className="text-[10px] font-normal">({currentScoreProportions.final})</div>
                  </th>
                  <th className="p-2 text-center w-20 bg-slate-200 font-black border-r border-slate-300 text-slate-900">
                    <div>รวม 100</div>
                  </th>
                  <th className="p-2 text-center w-16 bg-indigo-600 font-bold sticky right-0 z-20 text-white shadow-xs">
                    <div>เกรด</div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={currentAssignments.length + 7} className="p-8 text-center text-slate-400">
                      ไม่พบข้อมูลนักเรียนที่ตรงกับคำค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((std) => {
                    let totalCollected = 0;
                    let totalExam = 0;

                    currentAssignments.forEach(asg => {
                      const sub = getSubmission(asg.id, std.id);
                      const sc = (sub?.status !== 'pending') ? (sub?.score || 0) : 0;
                      if (asg.isExam) {
                        totalExam += sc;
                      } else {
                        totalCollected += sc;
                      }
                    });

                    const grandTotal = Math.round((totalCollected + totalExam) * 10) / 10;
                    const { grade } = calculateGrade(grandTotal);

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

                        {/* Assignment score cells */}
                        {currentAssignments.map((asg) => {
                          const sub = getSubmission(asg.id, std.id);
                          const status = sub?.status || 'pending';
                          const isPending = status === 'pending';
                          const score = sub?.score;

                          return (
                            <td
                              key={asg.id}
                              className={`p-1.5 text-center border-r border-slate-200 ${
                                isPending ? 'bg-slate-100/70' : 'bg-white'
                              }`}
                            >
                              {isPending ? (
                                /* STRICT LOCKED STATE: Cannot click to submit here! Must go to Check Submission window! */
                                <div
                                  className="px-2 py-1 bg-slate-200/60 text-slate-400 border border-slate-300 rounded text-[11px] flex items-center justify-center gap-1 select-none cursor-not-allowed"
                                  title="ล็อกอยู่: ต้องไปเช็คสถานะว่าส่งแล้วในหน้าเช็คส่งงานก่อน จึงจะกรอกคะแนนได้"
                                >
                                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="font-semibold text-[10px]">ยังไม่ส่ง</span>
                                </div>
                              ) : (
                                /* Unlocked State: Enter Score */
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max={asg.maxScore}
                                    value={score !== null && score !== undefined ? score : ''}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                      if (val !== null && val > asg.maxScore) {
                                        updateSubmissionScore(asg.id, std.id, asg.maxScore);
                                      } else {
                                        updateSubmissionScore(asg.id, std.id, val);
                                      }
                                    }}
                                    placeholder="-"
                                    className="w-14 py-1 text-center font-bold text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                  />
                                  <span className="text-[10px] text-slate-400">/{asg.maxScore}</span>
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Look up computed summary from studentSummaries */}
                        {(() => {
                          const summary = studentSummaries.find(s => s.student.id === std.id);
                          const pre = summary?.preMidtermScore ?? 0;
                          const mid = summary?.midtermScore ?? 0;
                          const post = summary?.postMidtermScore ?? 0;
                          const fin = summary?.finalScore ?? 0;
                          const tot = summary?.totalScore ?? 0;
                          const gr = summary?.grade ?? '0';

                          return (
                            <>
                              {/* ก่อนกลางภาค */}
                              <td className="p-2 text-center font-bold text-blue-900 bg-blue-50/40 border-r border-slate-200">
                                {pre}
                              </td>

                              {/* กลางภาค */}
                              <td className="p-2 text-center font-bold text-amber-900 bg-amber-50/40 border-r border-slate-200">
                                {mid}
                              </td>

                              {/* หลังกลางภาค */}
                              <td className="p-2 text-center font-bold text-indigo-900 bg-indigo-50/40 border-r border-slate-200">
                                {post}
                              </td>

                              {/* ปลายภาค */}
                              <td className="p-2 text-center font-bold text-rose-900 bg-rose-50/40 border-r border-slate-200">
                                {fin}
                              </td>

                              {/* รวม 100 */}
                              <td className="p-2 text-center font-black text-slate-900 bg-slate-100 border-r border-slate-200 text-sm">
                                {tot}
                              </td>

                              {/* Grade */}
                              <td className="p-2 text-center font-black sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-200 shadow-xs">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                                  gr === '4' ? 'bg-emerald-100 text-emerald-800' :
                                  gr === '0' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                                }`}>
                                  {gr}
                                </span>
                              </td>
                            </>
                          );
                        })()}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

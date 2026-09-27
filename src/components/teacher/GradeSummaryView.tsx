import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Award, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Download, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { GradeCutoff } from '../../types';

export const GradeSummaryView: React.FC = () => {
  const { 
    currentSubject, 
    currentClassroom, 
    studentSummaries, 
    classStats, 
    gradeCutoffs, 
    updateGradeCutoffs,
    currentAssignments,
    currentScoreProportions
  } = useApp();

  const [showCutoffsModal, setShowCutoffsModal] = useState(false);
  const [tempCutoffs, setTempCutoffs] = useState<GradeCutoff[]>(gradeCutoffs);

  // Grade color map
  const gradeColors: Record<string, string> = {
    '4': 'bg-emerald-500',
    '3.5': 'bg-teal-500',
    '3': 'bg-blue-500',
    '2.5': 'bg-indigo-500',
    '2': 'bg-violet-500',
    '1.5': 'bg-amber-500',
    '1': 'bg-orange-500',
    '0': 'bg-rose-500',
  };

  const handleExportFullCSV = () => {
    // Generate full CSV export ready for Excel
    const asgHeaders = currentAssignments.map(a => `"${a.title} (${a.unit || 'บททั่วไป'} | ${a.maxScore})"`).join(',');
    const headers = `เลขที่,รหัสประจำตัว,ชื่อ-นามสกุล,${asgHeaders},ก่อนกลางภาค (${currentScoreProportions.preMidterm}),กลางภาค (${currentScoreProportions.midterm}),หลังกลางภาค (${currentScoreProportions.postMidterm}),ปลายภาค (${currentScoreProportions.final}),รวม 100,เกรด,ระดับผลการเรียน`;

    const rows = studentSummaries.map(({ student, assignmentScores, preMidtermScore, midtermScore, postMidtermScore, finalScore, totalScore, grade }) => {
      const asgScores = currentAssignments.map(a => {
        const sc = assignmentScores[a.id]?.score;
        return sc !== null && sc !== undefined ? sc : 0;
      }).join(',');

      return `${student.seatNumber},"${student.studentCode}","${student.prefix}${student.fullName}",${asgScores},${preMidtermScore},${midtermScore},${postMidtermScore},${finalScore},${totalScore},"${grade}","${grade === '4' ? 'ดีเยี่ยม' : grade === '0' ? 'ตกเกณฑ์' : 'ผ่าน'}"`;
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ใบบันทึกผลการเรียนและตัดเกรด_${currentSubject?.code}_${currentClassroom?.name}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveCutoffs = (e: React.FormEvent) => {
    e.preventDefault();
    updateGradeCutoffs(tempCutoffs);
    setShowCutoffsModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Title & Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              สรุปผลการเรียนและตัดเกรดอัตโนมัติ ({currentSubject?.code} ห้อง {currentClassroom?.name})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            คำนวณคะแนนรวมและแปลงระดับผลการเรียน (เกรด 0-4) แบบอัตโนมัติ ลดภาระงานจัดทำเอกสาร ปพ.5
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTempCutoffs(gradeCutoffs);
              setShowCutoffsModal(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            ปรับเกณฑ์ตัดเกรด
          </button>
          <button
            onClick={handleExportFullCSV}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            ดาวน์โหลดสมุดเกรด (CSV)
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">คะแนนเฉลี่ยทั้งห้อง (Mean)</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{classStats.mean}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">จากคะแนนเต็ม 100</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">คะแนนสูงสุด (Max)</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{classStats.max}</div>
          <div className="text-[10px] text-emerald-600/70 mt-0.5">ผลสัมฤทธิ์ดีเด่น</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">คะแนนต่ำสุด (Min)</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{classStats.min}</div>
          <div className="text-[10px] text-rose-600/70 mt-0.5">ต้องได้รับการส่งเสริม</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">อัตราการผ่านเกณฑ์ (≥ 50)</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {studentSummaries.length > 0
              ? Math.round((classStats.passCount / studentSummaries.length) * 100)
              : 0}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            ผ่าน {classStats.passCount} คน / ตก {classStats.failCount} คน
          </div>
        </div>
      </div>

      {/* Grade Distribution Bar Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">การกระจายตัวของระดับผลการเรียน (Grade Distribution)</h3>
          </div>
          <div className="text-xs text-slate-400">
            จำนวนทั้งหมด {studentSummaries.length} คน
          </div>
        </div>

        {/* Visual Bar representation */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2">
          {['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'].map((g) => {
            const count = classStats.gradeCounts[g] || 0;
            const percentage = studentSummaries.length > 0 ? Math.round((count / studentSummaries.length) * 100) : 0;
            const barHeight = Math.max(12, Math.min(100, percentage * 2));

            return (
              <div key={g} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-800">เกรด {g}</span>
                
                {/* Bar */}
                <div className="w-full h-24 bg-slate-200/60 rounded-lg flex items-end p-1 justify-center">
                  <div
                    style={{ height: `${barHeight}%` }}
                    className={`w-full rounded-md transition-all duration-500 ${gradeColors[g]} flex items-center justify-center`}
                  >
                    {count > 0 && (
                      <span className="text-[10px] text-white font-bold">{count}</span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] font-bold text-slate-600">{count} คน</div>
                <div className="text-[10px] text-slate-400">({percentage}%)</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roster Grading Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">ใบบันทึกผลคะแนนและเกรดประจำห้อง</h3>
          <span className="text-xs text-slate-500">เรียงตามลำดับเลขที่</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-14 text-center">เลขที่</th>
                <th className="p-3 w-28 text-center">รหัสนักเรียน</th>
                <th className="p-3">ชื่อ - นามสกุล</th>
                <th className="p-3 text-center bg-blue-50/50 text-blue-900">ก่อนกลาง ({currentScoreProportions.preMidterm})</th>
                <th className="p-3 text-center bg-amber-50/50 text-amber-900">กลางภาค ({currentScoreProportions.midterm})</th>
                <th className="p-3 text-center bg-indigo-50/50 text-indigo-900">หลังกลาง ({currentScoreProportions.postMidterm})</th>
                <th className="p-3 text-center bg-rose-50/50 text-rose-900">ปลายภาค ({currentScoreProportions.final})</th>
                <th className="p-3 text-center font-bold text-indigo-900 bg-indigo-50">รวม 100</th>
                <th className="p-3 text-center font-bold">เกรด</th>
                <th className="p-3 text-center">ความหมาย</th>
                <th className="p-3 text-center">ส่งงาน (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentSummaries.map(({ student, preMidtermScore, midtermScore, postMidtermScore, finalScore, totalScore, grade, completionRate }) => (
                <tr key={student.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3 text-center font-bold text-slate-800">{student.seatNumber}</td>
                  <td className="p-3 text-center font-mono text-slate-600 text-[11px]">{student.studentCode}</td>
                  <td className="p-3 font-semibold text-slate-900">{student.prefix}{student.fullName}</td>
                  <td className="p-3 text-center text-blue-900 font-semibold bg-blue-50/20">{preMidtermScore}</td>
                  <td className="p-3 text-center text-amber-800 font-semibold bg-amber-50/20">{midtermScore}</td>
                  <td className="p-3 text-center text-indigo-900 font-semibold bg-indigo-50/20">{postMidtermScore}</td>
                  <td className="p-3 text-center text-rose-800 font-semibold bg-rose-50/20">{finalScore}</td>
                  <td className="p-3 text-center font-bold text-indigo-700 bg-indigo-50/40 text-sm">{totalScore}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      grade === '4' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      grade === '0' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {grade}
                    </span>
                  </td>
                  <td className="p-3 text-center text-slate-500 text-[11px]">
                    {grade === '4' ? 'ดีเยี่ยม' :
                     grade === '3.5' ? 'ดีมาก' :
                     grade === '3' ? 'ดี' :
                     grade === '2.5' ? 'ค่อนข้างดี' :
                     grade === '2' ? 'ปานกลาง' :
                     grade === '1.5' ? 'พอใช้' :
                     grade === '1' ? 'ผ่านเกณฑ์' : 'ตกเกณฑ์ (0)'}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs font-semibold ${completionRate === 100 ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Cutoffs Setting Modal */}
      {showCutoffsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">ปรับเกณฑ์การตัดเกรด (เกณฑ์มาตรฐานกระทรวงศึกษาธิการ)</h3>
            <p className="text-xs text-slate-500 mt-1">
              แก้ไขช่วงคะแนนขั้นต่ำ (Min Score) ของแต่ละเกรด ระบบจะคำนวณตัดเกรดใหม่ให้อัตโนมัติทันที
            </p>

            <form onSubmit={handleSaveCutoffs} className="mt-4 space-y-2">
              <div className="grid grid-cols-4 text-xs font-bold text-slate-500 pb-1 border-b border-slate-100">
                <span>เกรด</span>
                <span>ช่วงคะแนน</span>
                <span>คะแนนขั้นต่ำ</span>
                <span>ผลการเรียน</span>
              </div>

              {tempCutoffs.map((item, idx) => (
                <div key={item.grade} className="grid grid-cols-4 items-center gap-2 text-xs py-1">
                  <span className="font-bold text-slate-800">{item.grade}</span>
                  <span className="text-slate-500">{item.min} - {item.max}</span>
                  <div>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={item.min}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setTempCutoffs(prev => {
                          const copy = [...prev];
                          copy[idx] = { ...copy[idx], min: val };
                          return copy;
                        });
                      }}
                      className="w-20 px-2 py-1 text-xs border rounded-md border-slate-200 font-bold"
                    />
                  </div>
                  <span className="text-slate-600">{item.label}</span>
                </div>
              ))}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCutoffsModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  บันทึกเกณฑ์ใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Printer, 
  X, 
  FileText, 
  CheckSquare, 
  GraduationCap,
  Award,
  School
} from 'lucide-react';

interface PrintReportModalProps {
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({ onClose }) => {
  const { 
    currentSubject, 
    currentClassroom, 
    currentStudents, 
    currentAssignments, 
    studentSummaries,
    classStats,
    schoolProfile,
    currentScoreProportions
  } = useApp();

  const [printType, setPrintType] = useState<'roster' | 'slips'>('roster');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto font-formal">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header (No Print) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between no-print bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">พิมพ์เอกสารรายงานผลและ ปพ.5</h3>
              <p className="text-xs text-slate-500">เอกสารแบบทางการตามระเบียบกระทรวงศึกษาธิการ พิมพ์ลงกระดาษ A4 ได้ทันที</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setPrintType('roster')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  printType === 'roster' ? 'bg-white text-slate-800 font-bold shadow-2xs' : 'text-slate-600'
                }`}
              >
                ใบบันทึกคะแนน ปพ.5 รายห้อง
              </button>
              <button
                onClick={() => setPrintType('slips')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  printType === 'slips' ? 'bg-white text-slate-800 font-bold shadow-2xs' : 'text-slate-600'
                }`}
              >
                ใบแจ้งผล & งานค้างรายบุคคล
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              สั่งพิมพ์ (Print)
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white font-formal">
          {printType === 'roster' ? (
            /* TYPE 1: Formal Thai School Grade Sheet (ปพ.5 style) */
            <div className="space-y-4 text-black">
              {/* Header */}
              <div className="text-center pb-2 border-b-2 border-black space-y-1">
                <div className="text-sm font-semibold">{schoolProfile.affiliation}</div>
                <h1 className="text-lg font-bold">
                  แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5) • {schoolProfile.name}
                </h1>
                <h2 className="text-sm font-semibold">
                  รายวิชา {currentSubject?.name} (รหัสวิชา {currentSubject?.code}) • {currentSubject?.credit} หน่วยกิต
                </h2>
                <div className="text-xs flex items-center justify-center gap-4 text-slate-700">
                  <span>ระดับชั้น {currentSubject?.gradeLevel} ห้อง {currentClassroom?.name}</span>
                  <span>ภาคเรียนที่ {currentSubject?.term} ปีการศึกษา {currentSubject?.academicYear}</span>
                  <span>จำนวนนักเรียน {currentStudents.length} คน</span>
                </div>
              </div>

              {/* Roster Table */}
              <table className="w-full text-left text-[11px] border-collapse border border-black">
                <thead>
                  <tr className="bg-slate-100 text-center font-bold">
                    <th className="border border-black p-1.5 w-8">ที่</th>
                    <th className="border border-black p-1.5 w-16">รหัส</th>
                    <th className="border border-black p-1.5 text-left pl-2">ชื่อ - สกุล</th>
                    {currentAssignments.map((a, i) => (
                      <th key={a.id} className="border border-black p-1 max-w-[45px] truncate" title={a.title}>
                        <div>ง.{i + 1}</div>
                        <div className="text-[9px] font-normal">({a.maxScore})</div>
                      </th>
                    ))}
                    <th className="border border-black p-1 w-14 bg-blue-50 text-blue-900">
                      <div>ก่อนกลาง</div>
                      <div className="text-[9px] font-normal">({currentScoreProportions.preMidterm})</div>
                    </th>
                    <th className="border border-black p-1 w-12 bg-amber-50 text-amber-900">
                      <div>กลางภาค</div>
                      <div className="text-[9px] font-normal">({currentScoreProportions.midterm})</div>
                    </th>
                    <th className="border border-black p-1 w-14 bg-indigo-50 text-indigo-900">
                      <div>หลังกลาง</div>
                      <div className="text-[9px] font-normal">({currentScoreProportions.postMidterm})</div>
                    </th>
                    <th className="border border-black p-1 w-12 bg-rose-50 text-rose-900">
                      <div>ปลายภาค</div>
                      <div className="text-[9px] font-normal">({currentScoreProportions.final})</div>
                    </th>
                    <th className="border border-black p-1 w-12 font-black bg-slate-200">รวม 100</th>
                    <th className="border border-black p-1 w-10 font-black">เกรด</th>
                  </tr>
                </thead>
                <tbody>
                  {studentSummaries.map(({ student, assignmentScores, preMidtermScore, midtermScore, postMidtermScore, finalScore, totalScore, grade }) => (
                    <tr key={student.id} className="text-center">
                      <td className="border border-black p-1 font-bold">{student.seatNumber}</td>
                      <td className="border border-black p-1 font-mono text-[10px]">{student.studentCode}</td>
                      <td className="border border-black p-1 text-left pl-2 font-medium">
                        {student.prefix}{student.fullName}
                      </td>
                      {currentAssignments.map(a => {
                        const sc = assignmentScores[a.id]?.score;
                        return (
                          <td key={a.id} className="border border-black p-1">
                            {sc !== null && sc !== undefined ? sc : '-'}
                          </td>
                        );
                      })}
                      <td className="border border-black p-1 font-semibold bg-blue-50/40">{preMidtermScore}</td>
                      <td className="border border-black p-1 font-semibold bg-amber-50/40">{midtermScore}</td>
                      <td className="border border-black p-1 font-semibold bg-indigo-50/40">{postMidtermScore}</td>
                      <td className="border border-black p-1 font-semibold bg-rose-50/40">{finalScore}</td>
                      <td className="border border-black p-1 font-bold bg-slate-100">{totalScore}</td>
                      <td className="border border-black p-1 font-black">{grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Assignment Legend */}
              <div className="text-[10px] text-slate-600 pt-1">
                <strong>คำอธิบายชื่องานย่อย:</strong>{' '}
                {currentAssignments.map((a, i) => (
                  <span key={a.id} className="mr-3">
                    ง.{i + 1} = {a.title} ({a.unit || 'บททั่วไป'} | {a.maxScore} คะแนน)
                  </span>
                ))}
              </div>

              {/* Statistics & Signature Block */}
              <div className="pt-4 grid grid-cols-2 gap-8 text-xs">
                <div className="border border-black p-3 rounded text-[11px] space-y-1">
                  <div className="font-bold border-b border-black pb-1">สรุปข้อมูลผลการเรียน</div>
                  <div>คะแนนเฉลี่ย: <strong>{classStats.mean}</strong> | สูงสุด: <strong>{classStats.max}</strong> | ต่ำสุด: <strong>{classStats.min}</strong></div>
                  <div>ผ่านเกณฑ์ (≥50): <strong>{classStats.passCount} คน</strong> | ไม่ผ่านเกณฑ์ (&lt;50): <strong>{classStats.failCount} คน</strong></div>
                  <div className="pt-1 flex gap-2 flex-wrap">
                    {['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'].map(g => (
                      <span key={g}>เกรด {g}: <strong>{classStats.gradeCounts[g] || 0}</strong></span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center text-[11px]">
                  <div className="space-y-6 pt-2">
                    <div>ลงชื่อ......................................................</div>
                    <div>(ครูผู้สอน)</div>
                  </div>
                  <div className="space-y-6 pt-2">
                    <div>ลงชื่อ......................................................</div>
                    <div>({schoolProfile.academicHeadName || 'หัวหน้าฝ่ายวิชาการ/วัดผล'})</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TYPE 2: Individual Student Progress Slips for Parent Meetings */
            <div className="space-y-6 text-black">
              <div className="text-xs text-slate-500 pb-2 border-b border-slate-200 no-print">
                พิมพ์ใบแจ้งผลการเรียนรายบุคคล (สำหรับแจกผู้ปกครองหรือนักเรียนเพื่อติดตามงาน) • {schoolProfile.name}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentSummaries.map(({ student, preMidtermScore, midtermScore, postMidtermScore, finalScore, totalScore, grade, pendingCount }) => (
                  <div key={student.id} className="border border-black p-3 rounded-lg text-xs space-y-2 break-inside-avoid">
                    <div className="flex items-center justify-between border-b border-black pb-1.5">
                      <div>
                        <div className="text-[10px] text-slate-500">{schoolProfile.name}</div>
                        <div className="font-bold text-sm">
                          เลขที่ {student.seatNumber} {student.prefix}{student.fullName}
                        </div>
                        <div className="text-[10px] text-slate-600">
                          รหัส {student.studentCode} • ห้อง {currentClassroom?.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black">เกรด {grade}</div>
                        <div className="text-[10px]">รวม {totalScore}/100</div>
                      </div>
                    </div>

                    <div className="text-[11px]">
                      <strong>วิชา:</strong> {currentSubject?.code} {currentSubject?.name} (เทอม {currentSubject?.term}/{currentSubject?.academicYear})
                    </div>

                    {/* 4 Periods Scores */}
                    <div className="bg-slate-100 p-2 rounded text-[11px] space-y-1">
                      <div className="font-bold mb-1">ผลคะแนนตามสัดส่วน 4 ช่วง:</div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span>ก่อนกลางภาค ({currentScoreProportions.preMidterm}): <strong>{preMidtermScore}</strong></span>
                        <span>กลางภาค ({currentScoreProportions.midterm}): <strong>{midtermScore}</strong></span>
                        <span>หลังกลางภาค ({currentScoreProportions.postMidterm}): <strong>{postMidtermScore}</strong></span>
                        <span>ปลายภาค ({currentScoreProportions.final}): <strong>{finalScore}</strong></span>
                      </div>
                    </div>

                    {/* Pending work warning */}
                    {pendingCount > 0 ? (
                      <div className="text-rose-700 text-[11px] font-bold">
                        ⚠️ มีงานค้างที่ยังไม่ส่ง {pendingCount} รายการ กรุณารีบส่งด่วน
                      </div>
                    ) : (
                      <div className="text-emerald-700 text-[11px] font-semibold">
                        ✅ ส่งงานครบถ้วนเรียบร้อยทุกรายการ
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

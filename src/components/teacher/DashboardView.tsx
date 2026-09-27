import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart3, 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  Filter, 
  Sparkles, 
  TrendingUp, 
  Download, 
  Award, 
  ChevronRight,
  Search,
  School
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    currentSubject,
    currentClassroom,
    currentStudents,
    currentAssignments,
    studentSummaries,
    classStats,
    submissions,
    setActiveTab,
  } = useApp();

  // Multi-criteria filters for Pending Work Tracker Print/View
  const [filterClassroomId, setFilterClassroomId] = useState<string>('all');
  const [filterAssignmentId, setFilterAssignmentId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'pending' | 'late' | 'all'>('pending');
  const [searchStudent, setSearchStudent] = useState<string>('');

  // Overall Submission Rate for this subject
  const totalSubmissionsExpected = currentStudents.length * currentAssignments.length;
  const totalCompletedSubmissions = useMemo(() => {
    let count = 0;
    submissions.forEach(s => {
      if (s.status === 'submitted' || s.status === 'late') {
        const asg = currentAssignments.find(a => a.id === s.assignmentId);
        const std = currentStudents.find(st => st.id === s.studentId);
        if (asg && std) count++;
      }
    });
    return count;
  }, [submissions, currentAssignments, currentStudents]);

  const overallRate = totalSubmissionsExpected > 0 ? Math.round((totalCompletedSubmissions / totalSubmissionsExpected) * 100) : 0;

  // Multi-condition pending tracking items
  const trackedItems = useMemo(() => {
    const list: Array<{
      studentSeat: number;
      studentCode: string;
      studentName: string;
      assignmentTitle: string;
      assignmentCategory: string;
      dueDate: string;
      maxScore: number;
      status: string;
      teacherNote?: string;
    }> = [];

    currentStudents.forEach(std => {
      if (searchStudent.trim()) {
        const q = searchStudent.toLowerCase();
        const match = std.fullName.toLowerCase().includes(q) || std.studentCode.includes(q) || std.seatNumber.toString() === q;
        if (!match) return;
      }

      currentAssignments.forEach(asg => {
        if (filterAssignmentId !== 'all' && asg.id !== filterAssignmentId) return;

        const sub = submissions.find(s => s.assignmentId === asg.id && s.studentId === std.id);
        const status = sub?.status || 'pending';

        if (filterStatus === 'pending' && status !== 'pending') return;
        if (filterStatus === 'late' && status !== 'late') return;
        if (filterStatus === 'all' && (status !== 'pending' && status !== 'late')) return;

        list.push({
          studentSeat: std.seatNumber,
          studentCode: std.studentCode,
          studentName: `${std.prefix}${std.fullName}`,
          assignmentTitle: asg.title,
          assignmentCategory: asg.category,
          dueDate: asg.dueDate,
          maxScore: asg.maxScore,
          status,
          teacherNote: sub?.teacherNote,
        });
      });
    });

    return list.sort((a, b) => a.studentSeat - b.studentSeat);
  }, [currentStudents, currentAssignments, submissions, searchStudent, filterAssignmentId, filterStatus]);

  const handlePrintTracker = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Top Welcome & KPI Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20">
                {currentSubject?.code || 'รายวิชา'}
              </span>
              <span className="text-xs text-indigo-200">
                ห้อง {currentClassroom?.name} • ภาคเรียนที่ {currentSubject?.term}/{currentSubject?.academicYear}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
              Dashboard ภาพรวมผลการเรียนและการส่งงาน
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 mt-0.5">
              ศูนย์รวมข้อมูลสถิติ สรุปคะแนน และตารางติดตามทวงงานแบบหลายเงื่อนไข
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('check_submissions')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
            >
              เช็คสถานะส่งงาน
            </button>
            <button
              onClick={() => setActiveTab('enter_scores')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
            >
              กรอกคะแนน ปพ.5
            </button>
          </div>
        </div>

        {/* 4 Cards Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-slate-300">นักเรียนทั้งหมด</div>
            <div className="text-2xl font-black mt-0.5">{currentStudents.length} <span className="text-xs font-normal text-slate-400">คน</span></div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-slate-300">ภาระงาน/สอบ</div>
            <div className="text-2xl font-black mt-0.5">{currentAssignments.length} <span className="text-xs font-normal text-slate-400">รายการ</span></div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-slate-300">อัตราการส่งงานรวม</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{overallRate}%</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-[11px] text-slate-300">คะแนนเฉลี่ยห้อง (Mean)</div>
            <div className="text-2xl font-black text-amber-300 mt-0.5">{classStats.mean} <span className="text-xs font-normal text-slate-400">/ 100</span></div>
          </div>
        </div>
      </div>

      {/* MULTI-CRITERIA PENDING WORK TRACKER & PRINT SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ตารางติดตามทวงงานค้าง (เลือกดู & สั่งพิมพ์ได้หลายเงื่อนไข)
              </h2>
              <p className="text-xs text-slate-500">กรองตามภาระงาน สถานะ หรือค้นหารายชื่อ เพื่อพิมพ์ใบติดตามงานแจกนักเรียน</p>
            </div>
          </div>

          <button
            onClick={handlePrintTracker}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer self-start md:self-auto"
          >
            <Printer className="w-3.5 h-3.5" />
            พิมพ์ตารางติดตามทวงงาน
          </button>
        </div>

        {/* Multi-Condition Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          {/* Filter 1: By Assignment */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">เลือกภาระงาน / สอบ:</label>
            <select
              value={filterAssignmentId}
              onChange={(e) => setFilterAssignmentId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">ทุกภาระงาน ({currentAssignments.length} รายการ)</option>
              {currentAssignments.map(a => (
                <option key={a.id} value={a.id}>{a.title} ({a.category})</option>
              ))}
            </select>
          </div>

          {/* Filter 2: By Status */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">สถานะที่ต้องการติดตาม:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'pending' | 'late' | 'all')}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="pending">เฉพาะยังไม่ส่ง (งานค้าง)</option>
              <option value="late">เฉพาะส่งช้า</option>
              <option value="all">ทั้งงานค้างและส่งช้า</option>
            </select>
          </div>

          {/* Filter 3: Search Student */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">ค้นหานักเรียน:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="เลขที่, รหัส หรือชื่อ..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Tracked Table Result */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-2.5 bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>ผลการค้นหา: พบรายการที่ต้องติดตาม {trackedItems.length} รายการ</span>
            <span className="text-slate-500">วิชา {currentSubject?.code} ห้อง {currentClassroom?.name}</span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 text-center w-12">ที่</th>
                  <th className="p-2.5 text-center w-20">รหัส</th>
                  <th className="p-2.5">ชื่อ - สกุล</th>
                  <th className="p-2.5">ชื่องานที่ค้าง</th>
                  <th className="p-2.5 w-24 text-center">ประเภท</th>
                  <th className="p-2.5 w-24 text-center">กำหนดส่ง</th>
                  <th className="p-2.5 w-24 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trackedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      ไม่พบรายการค้างงานตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  trackedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 text-center font-bold text-slate-800">{item.studentSeat}</td>
                      <td className="p-2.5 text-center font-mono text-[11px] text-slate-600">{item.studentCode}</td>
                      <td className="p-2.5 font-bold text-slate-900">{item.studentName}</td>
                      <td className="p-2.5 text-slate-800 font-medium">{item.assignmentTitle}</td>
                      <td className="p-2.5 text-center text-slate-500 text-[11px]">{item.assignmentCategory}</td>
                      <td className="p-2.5 text-center text-slate-500 text-[11px]">{item.dueDate}</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'pending'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status === 'pending' ? 'ยังไม่ส่ง' : 'ส่งช้า'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

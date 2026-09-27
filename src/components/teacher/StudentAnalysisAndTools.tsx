import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Sparkles, 
  Dices, 
  Shuffle, 
  BarChart2, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  RotateCcw, 
  Copy, 
  Check, 
  Printer, 
  ShieldAlert, 
  Search,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Zap,
  Info,
  RefreshCw,
  FileText,
  X
} from 'lucide-react';
import { Student } from '../../types';

export const StudentAnalysisAndTools: React.FC = () => {
  const { 
    currentSubject, 
    currentClassroom, 
    currentStudents, 
    currentAssignments, 
    studentSummaries, 
    submissions,
    classStats
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'analysis' | 'randomizer' | 'grouping'>('analysis');

  // ==========================================
  // 1. ANALYSIS STATE & CALCULATIONS
  // ==========================================
  const [analysisFilter, setAnalysisFilter] = useState<'all' | 'high' | 'medium' | 'at_risk'>('all');
  const [analysisSearch, setAnalysisSearch] = useState('');

  // Categorize students
  const analyzedStudents = useMemo(() => {
    return studentSummaries.map(summary => {
      const pendingCount = currentAssignments.filter(asg => {
        const sub = submissions.find(s => s.assignmentId === asg.id && s.studentId === summary.student.id);
        return !sub || sub.status === 'pending';
      }).length;

      const completionRate = currentAssignments.length > 0 
        ? Math.round(((currentAssignments.length - pendingCount) / currentAssignments.length) * 100) 
        : 100;

      let tier: 'high' | 'medium' | 'at_risk' = 'medium';
      let tierLabel = 'กลุ่มปานกลาง';
      let tierColor = 'text-blue-700 bg-blue-50 border-blue-200';
      let recommendation = 'ส่งเสริมการทำงานอย่างสม่ำเสมอ พัฒนาทักษะเพิ่มเติม';

      if (summary.gpa >= 3.5 || (summary.totalScore >= 80 && pendingCount === 0)) {
        tier = 'high';
        tierLabel = 'กลุ่มผลสัมฤทธิ์สูง (เก่ง)';
        tierColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
        recommendation = 'ส่งเสริมงานขั้นสูง ท้าทายความคิด และให้เป็นพี่เลี้ยงช่วยเพื่อนในกลุ่ม';
      } else if (summary.gpa < 1.5 || pendingCount >= 2 || (summary.totalScore < 50 && currentAssignments.length > 2)) {
        tier = 'at_risk';
        tierLabel = 'กลุ่มเฝ้าระวัง / เสี่ยงติด 0 ร มส';
        tierColor = 'text-rose-700 bg-rose-50 border-rose-200';
        recommendation = 'ต้องติดตามงานค้างเร่งด่วน และสอนเสริมเป็นรายบุคคลก่อนสอบ';
      }

      return {
        ...summary,
        pendingCount,
        completionRate,
        tier,
        tierLabel,
        tierColor,
        recommendation
      };
    });
  }, [studentSummaries, currentAssignments, submissions]);

  const filteredAnalyzedStudents = useMemo(() => {
    return analyzedStudents.filter(item => {
      if (analysisFilter !== 'all' && item.tier !== analysisFilter) return false;
      if (analysisSearch.trim()) {
        const q = analysisSearch.toLowerCase();
        return (
          item.student.fullName.toLowerCase().includes(q) ||
          item.student.studentCode.includes(q) ||
          item.student.seatNumber.toString() === q
        );
      }
      return true;
    });
  }, [analyzedStudents, analysisFilter, analysisSearch]);

  const tierCounts = useMemo(() => {
    const high = analyzedStudents.filter(s => s.tier === 'high').length;
    const medium = analyzedStudents.filter(s => s.tier === 'medium').length;
    const atRisk = analyzedStudents.filter(s => s.tier === 'at_risk').length;
    return { high, medium, atRisk };
  }, [analyzedStudents]);

  // AI State: Class Diagnostic & Remedial Plan
  const [isClassAiLoading, setIsClassAiLoading] = useState(false);
  const [classAiResult, setClassAiResult] = useState<any>(null);
  const [showClassAiModal, setShowClassAiModal] = useState(false);

  // AI State: Individual Student Comment
  const [isStudentCommentLoading, setIsStudentCommentLoading] = useState(false);
  const [selectedStudentForComment, setSelectedStudentForComment] = useState<any>(null);
  const [generatedComment, setGeneratedComment] = useState<string>('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [isCommentCopied, setIsCommentCopied] = useState(false);

  const handleAnalyzeClassAi = async () => {
    setIsClassAiLoading(true);
    setShowClassAiModal(true);
    try {
      const atRiskList = analyzedStudents
        .filter(s => s.tier === 'at_risk')
        .map(s => ({
          name: `${s.student.prefix}${s.student.fullName}`,
          seat: s.student.seatNumber,
          score: s.totalScore,
          pending: s.pendingCount,
        }));

      const pendingMap: Record<string, number> = {};
      submissions.forEach(sub => {
        if (sub.status === 'pending') {
          const asg = currentAssignments.find(a => a.id === sub.assignmentId);
          if (asg) {
            pendingMap[asg.title] = (pendingMap[asg.title] || 0) + 1;
          }
        }
      });

      const res = await fetch('/api/gemini/analyze-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: currentSubject?.name || 'วิชาทั่วไป',
          className: currentClassroom?.name || 'ห้องเรียน',
          totalStudents: currentStudents.length,
          passCount: classStats.passCount,
          failCount: classStats.failCount,
          meanScore: classStats.mean,
          atRiskStudents: atRiskList,
          pendingAssignments: Object.entries(pendingMap).map(([title, count]) => ({ title, missingCount: count })),
        }),
      });

      if (!res.ok) throw new Error('AI failed');
      const data = await res.json();
      setClassAiResult(data);
    } catch {
      setClassAiResult({
        summary: 'ไม่สามารถติดต่อ AI ได้ในขณะนี้ กรุณาตรวจสอบอินเทอร์เน็ต',
        rootCauses: ['การเชื่อมต่อเครือข่ายขัดข้อง'],
        recommendedInterventions: [],
        quickTips: [],
      });
    } finally {
      setIsClassAiLoading(false);
    }
  };

  const handleGenerateStudentComment = async (summaryItem: any) => {
    setSelectedStudentForComment(summaryItem);
    setIsStudentCommentLoading(true);
    setGeneratedComment('');
    setShowCommentModal(true);
    setIsCommentCopied(false);

    try {
      const res = await fetch('/api/gemini/generate-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: `${summaryItem.student.prefix}${summaryItem.student.fullName}`,
          seatNumber: summaryItem.student.seatNumber,
          studentCode: summaryItem.student.studentCode,
          grade: summaryItem.grade,
          totalScore: summaryItem.totalScore,
          completionRate: summaryItem.completionRate,
          pendingCount: summaryItem.pendingCount,
          periodScores: {
            preMidterm: summaryItem.preMidtermScore,
            midterm: summaryItem.midtermScore,
            postMidterm: summaryItem.postMidtermScore,
            final: summaryItem.finalScore,
          },
        }),
      });

      if (!res.ok) throw new Error('AI comment failed');
      const data = await res.json();
      setGeneratedComment(data.comment || 'ไม่มีการตอบกลับ');
    } catch {
      setGeneratedComment('เกิดข้อผิดพลาดในการสร้างความเห็นด้วย AI กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsStudentCommentLoading(false);
    }
  };

  // ==========================================
  // 2. RANDOMIZER STATE & LOGIC (NO REPETITION!)
  // ==========================================
  const [pickedHistory, setPickedHistory] = useState<Student[]>([]);
  const [currentlyPicked, setCurrentlyPicked] = useState<Student | null>(null);
  const [isPickingAnimation, setIsPickingAnimation] = useState(false);
  const [animatedName, setAnimatedName] = useState<string>('');

  // Remaining students who haven't been picked yet
  const remainingStudents = useMemo(() => {
    const pickedIds = new Set(pickedHistory.map(s => s.id));
    return currentStudents.filter(s => !pickedIds.has(s.id));
  }, [currentStudents, pickedHistory]);

  const handlePickStudent = () => {
    if (remainingStudents.length === 0) {
      alert('นักเรียนทุกคนในห้องถูกสุ่มครบแล้ว! กดปุ่ม "เริ่มรอบใหม่" เพื่อรีเซ็ตประวัติ');
      return;
    }

    setIsPickingAnimation(true);
    let counter = 0;
    const interval = setInterval(() => {
      const randIdx = Math.floor(Math.random() * remainingStudents.length);
      setAnimatedName(`เลขที่ ${remainingStudents[randIdx].seatNumber} ${remainingStudents[randIdx].prefix}${remainingStudents[randIdx].fullName}`);
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        const finalIdx = Math.floor(Math.random() * remainingStudents.length);
        const selected = remainingStudents[finalIdx];
        setCurrentlyPicked(selected);
        setPickedHistory(prev => [selected, ...prev]);
        setIsPickingAnimation(false);
      }
    }, 80);
  };

  const handleResetHistory = () => {
    if (pickedHistory.length === 0) return;
    if (window.confirm('คุณต้องการรีเซ็ตประวัติการสุ่มทั้งหมดเพื่อเริ่มรอบใหม่ใช่หรือไม่?')) {
      setPickedHistory([]);
      setCurrentlyPicked(null);
    }
  };

  // ==========================================
  // 3. GROUPING STATE & LOGIC (HETEROGENEOUS)
  // ==========================================
  const [groupingType, setGroupingType] = useState<'heterogeneous' | 'random'>('heterogeneous');
  const [groupCountMode, setGroupCountMode] = useState<'byGroupCount' | 'byMemberCount'>('byGroupCount');
  const [groupCountValue, setGroupCountValue] = useState<number>(4);
  const [generatedGroups, setGeneratedGroups] = useState<Array<{
    groupId: number;
    name: string;
    members: Array<Student & { tier: 'high' | 'medium' | 'at_risk'; score: number }>;
  }>>([]);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerateGroups = () => {
    if (currentStudents.length === 0) {
      alert('ไม่มีข้อมูลนักเรียนในห้องนี้');
      return;
    }

    let numGroups = 4;
    if (groupCountMode === 'byGroupCount') {
      numGroups = Math.max(1, Math.min(groupCountValue, currentStudents.length));
    } else {
      const perGroup = Math.max(1, groupCountValue);
      numGroups = Math.max(1, Math.ceil(currentStudents.length / perGroup));
    }

    // Build enriched student list with scores
    const enriched = currentStudents.map(std => {
      const summary = analyzedStudents.find(a => a.student.id === std.id);
      return {
        ...std,
        tier: summary?.tier || 'medium',
        score: summary?.totalScore || 0,
      };
    });

    const groups: Array<{
      groupId: number;
      name: string;
      members: Array<Student & { tier: 'high' | 'medium' | 'at_risk'; score: number }>;
    }> = Array.from({ length: numGroups }, (_, i) => ({
      groupId: i + 1,
      name: `กลุ่มที่ ${i + 1}`,
      members: [],
    }));

    if (groupingType === 'heterogeneous') {
      // Sort by score descending
      enriched.sort((a, b) => b.score - a.score);
      // Snake / serpentine distribution for balanced heterogeneity
      let groupIndex = 0;
      let direction = 1;
      for (const student of enriched) {
        groups[groupIndex].members.push(student);
        groupIndex += direction;
        if (groupIndex >= numGroups) {
          groupIndex = numGroups - 1;
          direction = -1;
        } else if (groupIndex < 0) {
          groupIndex = 0;
          direction = 1;
        }
      }
    } else {
      // Shuffled random distribution
      const shuffled = [...enriched].sort(() => Math.random() - 0.5);
      shuffled.forEach((student, index) => {
        const targetGroup = index % numGroups;
        groups[targetGroup].members.push(student);
      });
    }

    // Sort members in each group by seatNumber
    groups.forEach(g => {
      g.members.sort((a, b) => a.seatNumber - b.seatNumber);
    });

    setGeneratedGroups(groups);
  };

  const handleCopyGroups = () => {
    if (generatedGroups.length === 0) return;
    let text = `📋 รายชื่อการจัดกลุ่มนักเรียน ห้อง ${currentClassroom?.name || ''} - วิชา ${currentSubject?.name || ''}\n`;
    text += `วิธีการจัด: ${groupingType === 'heterogeneous' ? 'คละความสามารถ (เก่ง-กลาง-อ่อน)' : 'สุ่มคละสมดุล'}\n`;
    text += `------------------------------------\n`;

    generatedGroups.forEach(g => {
      text += `\n🏷️ ${g.name} (${g.members.length} คน):\n`;
      g.members.forEach((m, idx) => {
        text += `  ${idx + 1}. เลขที่ ${m.seatNumber} ${m.prefix}${m.fullName}\n`;
      });
    });

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handlePrintGroups = () => {
    window.print();
  };

  return (
    <div className="space-y-5 font-formal">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: currentSubject?.color || '#4F46E5' }} />
            <h2 className="text-lg font-bold text-slate-900">
              เครื่องมือช่วยสอน: วิเคราะห์นักเรียน • สุ่มเรียก • จัดกลุ่มคละความสามารถ
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            วิชา {currentSubject?.code} {currentSubject?.name} • ห้อง {currentClassroom?.name || 'ม.2/1'} ({currentStudents.length} คน)
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 no-print self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('analysis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeSubTab === 'analysis'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            วิเคราะห์นักเรียน
          </button>
          <button
            onClick={() => setActiveSubTab('randomizer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeSubTab === 'randomizer'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Dices className="w-4 h-4" />
            สุ่มนักเรียน (ไม่ซ้ำ)
          </button>
          <button
            onClick={() => setActiveSubTab('grouping')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeSubTab === 'grouping'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            จัดกลุ่มคละนักเรียน
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 1. STUDENT ANALYSIS SUB-TAB */}
      {/* =================================================================== */}
      {activeSubTab === 'analysis' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div 
              onClick={() => setAnalysisFilter(analysisFilter === 'high' ? 'all' : 'high')}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                analysisFilter === 'high' ? 'ring-2 ring-emerald-500 bg-emerald-50/60' : 'bg-white hover:bg-slate-50'
              } border-emerald-200`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">กลุ่มผลสัมฤทธิ์สูง (เก่ง)</span>
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-2">
                {tierCounts.high} <span className="text-xs font-normal text-emerald-700">คน</span>
              </div>
              <p className="text-[11px] text-emerald-600 mt-1">
                เกรด 3.5 - 4.0 หรือส่งงานครบ 100%
              </p>
            </div>

            <div 
              onClick={() => setAnalysisFilter(analysisFilter === 'medium' ? 'all' : 'medium')}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                analysisFilter === 'medium' ? 'ring-2 ring-blue-500 bg-blue-50/60' : 'bg-white hover:bg-slate-50'
              } border-blue-200`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800">กลุ่มปานกลาง</span>
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-900 mt-2">
                {tierCounts.medium} <span className="text-xs font-normal text-blue-700">คน</span>
              </div>
              <p className="text-[11px] text-blue-600 mt-1">
                ผลการเรียนระดับกลาง มีงานค้างเล็กน้อย
              </p>
            </div>

            <div 
              onClick={() => setAnalysisFilter(analysisFilter === 'at_risk' ? 'all' : 'at_risk')}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                analysisFilter === 'at_risk' ? 'ring-2 ring-rose-500 bg-rose-50/60' : 'bg-white hover:bg-slate-50'
              } border-rose-200`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800">กลุ่มเฝ้าระวัง / ช่วยเหลือ</span>
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-900 mt-2">
                {tierCounts.atRisk} <span className="text-xs font-normal text-rose-700">คน</span>
              </div>
              <p className="text-[11px] text-rose-600 mt-1">
                งานค้างตั้งแต่ 2 ชิ้นขึ้นไป หรือเกรด &lt; 1.5
              </p>
            </div>
          </div>

          {/* Table of Analyzed Students */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  ตารางจำแนกและวิเคราะห์นักเรียนรายบุคคล ({filteredAnalyzedStudents.length} คน)
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleAnalyzeClassAi}
                  className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shadow-indigo-100"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI วินิจฉัย & แผนซ่อมเสริมทั้งห้อง</span>
                </button>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={analysisSearch}
                    onChange={(e) => setAnalysisSearch(e.target.value)}
                    placeholder="ค้นหาชื่อ / เลขที่..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {analysisFilter !== 'all' && (
                  <button
                    onClick={() => setAnalysisFilter('all')}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
            </div>

            {filteredAnalyzedStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                ไม่พบข้อมูลนักเรียนตามเงื่อนไขที่เลือก
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">เลขที่</th>
                      <th className="py-2.5 px-3 w-24">รหัส</th>
                      <th className="py-2.5 px-3">ชื่อ - สกุล</th>
                      <th className="py-2.5 px-3 text-center">กลุ่มผลสัมฤทธิ์</th>
                      <th className="py-2.5 px-3 text-center">งานค้าง</th>
                      <th className="py-2.5 px-3 text-center">ส่งงาน (%)</th>
                      <th className="py-2.5 px-3 text-center">คะแนนรวม</th>
                      <th className="py-2.5 px-3 text-center">เกรด</th>
                      <th className="py-2.5 px-3">แนวทางส่งเสริม / ช่วยเหลือ</th>
                      <th className="py-2.5 px-3 text-center">AI ความเห็น ปพ.5</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAnalyzedStudents.map((item) => (
                      <tr key={item.student.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                          {item.student.seatNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                          {item.student.studentCode}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {item.student.prefix}{item.student.fullName}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${item.tierColor}`}>
                            {item.tierLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.pendingCount > 0 ? (
                            <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              ค้าง {item.pendingCount} งาน
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold flex items-center justify-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              ครบ
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-slate-700">{item.completionRate}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-indigo-900">
                          {item.totalScore}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-black text-xs ${
                            item.gpa >= 3 ? 'bg-emerald-100 text-emerald-800' :
                            item.gpa >= 2 ? 'bg-blue-100 text-blue-800' :
                            item.gpa >= 1 ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {item.grade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                          {item.recommendation}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleGenerateStudentComment(item)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg border border-indigo-200 transition flex items-center gap-1 mx-auto cursor-pointer shadow-2xs"
                            title="สร้างความคิดเห็น ปพ.5 ด้วย AI"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            <span>เขียน ปพ.5</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. RANDOMIZER SUB-TAB (WITHOUT REPETITION!) */}
      {/* =================================================================== */}
      {activeSubTab === 'randomizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Pick Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[320px]">
              {/* Status Tracker */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-indigo-200">
                <span className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs font-semibold">
                  ห้อง {currentClassroom?.name || 'ม.2/1'} ({currentStudents.length} คน)
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full font-bold">
                  สุ่มแล้ว {pickedHistory.length} / {currentStudents.length} คน (เหลืออีก {remainingStudents.length} คน)
                </span>
              </div>

              {/* Center Display */}
              <div className="my-8 w-full max-w-md">
                {isPickingAnimation ? (
                  <div className="animate-pulse space-y-2">
                    <div className="text-4xl sm:text-5xl font-black text-amber-300 tracking-wider">
                      {animatedName}
                    </div>
                    <p className="text-indigo-200 text-sm">กำลังสุ่มรายชื่อ...</p>
                  </div>
                ) : currentlyPicked ? (
                  <div className="animate-scaleUp space-y-3 bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/20">
                    <div className="text-xs uppercase tracking-widest text-indigo-200 font-bold">
                      ผู้โชคดีที่ถูกสุ่ม
                    </div>
                    <div className="text-4xl sm:text-5xl font-black text-amber-300">
                      เลขที่ {currentlyPicked.seatNumber}
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {currentlyPicked.prefix}{currentlyPicked.fullName}
                    </div>
                    <div className="text-xs text-indigo-200 font-mono">
                      รหัสนักเรียน: {currentlyPicked.studentCode}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Dices className="w-16 h-16 text-indigo-300 mx-auto opacity-75" />
                    <div className="text-2xl font-bold text-white">พร้อมสุ่มนักเรียน</div>
                    <p className="text-xs text-indigo-200 max-w-sm mx-auto">
                      ระบบจะสุ่มโดยไม่ซ้ำกับคนที่เคยสุ่มแล้ว จนกว่าจะสุ่มครบทุกคนในห้อง
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <button
                  onClick={handlePickStudent}
                  disabled={isPickingAnimation || remainingStudents.length === 0}
                  className={`px-8 py-3.5 rounded-2xl font-bold text-base shadow-lg transition flex items-center gap-2 cursor-pointer ${
                    remainingStudents.length === 0
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-indigo-950 shadow-amber-500/20 active:scale-95'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>
                    {remainingStudents.length === 0 ? 'สุ่มครบทุกคนแล้ว' : 'กดเพื่อสุ่มนักเรียนคนถัดไป'}
                  </span>
                </button>

                {pickedHistory.length > 0 && (
                  <button
                    onClick={handleResetHistory}
                    disabled={isPickingAnimation}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                    title="เริ่มรอบใหม่ ล้างประวัติการสุ่ม"
                  >
                    <RotateCcw className="w-4 h-4" />
                    เริ่มรอบใหม่
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pick History Sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  ประวัติการสุ่ม (ไม่ซ้ำ)
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                  {pickedHistory.length} คน
                </span>
              </div>
              {pickedHistory.length > 0 && (
                <button
                  onClick={handleResetHistory}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  ล้างประวัติ
                </button>
              )}
            </div>

            {pickedHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                ยังไม่มีการสุ่มในรอบนี้ กดปุ่ม &quot;สุ่มนักเรียน&quot; เพื่อเริ่มต้น
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {pickedHistory.map((student, idx) => (
                  <div
                    key={student.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                        {pickedHistory.length - idx}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">
                          เลขที่ {student.seatNumber} {student.prefix}{student.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {student.studentCode}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. GROUPING SUB-TAB (HETEROGENEOUS) */}
      {/* =================================================================== */}
      {activeSubTab === 'grouping' && (
        <div className="space-y-4">
          {/* Group Settings Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4 no-print">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              กำหนดเงื่อนไขการจัดกลุ่มนักเรียน (คละนักเรียน)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รูปแบบการจัดกลุ่ม
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGroupingType('heterogeneous')}
                    className={`p-2.5 text-xs font-bold rounded-xl border text-left transition cursor-pointer ${
                      groupingType === 'heterogeneous'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>🌟 คละความสามารถ</div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">เก่ง-กลาง-อ่อน เท่าเทียมกัน</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGroupingType('random')}
                    className={`p-2.5 text-xs font-bold rounded-xl border text-left transition cursor-pointer ${
                      groupingType === 'random'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>🎲 สุ่มคละสมดุล</div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">สุ่มกระจายรายชื่อเท่าๆ กัน</div>
                  </button>
                </div>
              </div>

              {/* Mode: By Group Count or By Member Count */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  เกณฑ์การแบ่งกลุ่ม
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGroupCountMode('byGroupCount')}
                    className={`p-2.5 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                      groupCountMode === 'byGroupCount'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    กำหนดจำนวนกลุ่ม
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupCountMode('byMemberCount')}
                    className={`p-2.5 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                      groupCountMode === 'byMemberCount'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    กำหนดคนต่อกลุ่ม
                  </button>
                </div>
              </div>

              {/* Input Value */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {groupCountMode === 'byGroupCount' ? 'ต้องการแบ่งเป็น (กลุ่ม)' : 'จำนวนคนต่อกลุ่ม (คน)'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={currentStudents.length || 50}
                    value={groupCountValue}
                    onChange={(e) => setGroupCountValue(parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateGroups}
                    className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Shuffle className="w-4 h-4" />
                    สร้างกลุ่มคละนักเรียนเดี๋ยวนี้
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Groups Display */}
          {generatedGroups.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 no-print">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    ผลการจัดกลุ่ม ({generatedGroups.length} กลุ่ม • รวม {currentStudents.length} คน)
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {groupingType === 'heterogeneous' ? 'คละความสามารถ เก่ง-กลาง-อ่อน' : 'สุ่มคละสมดุล'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyGroups}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'คัดลอกเรียบร้อย' : 'คัดลอกรายชื่อกลุ่ม'}</span>
                  </button>

                  <button
                    onClick={handlePrintGroups}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    <span>พิมพ์ใบรายชื่อกลุ่ม</span>
                  </button>
                </div>
              </div>

              {/* Group Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {generatedGroups.map((grp) => (
                  <div
                    key={grp.groupId}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col"
                  >
                    <div className="bg-gradient-to-r from-slate-800 to-indigo-900 px-4 py-3 text-white flex items-center justify-between">
                      <div className="font-bold text-sm">{grp.name}</div>
                      <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                        {grp.members.length} คน
                      </span>
                    </div>

                    <div className="p-3 divide-y divide-slate-100 flex-1">
                      {grp.members.map((m, idx) => (
                        <div key={m.id} className="py-2 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {idx + 1}
                            </span>
                            <div className="truncate">
                              <span className="font-bold text-slate-900 mr-1.5">
                                #{m.seatNumber}
                              </span>
                              <span className="text-slate-700">
                                {m.prefix}{m.fullName}
                              </span>
                            </div>
                          </div>

                          {groupingType === 'heterogeneous' && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              m.tier === 'high' ? 'bg-emerald-100 text-emerald-800' :
                              m.tier === 'medium' ? 'bg-blue-100 text-blue-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {m.tier === 'high' ? 'เก่ง' : m.tier === 'medium' ? 'กลาง' : 'อ่อน'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. MODAL: AI CLASS DIAGNOSTIC & REMEDIAL PLAN */}
      {/* =================================================================== */}
      {showClassAiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    AI วินิจฉัยผลสัมฤทธิ์ทางการเรียน & แผนช่วยเหลือซ่อมเสริม
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ห้อง {currentClassroom?.name} • วิชา {currentSubject?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowClassAiModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isClassAiLoading ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-700">กำลังวิเคราะห์ข้อมูลชั้นเรียนด้วย Gemini AI...</p>
                <p className="text-[11px] text-slate-400">ประมวลผลงานค้าง คะแนน 4 ช่วง และแนวโน้มผลสัมฤทธิ์</p>
              </div>
            ) : classAiResult ? (
              <div className="space-y-4 mt-4 text-xs">
                {/* Summary */}
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                  <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>บทวิเคราะห์ภาพรวมชั้นเรียน:</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">
                    {classAiResult.summary}
                  </p>
                </div>

                {/* Root Causes */}
                {Array.isArray(classAiResult.rootCauses) && classAiResult.rootCauses.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1.5">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>ข้อสังเกตและสาเหตุของปัญหา:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                      {classAiResult.rootCauses.map((cause: string, i: number) => (
                        <li key={i}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Interventions */}
                {Array.isArray(classAiResult.recommendedInterventions) && (
                  <div className="space-y-2">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-600" />
                      <span>แผนการสอนซ่อมเสริมและยกระดับผลสัมฤทธิ์ (Action Plan):</span>
                    </div>
                    <div className="space-y-2">
                      {classAiResult.recommendedInterventions.map((plan: any, i: number) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="font-bold text-indigo-800 block text-xs">
                            🎯 {plan.targetGroup}
                          </span>
                          <p className="text-slate-700 text-[11px] leading-relaxed">
                            {plan.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Tips */}
                {Array.isArray(classAiResult.quickTips) && classAiResult.quickTips.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                    <span className="font-bold text-emerald-900 block text-xs">💡 ข้อแนะนำด่วนสำหรับคุณครู:</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
                      {classAiResult.quickTips.map((tip: string, i: number) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowClassAiModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. MODAL: AI STUDENT REPORT / ปพ.5 COMMENT */}
      {/* =================================================================== */}
      {showCommentModal && selectedStudentForComment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    AI เขียนความเห็น ปพ.5 / รายงานผู้ปกครอง
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    เลขที่ {selectedStudentForComment.student.seatNumber} {selectedStudentForComment.student.prefix}{selectedStudentForComment.student.fullName} (เกรด {selectedStudentForComment.grade})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCommentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isStudentCommentLoading ? (
              <div className="py-10 text-center space-y-2">
                <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-700">กำลังร่างความคิดเห็นประเมินผลการเรียนรู้...</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-serif text-xs leading-relaxed text-slate-800">
                  &ldquo;{generatedComment}&rdquo;
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    * นำไปวางในเอกสาร ปพ.5 หรือสมุดพกได้ทันที
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedComment);
                      setIsCommentCopied(true);
                      setTimeout(() => setIsCommentCopied(false), 2500);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shadow-indigo-100"
                  >
                    {isCommentCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCommentCopied ? 'คัดลอกเรียบร้อย!' : 'คัดลอกข้อความ'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

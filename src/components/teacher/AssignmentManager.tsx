import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Paperclip, 
  FileUp, 
  Link as LinkIcon, 
  ExternalLink,
  Layers,
  Sparkles,
  Settings,
  X,
  AlertCircle,
  FolderOpen,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Percent,
  RefreshCw
} from 'lucide-react';
import { Assignment, CategoryOption, AssignmentAttachment, EvaluationPeriod } from '../../types';

export const AssignmentManager: React.FC = () => {
  const {
    currentSubject,
    currentAssignments,
    categories,
    addCategory,
    deleteCategory,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    currentScoreProportions
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Period Filter tab
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<'all' | EvaluationPeriod>('all');

  // Form states for assignment
  const [title, setTitle] = useState('');
  const [categoryName, setCategoryName] = useState(() => categories[0]?.name || 'ใบงาน / ชิ้นงาน');
  const [maxScore, setMaxScore] = useState<number>(10);
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [assignedDate, setAssignedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [isExam, setIsExam] = useState<boolean>(false);
  const [attachment, setAttachment] = useState<AssignmentAttachment | undefined>(undefined);
  const [linkInput, setLinkInput] = useState('');

  // Hierarchical: บท -> เรื่อง -> งานย่อย
  const [period, setPeriod] = useState<EvaluationPeriod>('pre_midterm');
  const [unit, setUnit] = useState<string>('บทที่ 1: หน่วยการเรียนรู้ที่ 1');
  const [topic, setTopic] = useState<string>('เรื่องที่ 1: การเรียนรู้พื้นฐาน');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collect distinct existing units & topics in this subject for auto-suggestion
  const existingUnits = useMemo(() => {
    const set = new Set<string>();
    currentAssignments.forEach(a => {
      if (a.unit && a.unit.trim()) set.add(a.unit.trim());
    });
    return Array.from(set);
  }, [currentAssignments]);

  const existingTopics = useMemo(() => {
    const set = new Set<string>();
    currentAssignments.forEach(a => {
      if (a.topic && a.topic.trim()) set.add(a.topic.trim());
    });
    return Array.from(set);
  }, [currentAssignments]);

  const resetForm = () => {
    setTitle('');
    setCategoryName(categories[0]?.name || 'ใบงาน / ชิ้นงาน');
    setMaxScore(10);
    setDueDate(new Date().toISOString().slice(0, 10));
    setAssignedDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setIsExam(false);
    setAttachment(undefined);
    setLinkInput('');
    setPeriod('pre_midterm');
    setUnit(existingUnits[0] || 'บทที่ 1');
    setTopic(existingTopics[0] || 'เรื่องที่ 1');
  };

  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiGenerate = async () => {
    setIsAiGenerating(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/generate-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: currentSubject?.name || 'วิชาทั่วไป',
          gradeLevel: currentSubject?.gradeLevel || 'มัธยมศึกษา',
          topicTitle: topic || unit || 'สาระการเรียนรู้',
          period,
          targetScore: maxScore || 10,
        }),
      });

      if (!res.ok) throw new Error('AI generation failed');
      const data = await res.json();

      if (data.title) setTitle(data.title);
      if (data.suggestedMaxScore) setMaxScore(Number(data.suggestedMaxScore));
      if (data.category) {
        const found = categories.find(c => c.name.toLowerCase().includes(data.category.toLowerCase()));
        if (found) setCategoryName(found.name);
      }

      let fullDesc = data.description || '';
      if (Array.isArray(data.subTasks) && data.subTasks.length > 0) {
        fullDesc += '\n\nภาระงานย่อย:\n' + data.subTasks.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n');
      }
      if (Array.isArray(data.rubric) && data.rubric.length > 0) {
        fullDesc += '\n\nเกณฑ์การประเมิน (Rubric):\n' + data.rubric.map((r: any) => `• ${r.criteria} (${r.score} คะแนน): ${r.description}`).join('\n');
      }
      setDescription(fullDesc);
    } catch {
      setAiError('เกิดข้อผิดพลาดในการเรียกใช้ AI กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (asg: Assignment) => {
    setEditingAssignment(asg);
    setTitle(asg.title);
    setCategoryName(asg.category);
    setMaxScore(asg.maxScore);
    setDueDate(asg.dueDate);
    setAssignedDate(asg.assignedDate);
    setDescription(asg.description || '');
    setIsExam(asg.isExam);
    setAttachment(asg.attachment);
    setLinkInput(asg.attachment?.type === 'link' ? asg.attachment.url : '');
    setPeriod(asg.period || 'pre_midterm');
    setUnit(asg.unit || 'บทที่ 1');
    setTopic(asg.topic || 'เรื่องที่ 1');
    setShowAddModal(true);
  };

  const handleCategorySelect = (selectedName: string) => {
    setCategoryName(selectedName);
    const cat = categories.find(c => c.name === selectedName);
    if (cat) {
      setMaxScore(cat.defaultMaxScore);
      setIsExam(cat.isExam);
      if (selectedName.includes('กลางภาค') || selectedName.includes('Midterm')) {
        setPeriod('midterm');
      } else if (selectedName.includes('ปลายภาค') || selectedName.includes('Final')) {
        setPeriod('final');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 8 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAttachment({
        name: file.name,
        url: dataUrl,
        type: file.type || 'document',
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddLinkAttachment = () => {
    if (!linkInput.trim()) return;
    setAttachment({
      name: linkInput.trim(),
      url: linkInput.trim().startsWith('http') ? linkInput.trim() : `https://${linkInput.trim()}`,
      type: 'link',
    });
    setLinkInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentSubject) return;

    const assignmentData = {
      title: title.trim(),
      category: categoryName,
      maxScore: Number(maxScore),
      dueDate,
      assignedDate,
      description,
      isExam,
      attachment,
      period,
      unit: unit.trim() || 'บทที่ 1',
      topic: topic.trim() || 'เรื่องที่ 1',
    };

    if (editingAssignment) {
      updateAssignment(editingAssignment.id, assignmentData);
      setEditingAssignment(null);
    } else {
      addAssignment({
        subjectId: currentSubject.id,
        ...assignmentData,
      });
    }
    setShowAddModal(false);
    resetForm();
  };

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    if (selectedPeriodFilter === 'all') return currentAssignments;
    return currentAssignments.filter(a => {
      const p = a.period || (a.isExam ? 'midterm' : 'pre_midterm');
      return p === selectedPeriodFilter;
    });
  }, [currentAssignments, selectedPeriodFilter]);

  // Group filtered assignments by Unit -> Topic -> Sub-tasks
  const groupedHierarchy = useMemo(() => {
    const unitMap: Record<string, {
      unitName: string;
      topics: Record<string, Assignment[]>;
      totalRawScore: number;
      period: EvaluationPeriod;
    }> = {};

    filteredAssignments.forEach(asg => {
      const uName = (asg.unit && asg.unit.trim()) ? asg.unit.trim() : 'บทเรียนทั่วไป';
      const tName = (asg.topic && asg.topic.trim()) ? asg.topic.trim() : 'เรื่องทั่วไป';
      const p = asg.period || 'pre_midterm';

      if (!unitMap[uName]) {
        unitMap[uName] = {
          unitName: uName,
          topics: {},
          totalRawScore: 0,
          period: p,
        };
      }

      if (!unitMap[uName].topics[tName]) {
        unitMap[uName].topics[tName] = [];
      }

      unitMap[uName].topics[tName].push(asg);
      unitMap[uName].totalRawScore += asg.maxScore;
    });

    return Object.values(unitMap);
  }, [filteredAssignments]);

  const getPeriodBadge = (p: EvaluationPeriod) => {
    switch (p) {
      case 'pre_midterm':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">ก่อนกลางภาค ({currentScoreProportions.preMidterm}%)</span>;
      case 'midterm':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">กลางภาค ({currentScoreProportions.midterm}%)</span>;
      case 'post_midterm':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">หลังกลางภาค ({currentScoreProportions.postMidterm}%)</span>;
      case 'final':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">ปลายภาค ({currentScoreProportions.final}%)</span>;
    }
  };

  return (
    <div className="space-y-4 font-formal">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              โครงสร้าง บท • เรื่อง • งานย่อย และไฟล์แนบ
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            จัดกลุ่มภาระงานตาม <strong>บท &gt; เรื่อง &gt; งานย่อย</strong> โดยระบบจะคำนวณเฉลี่ยอัตโนมัติตามสัดส่วนช่วงคะแนน (ก่อน/กลาง/หลัง/ปลาย)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างงานย่อยใหม่</span>
          </button>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs text-xs">
        <button
          onClick={() => setSelectedPeriodFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            selectedPeriodFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ทั้งหมด ({currentAssignments.length})
        </button>

        <button
          onClick={() => setSelectedPeriodFilter('pre_midterm')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
            selectedPeriodFilter === 'pre_midterm'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span>ก่อนกลางภาค ({currentScoreProportions.preMidterm} คะแนน)</span>
        </button>

        <button
          onClick={() => setSelectedPeriodFilter('midterm')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
            selectedPeriodFilter === 'midterm'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>กลางภาค ({currentScoreProportions.midterm} คะแนน)</span>
        </button>

        <button
          onClick={() => setSelectedPeriodFilter('post_midterm')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
            selectedPeriodFilter === 'post_midterm'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span>หลังกลางภาค ({currentScoreProportions.postMidterm} คะแนน)</span>
        </button>

        <button
          onClick={() => setSelectedPeriodFilter('final')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
            selectedPeriodFilter === 'final'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span>ปลายภาค ({currentScoreProportions.final} คะแนน)</span>
        </button>
      </div>

      {/* Main Hierarchy List (บท -> เรื่อง -> งานย่อย) */}
      {groupedHierarchy.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">ยังไม่มีภาระงานในหมวดหมู่นี้</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            กดปุ่ม &quot;สร้างงานย่อยใหม่&quot; เพื่อกำหนดบท เรื่อง งานย่อย และคะแนนเก็บ
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            + สร้างงานย่อยชิ้นแรก
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedHierarchy.map((unitGroup, uIdx) => (
            <div key={uIdx} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* UNIT HEADER */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-5 py-3.5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {unitGroup.unitName}
                    </h3>
                    <div className="text-[11px] text-indigo-200 flex items-center gap-2 mt-0.5">
                      <span>คะแนนดิบรวมในบทนี้: <strong>{unitGroup.totalRawScore} คะแนน</strong></span>
                      <span>•</span>
                      <span>เฉลี่ยถ่วงน้ำหนักตามบทเข้าสู่ช่วงประเมินอัตโนมัติ</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getPeriodBadge(unitGroup.period)}
                </div>
              </div>

              {/* TOPICS & SUB-TASKS BODY */}
              <div className="p-4 space-y-4 bg-slate-50/50">
                {Object.entries(unitGroup.topics).map(([topicName, subTasks], tIdx) => (
                  <div key={tIdx} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                    {/* Topic Title */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-emerald-600 shrink-0" />
                        <h4 className="font-bold text-xs text-slate-800">
                          {topicName}
                        </h4>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.2 rounded-full">
                          {subTasks.length} งานย่อย
                        </span>
                      </div>
                    </div>

                    {/* Sub-tasks Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {subTasks.map((asg) => (
                        <div
                          key={asg.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition space-y-2 relative group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                                  {asg.category}
                                </span>
                                {asg.isExam && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                    การสอบ
                                  </span>
                                )}
                              </div>
                              <h5 className="font-bold text-xs text-slate-900 mt-1 leading-snug">
                                {asg.title}
                              </h5>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-base font-black text-indigo-900">
                                {asg.maxScore}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-0.5">คะแนน</span>
                            </div>
                          </div>

                          {asg.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2">
                              {asg.description}
                            </p>
                          )}

                          {/* Attachment Link */}
                          {asg.attachment && (
                            <div className="pt-1">
                              <a
                                href={asg.attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={asg.attachment.name}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200 transition"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span className="truncate max-w-[180px]">{asg.attachment.name}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}

                          {/* Footer Actions */}
                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                            <span>ส่ง: {asg.dueDate}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(asg)}
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-200 rounded transition cursor-pointer"
                                title="แก้ไขงาน"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`คุณแน่ใจว่าต้องการลบงาน "${asg.title}" ใช่หรือไม่?`)) {
                                    deleteAssignment(asg.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="ลบงาน"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT ASSIGNMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>{editingAssignment ? 'แก้ไขงานย่อย' : 'สั่งงานย่อย / สร้างภาระงานใหม่'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* AI Assistant Banner */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI ช่วยออกแบบภาระงานและเกณฑ์รูบริกอัตโนมัติ</span>
                  </div>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    ร่างชื่องาน คำชี้แจง และเกณฑ์รูบริกคะแนนให้สอดคล้องกับบทและสาระที่เลือก
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isAiGenerating}
                  onClick={handleAiGenerate}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-indigo-100"
                >
                  {isAiGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isAiGenerating ? 'กำลังสร้าง...' : 'สร้างด้วย AI'}</span>
                </button>
              </div>

              {aiError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* 1. ช่วงการประเมิน (4 Periods) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="block font-bold text-slate-700">
                  ช่วงการประเมินผล (Evaluation Period) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPeriod('pre_midterm')}
                    className={`py-2 px-2 rounded-lg text-center font-bold transition cursor-pointer border ${
                      period === 'pre_midterm'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ก่อนกลางภาค ({currentScoreProportions.preMidterm}%)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPeriod('midterm')}
                    className={`py-2 px-2 rounded-lg text-center font-bold transition cursor-pointer border ${
                      period === 'midterm'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    กลางภาค ({currentScoreProportions.midterm}%)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPeriod('post_midterm')}
                    className={`py-2 px-2 rounded-lg text-center font-bold transition cursor-pointer border ${
                      period === 'post_midterm'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    หลังกลางภาค ({currentScoreProportions.postMidterm}%)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPeriod('final')}
                    className={`py-2 px-2 rounded-lg text-center font-bold transition cursor-pointer border ${
                      period === 'final'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ปลายภาค ({currentScoreProportions.final}%)
                  </button>
                </div>
              </div>

              {/* 2. บท & เรื่อง (Unit & Topic) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    บทเรียน / หน่วยการเรียนรู้ (Unit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="unit-suggestions"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="เช่น บทที่ 1: ระบบจำนวนจริง"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                  <datalist id="unit-suggestions">
                    {existingUnits.map((u, i) => (
                      <option key={i} value={u} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    เรื่อง / หัวข้อย่อย (Topic)
                  </label>
                  <input
                    type="text"
                    list="topic-suggestions"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="เช่น เรื่องที่ 1: การบวกและลบ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                  <datalist id="topic-suggestions">
                    {existingTopics.map((t, i) => (
                      <option key={i} value={t} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* 3. ชื่องานย่อย (Sub-task title) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ชื่องานย่อย / กิจกรรม (Sub-task Title) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ใบงานที่ 1.1 การหา ค.ร.น. และ ห.ร.ม."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* 4. ประเภทงาน & คะแนนเต็มดิบ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ประเภทภาระงาน
                  </label>
                  <select
                    value={categoryName}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    คะแนนเต็มดิบของงานนี้ (Raw Score)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-center"
                  />
                </div>
              </div>

              {/* 5. กำหนดส่ง & วันที่สั่ง */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    วันที่มอบหมายงาน
                  </label>
                  <input
                    type="date"
                    value={assignedDate}
                    onChange={(e) => setAssignedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    กำหนดส่งงาน (Due Date)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* 6. คำอธิบายเพิ่มเติม */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  คำอธิบายหรือคำชี้แจงสำหรับนักเรียน
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="เขียนคำชี้แจงสั้นๆ เช่น ให้นักเรียนทำลงสมุด หรือส่งเป็นไฟล์ PDF..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              {/* 7. แนบไฟล์ใบงาน / รูปภาพ / ลิงก์ */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="block font-bold text-slate-700">
                  แนบไฟล์ใบงาน หรือเอกสารประกอบ (นักเรียนดาวน์โหลดได้)
                </label>

                {attachment ? (
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-indigo-200">
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate font-semibold text-slate-800">{attachment.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachment(undefined)}
                      className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileUp className="w-3.5 h-3.5 text-indigo-600" />
                        <span>อัปโหลดไฟล์ (PDF/ภาพ/เอกสาร)</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        placeholder="หรือวางลิงก์ เช่น Google Drive, Canva, YouTube"
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddLinkAttachment}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer"
                      >
                        แนบลิงก์
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer shadow-indigo-100"
                >
                  {editingAssignment ? 'บันทึกการแก้ไข' : 'บันทึกและสั่งงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

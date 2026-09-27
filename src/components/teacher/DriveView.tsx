import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DriveResource, DriveResourceType, WorksheetData, WorksheetQuestion } from '../../types';
import {
  FolderGit2,
  Plus,
  Sparkles,
  FileText,
  FileCode,
  Video,
  Presentation,
  CheckSquare,
  Globe,
  Upload,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  Share2,
  Printer,
  BookOpen,
  Layers,
  ArrowRight,
  ExternalLink,
  Award,
  HelpCircle,
  Lock,
  CheckCircle2,
} from 'lucide-react';

export const DriveView: React.FC = () => {
  const {
    currentSubject,
    currentClassroom,
    classrooms,
    currentDriveResources,
    addDriveResource,
    updateDriveResource,
    deleteDriveResource,
    addAssignment,
    schoolProfile,
    setActiveTab,
  } = useApp();

  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAiWorksheetModal, setShowAiWorksheetModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewWorksheet, setPreviewWorksheet] = useState<WorksheetData | null>(null);
  const [activePreviewResource, setActivePreviewResource] = useState<DriveResource | null>(null);

  // AI Worksheet Form states
  const [aiUnitTitle, setAiUnitTitle] = useState('');
  const [aiTopicTitle, setAiTopicTitle] = useState('');
  const [aiTargetClassroomId, setAiTargetClassroomId] = useState<string>(() => currentClassroom?.id || '');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Manual Upload / Add Link Form states
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<DriveResourceType>('worksheet');
  const [newClassroomId, setNewClassroomId] = useState<string>(() => currentClassroom?.id || '');
  const [newUnit, setNewUnit] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [isPublicToStudents, setIsPublicToStudents] = useState(true);

  // Download worksheet as clean text / printable format
  const handleDownloadWorksheet = (worksheet: WorksheetData, targetRoomName?: string) => {
    const textContent = `=======================================================
${schoolProfile.name || 'โรงเรียน'}
${worksheet.title}
รายวิชา: ${worksheet.subjectName} ระดับชั้น: ${worksheet.gradeLevel}
ห้องเรียน: ${targetRoomName || currentClassroom?.name || ''}
=======================================================

คำชี้แจง:
${worksheet.instructions}

${worksheet.conceptSummary ? `💡 สรุปสาระสำคัญ:\n${worksheet.conceptSummary}\n\n` : ''}${worksheet.objectives && worksheet.objectives.length > 0 ? `จุดประสงค์การเรียนรู้:\n${worksheet.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n` : ''}-------------------------------------------------------
คำถามและแบบฝึกหัด:
-------------------------------------------------------
${worksheet.questions.map((q, idx) => {
  let qText = `ข้อที่ ${idx + 1}: ${q.question} (${q.points || 1} คะแนน)\n`;
  if (q.options && q.options.length > 0) {
    qText += q.options.map(opt => `   ${opt}`).join('\n') + '\n';
  } else {
    qText += '   ตอบ: __________________________________________________\n';
  }
  return qText;
}).join('\n')}
=======================================================
เฉลยและแนวการตอบสำหรับครูผู้สอน:
=======================================================
${worksheet.questions.map((q, idx) => `ข้อ ${idx + 1}: ${q.correctAnswer || '-'}\n`).join('')}
${worksheet.answerKeyGuide ? `คำแนะนำครู: ${worksheet.answerKeyGuide}\n` : ''}
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${worksheet.title.replace(/[\/\\?%*:|"<>]/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered resources by Subject, Type, and Classroom
  const filteredResources = useMemo(() => {
    return currentDriveResources.filter(res => {
      const matchType = activeTypeFilter === 'all' || res.type === activeTypeFilter;
      const matchRoom = selectedRoomFilter === 'all' || !res.classroomId || res.classroomId === selectedRoomFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        res.title.toLowerCase().includes(q) ||
        (res.unit || '').toLowerCase().includes(q) ||
        (res.description || '').toLowerCase().includes(q);
      return matchType && matchRoom && matchSearch;
    });
  }, [currentDriveResources, activeTypeFilter, selectedRoomFilter, searchQuery]);

  // AI Worksheet Generator Handler
  const handleGenerateAiWorksheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopicTitle.trim()) {
      alert('กรุณาระบุหัวข้อเรื่องของใบงาน');
      return;
    }

    try {
      setIsAiGenerating(true);
      setAiError(null);

      const res = await fetch('/api/gemini/generate-worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: currentSubject?.name || 'รายวิชา',
          gradeLevel: currentSubject?.gradeLevel || 'มัธยมศึกษา',
          unitTitle: aiUnitTitle.trim(),
          topicTitle: aiTopicTitle.trim(),
          difficulty: aiDifficulty,
          questionCount: aiQuestionCount,
          schoolName: schoolProfile.name,
        }),
      });

      if (!res.ok) throw new Error('AI generation failed');
      const data: WorksheetData = await res.json();

      setPreviewWorksheet(data);
      setShowAiWorksheetModal(false);
    } catch (err) {
      console.error(err);
      setAiError('เกิดข้อผิดพลาดในการสร้างใบงาน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Save generated worksheet into Drive
  const handleSaveWorksheetToDrive = (createAsAssignment: boolean = false) => {
    if (!previewWorksheet || !currentSubject) return;

    const resourceTitle = previewWorksheet.title || `ใบงาน: ${aiTopicTitle}`;

    // Add to Drive
    addDriveResource({
      subjectId: currentSubject.id,
      classroomId: aiTargetClassroomId || currentClassroom?.id || undefined,
      title: resourceTitle,
      type: 'worksheet',
      unit: aiUnitTitle || undefined,
      topic: aiTopicTitle || undefined,
      description: previewWorksheet.conceptSummary || previewWorksheet.instructions,
      isPublicToStudents: true,
      allowedAt: new Date().toISOString(),
      aiGenerated: true,
      worksheetData: previewWorksheet,
    });

    // Optionally also create an Assignment directly in the gradebook!
    if (createAsAssignment) {
      const totalPoints = previewWorksheet.questions.reduce((sum, q) => sum + (q.points || 1), 0);
      addAssignment({
        subjectId: currentSubject.id,
        title: resourceTitle,
        category: 'ใบงาน/แบบฝึกหัด',
        maxScore: totalPoints > 0 ? totalPoints : 10,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        assignedDate: new Date().toISOString().slice(0, 10),
        description: `${previewWorksheet.instructions}\n\nจุดประสงค์การเรียนรู้:\n${(previewWorksheet.objectives || []).join('\n')}`,
        isExam: false,
        period: 'pre_midterm',
        unit: aiUnitTitle || undefined,
        topic: aiTopicTitle || undefined,
      });

      alert(`บันทึกลงคลังสื่อ และสร้างภาระงาน "${resourceTitle}" ในระบบเก็บคะแนนเรียบร้อยแล้ว!`);
    } else {
      alert(`บันทึกใบงาน "${resourceTitle}" ลงคลังสื่อเรียบร้อยแล้ว`);
    }

    setPreviewWorksheet(null);
  };

  // Manual Upload Handler
  const handleSaveManualResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubject || !newTitle.trim()) return;

    addDriveResource({
      subjectId: currentSubject.id,
      classroomId: newClassroomId || currentClassroom?.id || undefined,
      title: newTitle.trim(),
      type: newType,
      unit: newUnit.trim() || undefined,
      description: newDescription.trim() || undefined,
      fileUrl: newFileUrl.trim() || undefined,
      fileName: newFileName.trim() || undefined,
      isPublicToStudents,
      allowedAt: isPublicToStudents ? new Date().toISOString() : undefined,
      aiGenerated: false,
    });

    setShowUploadModal(false);
    setNewTitle('');
    setNewFileUrl('');
    setNewFileName('');
    setNewDescription('');
  };

  // Helper for file type icon
  const getResourceIcon = (type: DriveResourceType) => {
    switch (type) {
      case 'worksheet':
        return <FileCheckIcon className="w-5 h-5 text-indigo-500" />;
      case 'slide':
        return <Presentation className="w-5 h-5 text-amber-500" />;
      case 'media_link':
        return <Video className="w-5 h-5 text-rose-500" />;
      case 'lesson_plan':
        return <BookOpen className="w-5 h-5 text-emerald-500" />;
      case 'exam':
        return <Award className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  // Helper for type label
  const getResourceTypeLabel = (type: DriveResourceType) => {
    switch (type) {
      case 'worksheet':
        return 'ใบงาน/แบบฝึกหัด';
      case 'slide':
        return 'สไลด์ประกอบการสอน';
      case 'media_link':
        return 'สื่อวิดีโอ/ลิงก์';
      case 'lesson_plan':
        return 'แผนการสอน';
      case 'exam':
        return 'ข้อสอบ/แบบทดสอบ';
      default:
        return 'เอกสารทั่วไป';
    }
  };

  function FileCheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return <CheckSquare {...props} />;
  }

  if (!currentSubject) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>กรุณาเลือกวิชาที่ต้องการจัดการคลังสื่อและใบงาน</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/30 text-indigo-200">
                  {currentSubject.code}
                </span>
                <span className="text-xs text-slate-300">{currentSubject.name}</span>
                <span className="text-xs text-slate-400">({currentDriveResources.length} ไฟล์ในคลัง)</span>
              </div>
              <h2 className="text-xl font-bold mt-0.5">คลังสื่อ & คลังใบงานครู (Teaching Drive & Media)</h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                เก็บใบงาน สไลด์ แผนการสอน ลิงก์สื่อการเรียนรู้ แยกตามคาบ/บทเรียน พร้อม AI ช่วยสร้างใบงานทันที
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setShowAiWorksheetModal(true);
                setAiUnitTitle('');
                setAiTopicTitle('');
              }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4" />
              สร้างใบงานด้วย AI
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 border border-slate-700 transition-all"
            >
              <Upload className="w-4 h-4" />
              เพิ่มไฟล์ / ลิงก์สื่อ
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              ไปไทม์ไลน์การสอน
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อสื่อ, ใบงาน, หรือหน่วยการเรียนรู้..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Classroom Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">ห้องเรียน:</span>
            <select
              value={selectedRoomFilter}
              onChange={e => setSelectedRoomFilter(e.target.value)}
              className="text-xs bg-transparent text-slate-800 dark:text-slate-200 font-bold outline-hidden cursor-pointer"
            >
              <option value="all">ทุกห้องเรียน</option>
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>ห้อง {c.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setActiveTypeFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTypeFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            ทั้งหมด ({currentDriveResources.length})
          </button>
          <button
            onClick={() => setActiveTypeFilter('worksheet')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTypeFilter === 'worksheet'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            ใบงาน ({currentDriveResources.filter(r => r.type === 'worksheet').length})
          </button>
          <button
            onClick={() => setActiveTypeFilter('slide')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTypeFilter === 'slide'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            สไลด์
          </button>
          <button
            onClick={() => setActiveTypeFilter('media_link')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTypeFilter === 'media_link'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            วิดีโอ/ลิงก์
          </button>
          <button
            onClick={() => setActiveTypeFilter('lesson_plan')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTypeFilter === 'lesson_plan'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            แผนการสอน
          </button>
        </div>
      </div>

      {/* Grid of Drive Resources */}
      {filteredResources.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
            <FolderGit2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">ยังไม่มีสื่อหรือใบงานในคลังวิชานี้</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            คุณสามารถใช้ AI เพื่อออกแบบและสร้างใบงานได้ทันที หรืออัปโหลดไฟล์/ลิงก์สื่อจากภายนอก
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setShowAiWorksheetModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              สร้างใบงานด้วย AI ทันที
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              อัปโหลดไฟล์ / เพิ่มลิงก์
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map(resource => {
            const targetRoom = classrooms.find(c => c.id === resource.classroomId) || classrooms.find(c => c.id === currentSubject.classroomId);
            const targetRoomName = targetRoom ? targetRoom.name : (currentClassroom?.name || 'ทั่วไป');

            return (
              <div
                key={resource.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        📍 ห้อง {targetRoomName}
                      </span>
                      {resource.aiGenerated && (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI
                        </span>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`ต้องการลบ "${resource.title}" ออกจากคลังสื่อใช่หรือไม่?`)) {
                            deleteDriveResource(resource.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {getResourceTypeLabel(resource.type)}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5 line-clamp-2">
                      {resource.title}
                    </h3>
                    {resource.unit && (
                      <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                        {resource.unit}
                      </div>
                    )}
                    {resource.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Permission & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {/* Permission Box (ครูกดอนุญาตให้นักเรียนห้องนี้ดูและดาวน์โหลดได้) */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                    resource.isPublicToStudents
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      {resource.isPublicToStudents ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-[11px] truncate">
                          {resource.isPublicToStudents ? (
                            <span className="text-emerald-700 dark:text-emerald-300">
                              อนุญาต: นร.ห้อง {targetRoomName} โหลดได้
                            </span>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">
                              เฉพาะครู (ยังไม่อนุญาตให้นร.)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !resource.isPublicToStudents;
                        updateDriveResource(resource.id, {
                          isPublicToStudents: nextState,
                          allowedAt: nextState ? new Date().toISOString() : undefined,
                        });
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition shadow-2xs shrink-0 flex items-center gap-1 ${
                        resource.isPublicToStudents
                          ? 'bg-white dark:bg-slate-900 text-rose-600 hover:bg-rose-50 border border-rose-200 dark:border-rose-900/60'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
                      }`}
                    >
                      {resource.isPublicToStudents ? 'ล็อก/ปิด' : 'กดอนุญาต'}
                    </button>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-end gap-1.5 text-xs">
                    {resource.worksheetData ? (
                      <>
                        <button
                          onClick={() => {
                            setPreviewWorksheet(resource.worksheetData || null);
                            setActivePreviewResource(resource);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> เปิดดู
                        </button>
                        <button
                          onClick={() => resource.worksheetData && handleDownloadWorksheet(resource.worksheetData, targetRoomName)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition-colors"
                          title="ดาวน์โหลดไฟล์ใบงาน"
                        >
                          <Download className="w-3.5 h-3.5" /> ดาวน์โหลด
                        </button>
                      </>
                    ) : resource.fileUrl ? (
                      <>
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> เปิดลิงก์
                        </a>
                        <a
                          href={resource.fileUrl}
                          download={resource.fileName || resource.title}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> ดาวน์โหลด
                        </a>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: AI WORKSHEET GENERATOR FORM */}
      {showAiWorksheetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI สร้างใบงาน & ชุดคำถามอัตโนมัติ
              </h3>
              <button
                onClick={() => setShowAiWorksheetModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateAiWorksheet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  หน่วยการเรียนรู้ / บทที่
                </label>
                <input
                  type="text"
                  placeholder="เช่น บทที่ 3: ความน่าจะเป็น"
                  value={aiUnitTitle}
                  onChange={e => setAiUnitTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  หัวข้อเรื่อง / สาระที่ต้องการทดสอบ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น การทดลองสุ่มและเหตุการณ์ หรือ การคำนวณความน่าจะเป็นเบื้องต้น"
                  value={aiTopicTitle}
                  onChange={e => setAiTopicTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ห้องเรียนที่อนุญาตให้เข้าถึงใบงานนี้ *
                </label>
                <select
                  value={aiTargetClassroomId}
                  onChange={e => setAiTargetClassroomId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden font-medium"
                >
                  <option value={currentClassroom?.id || ''}>ห้อง {currentClassroom?.name || 'ห้องปัจจุบัน'} (เฉพาะห้องนี้)</option>
                  {classrooms.filter(c => c.id !== currentClassroom?.id).map(c => (
                    <option key={c.id} value={c.id}>ห้อง {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ระดับความยาก
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={e => setAiDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
                  >
                    <option value="easy">พื้นฐาน / จำและเข้าใจ</option>
                    <option value="medium">มาตรฐานหลักสูตร / ประยุกต์ใช้</option>
                    <option value="hard">ท้าทาย / วิเคราะห์แก้ปัญหา</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    จำนวนข้อคำถาม
                  </label>
                  <select
                    value={aiQuestionCount}
                    onChange={e => setAiQuestionCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
                  >
                    <option value={3}>3 ข้อ (แบบฝึกหัดสั้น)</option>
                    <option value={5}>5 ข้อ (ใบงานมาตรฐาน)</option>
                    <option value={8}>8 ข้อ (ชุดทดสอบย่อย)</option>
                    <option value={10}>10 ข้อ (แบบทดสอบเต็มคาบ)</option>
                  </select>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-3 text-xs text-purple-900 dark:text-purple-300 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
                  สิ่งที่ AI จะสร้างให้โดยอัตโนมัติ:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <li>คำชี้แจงและจุดประสงค์การเรียนรู้ตามหลักสูตร</li>
                  <li>สรุปองค์ความรู้สำคัญสำหรับนักเรียนทบทวน</li>
                  <li>คำถามปรนัย (4 ตัวเลือก) และอัตนัย พร้อมเฉลยและวิธีคิด</li>
                  <li>เกณฑ์การให้คะแนนแบบรูบริก (Rubric Criteria)</li>
                </ul>
              </div>

              {aiError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">
                  {aiError}
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAiWorksheetModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isAiGenerating}
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 rounded-xl shadow-md flex items-center gap-2"
                >
                  {isAiGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังสร้างใบงาน...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      เริ่มสร้างใบงาน
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL UPLOAD / ADD RESOURCE LINK */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                เพิ่มสื่อหรือไฟล์การสอนใหม่
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualResource} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ประเภทสื่อการสอน *
                </label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as DriveResourceType)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  <option value="worksheet">ใบงาน / แบบฝึกหัด (Worksheet)</option>
                  <option value="slide">สไลด์นำเสนอ (PowerPoint / Canva / PDF)</option>
                  <option value="media_link">ลิงก์สื่อวิดีโอ / YouTube / เว็บไซต์</option>
                  <option value="lesson_plan">แผนการจัดการเรียนรู้</option>
                  <option value="exam">ข้อสอบ / แบบทดสอบ</option>
                  <option value="document">เอกสารประกอบการสอนทั่วไป</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อสื่อ / ชื่อใบงาน *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สไลด์สรุปเนื้อหาบทที่ 1 หรือ ใบงานสรุปสูตร"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  หน่วยการเรียนรู้ / บทที่
                </label>
                <input
                  type="text"
                  placeholder="เช่น บทที่ 1: ระบบจำนวนจริง"
                  value={newUnit}
                  onChange={e => setNewUnit(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ลิงก์ไฟล์ หรือ ลิงก์สื่อภายนอก (Google Drive / Canva / YouTube / URL)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newFileUrl}
                  onChange={e => setNewFileUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  คำอธิบายเพิ่มเติม
                </label>
                <textarea
                  rows={2}
                  placeholder="คำชี้แจงสำหรับนักเรียน หรือรายละเอียดไฟล์..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublicToStudents}
                    onChange={e => setIsPublicToStudents(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    เปิดให้นักเรียนสามารถดาวน์โหลด/ดูไฟล์นี้ได้ในหน้าพอร์ทัลนักเรียน
                  </span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md"
                >
                  บันทึกลงคลัง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW & PRINT WORKSHEET */}
      {previewWorksheet && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6 my-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
              <div>
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  ✨ พรีวิวใบงานที่สร้างโดย AI
                </span>
                <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 mt-1">
                  {previewWorksheet.title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> พิมพ์ใบงาน
                </button>
                <button
                  onClick={() => handleSaveWorksheetToDrive(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Layers className="w-3.5 h-3.5" /> สั่งเป็นงานในระบบ & บันทึก
                </button>
                <button
                  onClick={() => handleSaveWorksheetToDrive(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> บันทึกลงคลังสื่อ
                </button>
                <button
                  onClick={() => setPreviewWorksheet(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Preview Sheet */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5 text-slate-800 dark:text-slate-200">
              {/* Header Box */}
              <div className="border-b-2 border-slate-300 dark:border-slate-700 pb-4 text-center space-y-1">
                <div className="text-xs font-semibold text-slate-500">{schoolProfile.name || 'โรงเรียน'}</div>
                <h2 className="text-lg font-bold">{previewWorksheet.title}</h2>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  รายวิชา {previewWorksheet.subjectName} ระดับชั้น {previewWorksheet.gradeLevel}
                </div>

                {/* Student Info Lines for Printing */}
                <div className="grid grid-cols-3 gap-2 text-xs pt-3 mt-2 border-t border-dashed border-slate-300 dark:border-slate-700 text-left">
                  <div>ชื่อ-สกุล: ....................................................</div>
                  <div>ชั้น: ................ เลขที่: ................</div>
                  <div className="text-right font-bold">คะแนนที่ได้: [ ......... / {previewWorksheet.questions.reduce((a, b) => a + (b.points || 1), 0)} ]</div>
                </div>
              </div>

              {/* Instructions & Concept */}
              <div className="space-y-2 text-xs">
                {previewWorksheet.conceptSummary && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 leading-relaxed">
                    <strong>💡 สรุปสาระสำคัญ:</strong> {previewWorksheet.conceptSummary}
                  </div>
                )}
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  <strong>คำชี้แจง:</strong> {previewWorksheet.instructions}
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-5 pt-2">
                {previewWorksheet.questions.map((q, idx) => (
                  <div key={q.id || idx} className="space-y-2 text-sm">
                    <div className="flex items-start gap-2 font-semibold">
                      <span className="text-indigo-600 dark:text-indigo-400">ข้อที่ {idx + 1}.</span>
                      <div className="flex-1 leading-relaxed">
                        {q.question}
                        <span className="text-xs font-normal text-slate-400 ml-2">({q.points || 1} คะแนน)</span>
                      </div>
                    </div>

                    {/* Multiple choice options */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 pt-1 text-xs">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Short answer line */}
                    {(!q.options || q.options.length === 0) && (
                      <div className="pl-6 pt-2 text-xs text-slate-400">
                        <div className="border-b border-dotted border-slate-400 pb-4">ตอบ: ....................................................................................................................................................</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Teacher's Answer Key Section */}
              <div className="mt-8 pt-4 border-t-2 border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-xl space-y-3 no-print">
                <div className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  เฉลยและแนวการตอบสำหรับครูผู้สอน (Answer Key & Guide):
                </div>
                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {previewWorksheet.questions.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-indigo-600">ข้อ {idx + 1}:</span>
                      <span>{q.correctAnswer || 'ตามแนวการตอบที่ครูกำหนด'}</span>
                    </div>
                  ))}
                  {previewWorksheet.answerKeyGuide && (
                    <div className="pt-2 text-slate-500 italic border-t border-indigo-200 dark:border-indigo-800/60">
                      {previewWorksheet.answerKeyGuide}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setPreviewWorksheet(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

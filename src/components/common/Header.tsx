import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  School, 
  GraduationCap, 
  Printer, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  Lock, 
  LogOut, 
  ChevronDown,
  Menu
} from 'lucide-react';
import { TeacherLoginModal } from '../teacher/TeacherLoginModal';

interface HeaderProps {
  onOpenPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenPrint }) => {
  const { 
    mode, 
    teacherLogout, 
    subjects, 
    selectedSubjectId, 
    setSelectedSubjectId, 
    currentSubject,
    currentClassroom,
    exportBackupData,
    importBackupData,
    clearAllData,
    schoolProfile,
    setMobileSidebarOpen
  } = useApp();

  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackupData(content);
      if (success) {
        setImportNotice('นำเข้าข้อมูลสำเร็จเรียบร้อย');
        setTimeout(() => setImportNotice(null), 3000);
      } else {
        alert('ไฟล์ข้อมูลไม่ถูกต้อง โปรดตรวจสอบว่าเป็นไฟล์สำรองจากระบบนี้');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print font-formal">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left branding & mobile menu toggle */}
            <div className="flex items-center gap-3">
              {mode === 'teacher' && (
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  title="เปิดแถบนำทางด้านข้าง"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base sm:text-lg text-slate-800 tracking-tight truncate max-w-[200px] sm:max-w-xs">
                      {schoolProfile.name || 'KruSmart'}
                    </span>
                    <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      {mode === 'teacher' ? 'ระบบบริหารงานวัดผล' : 'ระบบตรวจสอบงาน'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 hidden md:block truncate max-w-sm">
                    {schoolProfile.affiliation || 'ระบบจัดการคะแนน งาน และตัดเกรดอัตโนมัติ'}
                  </p>
                </div>
              </div>
            </div>

            {/* Subject & Classroom Quick Switcher (Teacher Mode Only) */}
            {mode === 'teacher' && (
              <div className="relative">
                <button
                  onClick={() => setShowSubjectMenu(!showSubjectMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium transition cursor-pointer shadow-2xs"
                  title="เปลี่ยนวิชาที่กำลังจัดการ"
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: currentSubject?.color || '#3B82F6' }}
                  />
                  <span className="font-bold text-slate-900 truncate max-w-[120px] sm:max-w-[180px]">
                    {currentSubject ? `${currentSubject.code} ${currentSubject.name}` : 'เลือกวิชา'}
                  </span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-semibold hidden sm:inline">
                    ห้อง {currentClassroom?.name || 'ม.2/1'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showSubjectMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowSubjectMenu(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-20 animate-scaleUp">
                      <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        วิชาทั้งหมดที่สอน ({subjects.length} วิชา)
                      </div>
                      {subjects.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubjectId(sub.id);
                            setShowSubjectMenu(false);
                          }}
                          className={`w-full px-3 py-2 text-left flex items-start gap-3 hover:bg-slate-50 transition cursor-pointer ${
                            selectedSubjectId === sub.id ? 'bg-indigo-50/60 font-semibold text-indigo-900' : 'text-slate-700'
                          }`}
                        >
                          <span 
                            className="w-3 h-3 rounded-full mt-1 shrink-0" 
                            style={{ backgroundColor: sub.color }} 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs sm:text-sm truncate">
                              <span className="font-bold">{sub.code}</span> {sub.name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>ระดับ {sub.gradeLevel}</span>
                              <span>•</span>
                              <span>ปีการศึกษา {sub.academicYear}/{sub.term}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {mode === 'student' ? (
                /* Student view: Prominent Teacher Login button */
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shadow-md shadow-indigo-100 active:scale-95"
                >
                  <Lock className="w-4 h-4" />
                  <span>เข้าสู่ระบบครูผู้สอน</span>
                </button>
              ) : (
                /* Teacher view: Print & Quick backup */
                <>
                  <button
                    onClick={onOpenPrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer shadow-2xs"
                    title="พิมพ์แบบบันทึกผลการเรียน (ปพ.5)"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden md:inline">พิมพ์ ปพ.5</span>
                  </button>

                  <div className="hidden lg:flex items-center gap-1 border-l border-slate-200 pl-2">
                    <button
                      onClick={exportBackupData}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      title="สำรองข้อมูล JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <label 
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="นำเข้าไฟล์สำรองข้อมูล"
                    >
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Import Notification Banner */}
          {importNotice && (
            <div className="bg-emerald-50 text-emerald-800 text-xs py-1.5 px-4 rounded-md mb-2 flex items-center justify-between border border-emerald-200 animate-fadeIn">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {importNotice}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Teacher Login Modal */}
      <TeacherLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};

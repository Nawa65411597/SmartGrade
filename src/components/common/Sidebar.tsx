import React from 'react';
import { useApp, ActiveTabType } from '../../context/AppContext';
import { 
  BarChart3, 
  CheckSquare, 
  Edit3, 
  Layers, 
  Percent, 
  Award, 
  Sparkles, 
  Users, 
  BookOpen, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  School, 
  LogOut,
  X,
  FileSpreadsheet,
  UserCheck,
  History,
  FolderGit2,
  ShieldCheck,
  Sun,
  Moon,
  AlertTriangle,
  FolderKanban,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  onOpenPrint: () => void;
}

interface NavItem {
  id: ActiveTabType;
  label: string;
  subLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavCategory {
  categoryKey: string;
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenPrint }) => {
  const { 
    activeTab, 
    setActiveTab, 
    sidebarCollapsed, 
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    schoolProfile,
    teacherProfile,
    currentSubject,
    currentClassroom,
    teacherLogout,
    themeMode,
    toggleThemeMode,
    setShowErrorModal
  } = useApp();

  // Organized into 5 coherent, categorized groups
  const navCategories: NavCategory[] = [
    {
      categoryKey: 'core',
      title: 'ภาพรวม & ชั้นเรียน',
      items: [
        {
          id: 'dashboard',
          label: 'แดชบอร์ด & ทวงงาน',
          subLabel: 'สรุปภาพรวมและติดตามงานค้าง',
          icon: BarChart3,
        },
        {
          id: 'attendance',
          label: 'เช็คชื่อ & คำนวณ มส.',
          subLabel: 'บันทึกเวลาเรียน หมดสิทธิ์สอบ',
          icon: UserCheck,
          badge: 'สำคัญ',
          badgeColor: 'bg-amber-400 text-amber-950 dark:bg-amber-300 dark:text-slate-900',
        },
        {
          id: 'timeline',
          label: 'ไทม์ไลน์บันทึกการสอน',
          subLabel: 'บันทึกการสอน & แผนหลังสอน',
          icon: History,
          badge: 'AI',
          badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
        },
      ]
    },
    {
      categoryKey: 'grading',
      title: 'งาน วัดผล & ปพ.5',
      items: [
        {
          id: 'check_submissions',
          label: 'เช็คสถานะส่งงาน (ปพ.5)',
          subLabel: 'ส่งแล้ว / ส่งช้า / ยังไม่ส่ง',
          icon: CheckSquare,
        },
        {
          id: 'enter_scores',
          label: 'กรอกคะแนน ปพ.5',
          subLabel: 'ล็อกอัตโนมัติถ้ายังไม่ส่งงาน',
          icon: Edit3,
        },
        {
          id: 'summary',
          label: 'สรุปตัดเกรดอัตโนมัติ',
          subLabel: 'เกรด 0-4 และส่งออก Excel',
          icon: Award,
        },
        {
          id: 'proportions',
          label: 'สัดส่วนคะแนน 4 ช่วง',
          subLabel: 'ก่อน/กลาง/หลัง/ปลายภาค',
          icon: Percent,
          badge: 'สำคัญ',
          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
        },
      ]
    },
    {
      categoryKey: 'curriculum',
      title: 'หลักสูตร & สื่อการสอน',
      items: [
        {
          id: 'assignments',
          label: 'โครงสร้าง บท/เรื่อง/งาน',
          subLabel: 'สั่งงาน แนบไฟล์ จัดกลุ่ม',
          icon: Layers,
        },
        {
          id: 'drive',
          label: 'คลังสื่อ & คลังใบงานครู',
          subLabel: 'ไดร์ฟครู & สร้างใบงาน AI',
          icon: FolderGit2,
          badge: 'AI',
          badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300',
        },
      ]
    },
    {
      categoryKey: 'analytics',
      title: 'ตรวจสอบ & เครื่องมือ',
      items: [
        {
          id: 'activity_logs',
          label: 'ประวัติการใช้งาน & ตรวจงาน',
          subLabel: 'Audit Log & ตรวจจับการเข้าดูงาน',
          icon: ShieldCheck,
          badge: 'ขั้นสูง',
          badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
        },
        {
          id: 'tools',
          label: 'วิเคราะห์ & สุ่มจัดกลุ่ม',
          subLabel: 'สุ่มไม่ซ้ำ คละความสามารถ',
          icon: Sparkles,
        },
      ]
    },
    {
      categoryKey: 'settings',
      title: 'จัดการ & ตั้งค่า',
      items: [
        {
          id: 'students',
          label: 'ข้อมูลนักเรียน',
          subLabel: 'เพิ่ม/แก้ไข/นำเข้ารายชื่อ',
          icon: Users,
        },
        {
          id: 'classes',
          label: 'วิชา & ห้องเรียน',
          subLabel: 'จัดการรายวิชาที่สอน',
          icon: BookOpen,
        },
        {
          id: 'school_settings',
          label: 'ตั้งค่าระบบ & บัญชีครู',
          subLabel: 'รหัสผ่าน, โรงเรียน, AI, คลาวด์',
          icon: Settings,
        },
      ]
    }
  ];

  const handleNavClick = (tabId: ActiveTabType) => {
    setActiveTab(tabId);
    setMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-700 dark:text-slate-200 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-200/80 dark:border-slate-800 shadow-xl no-print
          ${mobileSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        {/* Sidebar Header: School Name & Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-400 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-200/50 dark:shadow-none">
              <School className="w-5 h-5" />
            </div>

            {(!sidebarCollapsed || mobileSidebarOpen) && (
              <div className="min-w-0 animate-fadeIn">
                <h1 className="font-bold text-sm text-slate-900 dark:text-white truncate leading-tight" title={schoolProfile.name}>
                  {schoolProfile.name || 'KruSmart'}
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {schoolProfile.affiliation || 'ระบบสารสนเทศวัดผล (ปพ.5)'}
                </p>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg lg:hidden"
            title="ปิดเมนู"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title={sidebarCollapsed ? 'ขยายแถบเมนู (Expand)' : 'ยุบแถบเมนู (Collapse)'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Current Active Subject & Room Pill */}
        {(!sidebarCollapsed || mobileSidebarOpen) && currentSubject && (
          <div className="mx-3 mt-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                วิชาที่กำลังจัดการ
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-bold">
                ห้อง {currentClassroom?.name || 'ม.2/1'}
              </span>
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-white truncate mt-1">
              {currentSubject.code} {currentSubject.name}
            </div>
          </div>
        )}

        {/* Navigation Categories & Items */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {navCategories.map((category) => (
            <div key={category.categoryKey} className="space-y-1">
              {/* Category Section Header */}
              {(!sidebarCollapsed || mobileSidebarOpen) ? (
                <div className="px-2.5 pt-1 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>{category.title}</span>
                </div>
              ) : (
                <div className="border-t border-slate-100 dark:border-slate-800 my-1 mx-2" />
              )}

              {/* Items in Category */}
              {category.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer relative ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={sidebarCollapsed ? `${item.label} - ${item.subLabel}` : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                    }`} />

                    {(!sidebarCollapsed || mobileSidebarOpen) && (
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className={`ml-1.5 px-1.5 py-0.2 text-[9px] font-bold rounded-full shadow-2xs ${item.badgeColor || 'bg-amber-400 text-indigo-950'}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.subLabel && (
                          <div className={`text-[10px] truncate ${isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                            {item.subLabel}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Collapsed Tooltip Indicator */}
                    {sidebarCollapsed && !mobileSidebarOpen && (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50 border border-slate-700">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-slate-900">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.subLabel && <div className="text-[10px] text-slate-300">{item.subLabel}</div>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer: Theme switcher, Glitch Report, Teacher Profile & Actions */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 shrink-0 space-y-2">
          {(!sidebarCollapsed || mobileSidebarOpen) && (
            <>
              {/* Teacher Profile Card */}
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs flex items-center gap-2 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100 dark:border-indigo-900">
                  {teacherProfile.fullName.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1 truncate">
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                    {teacherProfile.fullName}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {teacherProfile.position || 'ครูผู้สอน'}
                  </div>
                </div>
              </div>

              {/* Utility Row: Theme Toggle + Glitch Report */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleThemeMode}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="สลับโหมด มืด / สว่าง (Dark / Light)"
                >
                  {themeMode === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-300" />
                      <span>โหมดสว่าง</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>โหมดมืด</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowErrorModal(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-[11px] font-semibold transition cursor-pointer border border-rose-200/80 dark:border-rose-900/60"
                  title="หากระบบขัดข้อง แจ้งเมลหา nawaratk65@gmail.com"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>แจ้งปัญหา</span>
                </button>
              </div>
            </>
          )}

          {/* Quick Print Button */}
          <button
            onClick={() => {
              onOpenPrint();
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition cursor-pointer border border-indigo-200/80 dark:border-indigo-900/60 shadow-2xs ${
              sidebarCollapsed && !mobileSidebarOpen ? 'px-0' : ''
            }`}
            title="พิมพ์แบบ ปพ.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            {(!sidebarCollapsed || mobileSidebarOpen) && <span>พิมพ์รายงาน ปพ.5</span>}
          </button>

          {/* Logout Button */}
          <button
            onClick={teacherLogout}
            className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-medium transition cursor-pointer border border-slate-200/60 dark:border-slate-700/60 ${
              sidebarCollapsed && !mobileSidebarOpen ? 'px-0' : ''
            }`}
            title="ออกจากระบบครูผู้สอน"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {(!sidebarCollapsed || mobileSidebarOpen) && <span>ออกจากระบบครู</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

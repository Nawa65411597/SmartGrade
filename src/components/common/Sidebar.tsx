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
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  onOpenPrint: () => void;
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
    teacherLogout
  } = useApp();

  const navItems: Array<{
    id: ActiveTabType;
    label: string;
    subLabel?: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
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
    },
    {
      id: 'timeline',
      label: 'ไทม์ไลน์บันทึกการสอน',
      subLabel: 'วันนี้สอนอะไร/บันทึกหลังสอน',
      icon: History,
      badge: 'AI',
    },
    {
      id: 'drive',
      label: 'คลังสื่อ & คลังใบงาน',
      subLabel: 'ไดร์ฟครู & สร้างใบงาน AI',
      icon: FolderGit2,
      badge: 'AI',
    },
    {
      id: 'activity_logs',
      label: 'ประวัติการใช้งาน & ติดตามงาน',
      subLabel: 'Audit Log & ตรวจจับเด็กไม่เช็คงาน',
      icon: ShieldCheck,
      badge: 'ขั้นสูง',
    },
    {
      id: 'check_submissions',
      label: 'เช็คสถานะส่งงาน (ปพ.5)',
      subLabel: 'บันทึก ส่งแล้ว/ส่งช้า/ยังไม่ส่ง',
      icon: CheckSquare,
    },
    {
      id: 'enter_scores',
      label: 'กรอกคะแนน ปพ.5',
      subLabel: 'ล็อกถ้ายังไม่ส่งงาน',
      icon: Edit3,
    },
    {
      id: 'assignments',
      label: 'โครงสร้าง บท/เรื่อง/งานย่อย',
      subLabel: 'สั่งงาน แนบไฟล์ จัดกลุ่ม',
      icon: Layers,
    },
    {
      id: 'proportions',
      label: 'สัดส่วนคะแนน & เฉลี่ย 4 ช่วง',
      subLabel: 'ก่อน/กลาง/หลัง/ปลายภาค',
      icon: Percent,
      badge: 'สำคัญ',
    },
    {
      id: 'summary',
      label: 'สรุปตัดเกรดอัตโนมัติ',
      subLabel: 'เกรด 0-4 และส่งออก Excel',
      icon: Award,
    },
    {
      id: 'tools',
      label: 'วิเคราะห์ & สุ่ม/จัดกลุ่ม',
      subLabel: 'สุ่มไม่ซ้ำ คละความสามารถ',
      icon: Sparkles,
    },
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
        className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-900 text-slate-100 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800 shadow-xl no-print
          ${mobileSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        {/* Sidebar Header: School Name & Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white shrink-0 shadow-md">
              <School className="w-5 h-5" />
            </div>

            {(!sidebarCollapsed || mobileSidebarOpen) && (
              <div className="min-w-0 animate-fadeIn">
                <h1 className="font-bold text-sm text-white truncate leading-tight" title={schoolProfile.name}>
                  {schoolProfile.name || 'ระบบบริหารคะแนนโรงเรียน'}
                </h1>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {schoolProfile.affiliation || 'ระบบสารสนเทศวัดผล (ปพ.5)'}
                </p>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            title="ปิดเมนู"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
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
          <div className="mx-3 mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider">
                วิชาที่กำลังจัดการ
              </span>
              <span className="text-[11px] px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded font-medium">
                ห้อง {currentClassroom?.name || 'ม.2/1'}
              </span>
            </div>
            <div className="font-bold text-xs text-white truncate mt-1">
              {currentSubject.code} {currentSubject.name}
            </div>
          </div>
        )}

        {/* Navigation Menu Items */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer relative ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                }`}
                title={sidebarCollapsed ? `${item.label} - ${item.subLabel}` : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 transition ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />

                {(!sidebarCollapsed || mobileSidebarOpen) && (
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-1.5 px-1.5 py-0.2 text-[10px] font-bold rounded bg-amber-400 text-indigo-950">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.subLabel && (
                      <div className={`text-[10px] truncate ${isActive ? 'text-indigo-200' : 'text-slate-500 group-hover:text-slate-400'}`}>
                        {item.subLabel}
                      </div>
                    )}
                  </div>
                )}

                {/* Collapsed Tooltip Indicator */}
                {sidebarCollapsed && !mobileSidebarOpen && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-xs rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50 border border-slate-800">
                    <div className="font-bold">{item.label}</div>
                    {item.subLabel && <div className="text-[10px] text-slate-400">{item.subLabel}</div>}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 shrink-0 space-y-2">
          {(!sidebarCollapsed || mobileSidebarOpen) && (
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                {teacherProfile.fullName.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1 truncate">
                <div className="font-bold text-slate-200 truncate text-[11px]">{teacherProfile.fullName}</div>
                <div className="text-[10px] text-slate-500 truncate">{teacherProfile.position || 'ครูผู้สอน'}</div>
              </div>
            </div>
          )}

          {/* Quick Print Button */}
          <button
            onClick={() => {
              onOpenPrint();
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-700/60 shadow-xs ${
              sidebarCollapsed && !mobileSidebarOpen ? 'px-0' : ''
            }`}
            title="พิมพ์แบบ ปพ.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
            {(!sidebarCollapsed || mobileSidebarOpen) && <span>พิมพ์รายงาน ปพ.5</span>}
          </button>

          {/* Logout Button */}
          <button
            onClick={teacherLogout}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition cursor-pointer border border-rose-500/20 ${
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

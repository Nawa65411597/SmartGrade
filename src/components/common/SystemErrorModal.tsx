import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  AlertTriangle, 
  Mail, 
  Copy, 
  CheckCircle2, 
  X, 
  Send, 
  HelpCircle, 
  Sparkles, 
  ExternalLink,
  Laptop,
  Clock,
  BookOpen
} from 'lucide-react';

interface SystemErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultErrorMsg?: string;
}

const SUPPORT_EMAIL = 'nawaratk65@gmail.com';

export const SystemErrorModal: React.FC<SystemErrorModalProps> = ({
  isOpen,
  onClose,
  defaultErrorMsg = '',
}) => {
  const { 
    currentSubject, 
    currentClassroom, 
    teacherProfile, 
    mode, 
    schoolProfile 
  } = useApp();

  const [issueCategory, setIssueCategory] = useState<string>('system_glitch');
  const [issueTitle, setIssueTitle] = useState<string>(defaultErrorMsg ? 'พบข้อผิดพลาดในระบบ' : '');
  const [issueDescription, setIssueDescription] = useState<string>(defaultErrorMsg || '');
  const [contactName, setContactName] = useState<string>(teacherProfile.fullName || '');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Preset templates for quick reporting
  const quickTemplates = [
    {
      label: '⚠️ บันทึกข้อมูลไม่สำเร็จ',
      title: 'พบปัญหาการบันทึกข้อมูลคะแนนหรือสถานะงาน',
      desc: 'ขณะทำการกรอกคะแนนหรือเปลี่ยนสถานะส่งงาน ระบบไม่ตอบสนองหรือแสดงข้อความขัดข้อง',
    },
    {
      label: '🔄 ระบบโหลดช้าหรือ 503',
      title: 'ระบบเชื่อมต่อไม่สำเร็จหรือตอบสนองช้า',
      desc: 'หน้าเว็บค้างหรือตอบสนองล่าช้า ต้องการให้ตรวจสอบสถานะเซิร์ฟเวอร์',
    },
    {
      label: '📱 ปัญหาแสดงผลบนมือถือ',
      title: 'หน้าจอแสดงผลผิดเพี้ยนบนอุปกรณ์มือถือ',
      desc: 'ตรวจพบว่าเมนูหรือตารางแสดงผลล้นขอบจอในโหมดมือถือ',
    },
    {
      label: '💡 เสนอแนะฟังก์ชันใหม่',
      title: 'ข้อเสนอแนะปรับปรุงระบบ KruSmart',
      desc: 'ต้องการเสนอแนะการเพิ่มฟังก์ชันเพื่อช่วยให้การจัดการงานครูสะดวกยิ่งขึ้น',
    }
  ];

  const handleApplyTemplate = (tpl: typeof quickTemplates[0]) => {
    setIssueTitle(tpl.title);
    setIssueDescription(tpl.desc);
  };

  const getSystemReportText = () => {
    return [
      `=== รายงานแจ้งเตือนข้อขัดข้อง / ปัญหาการใช้งาน KruSmart ===`,
      `ผู้แจ้ง: ${contactName || 'ผู้ใช้ระบบ'} (${mode === 'teacher' ? 'ครูผู้สอน' : 'นักเรียน'})`,
      `โรงเรียน: ${schoolProfile.name}`,
      `วิชาที่ใช้งาน: ${currentSubject ? `${currentSubject.code} ${currentSubject.name}` : 'ไม่ได้เลือก'}`,
      `ห้องเรียน: ${currentClassroom ? currentClassroom.name : 'ไม่ได้เลือก'}`,
      `หมวดหมู่: ${issueCategory}`,
      `หัวข้อ: ${issueTitle || 'รายงานปัญหา'}`,
      `รายละเอียดปัญหา:`,
      issueDescription || '(ไม่มีรายละเอียดเพิ่มเติม)',
      `-----------------------------------------`,
      `ข้อมูลระบบ (Diagnostics):`,
      `วันเวลา: ${new Date().toLocaleString('th-TH')}`,
      `URL: ${window.location.href}`,
      `เบราว์เซอร์: ${navigator.userAgent}`,
      `ขนาดหน้าจอ: ${window.innerWidth} x ${window.innerHeight} px`,
      `ผู้รับเรื่อง: ${SUPPORT_EMAIL}`,
      `===========================================`
    ].join('\n');
  };

  const handleCopyReport = () => {
    const text = getSystemReportText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`[แจ้งข้อขัดข้อง KruSmart] ${issueTitle || 'รายงานปัญหาการใช้งาน'}`);
    const body = encodeURIComponent(getSystemReportText());
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-formal animate-fadeIn">
      <div 
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-rose-200/80 dark:border-rose-900/40 shadow-2xl p-5 sm:p-7 z-10 max-h-[90vh] overflow-y-auto space-y-5 animate-scaleUp">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                  แจ้งข้อขัดข้อง / ติดต่อทีมพัฒนา
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                ศูนย์รายงานปัญหา & ข้อขัดข้อง
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                หากระบบขัดข้อง สามารถส่งข้อมูลตรงถึงทีมงานที่{' '}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{SUPPORT_EMAIL}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Template Pills */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>เลือกปัญหาที่พบบ่อย (แตะเพื่อกรอกอัตโนมัติ):</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {quickTemplates.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              หัวข้อปัญหา / อาการที่พบ
            </label>
            <input
              type="text"
              value={issueTitle}
              onChange={e => setIssueTitle(e.target.value)}
              placeholder="เช่น บันทึกคะแนนไม่ติด, เกิดข้อผิดพลาด 503..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              รายละเอียดเพิ่มเติม (เกิดตอนทำอะไร / มีขั้นตอนอย่างไร)
            </label>
            <textarea
              rows={3}
              value={issueDescription}
              onChange={e => setIssueDescription(e.target.value)}
              placeholder="ระบุข้อความแจ้งเตือนที่ขึ้น หรือขั้นตอนที่ทำให้เกิดปัญหา..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          {/* System info preview badge */}
          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>ข้อมูลสภาพแวดล้อมระบบและ URL จะถูกแนบไปกับรายงานอัตโนมัติ</span>
            </div>
            <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
              ถึง: {SUPPORT_EMAIL}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleCopyReport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">คัดลอกรายงานแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>คัดลอกข้อความรายงาน</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSendEmail}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer active:scale-95"
          >
            <Mail className="w-4 h-4" />
            <span>ส่งอีเมลหา {SUPPORT_EMAIL}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

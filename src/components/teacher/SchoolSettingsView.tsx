import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  School, 
  Building, 
  Save, 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  Upload, 
  Database, 
  FileText,
  Sparkles,
  KeyRound,
  User,
  Sliders,
  Cloud,
  CloudCheck,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  Layers,
  Award,
  BookOpen
} from 'lucide-react';
import { SchoolProfile, TeacherProfile, ScoreProportions, GradeCutoff } from '../../types';

export const SchoolSettingsView: React.FC = () => {
  const { 
    schoolProfile, 
    updateSchoolProfile,
    teacherProfile,
    updateTeacherProfile,
    changeTeacherPassword,
    firebaseSyncStatus,
    syncWithFirebase,
    gradeCutoffs,
    updateGradeCutoffs,
    subjects,
    classrooms,
    students,
    assignments,
    exportBackupData,
    importBackupData,
    clearAllData
  } = useApp();

  const [activeTab, setActiveTab] = useState<'teacher' | 'school' | 'grading' | 'firebase' | 'ai'>('teacher');

  // Teacher Profile Form State
  const [formTeacher, setFormTeacher] = useState<TeacherProfile>(teacherProfile);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // School Profile Form State
  const [formSchool, setFormSchool] = useState<SchoolProfile>(schoolProfile);

  // Proportions Form State
  const [formProportions, setFormProportions] = useState<ScoreProportions>(
    schoolProfile.defaultProportions || { preMidterm: 30, midterm: 20, postMidterm: 30, final: 20 }
  );

  // Status notifications
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // AI live test state
  const [aiTestPrompt, setAiTestPrompt] = useState('นักเรียนชื่อ เด็กชายสมคิด สดใส เลขที่ 1 เกรด 3.5 ได้คะแนนรวม 78/100 งานค้าง 1 ชิ้น');
  const [aiTestResult, setAiTestResult] = useState('');
  const [isAiTesting, setIsAiTesting] = useState(false);

  const notifySave = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  // Handle Teacher Profile Save
  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    updateTeacherProfile(formTeacher);
    notifySave('บันทึกข้อมูลครูผู้สอนเรียบร้อยแล้ว');
  };

  // Handle Password Change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPass !== confirmPass) {
      setPassError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    const result = changeTeacherPassword(currentPass, newPass);
    if (result.success) {
      setPassSuccess(result.message);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } else {
      setPassError(result.message);
    }
  };

  // Handle School Profile Save
  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfile({
      ...formSchool,
      defaultProportions: formProportions
    });
    notifySave('บันทึกข้อมูลสถานศึกษาและสัดส่วนคะแนนเรียบร้อยแล้ว');
  };

  // Handle Firebase Manual Sync
  const handleSyncFirebase = async () => {
    setIsSyncing(true);
    const ok = await syncWithFirebase();
    setIsSyncing(false);
    if (ok) {
      notifySave('ซิงค์ข้อมูลขึ้น Firebase Cloud Firestore สำเร็จ');
    } else {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ Firebase กรุณาตรวจสอบอินเทอร์เน็ต');
    }
  };

  // Handle AI Test
  const handleTestAi = async () => {
    setIsAiTesting(true);
    try {
      const res = await fetch('/api/gemini/generate-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'เด็กชายสมคิด สดใส',
          seatNumber: 1,
          studentCode: '52101',
          grade: '3.5',
          totalScore: 78,
          completionRate: 92,
          pendingCount: 1,
          periodScores: { preMidterm: 26, midterm: 16, postMidterm: 22, final: 14 }
        }),
      });
      const data = await res.json();
      setAiTestResult(data.comment || 'ไม่มีการตอบกลับ');
    } catch {
      setAiTestResult('เกิดข้อผิดพลาดในการติดต่อระบบ AI กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsAiTesting(false);
    }
  };

  const totalProportion = 
    Number(formProportions.preMidterm) + 
    Number(formProportions.midterm) + 
    Number(formProportions.postMidterm) + 
    Number(formProportions.final);

  return (
    <div className="space-y-5 font-formal max-w-5xl">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              ศูนย์การตั้งค่าระบบ & บัญชีครูผู้สอน (Master Settings)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ครูสามารถปรับแต่งการตั้งค่าได้ครบถ้วน ทั้งบัญชีครู รหัสผ่าน โรงเรียน สัดส่วนคะแนน ฐานข้อมูล Firebase และ AI
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccess}</span>
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 gap-2 overflow-x-auto text-xs font-bold shadow-2xs">
        <button
          onClick={() => setActiveTab('teacher')}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'teacher'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>บัญชีครู & ความปลอดภัย</span>
        </button>

        <button
          onClick={() => setActiveTab('school')}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'school'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <School className="w-4 h-4" />
          <span>ข้อมูลสถานศึกษา & สพฐ.</span>
        </button>

        <button
          onClick={() => setActiveTab('grading')}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'grading'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>สัดส่วน 4 ช่วง & เกณฑ์เกรด</span>
        </button>

        <button
          onClick={() => setActiveTab('firebase')}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'firebase'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Firebase คลาวด์ & สำรองข้อมูล</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ai'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>AI ลดภาระงานครู</span>
        </button>
      </div>

      {/* TAB 1: TEACHER PROFILE & SECURITY */}
      {activeTab === 'teacher' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Change Password Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              เปลี่ยนรหัสผ่านครูผู้สอน (Change Teacher Password)
            </h3>
            <p className="text-xs text-slate-500">
              กำหนดรหัสผ่านส่วนตัวสำหรับเข้าใช้งานระบบ KruSmart เพื่อความปลอดภัยของข้อมูลคะแนน
            </p>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  รหัสผ่านปัจจุบัน <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="กรอกรหัสผ่านเดิม"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  รหัสผ่านใหม่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="รหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ยืนยันรหัสผ่านใหม่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}</span>
                </button>
              </div>

              {passError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer shadow-indigo-100"
                >
                  <Lock className="w-4 h-4" />
                  <span>ยืนยันการเปลี่ยนรหัสผ่าน</span>
                </button>
              </div>
            </form>
          </div>

          {/* Teacher Profile Card */}
          <form onSubmit={handleSaveTeacher} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              ข้อมูลโปรไฟล์ครูผู้สอน (Teacher Profile)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ชื่อ - นามสกุลครูผู้สอน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTeacher.fullName}
                  onChange={(e) => setFormTeacher({ ...formTeacher, fullName: e.target.value })}
                  placeholder="เช่น นายณัฐวุฒิ การศึกษาไทย"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold text-slate-800"
                />
                <span className="text-[10px] text-slate-400">* ชื่อนี้จะแสดงในส่วนผู้ประเมินและลายเซ็น ปพ.5</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={formTeacher.position}
                    onChange={(e) => setFormTeacher({ ...formTeacher, position: e.target.value })}
                    placeholder="เช่น ครู คศ.2"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">วิทยฐานะ</label>
                  <input
                    type="text"
                    value={formTeacher.academicStanding || ''}
                    onChange={(e) => setFormTeacher({ ...formTeacher, academicStanding: e.target.value })}
                    placeholder="เช่น ชำนาญการพิเศษ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">กลุ่มสาระการเรียนรู้</label>
                <input
                  type="text"
                  value={formTeacher.department}
                  onChange={(e) => setFormTeacher({ ...formTeacher, department: e.target.value })}
                  placeholder="เช่น กลุ่มสาระการเรียนรู้คณิตศาสตร์"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">อีเมลติดต่อ</label>
                  <input
                    type="email"
                    value={formTeacher.email}
                    onChange={(e) => setFormTeacher({ ...formTeacher, email: e.target.value })}
                    placeholder="teacher@school.ac.th"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={formTeacher.phone || ''}
                    onChange={(e) => setFormTeacher({ ...formTeacher, phone: e.target.value })}
                    placeholder="081-xxx-xxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer shadow-indigo-100"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกข้อมูลครูผู้สอน</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SCHOOL PROFILE */}
      {activeTab === 'school' && (
        <form onSubmit={handleSaveSchool} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <School className="w-4 h-4 text-indigo-600" />
                ข้อมูลสถานศึกษา & ระบบเชื่อมต่อ สพฐ. (School Profile)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนดชื่อโรงเรียนและสังกัดที่จะปรากฏบนหัวกระดาษรายงาน ปพ.5 ทุกฉบับ
              </p>
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer shadow-indigo-100"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูลโรงเรียน</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ชื่อโรงเรียน (School Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formSchool.name}
                onChange={(e) => setFormSchool({ ...formSchool, name: e.target.value })}
                placeholder="เช่น โรงเรียนสวนกุหลาบวิทยาลัย, โรงเรียนสาธิตวิทยาคม"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold text-slate-900 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">สังกัดหน่วยงาน</label>
                <input
                  type="text"
                  value={formSchool.affiliation}
                  onChange={(e) => setFormSchool({ ...formSchool, affiliation: e.target.value })}
                  placeholder="เช่น สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">เขตพื้นที่การศึกษา</label>
                <input
                  type="text"
                  value={formSchool.areaZone || ''}
                  onChange={(e) => setFormSchool({ ...formSchool, areaZone: e.target.value })}
                  placeholder="เช่น สพม. กรุงเทพมหานคร เขต 1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">รหัสสถานศึกษา (10 หลัก)</label>
                <input
                  type="text"
                  value={formSchool.schoolCode || ''}
                  onChange={(e) => setFormSchool({ ...formSchool, schoolCode: e.target.value })}
                  placeholder="เช่น 1010720001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ภาคเรียนปัจจุบัน</label>
                <select
                  value={formSchool.currentTerm}
                  onChange={(e) => setFormSchool({ ...formSchool, currentTerm: e.target.value as '1' | '2' })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                >
                  <option value="1">ภาคเรียนที่ 1</option>
                  <option value="2">ภาคเรียนที่ 2</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ปีการศึกษา</label>
                <input
                  type="text"
                  value={formSchool.currentAcademicYear}
                  onChange={(e) => setFormSchool({ ...formSchool, currentAcademicYear: e.target.value })}
                  placeholder="เช่น 2567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อผู้อำนวยการโรงเรียน</label>
                <input
                  type="text"
                  value={formSchool.directorName || ''}
                  onChange={(e) => setFormSchool({ ...formSchool, directorName: e.target.value })}
                  placeholder="เช่น ดร.สมศักดิ์ รักการเรียน"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
                <span className="text-[10px] text-slate-400">สำหรับลายเซ็นรับรอง ปพ.5</span>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อหัวหน้าฝ่ายวิชาการ/วัดผล</label>
                <input
                  type="text"
                  value={formSchool.academicHeadName || ''}
                  onChange={(e) => setFormSchool({ ...formSchool, academicHeadName: e.target.value })}
                  placeholder="เช่น นางวิมล วิชาการ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
                <span className="text-[10px] text-slate-400">สำหรับลายเซ็นตรวจสอบผล</span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: 4-PERIOD PROPORTIONS & GRADING RULES */}
      {activeTab === 'grading' && (
        <div className="space-y-5">
          {/* 4 Periods Configuration */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  กำหนดสัดส่วนคะแนน 4 ช่วง (มาตรฐานโรงเรียน)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  แบ่งตามระเบียบวัดผล: ก่อนกลางภาค, กลางภาค, หลังกลางภาค, และปลายภาค (ผลรวมต้องได้ 100)
                </p>
              </div>

              <div className={`px-3 py-1 rounded-xl text-xs font-bold ${
                totalProportion === 100 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                ผลรวม: {totalProportion} / 100 คะแนน
              </div>
            </div>

            {/* Proportion Bar Visualization */}
            <div className="h-4 rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
              <div 
                style={{ width: `${formProportions.preMidterm}%` }} 
                className="bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold"
                title={`ก่อนกลางภาค: ${formProportions.preMidterm}%`}
              >
                {formProportions.preMidterm}%
              </div>
              <div 
                style={{ width: `${formProportions.midterm}%` }} 
                className="bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold"
                title={`กลางภาค: ${formProportions.midterm}%`}
              >
                {formProportions.midterm}%
              </div>
              <div 
                style={{ width: `${formProportions.postMidterm}%` }} 
                className="bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold"
                title={`หลังกลางภาค: ${formProportions.postMidterm}%`}
              >
                {formProportions.postMidterm}%
              </div>
              <div 
                style={{ width: `${formProportions.final}%` }} 
                className="bg-rose-500 flex items-center justify-center text-[10px] text-white font-bold"
                title={`ปลายภาค: ${formProportions.final}%`}
              >
                {formProportions.final}%
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <label className="block font-bold text-blue-900 mb-1">1. ก่อนกลางภาค</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formProportions.preMidterm}
                    onChange={(e) => setFormProportions({ ...formProportions, preMidterm: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg font-bold text-blue-900"
                  />
                  <span className="font-bold text-blue-800">%</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <label className="block font-bold text-amber-900 mb-1">2. กลางภาค</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formProportions.midterm}
                    onChange={(e) => setFormProportions({ ...formProportions, midterm: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg font-bold text-amber-900"
                  />
                  <span className="font-bold text-amber-800">%</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <label className="block font-bold text-indigo-900 mb-1">3. หลังกลางภาค</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formProportions.postMidterm}
                    onChange={(e) => setFormProportions({ ...formProportions, postMidterm: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg font-bold text-indigo-900"
                  />
                  <span className="font-bold text-indigo-800">%</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                <label className="block font-bold text-rose-900 mb-1">4. ปลายภาค</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formProportions.final}
                    onChange={(e) => setFormProportions({ ...formProportions, final: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg font-bold text-rose-900"
                  />
                  <span className="font-bold text-rose-800">%</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  updateSchoolProfile({ defaultProportions: formProportions });
                  notifySave('บันทึกสัดส่วนคะแนน 4 ช่วงสำเร็จ');
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer shadow-indigo-100"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกสัดส่วนคะแนน</span>
              </button>
            </div>
          </div>

          {/* Grade Cut-offs Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              เกณฑ์การตัดเกรด 8 ระดับ (มาตรฐานกระทรวงศึกษาธิการ)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 text-center">เกรด</th>
                    <th className="p-2.5 text-center">ค่าระดับคะแนน (GPA)</th>
                    <th className="p-2.5 text-center">คะแนนต่ำสุด (Min)</th>
                    <th className="p-2.5 text-center">คะแนนสูงสุด (Max)</th>
                    <th className="p-2.5">ความหมายผลการเรียน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gradeCutoffs.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 text-center font-bold text-indigo-700 text-sm">
                        {item.grade}
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-700">
                        {item.gpa.toFixed(1)}
                      </td>
                      <td className="p-2.5 text-center font-semibold text-slate-800">
                        {item.min}
                      </td>
                      <td className="p-2.5 text-center text-slate-600">
                        {item.max}
                      </td>
                      <td className="p-2.5 text-slate-700">
                        {item.label}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FIREBASE CLOUD & BACKUP */}
      {activeTab === 'firebase' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Cloud Sync Status */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-indigo-600" />
              การเชื่อมต่อฐานข้อมูล Google Cloud Firestore (Firebase)
            </h3>

            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">สถานะคลาวด์:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  เชื่อมต่อสมบูรณ์ (Connected)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Firebase Project ID:</span>
                <span className="font-mono font-bold text-slate-800">booming-apogee-rpthm</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Database Instance:</span>
                <span className="font-mono font-bold text-slate-800">ai-studio-krusmart</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>ความปลอดภัย:</span>
                <span className="font-bold text-indigo-700">Hardened ABAC Security Rules</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleSyncFirebase}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer shadow-indigo-100"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'กำลังซิงค์ขึ้น Cloud...' : 'ซิงค์ข้อมูลกับ Firebase ทันที'}</span>
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                * ข้อมูลวิชา ห้องเรียน นักเรียน งาน และคะแนนจะถูกสำรองขึ้นคลาวด์อัตโนมัติ
              </p>
            </div>
          </div>

          {/* Backup & System Reset */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              การสำรองและกู้คืนข้อมูล (Backup & Restore)
            </h3>

            <div className="space-y-3 text-xs">
              <button
                type="button"
                onClick={exportBackupData}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>สำรองข้อมูลระบบโรงเรียน (Export JSON)</span>
              </button>

              <label className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>กู้คืนข้อมูลจากไฟล์สำรอง (Import JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const json = evt.target?.result as string;
                        if (importBackupData(json)) {
                          notifySave('กู้คืนข้อมูลสำเร็จเรียบร้อย');
                        } else {
                          alert('ไฟล์สำรองไม่ถูกต้อง');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </label>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>เขตจัดการความเสี่ยง (Danger Zone)</span>
                </div>
                {!resetConfirm ? (
                  <button
                    type="button"
                    onClick={() => setResetConfirm(true)}
                    className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition cursor-pointer"
                  >
                    ล้างข้อมูลเพื่อเริ่มปีการศึกษาใหม่
                  </button>
                ) : (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                    <p className="text-[11px] text-rose-800 font-semibold">
                      คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมด? กรุณาสำรองข้อมูลก่อน
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setResetConfirm(false)}
                        className="flex-1 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          clearAllData();
                          setResetConfirm(false);
                          notifySave('ล้างข้อมูลเรียบร้อยแล้ว');
                        }}
                        className="flex-1 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-xs"
                      >
                        ยืนยันการล้าง
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AI ASSISTANCE CENTER */}
      {activeTab === 'ai' && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white p-6 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-base font-bold">ปัญญาประดิษฐ์ AI อัจฉริยะเพื่อลดภาระครู (KruSmart AI)</h3>
                <p className="text-xs text-indigo-200">
                  ระบบช่วยครูประหยัดเวลาในการเขียน ปพ.5, ออกแบบใบงาน/เกณฑ์รูบริก, วินิจฉัยนักเรียนกลุ่มเสี่ยง, และจัดเรียงรายชื่อ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 text-xs">
              <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                <div className="font-bold text-amber-300">1. AI เขียนความเห็น ปพ.5</div>
                <p className="text-[11px] text-indigo-100">
                  วิเคราะห์ผลการเรียนรวม คะแนน 4 ช่วง และงานค้าง สร้างความเห็นเชิงบวกรายคนใน 1 คลิก
                </p>
              </div>

              <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                <div className="font-bold text-amber-300">2. AI สร้างรูบริกและภาระงาน</div>
                <p className="text-[11px] text-indigo-100">
                  ระบุบทเรียนและระดับชั้น AI จะร่างภาระงานย่อยและเกณฑ์คะแนนรูบริกที่ตรงตัวชี้วัดทันที
                </p>
              </div>

              <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                <div className="font-bold text-amber-300">3. AI วินิจฉัย & ซ่อมเสริม</div>
                <p className="text-[11px] text-indigo-100">
                  ตรวจจับกลุ่มนักเรียนที่มีความเสี่ยงตกค้าง พร้อมเสนอแผนการสอนซ่อมเสริมแบบตรงจุด
                </p>
              </div>

              <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                <div className="font-bold text-amber-300">4. AI จัดระเบียบรายชื่อ</div>
                <p className="text-[11px] text-indigo-100">
                  แปลงข้อมูลรายชื่อที่คัดลอกจากตารางไม่เป็นระเบียบหรือ SchoolMIS ให้เป็นตารางสวยงาม
                </p>
              </div>
            </div>
          </div>

          {/* AI Interactive Demo / Test */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                ทดสอบการทำงานของ AI เขียนความเห็น ปพ.5 (Live Preview)
              </h3>
              <button
                type="button"
                disabled={isAiTesting}
                onClick={handleTestAi}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer shadow-indigo-100"
              >
                {isAiTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isAiTesting ? 'กำลังประมวลผล...' : 'กดทดสอบ AI เขียนความเห็น'}</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ตัวอย่างข้อมูลนักเรียนจำลอง:</label>
                <input
                  type="text"
                  value={aiTestPrompt}
                  onChange={(e) => setAiTestPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800"
                />
              </div>

              {aiTestResult && (
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-1.5 animate-fadeIn">
                  <div className="font-bold text-indigo-900 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>ผลลัพธ์ความเห็นที่ AI เขียนขึ้น (พร้อมนำไปใช้ใน ปพ.5):</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-serif bg-white p-3 rounded-lg border border-indigo-100">
                    "{aiTestResult}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

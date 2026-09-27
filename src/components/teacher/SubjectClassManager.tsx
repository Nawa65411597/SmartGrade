import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BookOpen, 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  School, 
  Users, 
  Check, 
  AlertCircle,
  Palette
} from 'lucide-react';
import { Subject, Classroom } from '../../types';

export const SubjectClassManager: React.FC = () => {
  const { 
    subjects, 
    classrooms, 
    students,
    addSubject, 
    updateSubject, 
    deleteSubject,
    addClassroom, 
    updateClassroom, 
    deleteClassroom,
    setSelectedSubjectId,
    selectedSubjectId
  } = useApp();

  const [activeTab, setActiveTab] = useState<'subjects' | 'classrooms'>('subjects');

  // Subject Modal state
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subCode, setSubCode] = useState('');
  const [subName, setSubName] = useState('');
  const [subGradeLevel, setSubGradeLevel] = useState('ม.2');
  const [subClassroomId, setSubClassroomId] = useState(classrooms[0]?.id || '');
  const [subYear, setSubYear] = useState('2567');
  const [subTerm, setSubTerm] = useState<'1' | '2'>('1');
  const [subColor, setSubColor] = useState('#3B82F6');
  const [subCredit, setSubCredit] = useState(1.5);
  const [subDesc, setSubDesc] = useState('');

  // Classroom Modal state
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Classroom | null>(null);
  const [className, setClassName] = useState('');
  const [classGradeLevel, setClassGradeLevel] = useState('ม.2');
  const [classRoomNumber, setClassRoomNumber] = useState('');
  const [classAdvisor, setClassAdvisor] = useState('');

  const colors = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', 
    '#EC4899', '#06B6D4', '#6366F1', '#14B8A6'
  ];

  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubCode('');
    setSubName('');
    setSubGradeLevel('ม.2');
    setSubClassroomId(classrooms[0]?.id || '');
    setSubYear('2567');
    setSubTerm('1');
    setSubColor('#3B82F6');
    setSubCredit(1.5);
    setSubDesc('');
    setShowSubjectModal(true);
  };

  const handleOpenEditSubject = (sub: Subject) => {
    setEditingSubject(sub);
    setSubCode(sub.code);
    setSubName(sub.name);
    setSubGradeLevel(sub.gradeLevel);
    setSubClassroomId(sub.classroomId);
    setSubYear(sub.academicYear);
    setSubTerm(sub.term);
    setSubColor(sub.color);
    setSubCredit(sub.credit);
    setSubDesc(sub.description || '');
    setShowSubjectModal(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCode.trim() || !subName.trim()) return;

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        code: subCode,
        name: subName,
        gradeLevel: subGradeLevel,
        classroomId: subClassroomId,
        academicYear: subYear,
        term: subTerm,
        color: subColor,
        credit: Number(subCredit),
        description: subDesc,
      });
    } else {
      addSubject({
        code: subCode,
        name: subName,
        gradeLevel: subGradeLevel,
        classroomId: subClassroomId,
        academicYear: subYear,
        term: subTerm,
        color: subColor,
        credit: Number(subCredit),
        description: subDesc,
      });
    }
    setShowSubjectModal(false);
  };

  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassName('');
    setClassGradeLevel('ม.2');
    setClassRoomNumber('');
    setClassAdvisor('');
    setShowClassModal(true);
  };

  const handleOpenEditClass = (cls: Classroom) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setClassGradeLevel(cls.gradeLevel);
    setClassRoomNumber(cls.roomNumber || '');
    setClassAdvisor(cls.advisorName || '');
    setShowClassModal(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    if (editingClass) {
      updateClassroom(editingClass.id, {
        name: className,
        gradeLevel: classGradeLevel,
        roomNumber: classRoomNumber,
        advisorName: classAdvisor,
      });
    } else {
      addClassroom({
        name: className,
        gradeLevel: classGradeLevel,
        roomNumber: classRoomNumber,
        advisorName: classAdvisor,
      });
    }
    setShowClassModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              ศูนย์รวมรายวิชา & ห้องเรียน (หลายวิชา หลายระดับชั้น)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            รองรับครูผู้สอนที่รับผิดชอบหลายวิชา หลายระดับชั้น รวมศูนย์การจัดการไว้ที่หน้าจอเดียว
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('subjects')}
              className={`px-3 py-1 font-semibold rounded-lg transition cursor-pointer ${
                activeTab === 'subjects' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              รายวิชาที่สอน ({subjects.length})
            </button>
            <button
              onClick={() => setActiveTab('classrooms')}
              className={`px-3 py-1 font-semibold rounded-lg transition cursor-pointer ${
                activeTab === 'classrooms' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ห้องเรียน / ระดับชั้น ({classrooms.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'subjects' ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={handleOpenAddSubject}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              + เพิ่มรายวิชาที่สอน
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => {
              const assignedClass = classrooms.find(c => c.id === sub.classroomId);
              const studentCount = students.filter(s => s.classroomId === sub.classroomId).length;
              const isSelected = selectedSubjectId === sub.id;

              return (
                <div
                  key={sub.id}
                  className={`bg-white rounded-2xl p-4 border transition flex flex-col justify-between hover:shadow-md ${
                    isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.color }} />
                        <span className="font-mono font-bold text-slate-900 text-sm">{sub.code}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditSubject(sub)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                          title="แก้ไข"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteSubject(sub.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-800 text-sm mt-2">{sub.name}</h3>
                    {sub.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sub.description}</p>
                    )}

                    <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">ระดับ {sub.gradeLevel}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">ห้อง {assignedClass?.name}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100">{sub.credit} หน่วยกิต</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100">นร. {studentCount} คน</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">ปี {sub.academicYear} / เทอม {sub.term}</span>
                    <button
                      onClick={() => setSelectedSubjectId(sub.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? 'กำลังเปิดใช้งาน' : 'เลือกวิชานี้'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={handleOpenAddClass}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              + เพิ่มห้องเรียนใหม่
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {classrooms.map((cls) => {
              const studentCount = students.filter(s => s.classroomId === cls.id).length;

              return (
                <div key={cls.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm">
                        {cls.gradeLevel}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditClass(cls)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteClassroom(cls.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base mt-2">ห้อง {cls.name}</h3>
                    <div className="text-xs text-slate-500 mt-1">ห้องประจำ: {cls.roomNumber || '-'}</div>
                    <div className="text-xs text-slate-500">ครูที่ปรึกษา: {cls.advisorName || '-'}</div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">จำนวนนักเรียน</span>
                    <span className="font-bold text-indigo-700">{studentCount} คน</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">
              {editingSubject ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาที่สอน'}
            </h3>

            <form onSubmit={handleSaveSubject} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสวิชา</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ค22101"
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ระดับชั้น</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ม.2"
                    value={subGradeLevel}
                    onChange={(e) => setSubGradeLevel(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อวิชา</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น คณิตศาสตร์พื้นฐาน 3"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ห้องเรียนที่สอน</label>
                  <select
                    value={subClassroomId}
                    onChange={(e) => setSubClassroomId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">หน่วยกิต</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={subCredit}
                    onChange={(e) => setSubCredit(parseFloat(e.target.value) || 1.0)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ปีการศึกษา</label>
                  <input
                    type="text"
                    value={subYear}
                    onChange={(e) => setSubYear(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ภาคเรียนที่</label>
                  <select
                    value={subTerm}
                    onChange={(e) => setSubTerm(e.target.value as '1' | '2')}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1">ภาคเรียนที่ 1</option>
                    <option value="2">ภาคเรียนที่ 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">สีประจำวิชา (สำหรับแยกหมวดหมู่)</label>
                <div className="flex items-center gap-2">
                  {colors.map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSubColor(col)}
                      className={`w-6 h-6 rounded-full cursor-pointer transition ${
                        subColor === col ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">คำอธิบายรายวิชา (ถ้ามี)</label>
                <textarea
                  rows={2}
                  value={subDesc}
                  onChange={(e) => setSubDesc(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  {editingSubject ? 'บันทึกการแก้ไข' : 'บันทึกวิชา'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Classroom Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">
              {editingClass ? 'แก้ไขข้อมูลห้องเรียน' : 'เพิ่มห้องเรียนใหม่'}
            </h3>

            <form onSubmit={handleSaveClass} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อห้องเรียน</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ม.2/1 หรือ ป.5/2"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ระดับชั้น</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ม.2"
                    value={classGradeLevel}
                    onChange={(e) => setClassGradeLevel(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ห้องประจำ</label>
                  <input
                    type="text"
                    placeholder="เช่น ห้อง 324"
                    value={classRoomNumber}
                    onChange={(e) => setClassRoomNumber(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ครูที่ปรึกษา</label>
                  <input
                    type="text"
                    placeholder="เช่น ครูสมศรี"
                    value={classAdvisor}
                    onChange={(e) => setClassAdvisor(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  {editingClass ? 'บันทึกการแก้ไข' : 'บันทึกห้องเรียน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

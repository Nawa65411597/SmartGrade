import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Search, 
  Check, 
  X,
  AlertTriangle,
  Sparkles,
  FileCheck,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  FileUp
} from 'lucide-react';
import { Student } from '../../types';

interface ParsedStudentItem {
  seatNumber: number;
  studentCode: string;
  prefix: Student['prefix'];
  fullName: string;
  gender: 'male' | 'female';
  note?: string;
}

export const StudentManager: React.FC = () => {
  const { 
    currentClassroom, 
    currentStudents, 
    addStudent, 
    updateStudent, 
    deleteStudent,
    batchAddStudents,
    selectedClassroomId
  } = useApp();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states for Single Add
  const [seatNumber, setSeatNumber] = useState<number>(currentStudents.length + 1);
  const [studentCode, setStudentCode] = useState<string>('');
  const [prefix, setPrefix] = useState<Student['prefix']>('เด็กชาย');
  const [fullName, setFullName] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [note, setNote] = useState<string>('');

  // Batch import states
  const [batchTab, setBatchTab] = useState<'upload' | 'paste' | 'ai'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [batchText, setBatchText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ParsedStudentItem[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('replace');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredStudents = currentStudents.filter(s => 
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentCode.includes(search) ||
    s.seatNumber.toString() === search
  );

  const resetForm = () => {
    setSeatNumber(currentStudents.length + 1);
    setStudentCode('');
    setPrefix('เด็กชาย');
    setFullName('');
    setGender('male');
    setNote('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (std: Student) => {
    setEditingStudent(std);
    setSeatNumber(std.seatNumber);
    setStudentCode(std.studentCode);
    setPrefix(std.prefix);
    setFullName(std.fullName);
    setGender(std.gender);
    setNote(std.note || '');
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !studentCode.trim()) {
      alert('กรุณากรอกรหัสนักเรียนและชื่อ-นามสกุล');
      return;
    }

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        seatNumber: Number(seatNumber),
        studentCode,
        prefix,
        fullName: fullName.trim(),
        gender,
        note,
      });
      setEditingStudent(null);
    } else {
      addStudent({
        classroomId: selectedClassroomId,
        seatNumber: Number(seatNumber),
        studentCode,
        prefix,
        fullName: fullName.trim(),
        gender,
        note,
      });
      setShowAddModal(false);
    }
    resetForm();
  };

  // 1. Download official template for Excel / SchoolMIS
  const handleDownloadTemplate = () => {
    const headers = ['เลขที่', 'รหัสประจำตัว', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'เพศ', 'หมายเหตุ'];
    const sampleRows = [
      ['1', '50001', 'เด็กชาย', 'กิตติพงษ์', 'บุญรักษา', 'ชาย', 'หัวหน้าห้อง'],
      ['2', '50002', 'เด็กหญิง', 'กัญญารัตน์', 'ใจดี', 'หญิง', ''],
      ['3', '50003', 'เด็กชาย', 'ชนาธิป', 'สุขสมบูรณ์', 'ชาย', ''],
      ['4', '50004', 'เด็กหญิง', 'ณิชาภัทร', 'วงศ์สุวรรณ', 'หญิง', ''],
      ['5', '50005', 'เด็กชาย', 'ธนกฤต', 'ประเสริฐยิ่ง', 'ชาย', '']
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `เทมแพลตรายชื่อนักเรียน_SchoolMIS_${currentClassroom?.name || 'ห้องเรียน'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 2. Parse text lines (from uploaded file or pasted textarea)
  const parseRawStudentText = (text: string): ParsedStudentItem[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const results: ParsedStudentItem[] = [];

    // Filter out header line if present
    const firstLine = lines[0] || '';
    const hasHeader = firstLine.includes('เลขที่') || firstLine.includes('รหัส') || firstLine.includes('ชื่อ') || firstLine.includes('Seat');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    dataLines.forEach((line, index) => {
      // Split by tab or comma
      let cols: string[] = [];
      if (line.includes('\t')) {
        cols = line.split('\t').map(c => c.trim().replace(/^["']|["']$/g, ''));
      } else {
        // Simple CSV splitter
        cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^["']|["']$/g, ''));
      }

      if (cols.length === 0 || cols.every(c => !c)) return;

      let seat = index + 1;
      let code = '';
      let pref: Student['prefix'] = 'เด็กชาย';
      let name = '';
      let gen: 'male' | 'female' = 'male';
      let rowNote = '';

      if (cols.length >= 5) {
        // e.g. [เลขที่, รหัส, คำนำหน้า, ชื่อ, นามสกุล, เพศ, หมายเหตุ]
        seat = parseInt(cols[0]) || (index + 1);
        code = cols[1] || `STD${String(seat).padStart(3, '0')}`;
        const rawPref = cols[2];
        const firstName = cols[3];
        const lastName = cols[4];
        name = `${firstName} ${lastName}`.trim();

        if (rawPref.includes('หญิง') || rawPref.includes('ด.ญ.') || rawPref.includes('นางสาว')) {
          pref = rawPref.includes('นางสาว') ? 'นางสาว' : 'เด็กหญิง';
          gen = 'female';
        } else if (rawPref.includes('นาย')) {
          pref = 'นาย';
          gen = 'male';
        } else {
          pref = 'เด็กชาย';
          gen = 'male';
        }

        if (cols[5]) {
          const rawGen = cols[5].toLowerCase();
          if (rawGen.includes('หญิง') || rawGen === 'f' || rawGen === 'female') gen = 'female';
          if (rawGen.includes('ชาย') || rawGen === 'm' || rawGen === 'male') gen = 'male';
        }
        if (cols[6]) rowNote = cols[6];
      } else if (cols.length === 3 || cols.length === 4) {
        // e.g. [เลขที่, รหัส, ชื่อ-นามสกุล]
        seat = parseInt(cols[0]) || (index + 1);
        code = cols[1] || `STD${String(seat).padStart(3, '0')}`;
        name = cols[2];
        if (cols[3]) rowNote = cols[3];
      } else if (cols.length === 2) {
        // e.g. [รหัส, ชื่อ-นามสกุล]
        code = cols[0];
        name = cols[1];
      } else {
        name = cols[0];
        code = `STD${String(seat).padStart(3, '0')}`;
      }

      // Clean prefix if embedded in name
      if (name.startsWith('เด็กชาย')) {
        pref = 'เด็กชาย';
        gen = 'male';
        name = name.replace(/^เด็กชาย\s*/, '');
      } else if (name.startsWith('เด็กหญิง')) {
        pref = 'เด็กหญิง';
        gen = 'female';
        name = name.replace(/^เด็กหญิง\s*/, '');
      } else if (name.startsWith('นาย')) {
        pref = 'นาย';
        gen = 'male';
        name = name.replace(/^นาย\s*/, '');
      } else if (name.startsWith('นางสาว')) {
        pref = 'นางสาว';
        gen = 'female';
        name = name.replace(/^นางสาว\s*/, '');
      } else if (name.startsWith('ด.ช.')) {
        pref = 'เด็กชาย';
        gen = 'male';
        name = name.replace(/^ด\.ช\.\s*/, '');
      } else if (name.startsWith('ด.ญ.')) {
        pref = 'เด็กหญิง';
        gen = 'female';
        name = name.replace(/^ด\.ญ\.\s*/, '');
      }

      if (name.trim().length > 0) {
        results.push({
          seatNumber: seat,
          studentCode: code,
          prefix: pref,
          fullName: name.trim(),
          gender: gen,
          note: rowNote,
        });
      }
    });

    return results;
  };

  // 3. Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsParsing(true);
    setAiError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setBatchText(text);
        const parsed = parseRawStudentText(text);
        setParsedPreview(parsed);
      } catch (err) {
        setAiError('ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบว่าเป็นไฟล์ CSV หรือข้อความที่ถูกต้อง');
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // 4. Handle Textarea Change
  const handleTextareaChange = (text: string) => {
    setBatchText(text);
    const parsed = parseRawStudentText(text);
    setParsedPreview(parsed);
  };

  // 5. AI Smart Parser for complex/unstructured text from SchoolMIS
  const handleAiParse = async () => {
    if (!batchText.trim()) {
      setAiError('กรุณาวางข้อความหรืออัปโหลดไฟล์ก่อนให้ AI ประมวลผล');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/gemini/parse-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: batchText }),
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถประมวลผลด้วย AI ได้ในขณะนี้');
      }

      const data = await response.json();
      if (Array.isArray(data.students) && data.students.length > 0) {
        const formatted: ParsedStudentItem[] = data.students.map((s: any, idx: number) => ({
          seatNumber: Number(s.seatNumber) || idx + 1,
          studentCode: String(s.studentCode || `STD${String(idx + 1).padStart(3, '0')}`),
          prefix: (s.prefix === 'เด็กหญิง' || s.prefix === 'นางสาว' || s.prefix === 'นาย') ? s.prefix : 'เด็กชาย',
          fullName: s.fullName || '',
          gender: s.gender === 'female' ? 'female' : 'male',
          note: s.note || '',
        }));
        setParsedPreview(formatted);
      } else {
        setAiError('AI ไม่พบรายชื่อนักเรียนในข้อความที่ให้มา กรุณาตรวจสอบข้อความ');
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเรียกใช้ AI');
    } finally {
      setIsAiLoading(false);
    }
  };

  // 6. Confirm Batch Import
  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;

    const count = batchAddStudents(selectedClassroomId, parsedPreview, importMode);
    alert(`นำเข้านักเรียนสำเร็จทั้งหมด ${count} คน (${importMode === 'replace' ? 'แทนที่รายชื่อเดิม' : 'เพิ่มต่อท้าย'})`);
    
    // Reset modal state
    setUploadedFile(null);
    setBatchText('');
    setParsedPreview([]);
    setShowBatchModal(false);
  };

  // 7. Export CSV
  const handleExportCSV = () => {
    const headers = ['เลขที่', 'รหัสประจำตัว', 'คำนำหน้า', 'ชื่อ-นามสกุล', 'เพศ', 'หมายเหตุ'];
    const rows = currentStudents.map(s => [
      s.seatNumber,
      `"${s.studentCode}"`,
      s.prefix,
      `"${s.fullName}"`,
      s.gender === 'male' ? 'ชาย' : 'หญิง',
      `"${s.note || ''}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายชื่อนักเรียน_${currentClassroom?.name || 'ห้อง'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-formal">
      {/* Title & Action Buttons */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              จัดการรายชื่อนักเรียน (ห้อง {currentClassroom?.name})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            นำเข้าชุดใหญ่ด้วยเทมแพลต Excel หรือ SchoolMIS, เพิ่มรายบุคคล และดาวน์โหลดรายชื่อ
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="ส่งออกรายชื่อนักเรียนทั้งหมดในห้องนี้เป็นไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            ส่งออก CSV
          </button>
          
          <button
            onClick={() => {
              setParsedPreview([]);
              setBatchText('');
              setUploadedFile(null);
              setShowBatchModal(true);
            }}
            className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-indigo-200 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
            นำเข้าชุดใหญ่ (เทมแพลต Excel / MIS)
          </button>
          
          <button
            onClick={handleOpenAdd}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + เพิ่มนักเรียนรายคน
          </button>
        </div>
      </div>

      {/* Filter and Stats */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่, รหัส, ชื่อ-นามสกุล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          จำนวนนักเรียนทั้งหมด: <strong className="text-slate-800 font-bold">{currentStudents.length}</strong> คน
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-16 text-center">เลขที่</th>
                <th className="p-3 w-28 text-center">รหัสนักเรียน</th>
                <th className="p-3">ชื่อ - นามสกุล</th>
                <th className="p-3 w-20 text-center">เพศ</th>
                <th className="p-3">หมายเหตุ</th>
                <th className="p-3 w-28 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    ไม่พบรายชื่อนักเรียนในห้องนี้ กรุณากด "นำเข้าชุดใหญ่" เพื่อเริ่มต้น
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 text-center font-bold text-slate-800">
                      {std.seatNumber}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-600 font-medium">
                      {std.studentCode}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      {std.prefix}{std.fullName}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        std.gender === 'male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                      }`}>
                        {std.gender === 'male' ? 'ชาย' : 'หญิง'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {std.note || '-'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(std)}
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="แก้ไขข้อมูลนักเรียน"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(std.id)}
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="ลบนักเรียน"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SINGLE ADD / EDIT MODAL */}
      {(showAddModal || editingStudent) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingStudent ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนรายคน'} (ห้อง {currentClassroom?.name})
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">เลขที่</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={seatNumber}
                    onChange={(e) => setSeatNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รหัสประจำตัว</label>
                  <input
                    type="text"
                    required
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="เช่น 52101"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">คำนำหน้า</label>
                  <select
                    value={prefix}
                    onChange={(e) => {
                      const newPref = e.target.value as Student['prefix'];
                      setPrefix(newPref);
                      setGender((newPref === 'เด็กหญิง' || newPref === 'นางสาว') ? 'female' : 'male');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  >
                    <option value="เด็กชาย">เด็กชาย</option>
                    <option value="เด็กหญิง">เด็กหญิง</option>
                    <option value="นาย">นาย</option>
                    <option value="นางสาว">นางสาว</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">ชื่อ - นามสกุล</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="เช่น สมเกียรติ ยิ่งเจริญ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">เพศ</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={gender === 'male'}
                      onChange={() => setGender('male')}
                    />
                    <span>ชาย</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={gender === 'female'}
                      onChange={() => setGender('female')}
                    />
                    <span>หญิง</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">หมายเหตุ (ถ้ามี)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น หัวหน้าห้อง, นักกีฬา"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStudent(null);
                  }}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {editingStudent ? 'บันทึกการแก้ไข' : 'เพิ่มนักเรียน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE BATCH IMPORT MODAL (TEMPLATE DOWNLOAD & UPLOAD) */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  นำเข้ารายชื่อนักเรียนชุดใหญ่ (ห้อง {currentClassroom?.name})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ดาวน์โหลดเทมแพลต นำไปกรอกใน Excel หรือ SchoolMIS แล้วอัปโหลดกลับเข้าสู่ระบบ
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Download Template Banner */}
            <div className="mt-3 p-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>ขั้นตอนที่ 1: ดาวน์โหลดเทมแพลตแม่แบบ (Excel Template)</span>
                </div>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  ไฟล์ CSV พร้อมฟอร์แมตภาษาไทย UTF-8 BOM รองรับ SchoolMIS, SGS และ Excel ทุกเวอร์ชัน
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer shadow-indigo-100"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดเทมแพลต .CSV</span>
              </button>
            </div>

            {/* Step 2: Tabs for Upload vs Paste vs AI */}
            <div className="mt-4 flex border-b border-slate-200 text-xs font-bold gap-2">
              <button
                onClick={() => setBatchTab('upload')}
                className={`pb-2 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  batchTab === 'upload'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                อัปโหลดไฟล์เทมแพลต (.csv / .txt)
              </button>
              <button
                onClick={() => setBatchTab('paste')}
                className={`pb-2 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  batchTab === 'paste'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                วางข้อความจาก Excel / SchoolMIS
              </button>
              <button
                onClick={() => setBatchTab('ai')}
                className={`pb-2 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  batchTab === 'ai'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                    : 'border-transparent text-indigo-600 hover:text-indigo-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                AI ช่วยจัดระเบียบข้อมูล
              </button>
            </div>

            {/* Tab 1: File Upload */}
            {batchTab === 'upload' && (
              <div className="mt-3 space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-50 hover:bg-indigo-50/30 transition cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                  </div>
                  <p className="text-[11px] text-slate-500">
                    รองรับไฟล์เทมแพลต .CSV ที่บันทึกจาก Excel หรือไฟล์ข้อความจาก SchoolMIS
                  </p>
                  {uploadedFile && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>{uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Copy Paste */}
            {batchTab === 'paste' && (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-slate-500">
                  คัดลอกคอลัมน์จาก Excel หรือ SchoolMIS มาวางได้โดยตรง (เลขที่, รหัส, ชื่อ-นามสกุล, เพศ):
                </p>
                <textarea
                  rows={5}
                  value={batchText}
                  onChange={(e) => handleTextareaChange(e.target.value)}
                  placeholder="ตัวอย่างการวาง:&#10;1  50001  เด็กชายสมชาย ใจดี  ชาย&#10;2  50002  เด็กหญิงวิไลวรรณ รักดี  หญิง"
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Tab 3: AI Smart Parser */}
            {batchTab === 'ai' && (
              <div className="mt-3 space-y-3 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>ระบบ AI จัดการข้อมูลรายชื่ออัจฉริยะ (Gemini AI Parser)</span>
                  </div>
                  <button
                    type="button"
                    disabled={isAiLoading || !batchText.trim()}
                    onClick={handleAiParse}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {isAiLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังจัดระเบียบ...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>ให้ AI ประมวลผล</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  หากท่านคัดลอกรายชื่อจากไฟล์ PDF ตารางเก่า หรือเอกสารที่คอลัมน์ไม่เป็นระเบียบ ให้วางข้อความด้านล่างแล้วกดปุ่ม "ให้ AI ประมวลผล" AI จะแยกเลขที่ รหัส คำนำหน้า และเพศให้อัตโนมัติ
                </p>
                <textarea
                  rows={4}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder="วางข้อความรายชื่อนักเรียนที่คัดลอกมาที่นี่..."
                  className="w-full p-3 font-mono text-xs rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {aiError && (
              <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Step 3: Live Preview Table */}
            <div className="mt-4 flex-1 overflow-hidden flex flex-col border border-slate-200 rounded-xl bg-slate-50">
              <div className="px-3.5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <span>ตัวอย่างข้อมูลที่ตรวจพบ (Preview)</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                    {parsedPreview.length} คน
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[11px]">รูปแบบการนำเข้า:</span>
                  <label className="flex items-center gap-1 cursor-pointer text-slate-700 text-[11px]">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                    />
                    <span>แทนที่รายชื่อเดิม</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-slate-700 text-[11px]">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                    />
                    <span>เพิ่มต่อท้าย</span>
                  </label>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-48 p-2">
                {parsedPreview.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    ยังไม่มีข้อมูล กรุณาอัปโหลดไฟล์เทมแพลต หรือวางข้อความเพื่อดูตัวอย่าง
                  </div>
                ) : (
                  <table className="w-full text-left text-xs bg-white rounded-lg overflow-hidden border border-slate-200">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="p-2 w-12 text-center">เลขที่</th>
                        <th className="p-2 w-24 text-center">รหัส</th>
                        <th className="p-2">ชื่อ - นามสกุล</th>
                        <th className="p-2 w-16 text-center">เพศ</th>
                        <th className="p-2">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedPreview.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="p-2 text-center font-bold text-slate-800">{item.seatNumber}</td>
                          <td className="p-2 text-center font-mono text-slate-600">{item.studentCode}</td>
                          <td className="p-2 font-medium text-slate-900">{item.prefix}{item.fullName}</td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              item.gender === 'male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                            }`}>
                              {item.gender === 'male' ? 'ชาย' : 'หญิง'}
                            </span>
                          </td>
                          <td className="p-2 text-slate-500 text-[11px]">{item.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                * ตรวจสอบความถูกต้องก่อนกดบันทึก
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={parsedPreview.length === 0}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer shadow-indigo-100"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันนำเข้าข้อมูล ({parsedPreview.length} คน)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 text-center animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">ยืนยันการลบนักเรียน</h3>
            <p className="text-xs text-slate-500 mt-1">
              การลบจะนำข้อมูลคะแนนและการส่งงานทั้งหมดของนักเรียนคนนี้ออกจากระบบด้วย คุณแน่ใจหรือไม่?
            </p>
            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  deleteStudent(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Percent, 
  Layers, 
  HelpCircle, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Sliders, 
  ArrowRight,
  Calculator,
  Award
} from 'lucide-react';
import { ScoreProportions } from '../../types';

export const ScoreProportionsView: React.FC = () => {
  const { 
    currentSubject, 
    currentClassroom,
    currentScoreProportions, 
    updateSubjectProportions,
    updateSchoolProfile,
    schoolProfile,
    studentSummaries,
    currentAssignments
  } = useApp();

  const [formProportions, setFormProportions] = useState<ScoreProportions>(currentScoreProportions);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [setAsSchoolDefault, setSetAsSchoolDefault] = useState(false);

  // Calculate sum of proportions
  const totalWeight = formProportions.preMidterm + formProportions.midterm + formProportions.postMidterm + formProportions.final;
  const is100 = totalWeight === 100;

  // Preset templates
  const presets: Array<{ name: string; props: ScoreProportions; desc: string }> = [
    {
      name: 'มาตรฐาน สพฐ. 30 : 20 : 30 : 20',
      props: { preMidterm: 30, midterm: 20, postMidterm: 30, final: 20 },
      desc: 'ก่อนกลางภาค 30 | กลางภาค 20 | หลังกลางภาค 30 | ปลายภาค 20',
    },
    {
      name: 'แบ่งเท่ากัน 4 ช่วง (25 : 25 : 25 : 25)',
      props: { preMidterm: 25, midterm: 25, postMidterm: 25, final: 25 },
      desc: 'กระจายน้ำหนักเท่ากันทุกช่วง ช่วงละ 25 คะแนน',
    },
    {
      name: 'เน้นงานเก็บปฏิบัติ (35 : 15 : 35 : 15)',
      props: { preMidterm: 35, midterm: 15, postMidterm: 35, final: 15 },
      desc: 'ก่อนกลางภาค 35 | กลางภาค 15 | หลังกลางภาค 35 | ปลายภาค 15',
    },
    {
      name: 'เน้นสอบเข้มข้น (20 : 30 : 20 : 30)',
      props: { preMidterm: 20, midterm: 30, postMidterm: 20, final: 30 },
      desc: 'คะแนนสอบกลางภาคและปลายภาคภาคละ 30 คะแนน',
    },
  ];

  const handleApplyPreset = (p: ScoreProportions) => {
    setFormProportions(p);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!is100) {
      alert(`สัดส่วนคะแนนรวมต้องเท่ากับ 100 คะแนนพอดี (ปัจจุบันรวมได้ ${totalWeight} คะแนน)`);
      return;
    }

    if (currentSubject) {
      updateSubjectProportions(currentSubject.id, formProportions);
    }

    if (setAsSchoolDefault) {
      updateSchoolProfile({
        defaultProportions: formProportions
      });
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-5 font-formal">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Percent className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              กำหนดสัดส่วนคะแนน (4 ช่วง) & ระบบเฉลี่ยอัตโนมัติตามบท
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            วิชา {currentSubject?.code} {currentSubject?.name} • ห้อง {currentClassroom?.name || 'ม.2/1'}
          </p>
        </div>

        {/* Total Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
            is100 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            รวมสัดส่วน: {totalWeight} / 100 คะแนน
          </span>
        </div>
      </div>

      {/* Visual Proportion Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>แผนภูมิสัดส่วนคะแนน 100 คะแนน</span>
          <span className={is100 ? 'text-emerald-600' : 'text-rose-600'}>
            {is100 ? '✓ สมบูรณ์ครบ 100%' : '⚠️ สัดส่วนยังไม่ครบ 100'}
          </span>
        </div>
        <div className="h-6 w-full rounded-xl overflow-hidden flex shadow-inner bg-slate-100">
          <div 
            style={{ width: `${formProportions.preMidterm}%` }}
            className="bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold transition-all"
            title={`ก่อนกลางภาค: ${formProportions.preMidterm}%`}
          >
            {formProportions.preMidterm > 8 && `ก่อนกลาง ${formProportions.preMidterm}%`}
          </div>
          <div 
            style={{ width: `${formProportions.midterm}%` }}
            className="bg-amber-500 flex items-center justify-center text-white text-[11px] font-bold transition-all"
            title={`กลางภาค: ${formProportions.midterm}%`}
          >
            {formProportions.midterm > 8 && `กลาง ${formProportions.midterm}%`}
          </div>
          <div 
            style={{ width: `${formProportions.postMidterm}%` }}
            className="bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold transition-all"
            title={`หลังกลางภาค: ${formProportions.postMidterm}%`}
          >
            {formProportions.postMidterm > 8 && `หลังกลาง ${formProportions.postMidterm}%`}
          </div>
          <div 
            style={{ width: `${formProportions.final}%` }}
            className="bg-rose-500 flex items-center justify-center text-white text-[11px] font-bold transition-all"
            title={`ปลายภาค: ${formProportions.final}%`}
          >
            {formProportions.final > 8 && `ปลาย ${formProportions.final}%`}
          </div>
        </div>
      </div>

      {/* Configuration Form & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Form Inputs (2 Cols) */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              กำหนดคะแนนเต็มในแต่ละช่วงการประเมิน (รวม 100)
            </h3>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                บันทึกสัดส่วนเรียบร้อย
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. ก่อนกลางภาค */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-950">
                  1. คะแนนก่อนกลางภาค (Pre-midterm)
                </label>
                <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  {formProportions.preMidterm} คะแนน
                </span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={formProportions.preMidterm}
                onChange={(e) => setFormProportions({ ...formProportions, preMidterm: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm font-bold text-center"
              />
              <p className="text-[11px] text-blue-700">
                รวมคะแนนงานย่อยตามบท (Unit) ก่อนสอบกลางภาค และเฉลี่ยทอนเข้าสัดส่วนนี้อัตโนมัติ
              </p>
            </div>

            {/* 2. กลางภาค */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950">
                  2. คะแนนสอบกลางภาค (Midterm)
                </label>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  {formProportions.midterm} คะแนน
                </span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={formProportions.midterm}
                onChange={(e) => setFormProportions({ ...formProportions, midterm: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-center"
              />
              <p className="text-[11px] text-amber-700">
                คะแนนสอบกลางภาค (เปิดเผยคะแนนสอบให้นักเรียนดูได้ในหน้านักเรียน)
              </p>
            </div>

            {/* 3. หลังกลางภาค */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-950">
                  3. คะแนนหลังกลางภาค (Post-midterm)
                </label>
                <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                  {formProportions.postMidterm} คะแนน
                </span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={formProportions.postMidterm}
                onChange={(e) => setFormProportions({ ...formProportions, postMidterm: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm font-bold text-center"
              />
              <p className="text-[11px] text-indigo-700">
                รวมคะแนนงานย่อยตามบท (Unit) หลังสอบกลางภาค และเฉลี่ยทอนเข้าสัดส่วนนี้อัตโนมัติ
              </p>
            </div>

            {/* 4. ปลายภาค */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-rose-950">
                  4. คะแนนสอบปลายภาค (Final)
                </label>
                <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                  {formProportions.final} คะแนน
                </span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={formProportions.final}
                onChange={(e) => setFormProportions({ ...formProportions, final: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-sm font-bold text-center"
              />
              <p className="text-[11px] text-rose-700">
                คะแนนสอบปลายภาค (เปิดเผยคะแนนสอบให้นักเรียนดูได้ในหน้านักเรียน)
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={setAsSchoolDefault}
                onChange={(e) => setSetAsSchoolDefault(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>กำหนดเป็นสัดส่วนมาตรฐานกลางของทั้งโรงเรียนด้วย</span>
            </label>

            <button
              type="submit"
              disabled={!is100}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                is100
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการตั้งค่าสัดส่วนคะแนน</span>
            </button>
          </div>
        </form>

        {/* Quick Templates & Explanation */}
        <div className="space-y-4">
          {/* Preset Buttons */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              แม่แบบสัดส่วนยอดนิยม
            </h3>
            <div className="space-y-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset.props)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition cursor-pointer text-xs group"
                >
                  <div className="font-bold text-slate-800 group-hover:text-indigo-900">
                    {preset.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {preset.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* How Average Works Info Box */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 text-xs text-indigo-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-indigo-900">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>กลไกการเฉลี่ยอัตโนมัติตามบท (Automatic Unit Averaging):</span>
            </div>
            <p className="text-[11px] leading-relaxed text-indigo-800">
              คุณครูสามารถกำหนดภาระงานย่อยในแต่ละบทด้วยคะแนนดิบเท่าใดก็ได้ (เช่น บทที่ 1 มีงาน 3 ชิ้นรวม 30 คะแนน, บทที่ 2 มีงาน 2 ชิ้นรวม 40 คะแนน) 
              ระบบจะคิดคะแนนร้อยละของแต่ละบท แล้วนำมา<strong>เฉลี่ยถ่วงน้ำหนักตามบท</strong>เพื่อแปลงเป็นคะแนนเต็มของช่วงนั้น (เช่น 30 คะแนนก่อนกลางภาค) ให้อัตโนมัติ ป้องกันไม่ให้บทที่มีคะแนนดิบเยอะได้เปรียบบทอื่น
            </p>
          </div>
        </div>
      </div>

      {/* Live Preview Table of 4-Period Weighted Scores for Students */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              ตารางแสดงคะแนนเฉลี่ย 4 ช่วงเปรียบเทียบคะแนนดิบ ({studentSummaries.length} คน)
            </h3>
            <p className="text-xs text-slate-500">
              ระบบแปลงคะแนนดิบจากทุกบทและงานย่อย มาเป็นคะแนนสัดส่วนจริงอัตโนมัติ
            </p>
          </div>
        </div>

        {studentSummaries.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            ยังไม่มีข้อมูลนักเรียนในห้องนี้
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold text-center">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">เลขที่</th>
                  <th className="py-2.5 px-3 text-left w-48">ชื่อ - สกุล</th>
                  <th className="py-2.5 px-3 bg-blue-50/80 text-blue-900 border-l border-r border-blue-200">
                    <div>ก่อนกลางภาค</div>
                    <div className="text-[10px] font-normal text-blue-700">(เต็ม {currentScoreProportions.preMidterm})</div>
                  </th>
                  <th className="py-2.5 px-3 bg-amber-50/80 text-amber-900 border-r border-amber-200">
                    <div>กลางภาค</div>
                    <div className="text-[10px] font-normal text-amber-700">(เต็ม {currentScoreProportions.midterm})</div>
                  </th>
                  <th className="py-2.5 px-3 bg-indigo-50/80 text-indigo-900 border-r border-indigo-200">
                    <div>หลังกลางภาค</div>
                    <div className="text-[10px] font-normal text-indigo-700">(เต็ม {currentScoreProportions.postMidterm})</div>
                  </th>
                  <th className="py-2.5 px-3 bg-rose-50/80 text-rose-900 border-r border-rose-200">
                    <div>ปลายภาค</div>
                    <div className="text-[10px] font-normal text-rose-700">(เต็ม {currentScoreProportions.final})</div>
                  </th>
                  <th className="py-2.5 px-3 bg-slate-200 text-slate-900 font-black">
                    <div>รวม 100</div>
                  </th>
                  <th className="py-2.5 px-3 text-center w-16">
                    <div>เกรด</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-center">
                {studentSummaries.map((s) => (
                  <tr key={s.student.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      {s.student.seatNumber}
                    </td>
                    <td className="py-2.5 px-3 text-left font-semibold text-slate-900">
                      {s.student.prefix}{s.student.fullName}
                    </td>
                    
                    {/* ก่อนกลางภาค */}
                    <td className="py-2.5 px-3 bg-blue-50/30 border-l border-r border-blue-100">
                      <span className="font-bold text-blue-900 text-sm">
                        {s.preMidtermScore}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        ดิบ {s.preMidtermDetail.rawScore}/{s.preMidtermDetail.rawMaxScore} ({s.preMidtermDetail.tasksCount} งาน)
                      </div>
                    </td>

                    {/* กลางภาค */}
                    <td className="py-2.5 px-3 bg-amber-50/30 border-r border-amber-100">
                      <span className="font-bold text-amber-900 text-sm">
                        {s.midtermScore}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        ดิบ {s.midtermDetail.rawScore}/{s.midtermDetail.rawMaxScore}
                      </div>
                    </td>

                    {/* หลังกลางภาค */}
                    <td className="py-2.5 px-3 bg-indigo-50/30 border-r border-indigo-100">
                      <span className="font-bold text-indigo-900 text-sm">
                        {s.postMidtermScore}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        ดิบ {s.postMidtermDetail.rawScore}/{s.postMidtermDetail.rawMaxScore} ({s.postMidtermDetail.tasksCount} งาน)
                      </div>
                    </td>

                    {/* ปลายภาค */}
                    <td className="py-2.5 px-3 bg-rose-50/30 border-r border-rose-100">
                      <span className="font-bold text-rose-900 text-sm">
                        {s.finalScore}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        ดิบ {s.finalDetail.rawScore}/{s.finalDetail.rawMaxScore}
                      </div>
                    </td>

                    {/* รวม 100 */}
                    <td className="py-2.5 px-3 bg-slate-50 font-black text-slate-900 text-sm">
                      {s.totalScore}
                    </td>

                    {/* เกรด */}
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded font-black text-xs ${
                        s.gpa >= 3 ? 'bg-emerald-100 text-emerald-800' :
                        s.gpa >= 2 ? 'bg-blue-100 text-blue-800' :
                        s.gpa >= 1 ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {s.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

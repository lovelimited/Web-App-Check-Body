import { useState } from 'react';
import Swal from 'sweetalert2';
import {
  Shirt, PersonStanding, CheckCircle2, ArrowLeft,
  Save, Lock, ChevronRight, UserCheck, Delete,
} from 'lucide-react';
import { getStudents, submitScores } from '../api';
import { ALL_CLASSES, CLASS_COLORS, CLASS_PINS, scoreColorClass, getTodayISO } from '../config';

export default function Entry({ onDone }) {
  const [step, setStep] = useState('select'); // select, pin, students
  const [selectedClass, setSelectedClass] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    setPinInput('');
    setStep('pin');
  };

  const handlePinKeyPress = async (key) => {
    if (key === 'backspace') {
      setPinInput(prev => prev.slice(0, -1));
      return;
    }
    
    if (pinInput.length >= 4) return;
    
    const newPin = pinInput + key;
    setPinInput(newPin);

    if (newPin.length === 4) {
      if (newPin !== CLASS_PINS[selectedClass]) {
        Swal.fire({ icon: 'error', title: 'PIN ไม่ถูกต้อง', text: 'กรุณาลองใหม่อีกครั้ง', confirmButtonColor: '#EF4444' });
        setPinInput('');
        return;
      }

      Swal.fire({ title: 'กำลังโหลดรายชื่อ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await getStudents(selectedClass);
      Swal.close();

      if (!res.success || !res.students?.length) {
        Swal.fire({ icon: 'warning', title: 'ไม่พบข้อมูลนักเรียน', text: `ชั้น ${selectedClass} ไม่มีข้อมูลในระบบ`, confirmButtonColor: '#F59E0B' });
        setStep('select');
        return;
      }

      setStudents(res.students);
      const initScores = {};
      res.students.forEach((_, i) => { initScores[i] = { dress: 0, body: 0 }; });
      setScores(initScores);
      setStep('students');
    }
  };

  const setScore = (idx, type, val) => {
    setScores(prev => ({ ...prev, [idx]: { ...prev[idx], [type]: val } }));
  };

  const filled = Object.values(scores).filter(s => s.dress > 0 && s.body > 0).length;
  const total  = students.length;
  const pct    = total ? Math.round((filled / total) * 100) : 0;

  const handleSubmit = async () => {
    if (filled === 0) {
      Swal.fire({ icon: 'warning', title: 'ยังไม่ได้ให้คะแนน', text: 'กรุณาให้คะแนนอย่างน้อย 1 คน', confirmButtonColor: '#F59E0B' });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      icon: 'question',
      title: `ยืนยันบันทึก ${filled} คน?`,
      text: 'นักเรียนที่ไม่ได้เลือกคะแนนในรอบนี้ จะไม่ถูกบันทึก/แก้ไข',
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'กลับไปแก้ไข',
      confirmButtonColor: '#4F46E5',
    });
    if (!isConfirmed) return;

    setSaving(true);
    Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const payload = students
      .map((s, i) => ({
        prefix: s.prefix, first_name: s.first_name,
        last_name: s.last_name, nickname: s.nickname,
        score_dress: scores[i]?.dress ?? 0,
        score_body:  scores[i]?.body  ?? 0,
      }))
      .filter(s => s.score_dress > 0 && s.score_body > 0);

    try {
      const res = await submitScores(selectedClass, getTodayISO(), payload);
      Swal.close();
      if (res.success) {
        await Swal.fire({
          icon: 'success', title: 'บันทึกสำเร็จ!',
          text: `บันทึกข้อมูล ${res.saved} คน เรียบร้อย`,
          confirmButtonColor: '#10B981',
        });
        setStep('select');
        onDone();
      } else {
        Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: res.error, confirmButtonColor: '#EF4444' });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: e.message, confirmButtonColor: '#EF4444' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in space-y-6">
      {step === 'select' && (
        <div className="card space-y-5">
          <div>
            <h1 className="text-2xl font-extrabold text-indigo-800 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-indigo-600" /> กรอกคะแนนตรวจร่างกาย
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> เลือกชั้นเรียน แล้วกรอก PIN เพื่อเข้าสู่ระบบ
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {ALL_CLASSES.map(cls => {
              const c = CLASS_COLORS[cls];
              return (
                <button key={cls} onClick={() => handleSelectClass(cls)}
                  className={`${c.bg} ${c.text} ${c.hover} hover:text-white group py-6 rounded-2xl font-black text-2xl transition-all duration-200 shadow-sm hover:shadow-lg active:scale-95 flex flex-col items-center gap-1`}>
                  {cls}
                  <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 'pin' && (
        <div className="card max-w-sm mx-auto space-y-6 text-center">
          <div>
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setStep('select')} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-extrabold text-indigo-800">ชั้น {selectedClass}</h1>
              <div className="w-9"></div> {/* Spacer for centering */}
            </div>
            <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
              <Lock className="w-3.5 h-3.5" /> กรอก PIN 4 หลักเพื่อเข้าสู่ระบบ
            </p>
          </div>

          <div className="flex justify-center gap-3 my-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${i < pinInput.length ? 'bg-indigo-600 scale-110' : 'bg-indigo-100'}`}></div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button key={n} onClick={() => handlePinKeyPress(n.toString())}
                className="py-4 text-2xl font-bold text-gray-700 bg-gray-50 hover:bg-indigo-100 hover:text-indigo-700 active:bg-indigo-200 rounded-2xl transition-all">
                {n}
              </button>
            ))}
            <div></div>
            <button onClick={() => handlePinKeyPress('0')}
              className="py-4 text-2xl font-bold text-gray-700 bg-gray-50 hover:bg-indigo-100 hover:text-indigo-700 active:bg-indigo-200 rounded-2xl transition-all">
              0
            </button>
            <button onClick={() => handlePinKeyPress('backspace')}
              className="py-4 flex justify-center items-center text-gray-500 bg-gray-50 hover:bg-red-100 hover:text-red-600 active:bg-red-200 rounded-2xl transition-all">
              <Delete className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {step === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-extrabold text-indigo-800">ชั้น {selectedClass}</h1>
              <p className="text-sm text-gray-500">{filled} / {total} คน · {pct}%</p>
            </div>
            <button onClick={() => setStep('select')} className="btn-secondary flex items-center gap-1.5 text-sm">
              <ArrowLeft className="w-4 h-4" /> เปลี่ยนชั้น
            </button>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Student Cards */}
          <div className="space-y-3">
            {students.map((s, i) => (
              <StudentCard key={i} index={i} student={s}
                score={scores[i] ?? { dress: 0, body: 0 }}
                onScore={setScore}
              />
            ))}
          </div>

          <button onClick={handleSubmit} disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-lg rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> บันทึกข้อมูลทั้งชั้น
          </button>
        </div>
      )}
    </div>
  );
}

function StudentCard({ index, student, score, onScore }) {
  const done = score.dress > 0 && score.body > 0;
  return (
    <div className={`card border transition-all ${done ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-600 shrink-0 text-sm">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 truncate">
            {student.prefix}{student.first_name} {student.last_name}
          </p>
          {student.nickname && (
            <p className="text-xs text-gray-400">"{student.nickname}"</p>
          )}
        </div>
        {done && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
      </div>

      <div className="space-y-3">
        <ScoreRow label="เครื่องแต่งกาย" Icon={Shirt} type="dress" value={score.dress}
          onSelect={val => onScore(index, 'dress', val)} selClass="sel-dress"
          labelColor="text-blue-600" />
        <ScoreRow label="สภาพร่างกาย" Icon={PersonStanding} type="body" value={score.body}
          onSelect={val => onScore(index, 'body', val)} selClass="sel-body"
          labelColor="text-purple-600" />
      </div>

      {done && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end items-center gap-2">
          <span className="text-xs text-gray-500">รวม</span>
          <span className={`font-black text-lg ${(score.dress + score.body) >= 14 ? 'text-green-600' : 'text-red-500'}`}>
            {score.dress + score.body} / 20
          </span>
        </div>
      )}
    </div>
  );
}

function ScoreRow({ label, Icon, type, value, onSelect, selClass, labelColor }) {
  return (
    <div>
      <p className={`text-xs font-bold mb-2 flex items-center gap-1 ${labelColor}`}>
        <Icon className="w-3.5 h-3.5" /> {label}
      </p>
      <div className="grid grid-cols-5 sm:flex gap-1.5 sm:gap-1">
        {[1,2,3,4,5,6,7,8,9,10].map(n => {
          const isSelected = value === n;
          const hasSelection = value > 0;
          const defaultColor = scoreColorClass(n);
          const fadedColor = 'bg-gray-50 text-gray-400 border-gray-200 opacity-60 grayscale';
          const btnColor = hasSelection && !isSelected ? fadedColor : defaultColor;

          return (
            <button key={n} type="button" onClick={() => onSelect(value === n ? 0 : n)}
              style={{ touchAction: 'manipulation' }}
              className={`score-btn w-full sm:w-9 sm:h-9 py-2 sm:py-0 ${btnColor} ${isSelected ? selClass : ''}`}>
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import type { Medication } from '../types';

interface MedicationFormModalProps {
  medication: Medication | null;
  onSave: (med: Omit<Medication, 'id' | 'taken'>) => void;
  onClose: () => void;
}

const dayOptions = [
  { label: '日', value: 0 }, { label: '月', value: 1 }, { label: '火', value: 2 },
  { label: '水', value: 3 }, { label: '木', value: 4 }, { label: '金', value: 5 },
  { label: '土', value: 6 }
];

const MedicationFormModal: React.FC<MedicationFormModalProps> = ({ medication, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('朝食後');
  const [quantity, setQuantity] = useState('');
  const [pillsPerDose, setPillsPerDose] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderDays, setReminderDays] = useState<number[]>([]);

  useEffect(() => {
    if (medication) {
      setName(medication.name);
      setDosage(medication.dosage);
      setTime(medication.time);
      setQuantity(medication.quantity.toString());
      setPillsPerDose(medication.pillsPerDose.toString());
      setReminderTime(medication.reminderTime || '');
      setReminderDays(medication.reminderDays || []);
    } else {
      // Set default for new medication
      setReminderDays([0, 1, 2, 3, 4, 5, 6]); // Default to every day
    }
  }, [medication]);

  const handleDayToggle = (dayValue: number) => {
    setReminderDays(prevDays => 
      prevDays.includes(dayValue) 
        ? prevDays.filter(d => d !== dayValue)
        : [...prevDays, dayValue]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim() || !time || !quantity || !pillsPerDose) {
      alert('すべての項目を正しく入力してください。');
      return;
    }
    const numQuantity = parseInt(quantity, 10);
    const numPillsPerDose = parseInt(pillsPerDose, 10);

    if (isNaN(numQuantity) || isNaN(numPillsPerDose) || numQuantity < 0 || numPillsPerDose <= 0) {
      alert('錠数は正しい数字で入力してください。');
      return;
    }

    onSave({
      name,
      dosage,
      time,
      quantity: numQuantity,
      pillsPerDose: numPillsPerDose,
      reminderTime: reminderTime || undefined,
      reminderDays: reminderDays.length > 0 ? reminderDays.sort() : undefined,
    });
  };
  
  const inputClasses = "w-full p-3 border border-gray-300 bg-white text-gray-800 rounded-lg text-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder:text-gray-400";
  const labelClasses = "block text-lg font-medium text-gray-700 mb-1";


  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-lg m-4 transform transition-all max-h-[90vh] overflow-y-auto" 
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-2xl font-bold text-gray-800 mb-4 pb-4 border-b border-blue-300">{medication ? 'お薬の編集' : '新しいお薬の追加'}</h2>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div>
            <label htmlFor="name" className={labelClasses}>お薬の名前</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dosage" className={labelClasses}>用量 (例: 1錠)</label>
              <input type="text" id="dosage" value={dosage} onChange={e => setDosage(e.target.value)} className={inputClasses} required />
            </div>
            <div>
              <label htmlFor="pillsPerDose" className={labelClasses}>1回の錠数</label>
              <input type="number" id="pillsPerDose" value={pillsPerDose} onChange={e => setPillsPerDose(e.target.value)} min="1" className={inputClasses} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="time" className={labelClasses}>飲むタイミング</label>
              <select id="time" value={time} onChange={e => setTime(e.target.value)} className={inputClasses}>
                <option value="朝食後">朝食後</option>
                <option value="昼食後">昼食後</option>
                <option value="夕食後">夕食後</option>
                <option value="就寝前">就寝前</option>
              </select>
            </div>
             <div>
              <label htmlFor="quantity" className={labelClasses}>総錠数 (残り)</label>
              <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(e.target.value)} min="0" className={inputClasses} required />
            </div>
          </div>

          <div className="pt-2">
             <h3 className="block text-lg font-medium text-gray-700 mb-2">リマインダー設定</h3>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label htmlFor="reminderTime" className="block text-base font-medium text-gray-600 mb-1">通知時間</label>
                     <input type="time" id="reminderTime" value={reminderTime} onChange={e => setReminderTime(e.target.value)} className={inputClasses} />
                  </div>
                   <div>
                     <label className="block text-base font-medium text-gray-600 mb-1">通知する曜日</label>
                     <div className="flex justify-between items-center bg-white p-1 rounded-lg border border-gray-300">
                       {dayOptions.map(day => (
                         <button
                           type="button"
                           key={day.value}
                           onClick={() => handleDayToggle(day.value)}
                           className={`flex-1 text-center py-1 text-base font-bold rounded ${reminderDays.includes(day.value) ? 'bg-teal-500 text-white' : 'bg-white text-teal-600 hover:bg-teal-50'}`}
                         >
                           {day.label}
                         </button>
                       ))}
                     </div>
                   </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">時間を設定すると、その曜日のその時間に通知が届きます。</p>
              </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-3 text-lg font-bold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-transform transform active:scale-95">キャンセル</button>
            <button type="submit" className="px-6 py-3 text-lg font-bold rounded-lg bg-teal-500 text-white hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 transition-transform transform active:scale-95">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicationFormModal;
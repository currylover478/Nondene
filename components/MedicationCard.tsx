import React from 'react';
import type { Medication } from '../types';

interface MedicationCardProps {
  medication: Medication;
  onToggleTaken: (id: number) => void;
  onEdit: (medication: Medication) => void;
  onDelete: (id: number) => void;
}

const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];

const formatReminder = (days?: number[], time?: string): string | null => {
  if (!time || !days || days.length === 0) return null;

  let dayStr;
  if (days.length === 7) {
    dayStr = '毎日';
  } else if (days.length === 2 && days.includes(0) && days.includes(6)) {
     dayStr = '土日';
  } else if (days.length === 5 && !days.includes(0) && !days.includes(6)) {
     dayStr = '平日';
  } else {
    dayStr = days.map(d => dayLabels[d]).join('・');
  }

  return `${dayStr} ${time}`;
};

const MedicationCard: React.FC<MedicationCardProps> = ({ medication, onToggleTaken, onEdit, onDelete }) => {
  const { id, name, dosage, time, taken, quantity, pillsPerDose, reminderDays, reminderTime } = medication;

  const remainingDays = pillsPerDose > 0 ? Math.floor(quantity / pillsPerDose) : 0;
  const reminderText = formatReminder(reminderDays, reminderTime);

  return (
    <div className={`p-4 rounded-xl transition-all duration-300 flex flex-col gap-3 ${taken ? 'bg-teal-50 text-gray-500' : 'bg-blue-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-grow mr-4">
          <h3 className={`text-xl font-bold ${taken ? 'line-through text-teal-700' : 'text-blue-900'}`}>{name}</h3>
          <p className="text-lg mt-1">{dosage}・{time}</p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={() => onToggleTaken(id)}
            className={`px-6 py-3 text-lg font-bold rounded-lg transition-transform transform active:scale-95 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 ${taken ? 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100 focus:ring-gray-300' : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300'}`}
            disabled={quantity < pillsPerDose && !taken}
            aria-label={taken ? `${name}を飲んだ状態を取り消す` : `${name}を飲む`}
          >
            {taken ? '飲んだ' : '飲む'}
          </button>
        </div>
      </div>
       {reminderText && (
        <div className="flex items-center gap-2 text-base text-gray-600">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
           <span>{reminderText} に通知</span>
        </div>
      )}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200/80">
        <div>
          {quantity < pillsPerDose && !taken ? (
             <p className="text-base font-bold text-red-600">お薬が足りません</p>
          ) : (
             <p className={`text-base font-medium ${remainingDays <= 3 ? 'text-red-600 animate-pulse' : 'text-gray-600'}`}>
               残り約{remainingDays}日分 ({quantity}錠)
             </p>
          )}
        </div>
        <div className="flex items-center">
          <button onClick={() => onEdit(medication)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label={`${name}を編集する`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
          </button>
          <button onClick={() => onDelete(id)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400" aria-label={`${name}を削除する`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicationCard;
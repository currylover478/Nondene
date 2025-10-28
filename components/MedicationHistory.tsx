import React from 'react';
import type { MedicationHistoryEntry } from '../types';

interface MedicationHistoryProps {
  history: MedicationHistoryEntry[];
  onClose: () => void;
}

const MedicationHistory: React.FC<MedicationHistoryProps> = ({ history, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-lg m-4 transform transition-all max-h-[90vh] overflow-y-auto" 
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="history-modal-title" className="text-2xl font-bold text-gray-700 border-b-2 border-teal-500 pb-2 mb-4">
          今日の服用履歴
        </h2>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {history.length > 0 ? (
            history.map(entry => (
              <div key={entry.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <p className="text-lg font-medium text-gray-800">{entry.medicationName}</p>
                <p className="text-lg font-semibold text-teal-600">
                  {new Date(entry.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-10 px-4">
              <p className="text-lg text-gray-500">本日、まだお薬を飲んでいません。</p>
            </div>
          )}
        </div>
        <div className="flex justify-end pt-6">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-3 text-lg font-bold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-transform transform active:scale-95"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicationHistory;
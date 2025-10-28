import React from 'react';
import type { Medication, AccountMode } from '../types';
import MedicationCard from './MedicationCard';

interface MedicationScheduleProps {
  medications: Medication[];
  onToggleTaken: (id: number) => void;
  onAdd: () => void;
  onScan: () => void;
  onEdit: (medication: Medication) => void;
  onDelete: (id: number) => void;
  onShowHistory: () => void;
  onShowSharingSettings: () => void;
  notificationPermission: NotificationPermission;
  accountMode: AccountMode;
}

const MedicationSchedule: React.FC<MedicationScheduleProps> = ({ 
  medications, 
  onToggleTaken, 
  onAdd, 
  onScan, 
  onEdit, 
  onDelete, 
  onShowHistory,
  onShowSharingSettings, 
  notificationPermission,
  accountMode 
}) => {
  const today = new Date();
  const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  const renderNotificationStatus = () => {
    if (accountMode === 'caregiver') return null; // Do not show in caregiver mode

    switch (notificationPermission) {
      case 'granted':
        return (
          <div className="p-2 text-sm bg-green-100 text-green-800 rounded-lg mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>リマインダー通知はオンです。</span>
          </div>
        );
      case 'denied':
        return (
          <div className="p-2 text-sm bg-red-100 text-red-800 rounded-lg mb-4">
            通知がブロックされています。リマインダーを受け取るには、ブラウザの設定で通知を許可してください。
          </div>
        );
      case 'default':
        return (
          <div className="p-2 text-sm bg-yellow-100 text-yellow-800 rounded-lg mb-4">
            リマインダーを受け取るために、ブラウザに表示されるメッセージから通知を許可してください。
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <section className="bg-white p-4 md:p-6 rounded-2xl shadow-lg h-full">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b-2 border-teal-500 pb-2 mb-4">
        <h2 className="text-2xl font-bold text-gray-700">
          {accountMode === 'user' ? '今日のおくすり' : 'お薬の管理（介護者モード）'}
        </h2>
        <div className="flex items-center flex-wrap justify-end gap-2">
           <button
            onClick={onShowHistory}
            className="px-3 py-2 text-base font-bold rounded-lg bg-white text-teal-500 border-2 border-teal-500 hover:bg-teal-50 focus:outline-none focus:ring-4 focus:ring-teal-300 transition-transform transform active:scale-95"
            aria-label="服用履歴を見る"
          >
            履歴
          </button>
           <button
            onClick={onShowSharingSettings}
            className="px-3 py-2 text-base font-bold rounded-lg bg-white text-teal-500 border-2 border-teal-500 hover:bg-teal-50 focus:outline-none focus:ring-4 focus:ring-teal-300 transition-transform transform active:scale-95"
            aria-label="共有設定を開く"
          >
            共有設定
          </button>
           <button 
            onClick={onScan}
            className="px-3 py-2 text-base font-bold rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-transform transform active:scale-95 flex items-center gap-1"
            aria-label="QRコードを読み取る"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 3a1 1 0 011-1h3v2H4v3H2V4a1 1 0 011-1zM3 17a1 1 0 01-1-1v-3h2v3h3v2H4a1 1 0 01-1-1zM17 3a1 1 0 011 1v3h-2V4h-3V2h3a1 1 0 011 1zM17 17a1 1 0 01-1 1h-3v-2h3v-3h2v3a1 1 0 01-1 1zM6 6h8v8H6V6z"/>
            </svg>
            <span>QR読取</span>
          </button>
          <button 
            onClick={onAdd}
            className="px-3 py-2 text-base font-bold rounded-lg bg-teal-500 text-white hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 transition-transform transform active:scale-95 flex items-center gap-1"
            aria-label="お薬を追加する"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>追加</span>
          </button>
        </div>
      </div>
      <p className="text-lg text-gray-500 mb-4">{dateString}</p>
      {renderNotificationStatus()}
      <div className="space-y-4">
        {medications.length > 0 
          ? medications.map(med => (
              <MedicationCard 
                key={med.id} 
                medication={med} 
                onToggleTaken={onToggleTaken} 
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          : (
            <div className="text-center py-10 px-4 bg-gray-50 rounded-lg">
              <p className="text-lg text-gray-600">お薬は登録されていません。</p>
              <p className="mt-2 text-gray-500">「追加」または「QR読取」ボタンから登録してください。</p>
            </div>
          )
        }
      </div>
    </section>
  );
};

export default MedicationSchedule;
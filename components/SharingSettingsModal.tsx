import React, { useState } from 'react';
import type { SharedContact } from '../types';

interface SharingSettingsModalProps {
  contacts: SharedContact[];
  onAddContact: (contact: Omit<SharedContact, 'id'>) => void;
  onDeleteContact: (id: string) => void;
  onClose: () => void;
}

const SharingSettingsModal: React.FC<SharingSettingsModalProps> = ({ contacts, onAddContact, onDeleteContact, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('お名前とメールアドレスを入力してください。');
      return;
    }
    onAddContact({ name, email });
    setName('');
    setEmail('');
  };

  const inputClasses = "w-full p-3 border border-gray-300 bg-white text-gray-800 rounded-lg text-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder:text-gray-400";
  const labelClasses = "block text-lg font-medium text-gray-700 mb-1";

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sharing-modal-title"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-lg m-4 transform transition-all max-h-[90vh] overflow-y-auto" 
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="sharing-modal-title" className="text-2xl font-bold text-gray-800 mb-4 pb-4 border-b border-gray-300">
          共有設定
        </h2>
        <p className="text-gray-600 mb-4">
          お薬の飲み忘れがあった場合に通知する連絡先を登録します。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-name" className={labelClasses}>お名前</label>
              <input type="text" id="contact-name" value={name} onChange={e => setName(e.target.value)} className={inputClasses} placeholder="息子" required />
            </div>
            <div>
              <label htmlFor="contact-email" className={labelClasses}>メールアドレス</label>
              <input type="email" id="contact-email" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} placeholder="example@email.com" required />
            </div>
          </div>
          <button type="submit" className="w-full px-6 py-3 text-lg font-bold rounded-lg bg-teal-500 text-white hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 transition-transform transform active:scale-95">
            追加
          </button>
        </form>

        <h3 className="text-xl font-bold text-gray-700 mb-3">共有中の連絡先</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {contacts.length > 0 ? (
            contacts.map(contact => (
              <div key={contact.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div>
                  <p className="text-lg font-medium text-gray-800">{contact.name}</p>
                  <p className="text-base text-gray-500">{contact.email}</p>
                </div>
                <button 
                  onClick={() => onDeleteContact(contact.id)} 
                  className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                  aria-label={`${contact.name}さんを削除する`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 px-4">
              <p className="text-lg text-gray-500">まだ誰も共有先に登録されていません。</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-6 mt-4 border-t">
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

export default SharingSettingsModal;

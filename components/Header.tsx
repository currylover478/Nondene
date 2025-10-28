import React from 'react';
import type { AccountMode } from '../types';

interface HeaderProps {
  accountMode: AccountMode;
  onToggleMode: () => void;
}

const CaregiverIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0115 11h1c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1h-2.07zM9 11a5 5 0 014.07-4.93A6.97 6.97 0 009 5a7 7 0 00-6.93 6H1a1 1 0 00-1 1v2c0 .55.45 1 1 1h1.07A5 5 0 015 11z" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);


const Header: React.FC<HeaderProps> = ({ accountMode, onToggleMode }) => {
  const isCaregiverMode = accountMode === 'caregiver';
  
  return (
    <header className="bg-teal-700 text-white shadow-md">
      <div className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Nondene</h1>
          <p className="text-lg text-teal-200 mt-1">
            {isCaregiverMode ? 'ご家族の服薬状況を確認できます' : 'あなたの健康を声でサポート'}
          </p>
        </div>
        <div>
          <button
            onClick={onToggleMode}
            className="flex items-center gap-2 px-4 py-2 text-base font-bold rounded-lg bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-4 focus:ring-teal-400 transition-transform transform active:scale-95"
            aria-label={isCaregiverMode ? "本人モードに切り替える" : "介護者モードに切り替える"}
          >
            {isCaregiverMode ? <UserIcon /> : <CaregiverIcon />}
            <span>{isCaregiverMode ? '本人モードへ' : '介護者モードへ'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
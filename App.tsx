import React, { useState, useEffect, useCallback } from 'react';
import type { Medication, MedicationHistoryEntry, AccountMode, SharedContact } from './types';
import Header from './components/Header';
import MedicationSchedule from './components/MedicationSchedule';
import AIAssistant from './components/AIAssistant';
import MedicationFormModal from './components/MedicationFormModal';
import MedicationHistory from './components/MedicationHistory';
import QRCodeScannerModal from './components/QRCodeScannerModal';
import SharingSettingsModal from './components/SharingSettingsModal';
import { parseJahisQrCode } from './utils/jahisParser';

// Mock data with reminder schedule, used only if localStorage is empty
const initialMedications: Medication[] = [
  { id: 1, name: '高血圧の薬', dosage: '1錠', time: '朝食後', taken: false, quantity: 28, pillsPerDose: 1, reminderTime: '08:30', reminderDays: [0,1,2,3,4,5,6] },
  { id: 2, name: 'コレステロールの薬', dosage: '1錠', time: '朝食後', taken: false, quantity: 27, pillsPerDose: 1, reminderTime: '08:30', reminderDays: [0,1,2,3,4,5,6] },
  { id: 3, name: '血液をサラサラにする薬', dosage: '1錠', time: '昼食後', taken: false, quantity: 3, pillsPerDose: 1, reminderTime: '12:30', reminderDays: [0,1,2,3,4,5,6] },
  { id: 4, name: 'ビタミンD', dosage: '2錠', time: '夕食後', taken: false, quantity: 56, pillsPerDose: 2, reminderTime: '19:00', reminderDays: [1,3,5] },
];

const App: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>(() => {
    try {
      const storedMeds = window.localStorage.getItem('medications');
      return storedMeds ? JSON.parse(storedMeds) : initialMedications;
    } catch (error) {
      console.error("Failed to parse medications from localStorage", error);
      return initialMedications;
    }
  });

  const [medicationHistory, setMedicationHistory] = useState<MedicationHistoryEntry[]>(() => {
    try {
      const storedHistory = window.localStorage.getItem('medicationHistory');
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
      console.error("Failed to parse medication history from localStorage", error);
      return [];
    }
  });
  
  const [sharedContacts, setSharedContacts] = useState<SharedContact[]>(() => {
    try {
      const storedContacts = window.localStorage.getItem('sharedContacts');
      return storedContacts ? JSON.parse(storedContacts) : [];
    } catch (error) {
      console.error("Failed to parse shared contacts from localStorage", error);
      return [];
    }
  });

  const [sentNotifications, setSentNotifications] = useState<Record<number, boolean>>(() => {
    try {
      const lastResetDate = window.localStorage.getItem('lastResetDate');
      const today = new Date().toLocaleDateString();
      if (lastResetDate !== today) {
        return {}; // It's a new day, so start fresh.
      }
      const stored = window.localStorage.getItem('sentNotifications');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Failed to parse sentNotifications from localStorage", error);
      return {};
    }
  });
  
  const [sentMissedNotifications, setSentMissedNotifications] = useState<Record<number, boolean>>(() => {
    try {
      const lastResetDate = window.localStorage.getItem('lastResetDate');
      const today = new Date().toLocaleDateString();
      if (lastResetDate !== today) {
        return {};
      }
      const stored = window.localStorage.getItem('sentMissedNotifications');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Failed to parse sentMissedNotifications from localStorage", error);
      return {};
    }
  });
  
  const [accountMode, setAccountMode] = useState<AccountMode>('user');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  
  // Persist states to localStorage
  useEffect(() => {
    window.localStorage.setItem('medications', JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    window.localStorage.setItem('medicationHistory', JSON.stringify(medicationHistory));
  }, [medicationHistory]);
  
  useEffect(() => {
    window.localStorage.setItem('sharedContacts', JSON.stringify(sharedContacts));
  }, [sharedContacts]);

  useEffect(() => {
    window.localStorage.setItem('sentNotifications', JSON.stringify(sentNotifications));
  }, [sentNotifications]);
  
  useEffect(() => {
    window.localStorage.setItem('sentMissedNotifications', JSON.stringify(sentMissedNotifications));
  }, [sentMissedNotifications]);
  
  useEffect(() => {
    try {
      const storedMode = window.localStorage.getItem('accountMode') as AccountMode | null;
      if (storedMode) {
        setAccountMode(storedMode);
      }
    } catch (error) {
       console.error("Failed to parse accountMode from localStorage", error);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('accountMode', accountMode);
  }, [accountMode]);


  // Effect for daily reset
  useEffect(() => {
    const checkDateAndReset = () => {
        const today = new Date().toLocaleDateString();
        const storedLastResetDate = window.localStorage.getItem('lastResetDate');
        if (storedLastResetDate !== today) {
            console.log("New day detected, resetting medication status.");
            setMedications(meds => meds.map(m => ({ ...m, taken: false })));
            setSentNotifications({});
            setSentMissedNotifications({});
            window.localStorage.setItem('lastResetDate', today);
        }
    };
    checkDateAndReset();
    const interval = setInterval(checkDateAndReset, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Effect for requesting notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            setNotificationPermission(permission);
        });
    }
  }, []);

  // Effect for reminder notifications and missed dose alerts
  const checkAndSendNotifications = useCallback(() => {
    const now = new Date();
    const MISSED_DOSE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

    medications.forEach(med => {
      if (!med.reminderTime || !med.reminderDays) return;

      const currentDay = now.getDay();
      if (!med.reminderDays.includes(currentDay)) return;

      const [hours, minutes] = med.reminderTime.split(':').map(Number);
      const notificationDateTime = new Date();
      notificationDateTime.setHours(hours, minutes, 0, 0);

      // 1. Reminder notification to user
      if (!med.taken && !sentNotifications[med.id] && notificationDateTime <= now) {
        new Notification('おくすりの時間です', {
          body: `「${med.name}」を飲む時間です。`,
          icon: '/favicon.ico'
        });
        setSentNotifications(prev => ({ ...prev, [med.id]: true }));
      }

      // 2. Missed dose notification (simulation) to caregivers
      if (
        !med.taken &&
        !sentMissedNotifications[med.id] &&
        sharedContacts.length > 0 &&
        now.getTime() > notificationDateTime.getTime() + MISSED_DOSE_THRESHOLD_MS
      ) {
        const contactNames = sharedContacts.map(c => c.name).join('さん、');
        alert(`「${med.name}」が時間通りに服用されていません。\n${contactNames}さんに通知を送信しました。`);
        setSentMissedNotifications(prev => ({ ...prev, [med.id]: true }));
      }
    });
  }, [medications, sentNotifications, sentMissedNotifications, sharedContacts]);


  useEffect(() => {
    if (notificationPermission !== 'granted') return;
    
    checkAndSendNotifications();
    const interval = setInterval(checkAndSendNotifications, 60000); 
    return () => clearInterval(interval);
  }, [notificationPermission, checkAndSendNotifications]);


  const handleOpenModal = (med: Medication | null) => {
    setEditingMedication(med);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMedication(null);
  };

  const handleSaveMedication = (medData: Omit<Medication, 'id' | 'taken'>) => {
    if (editingMedication) { // Update existing medication
      setMedications(meds => meds.map(m => 
        m.id === editingMedication.id ? { ...editingMedication, ...medData } : m
      ));
    } else { // Add new medication
      const newMed: Medication = {
        ...medData,
        id: Date.now(),
        taken: false,
      };
      setMedications(meds => [...meds, newMed]);
    }
    handleCloseModal();
  };

  const handleDeleteMedication = (id: number) => {
    if (window.confirm('このお薬を削除してもよろしいですか？')) {
      setMedications(meds => meds.filter(m => m.id !== id));
    }
  };
  
  const handleToggleTaken = (id: number) => {
    setMedications(prevMeds =>
      prevMeds.map(med => {
        if (med.id === id) {
          const alreadyTaken = med.taken;
          if (!alreadyTaken && med.quantity < med.pillsPerDose) {
            return med;
          }

          if (!alreadyTaken) {
            const newHistoryEntry: MedicationHistoryEntry = {
              id: new Date().toISOString(),
              medicationName: med.name,
              timestamp: new Date().toISOString(),
            };
            setMedicationHistory(prevHistory => [newHistoryEntry, ...prevHistory]);
          }

          return { 
            ...med, 
            taken: !alreadyTaken,
            quantity: alreadyTaken ? med.quantity + med.pillsPerDose : med.quantity - med.pillsPerDose
          };
        }
        return med;
      })
    );
  };

  const handleQrCodeScanned = useCallback((decodedText: string) => {
    setIsScannerOpen(false);
    try {
      const parsedMeds = parseJahisQrCode(decodedText);
      if (parsedMeds.length === 0) {
        alert('有効なお薬情報がQRコードから見つかりませんでした。');
        return;
      }

      const newMedications: Medication[] = parsedMeds.map((medData, index) => ({
        id: Date.now() + index, // Ensure unique id for multiple additions
        taken: false,
        name: medData.name || '名称不明の薬',
        dosage: medData.dosage || '1回分',
        time: medData.time || '食後',
        quantity: medData.quantity || 0,
        pillsPerDose: medData.pillsPerDose || 1,
        reminderTime: medData.reminderTime || undefined,
        reminderDays: medData.reminderDays || undefined,
      }));

      setMedications(prevMeds => [...prevMeds, ...newMedications]);
      alert(`${newMedications.length}件のお薬を追加しました。`);

    } catch (error) {
      console.error("Failed to parse QR code", error);
      alert('QRコードの解析に失敗しました。形式が違う可能性があります。');
    }
  }, []);
  
  const handleToggleAccountMode = () => {
    setAccountMode(prevMode => (prevMode === 'user' ? 'caregiver' : 'user'));
  };

  const handleAddContact = (contact: Omit<SharedContact, 'id'>) => {
    const newContact: SharedContact = { ...contact, id: Date.now().toString() };
    setSharedContacts(prev => [...prev, newContact]);
  };
  
  const handleDeleteContact = (id: string) => {
    setSharedContacts(prev => prev.filter(c => c.id !== id));
  };


  const todayHistory = medicationHistory.filter(h => new Date(h.timestamp).toLocaleDateString() === new Date().toLocaleDateString());
  const mainContentClasses = accountMode === 'user'
    ? "flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-8"
    : "flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8";

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header accountMode={accountMode} onToggleMode={handleToggleAccountMode} />
      <main className={mainContentClasses}>
        <div className={accountMode === 'user' ? "lg:w-1/3" : "lg:w-full"}>
          <MedicationSchedule 
            medications={medications} 
            onToggleTaken={handleToggleTaken}
            onAdd={() => handleOpenModal(null)}
            onScan={() => setIsScannerOpen(true)}
            onEdit={(med) => handleOpenModal(med)}
            onDelete={handleDeleteMedication}
            onShowHistory={() => setIsHistoryModalOpen(true)}
            onShowSharingSettings={() => setIsSharingModalOpen(true)}
            notificationPermission={notificationPermission}
            accountMode={accountMode}
          />
        </div>
        {accountMode === 'user' && (
          <div className="lg:w-2/3 flex flex-col gap-8">
            <AIAssistant />
          </div>
        )}
      </main>
      {isModalOpen && (
        <MedicationFormModal 
          medication={editingMedication}
          onSave={handleSaveMedication}
          onClose={handleCloseModal}
        />
      )}
      {isHistoryModalOpen && (
        <MedicationHistory 
          history={todayHistory}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}
       {isScannerOpen && (
        <QRCodeScannerModal
          onScanSuccess={handleQrCodeScanned}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
       {isSharingModalOpen && (
        <SharingSettingsModal
          contacts={sharedContacts}
          onAddContact={handleAddContact}
          onDeleteContact={handleDeleteContact}
          onClose={() => setIsSharingModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
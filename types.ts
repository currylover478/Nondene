export interface Medication {
  id: number;
  name: string;
  dosage: string; // e.g. "1錠"
  time: string;
  taken: boolean;
  quantity: number; // total pills remaining
  pillsPerDose: number; // e.g. 1
  reminderTime?: string; // e.g. "08:30"
  reminderDays?: number[]; // [0, 1, 2, 3, 4, 5, 6] for Sun-Sat
}

export interface Transcript {
  speaker: 'user' | 'assistant';
  text: string;
}

export interface MedicationHistoryEntry {
  id: string; // Unique ID for the history entry, can be a timestamp
  medicationName: string;
  timestamp: string; // ISO string format
}

export type AccountMode = 'user' | 'caregiver';

export interface SharedContact {
  id: string;
  name: string;
  email: string;
}

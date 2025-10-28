import type { Medication } from '../types';

type ParsedMedicationData = Partial<Omit<Medication, 'id' | 'taken'>>;

const extractTime = (usage: string): string => {  
  if (usage.includes('朝食後')) return '朝食後';
  if (usage.includes('昼食後')) return '昼食後';
  if (usage.includes('夕食後')) return '夕食後';
  if (usage.includes('就寝前')) return '就寝前';
  if (usage.includes('朝')) return '朝食後';
  if (usage.includes('昼')) return '昼食後';
  if (usage.includes('夕')) return '夕食後';
  return '食後';
};

const extractDosage = (usage: string): { dosage: string, pillsPerDose: number } => {
    const match = usage.match(/１回([0-9０-９\.]+)[錠カプセル包]/);
    if (match && match[1]) {
        const quantityStr = match[1].replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
        const quantity = parseFloat(quantityStr) || 1;
        const unitMatch = usage.match(/([錠カプセル包])/);
        const unit = unitMatch ? unitMatch[1] : '錠';
        return { dosage: `${quantity}${unit}`, pillsPerDose: quantity };
    }
    return { dosage: '1回分', pillsPerDose: 1 };
};

export const parseJahisQrCode = (qrData: string): ParsedMedicationData[] => {
  if (!qrData.startsWith('JAHIS,')) {
    throw new Error('Not a valid JAHIS QR code format.');
  }

  const lines = qrData.split(/\r\n|\n/);
  const medicationGroups: { [key: number]: { name?: string; quantity?: number; usage?: string } } = {};

  for (const line of lines) {
    const fields = line.split(',');

    const recordType = parseInt(fields[0], 10);
    const groupNumber = parseInt(fields[1], 10);

    if (isNaN(groupNumber)) continue;
    if (!medicationGroups[groupNumber]) {
      medicationGroups[groupNumber] = {};
    }

    switch (recordType) {
      case 51: {
        const name = fields[3]?.replace(/"/g, '');
        const quantity = parseInt(fields[4], 10);
        if (name) medicationGroups[groupNumber].name = name;
        if (!isNaN(quantity)) medicationGroups[groupNumber].quantity = quantity;
        break;
      }
      case 52: {
        const usage = fields[2]?.replace(/"/g, '');
        if (usage) medicationGroups[groupNumber].usage = usage;
        break;
      }
      default:
        break;
    }
  }

  const results: ParsedMedicationData[] = [];
  for (const key in medicationGroups) {
    const group = medicationGroups[key];
    if (group.name && group.usage) {
      const { dosage, pillsPerDose } = extractDosage(group.usage);
      results.push({
        name: group.name,
        quantity: group.quantity,
        time: extractTime(group.usage),
        dosage,
        pillsPerDose,
      });
    }
  }
  
  return results;
};

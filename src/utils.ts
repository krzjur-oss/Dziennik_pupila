import { DiaryEntry } from './types';
import { parseLegacyWeightKg } from './utils/weightParser';

// Extract numeric weight and unit from a diary entry
export function extractWeightWithUnit(entry: DiaryEntry): { value: number; unit: 'kg' | 'g' } | null {
  if (entry.weightKg != null && !isNaN(entry.weightKg) && entry.weightKg > 0) {
    if (entry.weightKg < 1) {
      return { value: Math.round(entry.weightKg * 1000), unit: 'g' };
    }
    return { value: entry.weightKg, unit: 'kg' };
  }

  const legacyKg = parseLegacyWeightKg(`${entry.title} ${entry.content}`);
  if (legacyKg != null) {
    if (legacyKg < 1) {
      return { value: Math.round(legacyKg * 1000), unit: 'g' };
    }
    return { value: legacyKg, unit: 'kg' };
  }

  return null;
}

// Extract numeric weight in kilograms from a diary entry
export function extractWeight(entry: DiaryEntry): number | null {
  if (entry.weightKg != null && !isNaN(entry.weightKg) && entry.weightKg > 0) {
    return entry.weightKg;
  }
  return parseLegacyWeightKg(`${entry.title} ${entry.content}`);
}

// Polish translation utility for pet age calculation with day precision and future check
export function calculateAgeInPolish(birthDateString?: string, referenceDate: Date = new Date()): string {
  if (!birthDateString) return 'Nie podano wieku';

  const birthParts = birthDateString.split('-');
  if (birthParts.length !== 3) return 'Błędna data urodzenia';
  const birthYear = parseInt(birthParts[0], 10);
  const birthMonth = parseInt(birthParts[1], 10) - 1;
  const birthDay = parseInt(birthParts[2], 10);

  const birth = new Date(birthYear, birthMonth, birthDay, 12, 0, 0);
  if (isNaN(birth.getTime())) return 'Błędna data urodzenia';

  const nowYear = referenceDate.getFullYear();
  const nowMonth = referenceDate.getMonth();
  const nowDay = referenceDate.getDate();
  const nowMid = new Date(nowYear, nowMonth, nowDay, 12, 0, 0);

  if (birth.getTime() > nowMid.getTime()) {
    return 'Data z przyszłości';
  }

  let years = nowYear - birthYear;
  let months = nowMonth - birthMonth;
  let days = nowDay - birthDay;

  if (days < 0) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years === 0 && months === 0) {
    const diffTime = Math.abs(nowMid.getTime() - birth.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Dziś urodzony';
    if (diffDays === 1) return '1 dzień';
    return `${diffDays} dni`;
  }

  // Custom pluralization rules in Polish
  if (years === 0) {
    if (months === 1) return '1 miesiąc';
    if (months > 1 && months < 5) return `${months} miesiące`;
    return `${months} miesięcy`;
  }

  let ageStr = '';
  if (years === 1) {
    ageStr = '1 rok';
  } else if (years % 10 >= 2 && years % 10 <= 4 && (years % 100 < 10 || years % 100 >= 20)) {
    ageStr = `${years} lata`;
  } else {
    ageStr = `${years} lat`;
  }

  if (months > 0) {
    if (months === 1) ageStr += ' i 1 miesiąc';
    else if (months > 1 && months < 5) ageStr += ` i ${months} miesiące`;
    else ageStr += ` i ${months} miesięcy`;
  }

  return ageStr;
}

// Compress uploaded file to base64
export function compressImageToBase64(file: File, maxWOrH: number = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale proportionally
        if (width > height) {
          if (width > maxWOrH) {
            height = Math.round((height * maxWOrH) / width);
            width = maxWOrH;
          }
        } else {
          if (height > maxWOrH) {
            width = Math.round((width * maxWOrH) / height);
            height = maxWOrH;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Expose as JPEG with 75% quality for excellent weight/fidelity ratio
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Get pet icon / emoji helper
export function getSpeciesEmoji(species: string): string {
  switch (species.toLowerCase()) {
    case 'pies':
      return '🐶';
    case 'kot':
      return '🐱';
    case 'swinka_morska':
      return '🐹';
    case 'krolik':
      return '🐰';
    case 'chomik':
      return '🐹';
    case 'papuga':
      return '🦜';
    case 'jaszczurka':
      return '🦎';
    case 'rybki':
      return '🐠';
    default:
      return '🐾';
  }
}

// Get user-friendly Polish species name
export function getSpeciesLabel(species: string, customSpecies?: string): string {
  if (species === 'inne' && customSpecies) {
    return customSpecies;
  }
  switch (species.toLowerCase()) {
    case 'pies':
      return 'Pies';
    case 'kot':
      return 'Kot';
    case 'swinka_morska':
      return 'Świnka morska (Kawia)';
    case 'krolik':
      return 'Królik';
    case 'chomik':
      return 'Chomik / Gryzoń';
    case 'papuga':
      return 'Papuga / Ptak';
    case 'jaszczurka':
      return 'Jaszczurka / Gad';
    case 'rybki':
      return 'Rybki / Akwarium';
    default:
      return 'Inne zwierzę';
  }
}

// Map english keys to Polish category names and colors
export const CATEGORIES = {
  zdrowie: { label: 'Zdrowie', color: '#b23b3b', bg: 'bg-red-50/50 text-[#b23b3b] border-red-200/50' },
  jedzenie: { label: 'Karmienie', color: '#c25e25', bg: 'bg-orange-50/50 text-[#c25e25] border-orange-200/50' },
  weterynarz: { label: 'Weterynarz', color: '#7b4f9b', bg: 'bg-purple-50/50 text-[#7b4f9b] border-purple-200/50' },
  aktywnosc: { label: 'Zabawa / Ruch', color: '#3b5f8f', bg: 'bg-blue-50/50 text-[#3b5f8f] border-blue-200/50' },
  pielegnacja: { label: 'Pielęgnacja', color: '#2e7a75', bg: 'bg-teal-50/50 text-[#2e7a75] border-teal-250/30' },
  pomiary: { label: 'Waga / Wymiary', color: '#ad872a', bg: 'bg-yellow-50/50 text-[#ad872a] border-yellow-200/40' },
  notatka: { label: 'Notatka', color: '#5a5a40', bg: 'bg-natural-highlight text-natural-olive border-natural-border/50' },
};

import { DiaryEntry } from './types';

// Extract numeric weight and unit from a diary entry
export function extractWeightWithUnit(entry: DiaryEntry): { value: number; unit: 'kg' | 'g' } | null {
  const text = `${entry.title} ${entry.content}`.toLowerCase();
  
  // Look for weight patterns
  const matches = [
    /waga:?\s*(\d+(?:[.,]\d+)?)\s*(kg|g|kilogram[a-z]*|gram[a-z]*)?/i,
    /(\d+(?:[.,]\d+)?)\s*(kg|g|kilogram[a-z]*|gram[a-z]*)?/i
  ];

  for (const regex of matches) {
    const match = text.match(regex);
    if (match) {
      const hasWagaWord = text.includes('waga');
      const unitPart = match[2];
      const hasExplicitUnit = unitPart && /^(kg|g|kilogram[a-z]*|gram[a-z]*)$/i.test(unitPart);
      
      if (hasWagaWord || hasExplicitUnit) {
        const valStr = match[1].replace(',', '.');
        const val = parseFloat(valStr);
        if (!isNaN(val) && val > 0) {
          const isGram = unitPart && /^(g|gram[a-z]*)$/i.test(unitPart);
          return {
            value: val,
            unit: isGram ? 'g' : 'kg'
          };
        }
      }
    }
  }

  // If category is pomiary, look for any standalone number representing weight or dimension
  if (entry.category === 'pomiary') {
    const fallbackRegex = /(\d+(?:[.,]\d+)?)/;
    const match = text.match(fallbackRegex);
    if (match) {
      const valStr = match[1].replace(',', '.');
      const val = parseFloat(valStr);
      if (!isNaN(val) && val > 0 && val < 500) {
        return {
          value: val,
          unit: 'kg'
        };
      }
    }
  }

  return null;
}

// Extract numeric weight in kilograms from a diary entry
export function extractWeight(entry: DiaryEntry): number | null {
  const parsed = extractWeightWithUnit(entry);
  if (!parsed) return null;
  if (parsed.unit === 'g') {
    return parsed.value / 1000;
  }
  return parsed.value;
}

// Polish translation utility for pet age calculation
export function calculateAgeInPolish(birthDateString?: string): string {
  if (!birthDateString) return 'Nie podano wieku';
  
  const birth = new Date(birthDateString);
  const now = new Date();
  
  if (isNaN(birth.getTime())) return 'Błędna data urodzenia';
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
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
          reject(new Error('Failed to get canvas 2D context'));
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
    case 'jaszczurka':
      return '🦎';
    case 'chomik':
      return '🐹';
    case 'papuga':
      return '🦜';
    case 'krolik':
      return '🐰';
    case 'rybki':
      return '🐠';
    default:
      return '🐾';
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

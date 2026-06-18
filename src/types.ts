export type SpeciesType = 'pies' | 'kot' | 'jaszczurka' | 'chomik' | 'papuga' | 'krolik' | 'rybki' | 'inne';

export interface Pet {
  id: string;
  name: string;
  species: SpeciesType;
  customSpecies?: string;
  birthDate?: string;
  avatar?: string; // base64
  notes?: string;
  createdAt: number;
}

export type CategoryType = 'zdrowie' | 'jedzenie' | 'weterynarz' | 'aktywnosc' | 'pielegnacja' | 'pomiary' | 'notatka';

export type HealthEventType = 'szczepienie' | 'wizyta' | 'odrobaczanie' | 'leki' | 'inne';

export interface HealthEvent {
  id: string;
  petId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  type: HealthEventType;
  title: string;
  notes?: string;
  isCompleted: boolean;
  createdAt: number;
}

export interface DiaryEntry {
  id: string;
  petId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  category: CategoryType;
  title: string;
  content: string;
  photo?: string; // base64
  drawing?: string; // base64 representation of stylus sketch
  dimensions?: {
    length?: number; // cm
    chest?: number;  // cm
    neck?: number;   // cm
    height?: number; // cm
  };
  createdAt: number;
}

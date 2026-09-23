export type SpeciesType = 'pies' | 'kot' | 'swinka_morska' | 'krolik' | 'chomik' | 'papuga' | 'jaszczurka' | 'rybki' | 'inne';

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

export type HealthEventType = 'szczepienie' | 'wizyta' | 'odrobaczanie' | 'leki' | 'pielegnacja' | 'inne';

export type RecurrenceFrequency =
  | 'none'
  | 'daily'
  | 'weekdays'
  | 'weekends'
  | 'weekly'
  | 'biweekly'
  | 'every_3_weeks'
  | 'every_4_weeks'
  | 'monthly'
  | 'every_2_months'
  | 'every_3_months'
  | 'every_6_months'
  | 'yearly'
  | 'custom_days';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number; // for custom_days (e.g. every 2 or 3 days)
  selectedDays?: number[]; // [1, 2, 3, 4, 5, 6, 0] for weekly (1=Pon ... 0=Nd)
  endType: 'count' | 'until_date' | 'forever';
  endCount?: number; // e.g. 10 times
  endDate?: string;  // YYYY-MM-DD
}

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
  recurrence?: RecurrenceRule;
  recurrenceGroupId?: string;
  recurrenceLabel?: string;
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

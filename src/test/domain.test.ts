import { describe, it, expect } from 'vitest';
import { calculateAgeInPolish } from '../utils';
import { generateRecurrenceDates, suggestRecurrenceFromTask } from '../lib/recurrence';

describe('Etap 3: Logika domenowa i funkcje pomocnicze', () => {
  describe('calculateAgeInPolish - dokładność co do dnia i daty z przyszłości', () => {
    const fixedNow = new Date(2026, 8, 24); // 24 września 2026

    it('zwraca "Data z przyszłości" dla daty późniejszej niż dzisiaj', () => {
      expect(calculateAgeInPolish('2026-09-25', fixedNow)).toBe('Data z przyszłości');
      expect(calculateAgeInPolish('2027-01-01', fixedNow)).toBe('Data z przyszłości');
    });

    it('zwraca "Dziś urodzony" dla dzisiejszej daty', () => {
      expect(calculateAgeInPolish('2026-09-24', fixedNow)).toBe('Dziś urodzony');
    });

    it('zwraca dni dla wieku poniżej 1 miesiąca', () => {
      expect(calculateAgeInPolish('2026-09-23', fixedNow)).toBe('1 dzień');
      expect(calculateAgeInPolish('2026-09-14', fixedNow)).toBe('10 dni');
    });

    it('uwzględnia dzień miesiąca przy obliczaniu pełnych miesięcy', () => {
      // Urodzony 25 sierpnia, dziś 24 września -> jeszcze nie minął pełny miesiąc!
      expect(calculateAgeInPolish('2026-08-25', fixedNow)).toBe('30 dni');
      // Urodzony 24 sierpnia, dziś 24 września -> minął dokładnie 1 miesiąc
      expect(calculateAgeInPolish('2026-08-24', fixedNow)).toBe('1 miesiąc');
      // Urodzony 20 sierpnia -> 1 miesiąc
      expect(calculateAgeInPolish('2026-08-20', fixedNow)).toBe('1 miesiąc');
    });

    it('poprawnie odmienia lata i miesiące', () => {
      expect(calculateAgeInPolish('2025-09-24', fixedNow)).toBe('1 rok');
      expect(calculateAgeInPolish('2024-09-24', fixedNow)).toBe('2 lata');
      expect(calculateAgeInPolish('2021-09-24', fixedNow)).toBe('5 lat');
      expect(calculateAgeInPolish('2025-07-24', fixedNow)).toBe('1 rok i 2 miesiące');
    });
  });

  describe('generateRecurrenceDates - obsługa 29 lutego i lat przestępnych', () => {
    it('generuje 28 lutego w latach nieprzestępnych dla reguły rocznej startującej 29 lutego', () => {
      const dates = generateRecurrenceDates('2024-02-29', {
        frequency: 'yearly',
        endType: 'count',
        endCount: 5,
      });

      expect(dates).toEqual([
        '2024-02-29', // rok przestępny
        '2025-02-28', // nieprzestępny (skrócony do 28)
        '2026-02-28', // nieprzestępny
        '2027-02-28', // nieprzestępny
        '2028-02-29', // przestępny
      ]);
    });
  });

  describe('suggestRecurrenceFromTask - odporność na fałszywe dopasowania słów', () => {
    it('nie traktuje słowa "Krok" jako "rok" (nie sugeruje yearly)', () => {
      const res = suggestRecurrenceFromTask('Pierwszy krok w tresurze');
      expect(res.frequency).toBe('none');
    });

    it('nie traktuje "za tydzień" jako "weekly" (nie sugeruje powtarzania co tydzień)', () => {
      const res = suggestRecurrenceFromTask('Wizyta kontrolna za tydzień');
      expect(res.frequency).toBe('none');
    });

    it('poprawnie rozpoznaje szczepienia jako roczne', () => {
      const res = suggestRecurrenceFromTask('Szczepienie p/wściekliźnie');
      expect(res.frequency).toBe('yearly');
    });

    it('poprawnie rozpoznaje pazurki jako co 3 tygodnie', () => {
      const res = suggestRecurrenceFromTask('Obcinanie pazurków');
      expect(res.frequency).toBe('every_3_weeks');
    });

    it('poprawnie rozpoznaje odrobaczanie jako co 3 miesiące', () => {
      const res = suggestRecurrenceFromTask('Odrobaczanie tabletką');
      expect(res.frequency).toBe('every_3_months');
    });
  });
});

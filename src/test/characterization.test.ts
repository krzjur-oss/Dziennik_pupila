import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDB,
  getPets,
  savePet,
  saveEntry,
  getEntries,
  getHealthEvents,
  saveHealthEvent,
  importDatabase,
  resetDBCache,
  runTx
} from '../lib/db';
import { Pet, DiaryEntry, HealthEvent } from '../types';
import { safeStorage } from '../lib/storage';
import { parseLegacyWeightKg } from '../utils/weightParser';
import { calculateAgeInPolish } from '../utils';
import { generateRecurrenceDates, suggestRecurrenceFromTask } from '../lib/recurrence';

describe('Etap 0: Środowisko testowe i testy charakteryzujące', () => {
  beforeEach(async () => {
    resetDBCache();
    const db = await getDB();
    await runTx(['pets', 'entries', 'events'], 'readwrite', (tx) => {
      tx.objectStore('pets').clear();
      tx.objectStore('entries').clear();
      tx.objectStore('events').clear();
    });
  });

  it('środowisko testowe działa poprawnie', () => {
    expect(true).toBe(true);
  });

  it('Etap 1: import w trybie merge nie kasuje istniejących rekordów', async () => {
    const p1: Pet = { id: 'p-orig', name: 'Burek', species: 'pies', createdAt: 1000 };
    await savePet(p1);

    const backup = {
      schemaVersion: 2,
      pets: [{ id: 'p-new', name: 'Mruczek', species: 'kot', createdAt: 2000 }],
      entries: [
        {
          id: 'e-new',
          petId: 'p-new',
          date: '2026-09-20',
          time: '12:00',
          category: 'notatka',
          title: 'Nowy kotek',
          content: 'Treść wpisu',
          createdAt: 2000,
        },
      ],
    };

    await importDatabase(JSON.stringify(backup), 'merge');
    const pets = await getPets();
    expect(pets.map((p) => p.id)).toContain('p-orig');
    expect(pets.map((p) => p.id)).toContain('p-new');
  });

  it('Etap 1: import bez healthEvents nie kasuje istniejących zdarzeń', async () => {
    const ev: HealthEvent = {
      id: 'h-1',
      petId: 'p-orig',
      date: '2026-09-24',
      type: 'szczepienie',
      title: 'Szczepienie p/wściekliźnie',
      isCompleted: false,
      createdAt: 1000,
    };
    await saveHealthEvent(ev);

    const backupWithoutEvents = {
      schemaVersion: 2,
      pets: [{ id: 'p-orig', name: 'Burek', species: 'pies', createdAt: 1000 }],
      entries: [],
    };

    await importDatabase(JSON.stringify(backupWithoutEvents), 'merge');
    let events = await getHealthEvents();
    expect(events.some((e) => e.id === 'h-1')).toBe(true);

    await importDatabase(JSON.stringify(backupWithoutEvents), 'replace');
    events = await getHealthEvents();
    expect(events.some((e) => e.id === 'h-1')).toBe(true);
  });

  it('Etap 2: parseLegacyWeightKg poprawnie parsuje wagi w tekście', () => {
    expect(parseLegacyWeightKg('Waga: 14.5 kg')).toBe(14.5);
    expect(parseLegacyWeightKg('waga 4,5 kg')).toBe(4.5);
    expect(parseLegacyWeightKg('Waga: 950 g')).toBe(0.95);
    expect(parseLegacyWeightKg('Zjadł 200 g karmy')).toBeNull();
    expect(parseLegacyWeightKg('Nadwaga: 3 kg')).toBeNull();
    expect(parseLegacyWeightKg('Obwód szyi: 32 cm')).toBeNull();
  });

  it('Etap 2: migracja IDB v1 -> v2 tworzy poprawny stan bazy', async () => {
    // Przygotuj stary wpis bez wagi w IndexedDB
    const legacyEntry: DiaryEntry = {
      id: 'legacy-e1',
      petId: 'pet-1',
      date: '2026-09-10',
      time: '10:00',
      category: 'pomiary',
      title: 'Kontrola wagi',
      content: 'Waga: 7.8 kg po spacerze',
      createdAt: 1000,
    };
    await saveEntry(legacyEntry);

    // Przygotuj zdarzenie w localStorage z v1
    safeStorage.setItem(
      'DziennikPupila_healthEvents',
      JSON.stringify([
        {
          id: 'legacy-h1',
          petId: 'pet-1',
          date: '2026-09-28',
          type: 'odrobaczanie',
          title: 'Odrobaczanie jesienne',
          isCompleted: false,
          createdAt: 1000,
        },
      ])
    );

    // Wymuś powtórną migrację usuwając flagę
    safeStorage.removeItem('DziennikPupila_migratedEventsV2');
    resetDBCache();

    // Wywołanie getDB() uruchamia runV2DataMigration
    await getDB();

    // Sprawdź czy zdarzenie zostało zmigrowane do IndexedDB
    const events = await getHealthEvents();
    expect(events.some((e) => e.id === 'legacy-h1')).toBe(true);

    // Sprawdź czy waga została sparsowana i zaktualizowana w wpisie
    const entries = await getEntries();
    const migratedEntry = entries.find((e) => e.id === 'legacy-e1');
    expect(migratedEntry).toBeDefined();
    expect(migratedEntry?.weightKg).toBe(7.8);

    // Sprawdź czy flaga migracji została ustawiona
    expect(safeStorage.getItem('DziennikPupila_migratedEventsV2')).toBe('true');
  });

  it('Etap 3: calculateAgeInPolish uwzględnia dni miesiąca i nie toleruje dat z przyszłości', () => {
    const fixedNow = new Date(2026, 8, 24);
    expect(calculateAgeInPolish('2026-09-25', fixedNow)).toBe('Data z przyszłości');
    expect(calculateAgeInPolish('2026-08-25', fixedNow)).toBe('30 dni');
    expect(calculateAgeInPolish('2026-08-24', fixedNow)).toBe('1 miesiąc');
    expect(calculateAgeInPolish('2025-09-24', fixedNow)).toBe('1 rok');
  });

  it('Etap 3: generateRecurrenceDates poprawnie obsługuje 29 lutego', () => {
    const dates = generateRecurrenceDates('2024-02-29', {
      frequency: 'yearly',
      endType: 'count',
      endCount: 5,
    });

    expect(dates).toEqual([
      '2024-02-29',
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
      '2028-02-29',
    ]);
  });

  it('Etap 3: suggestRecurrenceFromTask nie reaguje błędnie na słowa "Krok" czy "za tydzień"', () => {
    expect(suggestRecurrenceFromTask('Pierwszy krok w tresurze').frequency).toBe('none');
    expect(suggestRecurrenceFromTask('Wizyta kontrolna za tydzień').frequency).toBe('none');
    expect(suggestRecurrenceFromTask('Szczepienie p/wściekliźnie').frequency).toBe('yearly');
    expect(suggestRecurrenceFromTask('Obcinanie pazurków').frequency).toBe('every_3_weeks');
    expect(suggestRecurrenceFromTask('Odrobaczanie tabletką').frequency).toBe('every_3_months');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDB,
  getPets,
  savePet,
  deletePet,
  getEntries,
  saveEntry,
  getHealthEvents,
  saveHealthEvent,
  importDatabase,
  exportDatabase,
  resetDBCache,
  runTx
} from '../lib/db';
import { Pet, DiaryEntry, HealthEvent } from '../types';

describe('Etap 1: Trwałość danych i importDatabase', () => {
  beforeEach(async () => {
    resetDBCache();
    const db = await getDB();
    await runTx(['pets', 'entries', 'events'], 'readwrite', (tx) => {
      tx.objectStore('pets').clear();
      tx.objectStore('entries').clear();
      tx.objectStore('events').clear();
    });
  });

  it('import w trybie merge nie kasuje niezależnych rekordów', async () => {
    // Istniejący zwierzak
    const p1: Pet = { id: 'p1', name: 'Burek', species: 'pies', createdAt: 1000, updatedAt: 1000 };
    await savePet(p1);

    // Kopia zapasowa z innym zwierzakiem
    const backup = {
      schemaVersion: 2,
      version: 2,
      timestamp: Date.now(),
      pets: [{ id: 'p2', name: 'Mruczek', species: 'kot', createdAt: 2000, updatedAt: 2000 }],
      entries: [
        {
          id: 'e1',
          petId: 'p2',
          date: '2026-09-20',
          time: '12:00',
          category: 'notatka',
          title: 'Wpis Mruczka',
          content: 'Treść',
          createdAt: 2000,
        },
      ],
    };

    const result = await importDatabase(JSON.stringify(backup), 'merge');
    expect(result.petsCount).toBe(1);
    expect(result.entriesCount).toBe(1);

    const pets = await getPets();
    expect(pets).toHaveLength(2);
    expect(pets.map((p) => p.id)).toContain('p1');
    expect(pets.map((p) => p.id)).toContain('p2');
  });

  it('import w trybie replace czyści bazę i zastępuje nowymi danymi', async () => {
    const p1: Pet = { id: 'p1', name: 'Burek', species: 'pies', createdAt: 1000 };
    await savePet(p1);

    const backup = {
      schemaVersion: 2,
      version: 2,
      timestamp: Date.now(),
      pets: [{ id: 'p2', name: 'Mruczek', species: 'kot', createdAt: 2000 }],
      entries: [],
    };

    await importDatabase(JSON.stringify(backup), 'replace');

    const pets = await getPets();
    expect(pets).toHaveLength(1);
    expect(pets[0].id).toBe('p2');
  });

  it('plik bez healthEvents nie kasuje istniejących zdarzeń w trybie merge ani replace', async () => {
    const ev: HealthEvent = {
      id: 'h1',
      petId: 'p1',
      date: '2026-09-24',
      type: 'szczepienie',
      title: 'Szczepienie p/wściekliźnie',
      isCompleted: false,
      createdAt: 1000,
    };
    await saveHealthEvent(ev);

    const backupWithoutEvents = {
      schemaVersion: 2,
      version: 2,
      timestamp: Date.now(),
      pets: [{ id: 'p1', name: 'Burek', species: 'pies', createdAt: 1000 }],
      entries: [],
    };

    await importDatabase(JSON.stringify(backupWithoutEvents), 'merge');
    let events = await getHealthEvents();
    expect(events).toHaveLength(1);

    await importDatabase(JSON.stringify(backupWithoutEvents), 'replace');
    events = await getHealthEvents();
    expect(events).toHaveLength(1);
  });

  it('rekord bez title lub z niepoprawną datą zostaje pominięty podczas importu', async () => {
    const backup = {
      pets: [{ id: 'p1', name: 'Burek', species: 'pies', createdAt: 1000 }],
      entries: [
        {
          id: 'e1',
          petId: 'p1',
          date: '2026-09-20',
          time: '12:00',
          category: 'notatka',
          title: '', // pusty tytuł
          content: 'Brak tytułu',
          createdAt: 1000,
        },
        {
          id: 'e2',
          petId: 'p1',
          date: 'zła-data',
          time: '12:00',
          category: 'notatka',
          title: 'Zły wpis',
          content: 'Data zła',
          createdAt: 1000,
        },
        {
          id: 'e3',
          petId: 'p1',
          date: '2026-09-20',
          time: '12:00',
          category: 'notatka',
          title: 'Dobry wpis',
          content: 'Wszystko ok',
          createdAt: 1000,
        },
      ],
    };

    const res = await importDatabase(JSON.stringify(backup), 'merge');
    expect(res.entriesCount).toBe(1);
    expect(res.skippedCount).toBe(2);

    const entries = await getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('e3');
  });

  it('deletePet kaskadowo usuwa powiązane wpisy i zdarzenia zdrowotne', async () => {
    const p1: Pet = { id: 'p1', name: 'Burek', species: 'pies', createdAt: 1000 };
    const p2: Pet = { id: 'p2', name: 'Mruczek', species: 'kot', createdAt: 1000 };
    await savePet(p1);
    await savePet(p2);

    const e1: DiaryEntry = {
      id: 'e1',
      petId: 'p1',
      date: '2026-09-20',
      time: '10:00',
      category: 'notatka',
      title: 'Wpis Burka',
      content: 'Burek biega',
      createdAt: 1000,
    };
    const e2: DiaryEntry = {
      id: 'e2',
      petId: 'p2',
      date: '2026-09-20',
      time: '11:00',
      category: 'notatka',
      title: 'Wpis Mruczka',
      content: 'Mruczek spi',
      createdAt: 1000,
    };
    await saveEntry(e1);
    await saveEntry(e2);

    const h1: HealthEvent = {
      id: 'h1',
      petId: 'p1',
      date: '2026-09-25',
      type: 'szczepienie',
      title: 'Szczepienie Burka',
      isCompleted: false,
      createdAt: 1000,
    };
    const h2: HealthEvent = {
      id: 'h2',
      petId: 'p2',
      date: '2026-09-25',
      type: 'odrobaczanie',
      title: 'Odrobaczanie Mruczka',
      isCompleted: false,
      createdAt: 1000,
    };
    await saveHealthEvent(h1);
    await saveHealthEvent(h2);

    // Usuwamy Burka
    await deletePet('p1');

    const pets = await getPets();
    expect(pets).toHaveLength(1);
    expect(pets[0].id).toBe('p2');

    const entries = await getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('e2');

    const events = await getHealthEvents();
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('h2');
  });

  it('przerwana transakcja (abort) odrzuca obietnicę', async () => {
    await expect(
      runTx(['pets'], 'readwrite', (tx) => {
        tx.abort();
      })
    ).rejects.toThrow();
  });
});

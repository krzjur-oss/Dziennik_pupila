import { Pet, DiaryEntry, HealthEvent, MediaItem } from '../types';
import { safeStorage } from './storage';
import { parseLegacyWeightKg } from '../utils/weightParser';

export const DB_NAME = 'DziennikPupilaDB';
export const DB_VERSION = 2;

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

export function resetDBCache(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
  }
  dbInstance = null;
  dbPromise = null;
}

export function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      dbPromise = null;
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn('IndexedDB blocked: wcześniejsze połączenie blokuje migrację wersji');
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      // v1 stores
      if (!db.objectStoreNames.contains('pets')) {
        db.createObjectStore('pets', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('entries')) {
        const entryStore = db.createObjectStore('entries', { keyPath: 'id' });
        entryStore.createIndex('petId', 'petId', { unique: false });
      }

      // v2 stores
      if (!db.objectStoreNames.contains('events')) {
        const eventStore = db.createObjectStore('events', { keyPath: 'id' });
        eventStore.createIndex('petId', 'petId', { unique: false });
        eventStore.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('media')) {
        db.createObjectStore('media', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };

    request.onsuccess = async () => {
      const db = request.result;
      dbInstance = db;

      db.onversionchange = () => {
        console.warn('Wykryto zmianę wersji bazy IndexedDB w innej karcie - zamykanie połączenia');
        db.close();
        dbInstance = null;
        dbPromise = null;
      };

      try {
        await runV2DataMigration(db);
        resolve(db);
      } catch (migrationErr) {
        console.error('Błąd migracji danych do v2:', migrationErr);
        resolve(db); // Rozwiązujemy bazę, aby nie blokować aplikacji
      }
    };
  });

  return dbPromise;
}

/**
 * Jednorazowa migracja zdarzeń z localStorage do IndexedDB oraz normalizacja wagi i cleaningDays
 */
async function runV2DataMigration(db: IDBDatabase): Promise<void> {
  // Sprawdź flagę migracji
  const isMigrated = safeStorage.getItem('DziennikPupila_migratedEventsV2') === 'true';
  if (isMigrated) {
    return;
  }

  // 1. Migracja zdarzeń z localStorage['DziennikPupila_healthEvents']
  const cachedEventsRaw = safeStorage.getItem('DziennikPupila_healthEvents');
  if (cachedEventsRaw) {
    try {
      const parsed: unknown = JSON.parse(cachedEventsRaw);
      if (Array.isArray(parsed)) {
        await runTx(['events'], 'readwrite', (tx) => {
          const store = tx.objectStore('events');
          const seen = new Set<string>();
          for (const raw of parsed) {
            if (isHealthEvent(raw)) {
              const dedupeKey = `${raw.petId}|${raw.date}|${raw.title}|${raw.time || ''}`;
              if (!seen.has(dedupeKey)) {
                seen.add(dedupeKey);
                store.put(raw);
              }
            }
          }
        });
      }
      // Usuń z localStorage dopiero po pomyślnym zapisie w transakcji
      safeStorage.removeItem('DziennikPupila_healthEvents');
    } catch (e) {
      console.warn('Nie udało się przenieść zdarzeń z localStorage do IndexedDB:', e);
    }
  }

  // 2. Migracja cleaning_days_<petId> do pola pet.cleaningDays
  try {
    const petsToUpdate: Pet[] = [];
    await runTx(['pets'], 'readonly', (tx) => {
      const store = tx.objectStore('pets');
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result as Pet[];
        for (const pet of list) {
          const key = `cleaning_days_${pet.id}`;
          const rawDays = safeStorage.getItem(key);
          if (rawDays && !pet.cleaningDays) {
            try {
              const days = JSON.parse(rawDays);
              if (Array.isArray(days)) {
                petsToUpdate.push({ ...pet, cleaningDays: days, updatedAt: Date.now() });
              }
            } catch {
              // ignore
            }
          }
        }
      };
    });

    if (petsToUpdate.length > 0) {
      await runTx(['pets'], 'readwrite', (tx) => {
        const store = tx.objectStore('pets');
        for (const p of petsToUpdate) {
          store.put(p);
        }
      });
      for (const p of petsToUpdate) {
        safeStorage.removeItem(`cleaning_days_${p.id}`);
      }
    }
  } catch (e) {
    console.warn('Błąd migracji cleaning_days:', e);
  }

  // 3. Normalizacja wagi dla starych wpisów (pomiary, weterynarz)
  try {
    const entriesToUpdate: DiaryEntry[] = [];
    await runTx(['entries'], 'readonly', (tx) => {
      const store = tx.objectStore('entries');
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result as DiaryEntry[];
        for (const entry of list) {
          if ((entry.category === 'pomiary' || entry.category === 'weterynarz') && entry.weightKg == null) {
            const parsedKg = parseLegacyWeightKg(`${entry.title} ${entry.content}`);
            if (parsedKg != null) {
              entriesToUpdate.push({ ...entry, weightKg: parsedKg, updatedAt: entry.updatedAt || Date.now() });
            }
          }
        }
      };
    });

    if (entriesToUpdate.length > 0) {
      await runTx(['entries'], 'readwrite', (tx) => {
        const store = tx.objectStore('entries');
        for (const e of entriesToUpdate) {
          store.put(e);
        }
      });
    }
  } catch (e) {
    console.warn('Błąd migracji wagi w wpisach:', e);
  }

  // Ustaw flagę zakończenia migracji
  safeStorage.setItem('DziennikPupila_migratedEventsV2', 'true');
}

/**
 * Wspólny helper transakcji z obsługą oncomplete, onerror i onabort
 */
export async function runTx<T = void>(
  stores: string | string[],
  mode: IDBTransactionMode,
  work: (tx: IDBTransaction) => Promise<T> | T
): Promise<T> {
  const db = await getDB();
  return new Promise<T>((resolve, reject) => {
    let result: T;
    let workCompleted = false;

    const tx = db.transaction(stores, mode);

    tx.oncomplete = () => {
      resolve(result);
    };

    tx.onerror = () => {
      const err = tx.error || new Error('Błąd transakcji bazy danych IndexedDB');
      reject(err);
    };

    tx.onabort = () => {
      const err = tx.error || new Error('Transakcja bazy danych została przerwana (abort). Sprawdź dostępne miejsce na dysku.');
      reject(err);
    };

    try {
      const workRes = work(tx);
      if (workRes instanceof Promise) {
        workRes
          .then((res) => {
            result = res;
            workCompleted = true;
          })
          .catch((err) => {
            try {
              tx.abort();
            } catch {
              // ignore
            }
            reject(err);
          });
      } else {
        result = workRes;
        workCompleted = true;
      }
    } catch (err) {
      try {
        tx.abort();
      } catch {
        // ignore
      }
      reject(err);
    }
  });
}

// -------------------------------------------------------------
// PETS
// -------------------------------------------------------------

export async function getPets(): Promise<Pet[]> {
  return runTx(['pets'], 'readonly', (tx) => {
    return new Promise<Pet[]>((resolve, reject) => {
      const store = tx.objectStore('pets');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as Pet[]);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function savePet(pet: Pet): Promise<void> {
  const now = Date.now();
  const toSave: Pet = {
    ...pet,
    updatedAt: now,
  };
  await runTx(['pets'], 'readwrite', (tx) => {
    const store = tx.objectStore('pets');
    store.put(toSave);
  });
  triggerStoragePersist();
}

/**
 * Kaskadowe usunięcie zwierzaka, jego wpisów, mediów i zdarzeń
 */
export async function deletePet(id: string): Promise<void> {
  await runTx(['pets', 'entries', 'events'], 'readwrite', (tx) => {
    const petStore = tx.objectStore('pets');
    const entryStore = tx.objectStore('entries');
    const eventStore = tx.objectStore('events');

    // 1. Usuń zwierzaka
    petStore.delete(id);

    // 2. Usuń powiązane wpisy
    const entryIndex = entryStore.index('petId');
    const entryCursorReq = entryIndex.openCursor(IDBKeyRange.only(id));
    entryCursorReq.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // 3. Usuń powiązane zdarzenia zdrowotne
    const eventIndex = eventStore.index('petId');
    const eventCursorReq = eventIndex.openCursor(IDBKeyRange.only(id));
    eventCursorReq.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  });
}

// -------------------------------------------------------------
// DIARY ENTRIES
// -------------------------------------------------------------

export async function getEntries(): Promise<DiaryEntry[]> {
  return runTx(['entries'], 'readonly', (tx) => {
    return new Promise<DiaryEntry[]>((resolve, reject) => {
      const store = tx.objectStore('entries');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as DiaryEntry[]);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function getEntriesByPet(petId: string): Promise<DiaryEntry[]> {
  return runTx(['entries'], 'readonly', (tx) => {
    return new Promise<DiaryEntry[]>((resolve, reject) => {
      const store = tx.objectStore('entries');
      const index = store.index('petId');
      const req = index.getAll(IDBKeyRange.only(petId));
      req.onsuccess = () => resolve(req.result as DiaryEntry[]);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function saveEntry(entry: DiaryEntry): Promise<void> {
  const now = Date.now();
  const toSave: DiaryEntry = {
    ...entry,
    updatedAt: now,
  };

  // Zapisz ewentualne media w osobnym store 'media', jeśli podano blob/dataUrl
  await runTx(['entries'], 'readwrite', (tx) => {
    const store = tx.objectStore('entries');
    store.put(toSave);
  });
  triggerStoragePersist();
}

export async function deleteEntry(id: string): Promise<void> {
  await runTx(['entries'], 'readwrite', (tx) => {
    const store = tx.objectStore('entries');
    store.delete(id);
  });
}

// -------------------------------------------------------------
// HEALTH EVENTS
// -------------------------------------------------------------

export async function getHealthEvents(): Promise<HealthEvent[]> {
  return runTx(['events'], 'readonly', (tx) => {
    return new Promise<HealthEvent[]>((resolve, reject) => {
      const store = tx.objectStore('events');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as HealthEvent[]);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function getHealthEventsByPet(petId: string): Promise<HealthEvent[]> {
  return runTx(['events'], 'readonly', (tx) => {
    return new Promise<HealthEvent[]>((resolve, reject) => {
      const store = tx.objectStore('events');
      const index = store.index('petId');
      const req = index.getAll(IDBKeyRange.only(petId));
      req.onsuccess = () => resolve(req.result as HealthEvent[]);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function saveHealthEvent(event: HealthEvent): Promise<void> {
  const toSave: HealthEvent = {
    ...event,
    updatedAt: Date.now(),
  };
  await runTx(['events'], 'readwrite', (tx) => {
    const store = tx.objectStore('events');
    store.put(toSave);
  });
  triggerStoragePersist();
}

export async function saveHealthEventsBatch(events: HealthEvent[]): Promise<void> {
  if (events.length === 0) return;
  const now = Date.now();
  await runTx(['events'], 'readwrite', (tx) => {
    const store = tx.objectStore('events');
    for (const ev of events) {
      store.put({ ...ev, updatedAt: ev.updatedAt || now });
    }
  });
  triggerStoragePersist();
}

export async function deleteHealthEvent(id: string): Promise<void> {
  await runTx(['events'], 'readwrite', (tx) => {
    const store = tx.objectStore('events');
    store.delete(id);
  });
}

export async function deleteHealthEventsByGroup(groupId: string): Promise<number> {
  return runTx(['events'], 'readwrite', (tx) => {
    return new Promise<number>((resolve, reject) => {
      const store = tx.objectStore('events');
      const req = store.openCursor();
      let count = 0;
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          const ev = cursor.value as HealthEvent;
          if (ev.recurrenceGroupId === groupId) {
            cursor.delete();
            count++;
          }
          cursor.continue();
        } else {
          resolve(count);
        }
      };
      req.onerror = () => reject(req.error);
    });
  });
}

// -------------------------------------------------------------
// MEDIA STORE
// -------------------------------------------------------------

export async function saveMedia(id: string, blob: Blob, mime: string): Promise<void> {
  await runTx(['media'], 'readwrite', (tx) => {
    const store = tx.objectStore('media');
    store.put({ id, blob, mime } as MediaItem);
  });
}

export async function getMedia(id: string): Promise<MediaItem | null> {
  return runTx(['media'], 'readonly', (tx) => {
    return new Promise<MediaItem | null>((resolve, reject) => {
      const store = tx.objectStore('media');
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as MediaItem) || null);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function deleteMedia(id: string): Promise<void> {
  await runTx(['media'], 'readwrite', (tx) => {
    const store = tx.objectStore('media');
    store.delete(id);
  });
}

// -------------------------------------------------------------
// EXPORT & IMPORT
// -------------------------------------------------------------

export interface BackupDataV2 {
  schemaVersion: number;
  version: number;
  timestamp: number;
  pets: Pet[];
  entries: DiaryEntry[];
  healthEvents?: HealthEvent[];
  media?: Array<{ id: string; base64: string; mime: string }>;
}

export async function exportDatabase(): Promise<string> {
  const pets = await getPets();
  const entries = await getEntries();
  const healthEvents = await getHealthEvents();

  // Konwertuj media na base64 jeśli są w store media
  const backup: BackupDataV2 = {
    schemaVersion: 2,
    version: DB_VERSION,
    timestamp: Date.now(),
    pets,
    entries,
    healthEvents,
  };

  // Kompaktowy JSON bez formatowania
  return JSON.stringify(backup);
}

export interface ImportResult {
  petsCount: number;
  entriesCount: number;
  eventsCount: number;
  skippedCount: number;
  message: string;
}

/**
 * Type guards walidujące rekordy
 */
export function isPet(val: unknown): val is Pet {
  if (!val || typeof val !== 'object') return false;
  const p = val as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    p.id.trim().length > 0 &&
    typeof p.name === 'string' &&
    p.name.trim().length > 0 &&
    typeof p.species === 'string' &&
    typeof p.createdAt === 'number'
  );
}

export function isDiaryEntry(val: unknown): val is DiaryEntry {
  if (!val || typeof val !== 'object') return false;
  const e = val as Record<string, unknown>;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^\d{2}:\d{2}$/;
  return (
    typeof e.id === 'string' &&
    e.id.trim().length > 0 &&
    typeof e.petId === 'string' &&
    typeof e.title === 'string' &&
    e.title.trim().length > 0 &&
    typeof e.date === 'string' &&
    dateRegex.test(e.date) &&
    typeof e.time === 'string' &&
    timeRegex.test(e.time) &&
    typeof e.category === 'string' &&
    typeof e.content === 'string' &&
    typeof e.createdAt === 'number'
  );
}

export function isHealthEvent(val: unknown): val is HealthEvent {
  if (!val || typeof val !== 'object') return false;
  const h = val as Record<string, unknown>;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return (
    typeof h.id === 'string' &&
    h.id.trim().length > 0 &&
    typeof h.petId === 'string' &&
    typeof h.title === 'string' &&
    h.title.trim().length > 0 &&
    typeof h.date === 'string' &&
    dateRegex.test(h.date) &&
    typeof h.type === 'string' &&
    typeof h.isCompleted === 'boolean' &&
    typeof h.createdAt === 'number'
  );
}

/**
 * Import bazy danych w trybie 'merge' (domyślny) lub 'replace'
 */
export async function importDatabase(
  jsonData: string,
  mode: 'merge' | 'replace' = 'merge'
): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonData);
  } catch {
    throw new Error('Plik nie jest poprawnym formatem JSON.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Niepoprawny format pliku kopii zapasowej.');
  }

  const data = parsed as Record<string, unknown>;
  if (!Array.isArray(data.pets) || !Array.isArray(data.entries)) {
    throw new Error('Kopia zapasowa musi zawierać tablice "pets" oraz "entries".');
  }

  let skippedCount = 0;
  const validPets: Pet[] = [];
  for (const p of data.pets) {
    if (isPet(p)) {
      validPets.push(p);
    } else {
      skippedCount++;
    }
  }

  const validEntries: DiaryEntry[] = [];
  for (const e of data.entries) {
    if (isDiaryEntry(e)) {
      // Normalizuj weightKg jeśli brak
      if (e.weightKg == null && (e.category === 'pomiary' || e.category === 'weterynarz')) {
        const parsedWeight = parseLegacyWeightKg(`${e.title} ${e.content}`);
        if (parsedWeight != null) {
          e.weightKg = parsedWeight;
        }
      }
      validEntries.push(e);
    } else {
      skippedCount++;
    }
  }

  const validEvents: HealthEvent[] = [];
  const hasEventsInFile = Array.isArray(data.healthEvents);
  if (hasEventsInFile) {
    for (const h of data.healthEvents as unknown[]) {
      if (isHealthEvent(h)) {
        validEvents.push(h);
      } else {
        skippedCount++;
      }
    }
  }

  if (mode === 'replace') {
    // Tryb replace czyści bazę i wgrywa nowe rekordy
    await runTx(['pets', 'entries', 'events'], 'readwrite', (tx) => {
      const petStore = tx.objectStore('pets');
      const entryStore = tx.objectStore('entries');
      const eventStore = tx.objectStore('events');

      petStore.clear();
      entryStore.clear();
      if (hasEventsInFile) {
        eventStore.clear();
      }

      for (const p of validPets) {
        petStore.put(p);
      }
      for (const e of validEntries) {
        entryStore.put(e);
      }
      for (const h of validEvents) {
        eventStore.put(h);
      }
    });
  } else {
    // Tryb merge: put po ID, przy kolizji wygrywa nowszy updatedAt
    await runTx(['pets', 'entries', 'events'], 'readwrite', (tx) => {
      const petStore = tx.objectStore('pets');
      const entryStore = tx.objectStore('entries');
      const eventStore = tx.objectStore('events');

      // Merge pets
      for (const newPet of validPets) {
        const getReq = petStore.get(newPet.id);
        getReq.onsuccess = () => {
          const existing = getReq.result as Pet | undefined;
          if (!existing || (newPet.updatedAt || 0) >= (existing.updatedAt || 0)) {
            petStore.put(newPet);
          }
        };
      }

      // Merge entries
      for (const newEntry of validEntries) {
        const getReq = entryStore.get(newEntry.id);
        getReq.onsuccess = () => {
          const existing = getReq.result as DiaryEntry | undefined;
          if (!existing || (newEntry.updatedAt || 0) >= (existing.updatedAt || 0)) {
            entryStore.put(newEntry);
          }
        };
      }

      // Merge events
      for (const newEvent of validEvents) {
        const getReq = eventStore.get(newEvent.id);
        getReq.onsuccess = () => {
          const existing = getReq.result as HealthEvent | undefined;
          if (!existing || (newEvent.updatedAt || 0) >= (existing.updatedAt || 0)) {
            eventStore.put(newEvent);
          }
        };
      }
    });
  }

  triggerStoragePersist();

  return {
    petsCount: validPets.length,
    entriesCount: validEntries.length,
    eventsCount: validEvents.length,
    skippedCount,
    message: `Zaimportowano ${validPets.length} zwierząt i ${validEntries.length} wpisów${
      hasEventsInFile ? ` oraz ${validEvents.length} zdarzeń` : ''
    }${skippedCount > 0 ? `, pominięto ${skippedCount} uszkodzonych rekordów` : ''}.`,
  };
}

/**
 * Ciche wywołanie navigator.storage.persist() po zapisie danych
 */
let persistTriggered = false;
export async function triggerStoragePersist(): Promise<void> {
  if (persistTriggered) return;
  persistTriggered = true;
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        await navigator.storage.persist();
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Sprawdzenie zajętości pamięci przez navigator.storage.estimate()
 */
export async function getStorageEstimate(): Promise<{
  usageMB: number;
  quotaMB: number;
  percent: number;
  persisted: boolean;
}> {
  try {
    let persisted = false;
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      persisted = await navigator.storage.persisted();
    }

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const usageMB = Number((usage / (1024 * 1024)).toFixed(2));
      const quotaMB = Number((quota / (1024 * 1024)).toFixed(0));
      const percent = quota > 0 ? Math.round((usage / quota) * 100) : 0;
      return { usageMB, quotaMB, percent, persisted };
    }
  } catch {
    // ignore
  }
  return { usageMB: 0, quotaMB: 0, percent: 0, persisted: false };
}

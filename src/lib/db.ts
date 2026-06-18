import { Pet, DiaryEntry } from '../types';

const DB_NAME = 'DziennikPupilaDB';
const DB_VERSION = 1;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB failure:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Store for Pets
      if (!db.objectStoreNames.contains('pets')) {
        db.createObjectStore('pets', { keyPath: 'id' });
      }

      // Store for Diary Entries
      if (!db.objectStoreNames.contains('entries')) {
        const entryStore = db.createObjectStore('entries', { keyPath: 'id' });
        // Create an index to quickly filter nodes by petId
        entryStore.createIndex('petId', 'petId', { unique: false });
      }
    };
  });
}

export async function getPets(): Promise<Pet[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pets', 'readonly');
    const store = transaction.objectStore(requestStoreName(transaction, 'pets'));
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as Pet[]);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function savePet(pet: Pet): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pets', 'readwrite');
    const store = transaction.objectStore(requestStoreName(transaction, 'pets'));
    const request = store.put(pet);

    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function deletePet(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pets', 'entries'], 'readwrite');
    const petStore = transaction.objectStore(requestStoreName(transaction, 'pets'));
    const entryStore = transaction.objectStore(requestStoreName(transaction, 'entries'));

    // Delete pet
    petStore.delete(id);

    // Delete all notes relating to this pet
    const index = entryStore.index('petId');
    const request = index.openCursor(IDBKeyRange.only(id));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

export async function getEntries(): Promise<DiaryEntry[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('entries', 'readonly');
    const store = transaction.objectStore(requestStoreName(transaction, 'entries'));
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as DiaryEntry[]);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getEntriesByPet(petId: string): Promise<DiaryEntry[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('entries', 'readonly');
    const store = transaction.objectStore(requestStoreName(transaction, 'entries'));
    const index = store.index('petId');
    const request = index.getAll(IDBKeyRange.only(petId));

    request.onsuccess = () => {
      resolve(request.result as DiaryEntry[]);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function saveEntry(entry: DiaryEntry): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('entries', 'readwrite');
    const store = transaction.objectStore(requestStoreName(transaction, 'entries'));
    const request = store.put(entry);

    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('entries', 'readwrite');
    const store = transaction.objectStore(requestStoreName(transaction, 'entries'));
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Export database back-up helper
export async function exportDatabase(): Promise<string> {
  const pets = await getPets();
  const entries = await getEntries();
  const backup = {
    version: DB_VERSION,
    timestamp: Date.now(),
    pets,
    entries
  };
  return JSON.stringify(backup);
}

// Import database merge helper
export async function importDatabase(jsonData: string): Promise<void> {
  const backup = JSON.parse(jsonData);
  if (!backup.pets || !backup.entries) {
    throw new Error('Niepoprawny format kopii zapasowej.');
  }

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pets', 'entries'], 'readwrite');
    const petStore = transaction.objectStore(requestStoreName(transaction, 'pets'));
    const entryStore = transaction.objectStore(requestStoreName(transaction, 'entries'));

    // Clear and restore
    petStore.clear();
    entryStore.clear();

    for (const pet of backup.pets) {
      petStore.put(pet);
    }
    for (const entry of backup.entries) {
      entryStore.put(entry);
    }

    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

// Helper for type-safe IndexedDB transactions
function requestStoreName(tx: IDBTransaction, name: string): string {
  return name;
}

/**
 * Offline-Synchronisation für EpiDoc
 * Speichert Daten lokal und synchronisiert sie, wenn wieder online
 */

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data?: any;
  timestamp: number;
  retries: number;
}

const DB_NAME = 'epidoc-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-operations';
const MAX_RETRIES = 3;

/**
 * Initialisiert IndexedDB für Offline-Speicherung
 */
async function initDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB ist nur im Browser verfügbar');
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Speichert eine Operation für spätere Synchronisation
 */
export async function queueOperation(
  type: PendingOperation['type'],
  endpoint: string,
  data?: any
): Promise<string> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB ist nur im Browser verfügbar');
  }

  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const operation: PendingOperation = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    endpoint,
    data,
    timestamp: Date.now(),
    retries: 0,
  };

  return new Promise((resolve, reject) => {
    const request = store.add(operation);
    request.onsuccess = () => resolve(operation.id);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Ruft alle ausstehenden Operationen ab
 */
async function getPendingOperations(): Promise<PendingOperation[]> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return [];
  }

  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Entfernt eine Operation nach erfolgreicher Synchronisation
 */
async function removeOperation(id: string): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Aktualisiert die Retry-Anzahl einer Operation
 */
async function updateOperationRetries(id: string, retries: number): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const operation = getRequest.result;
      if (operation) {
        operation.retries = retries;
        const putRequest = store.put(operation);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Prüft ob der Browser online ist
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Synchronisiert alle ausstehenden Operationen
 */
export async function syncPendingOperations(
  apiClient: any
): Promise<{ success: number; failed: number }> {
  if (!isOnline()) {
    return { success: 0, failed: 0 };
  }

  const operations = await getPendingOperations();
  let success = 0;
  let failed = 0;

  for (const operation of operations) {
    if (operation.retries >= MAX_RETRIES) {
      // Zu viele Versuche, entferne die Operation
      await removeOperation(operation.id);
      failed++;
      continue;
    }

    try {
      let response;
      switch (operation.type) {
        case 'create':
          response = await apiClient.post(operation.endpoint, operation.data);
          break;
        case 'update':
          response = await apiClient.put(operation.endpoint, operation.data);
          break;
        case 'delete':
          response = await apiClient.delete(operation.endpoint);
          break;
      }

      // Erfolgreich synchronisiert
      await removeOperation(operation.id);
      success++;
    } catch (error) {
      // Fehler beim Synchronisieren, erhöhe Retry-Zähler
      await updateOperationRetries(operation.id, operation.retries + 1);
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Initialisiert Offline-Synchronisation
 * Sollte beim App-Start aufgerufen werden
 */
export function initOfflineSync(apiClient: any) {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return;

  try {
    // Synchronisiere beim App-Start
    syncPendingOperations(apiClient).catch(err => {
      console.error('Fehler beim Synchronisieren:', err);
    });

    // Synchronisiere wenn wieder online
    window.addEventListener('online', () => {
      syncPendingOperations(apiClient).catch(err => {
        console.error('Fehler beim Synchronisieren:', err);
      });
    });

    // Synchronisiere periodisch (alle 30 Sekunden)
    setInterval(() => {
      if (isOnline()) {
        syncPendingOperations(apiClient).catch(err => {
          console.error('Fehler beim Synchronisieren:', err);
        });
      }
    }, 30000);
  } catch (error) {
    console.error('Fehler beim Initialisieren der Offline-Synchronisation:', error);
  }
}

/**
 * Ruft die Anzahl ausstehender Operationen ab
 */
export async function getPendingCount(): Promise<number> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return 0;
  }

  const operations = await getPendingOperations();
  return operations.length;
}


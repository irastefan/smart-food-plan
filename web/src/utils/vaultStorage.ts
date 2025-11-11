const DB_NAME = "smartFoodPlan";
const STORE_NAME = "vault";
const HANDLE_KEY = "vaultDirectoryHandle";

let sessionVaultHandle: DirectoryHandle | null = null;

type DirectoryHandle = FileSystemDirectoryHandle;

function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined";
  } catch {
    return false;
  }
}

function openDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error("IndexedDB is not available"));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runTransaction<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => {
      db.close();
    };
    transaction.onerror = () => {
      reject(transaction.error ?? request.error ?? new Error("IndexedDB transaction failed"));
    };
  });
}

export function setSessionVaultDirectoryHandle(handle: DirectoryHandle | null): void {
  sessionVaultHandle = handle;
}

export async function saveVaultDirectoryHandle(handle: DirectoryHandle): Promise<void> {
  sessionVaultHandle = handle;
  if (!isIndexedDBAvailable()) {
    return;
  }
  const db = await openDatabase();
  await runTransaction(db, "readwrite", (store) => store.put(handle, HANDLE_KEY));
}

export async function loadVaultDirectoryHandle(): Promise<DirectoryHandle | null> {
  if (sessionVaultHandle) {
    return sessionVaultHandle;
  }

  if (!isIndexedDBAvailable()) {
    return null;
  }

  const db = await openDatabase();
  const result = await runTransaction<DirectoryHandle | undefined>(db, "readonly", (store) =>
    store.get(HANDLE_KEY)
  );
  sessionVaultHandle = result ?? null;
  return sessionVaultHandle;
}

export async function clearVaultDirectoryHandle(): Promise<void> {
  sessionVaultHandle = null;
  if (!isIndexedDBAvailable()) {
    return;
  }
  const db = await openDatabase();
  await runTransaction(db, "readwrite", (store) => store.delete(HANDLE_KEY));
}

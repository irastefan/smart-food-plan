const DB_NAME = "smartFoodPlan";
const STORE_NAME = "vault";
const HANDLE_KEY = "vaultDirectoryHandle";

type DirectoryHandle = FileSystemDirectoryHandle;

function openDatabase(): Promise<IDBDatabase> {
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

export async function saveVaultDirectoryHandle(handle: DirectoryHandle): Promise<void> {
  const db = await openDatabase();
  await runTransaction(db, "readwrite", (store) => store.put(handle, HANDLE_KEY));
}

export async function loadVaultDirectoryHandle(): Promise<DirectoryHandle | null> {
  const db = await openDatabase();
  const result = await runTransaction<DirectoryHandle | undefined>(db, "readonly", (store) =>
    store.get(HANDLE_KEY)
  );
  return result ?? null;
}

export async function clearVaultDirectoryHandle(): Promise<void> {
  const db = await openDatabase();
  await runTransaction(db, "readwrite", (store) => store.delete(HANDLE_KEY));
}

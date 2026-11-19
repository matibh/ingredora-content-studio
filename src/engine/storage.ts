const DB_NAME = "ingredora-content-studio";
const STORE_NAME = "renders";
const DB_VERSION = 1;
const RENDER_CACHE_VERSION = "audiovisual-v2";

function cacheKey(id: string) {
  return `${id}:${RENDER_CACHE_VERSION}`;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir el almacenamiento local."));
  });
}

export async function getRenderedVideo(id: string): Promise<Blob | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(cacheKey(id));
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("No se pudo leer el render."));
    request.transaction?.addEventListener("complete", () => db.close(), { once: true });
  });
}

export async function saveRenderedVideo(id: string, blob: Blob): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(blob, cacheKey(id));
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error("No se pudo guardar el render.")); };
    transaction.onabort = () => { db.close(); reject(transaction.error ?? new Error("Se interrumpió el guardado del render.")); };
  });
}

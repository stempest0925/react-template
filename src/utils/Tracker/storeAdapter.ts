// utils/storageAdapter.ts
interface StorageAdapter {
  enqueue(data: any): Promise<void>;
  dequeue(): Promise<any>;
  isEmpty(): Promise<boolean>;
}

class IndexedDBAdapter implements StorageAdapter {
  private dbName = "OfflineDataQueue";
  private storeName = "events";
  private db: IDBDatabase | null = null;

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = reject;
    });
  }

  async enqueue(data: any) {
    const db = await this.initDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readwrite");
      tx.objectStore(this.storeName).add(data);
      tx.oncomplete = () => resolve();
      tx.onerror = reject;
    });
  }

  async dequeue() {
    const db = await this.initDB();
    return new Promise<any>((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const data = cursor.value;
          store.delete(cursor.primaryKey);
          resolve(data);
        } else {
          resolve(null);
        }
      };

      request.onerror = reject;
    });
  }

  async isEmpty() {
    const db = await this.initDB();
    return new Promise<boolean>((resolve) => {
      const tx = db.transaction(this.storeName, "readonly");
      const count = tx.objectStore(this.storeName).count();
      count.onsuccess = () => resolve(count.result === 0);
    });
  }
}

export const storage = new IndexedDBAdapter();

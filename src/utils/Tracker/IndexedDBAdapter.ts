export default class IndexedDBAdapter {
  private db: IDBDatabase | null = null;

  constructor(private dbName: string) {
    this.dbName = dbName;
  }

  private async initialize(
    storeName: string | string[],
    indexes: string | string[]
  ): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (Array.isArray(storeName)) {
          storeName.forEach((storeItem) => {
            if (!db.objectStoreNames.contains(storeItem))
              db.createObjectStore(storeItem, { autoIncrement: true });
          });
        } else {
          if (!db.objectStoreNames.contains(storeName))
            db.createObjectStore(storeName, { autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => (event.target as IDBOpenDBRequest).error;
    });
  }

  private async executeTransaction(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized."));
        return;
      }

      const transaction = this.db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      operation(store);

      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  async add<T extends Record<string, any>>(storeName: string, items: T | T[]): Promise<void> {
    // 校验数据格式
    if (Array.isArray(items)) {
      if (items.length === 0) {
        throw new Error("Cannot add empty array.");
      }
    } else {
      if (Object.keys(items).length === 0) {
        throw new Error("Cannot add empty object.");
      }
      items = [items];
    }

    return this.executeTransaction(storeName, "readwrite", (store) => {
      items.forEach((dataItem) => store.add(dataItem));
    });
  }

  async update<T extends Record<string, any>>(storeName: string, items: T | T[]): Promise<void> {
    return this.executeTransaction(storeName, "readwrite", (store) => {
      store.put(items);
    });
  }

  async delete(storeName: string, indexes: number | number[]): Promise<void> {
    return this.executeTransaction(storeName, "readwrite", (store) => store.delete(indexes));
  }
}

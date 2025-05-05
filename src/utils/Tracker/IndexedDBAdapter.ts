type InitializeParamsType = {
  storeName: string;
  indexes: string | string[];
};

export default class IndexedDBAdapter {
  private db: IDBDatabase | null = null;

  constructor(private dbName: string) {
    this.dbName = dbName;
  }

  private async initialize<T extends InitializeParamsType>(params: T | T[]): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      let _params: T[];
      if (Array.isArray(params)) {
        if (params.length === 0) {
          // Object.keys(params[0]).length === 0
          reject(new Error("Initialize DB not params."));
          return;
        }
      } else {
        if (Object.keys(params).length === 0) {
          reject(new Error("Initialize DB not params."));
          return;
        }
        _params = [params];
      }

      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        _params.forEach((item) => {
          if (!db.objectStoreNames.contains(item.storeName)) {
            const store = db.createObjectStore(item.storeName, { autoIncrement: true });
            if (item.indexes) {
              if (Array.isArray(item.indexes) && item.indexes.length > 0) {
                item.indexes.forEach((index) => {
                  store.createIndex(index, index, { unique: false });
                });
              } else {
                store.createIndex(item.indexes, item.indexes, { unique: false });
              }
            }
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => (event.target as IDBOpenDBRequest).error;
    });
  }

  public get DB(): IDBDatabase | null {
    return this.db;
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

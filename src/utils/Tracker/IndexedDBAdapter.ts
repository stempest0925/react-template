export default class IndexedDBAdapter {
  private db: IDBDatabase | null = null;

  constructor(private dbName: string) {
    this.dbName = dbName;
  }

  private async initDB(
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

      request.onerror = reject;
    });
  }

  private async addData(
    storeName: string,
    data: Record<string, any> | Record<string, any>[]
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // 校验DB对象
      if (!this.db) {
        reject(new Error("Database is undefined."));
        return;
      }

      // 校验数据格式
      if (Array.isArray(data)) {
        if (data.length === 0) {
          reject(new Error("Cannot add empty array."));
          return;
        }
      } else {
        if (Object.keys(data).length === 0) {
          reject(new Error("Cannot add empty object."));
          return;
        }
      }

      // 创建操作事务
      const transaction = this.db.transaction(storeName, "readwrite");
      const objectStore = transaction.objectStore(storeName);

      try {
        // 插入数据
        Array.isArray(data)
          ? data.forEach((dataItem) => objectStore.add(dataItem))
          : objectStore.add(data);
      } catch (error) {
        reject(error);
        return;
      }

      // 监听状态
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = (event) =>
        reject((event.target as IDBTransaction).error || new Error("Transaction failed."));
    });
  }
}

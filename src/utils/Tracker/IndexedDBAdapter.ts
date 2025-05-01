export default class IndexedDBAdapter {
  private db: IDBDatabase | null = null;

  constructor(
    private dbName: string,
    private storeName: string
  ) {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise<IDBDatabase>((resolve, reject) => {
      const dbRequest = indexedDB.open(this.dbName, 1);

      dbRequest.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { autoIncrement: true });
        }
      };

      dbRequest.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      dbRequest.onerror = reject;
    });
  }
}

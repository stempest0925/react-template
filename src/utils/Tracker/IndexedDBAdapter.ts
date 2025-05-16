interface IndexConfig extends IDBIndexParameters {
  name: string;
  keyPath?: string | string[];
}
interface StoreConfig extends IDBObjectStoreParameters {
  storeName: string;
  indexes?: (string | IndexConfig)[];
}
type InitializeOptions = StoreConfig | StoreConfig[];

export default class IndexedDBAdapter {
  private db: IDBDatabase | null = null;

  constructor(private dbName: string) {
    this.dbName = dbName;
  }

  /**
   * 初始化
   * @param options
   */
  public async initialize(options: InitializeOptions) {
    if (this.db) return this.db;

    try {
      // 参数归一化处理
      const _options = Array.isArray(options) ? options : [options];

      this.db = await this.openDatabase(_options);
      return this.db;
    } catch (error) {
      // TODO: 添加错误收集或处理
      console.error(error);
    }
  }

  /**
   * 打开数据库
   * @param options
   * @returns db
   */
  private openDatabase(options: StoreConfig[]): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.processStore(db, options);
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = (event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        reject(error || new Error("Initialize Database failed."));
      };
    });
  }

  /**
   * 处理 Store
   * @param db
   * @param configs
   * @description 暂时只对未创建过的store进行index创建，已存在的store，默认当做已有index，可开放其他方法进行index创建
   */
  private processStore(db: IDBDatabase, configs: StoreConfig[]) {
    configs.forEach((config) => {
      if (!db.objectStoreNames.contains(config.storeName)) {
        const store = db.createObjectStore(config.storeName, {
          keyPath: config.keyPath,
          autoIncrement: config.autoIncrement ?? true
        });

        this.processIndexes(store, config.indexes);
      }
    });
  }

  /**
   * 处理 Index
   * @param store
   * @param indexes
   */
  private processIndexes(store: IDBObjectStore, indexes?: (string | IndexConfig)[]) {
    if (indexes) {
      indexes.forEach((index) => {
        const indexObj = typeof index === "string" ? { name: index } : index;
        const { name, keyPath = name, unique = false, multiEntry = false } = indexObj;

        if (!store.indexNames.contains(name)) {
          store.createIndex(name, keyPath, { unique, multiEntry });
        }
      });
    }
  }

  /**
   * 通过Keys删除
   * @param storeName
   * @param keys
   * @returns deleteCount
   */
  private deleteByKeys(storeName: string, keys: number | number[]): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialize."));
        return;
      }

      const _keys = Array.isArray(keys) ? keys : [keys];

      const transaction = this.db.transaction(storeName);
      const store = transaction.objectStore(storeName);

      let deleteCount = 0;

      _keys.forEach((key) => {
        const request = store.delete(key);

        request.onsuccess = () => deleteCount++;
        request.onerror = () => {
          // TODO: 可记录，错误埋点的警告级别
          console.warn(`Failed to Delete key ${key}.`);
        };
      });

      transaction.oncomplete = () => {
        resolve(deleteCount);
      };
      transaction.onerror = () => {
        reject(new Error("Delete keys transaction failed."));
      };
    });
  }

  /**
   * 通过查询条件删除
   * @param storeName
   * @param options
   * @returns deleteCount
   */
  private deleteByCondition(
    storeName: string,
    options: {
      index?: string;
      keyRange?: IDBKeyRange;
      direction?: IDBCursorDirection;
      limit: number;
    }
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialize."));
        return;
      }

      const { limit = 30 } = options;
      const transaction = this.db.transaction(storeName);
      const store = transaction.objectStore(storeName);
      const source = options.index ? store.index(options.index) : store;
      const request = source.openCursor(options.keyRange, options.direction);

      let deleteCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor && deleteCount < limit) {
          cursor.delete();
          deleteCount++;
          cursor.continue();
        } else {
          resolve(deleteCount);
        }
      };
      transaction.oncomplete = () => {
        // TODO: 可移除，测试触发时机
        console.log("transaction complete");
      };

      request.onerror = () => {
        reject(new Error("Delete cursor transaction failed."));
      };
      transaction.onerror = () => {
        reject(new Error("Delete transaction failed."));
      };
    });
  }
}

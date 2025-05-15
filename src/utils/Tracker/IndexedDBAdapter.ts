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

  public async initialize(options: InitializeOptions) {
    if (this.db) return this.db;

    try {
      // 参数归一化处理
      const _options = Array.isArray(options) ? options : [options];

      this.db = await this.openDatabase(_options);
      return this.db;
    } catch (error) {
      console.error(error);
    }
  }

  // private validateOptions() {
  //   let _options: T[];
  //   if (Array.isArray(options)) {
  //     // 数组参数校验
  //     if (options.length === 0) {
  //       reject(new Error("Initialize DB not options."));
  //       return;
  //     }
  //   } else {
  //     // 对象参数校验
  //     if (Object.keys(options).length === 0) {
  //       reject(new Error("Initialize DB not options."));
  //       return;
  //     }
  //     // 将对象转为数组便于后续统一操作
  //     _options = [options];
  //   }
  // }

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

  // 暂时只对未创建过的store进行index创建，已存在的store，默认已有index，可开放其他方法进行index创建
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
}

/**
 * IndexDBAdapter
 * 注意事项：
 * 1. 创建阶段，建议指定主键的keypath，并且以简单类型作为主键类型，而不是复合类型，便于方法封装处理。
 * 2. 操作阶段，加入主键数据时，建议以key以string类型为准，操作归一化，避免number、array等其他类型，否则根据key获取数据时为空。
 * 3. 目前只针对常用方法进行封装，且不支持复合类型主键以及引用类型主键值，避免方法过于复杂，如果有特殊需求，请获取DB对象，在外部操作实现。
 */

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
   * 获取store列表
   */
  public get storeList() {
    if (!this.db) {
      return [];
    }
    return this.db.objectStoreNames;
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
   * 通过keys查询
   * @description get系列适合少量精准查询
   */
  public queryByKeys(storeName: string, keys: string | string[]): Promise<Record<string, any>[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialize."));
        return;
      }

      const _keys = Array.isArray(keys) ? keys : [keys];

      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);

      const result: Record<string, any>[] = [];

      _keys.forEach((key) => {
        const request = store.get(key);
        request.onsuccess = (event) => {
          result.push(request.result);
        };
      });

      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => {
        reject(new Error("Query keys transaction failed."));
      };
    });
  }

  /**
   * 通过条件查询
   * @param storeName
   * @param options
   * @returns data
   * @description 游标适合大量数据或者复杂查询
   */
  public queryByCondition(
    storeName: string,
    options: {
      index?: string;
      keyRange?: IDBKeyRange;
      direction?: IDBCursorDirection;
      limit?: number;
    }
  ): Promise<Record<string, any>[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialize."));
        return;
      }

      const { limit = 30 } = options;
      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const source = options.index ? store.index(options.index) : store;
      const request = source.openCursor(options.keyRange, options.direction);

      const queryData: Record<string, any>[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor && queryData.length < limit) {
          queryData.push(cursor.value);
          cursor.continue();
        } else {
          resolve(queryData);
        }
      };
      transaction.oncomplete = () => {
        // TODO: 可移除，测试触发时机
        console.log("transaction complete");
      };

      request.onerror = () => {
        reject(new Error("Query cursor transaction failed."));
      };
      transaction.onerror = () => {
        reject(new Error("Query transaction failed."));
      };
    });
  }

  /**
   * 添加
   * @param storeName
   * @param data
   * @returns addCount
   */
  public add<T extends Record<string, any>>(storeName: string, data: T | T[]): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialize."));
        return;
      }

      // 参数归一化
      const _data = Array.isArray(data) ? data : [data];

      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      let addCount = 0;

      _data.forEach((dataItem) => {
        const request = store.add(dataItem);

        request.onsuccess = () => addCount++;
        request.onerror = () => {
          // TODO: 可记录，错误埋点的警告级别
          console.warn(`Failed to add dataItem:`, dataItem);
        };
      });

      transaction.oncomplete = () => {
        resolve(addCount);
      };
      transaction.onerror = () => {
        reject(new Error("Add data transaction failed."));
      };
    });
  }

  /**
   * 通过Keys删除
   * @param storeName
   * @param keys
   * @returns deleteCount
   */
  private deleteByKeys(storeName: string, keys: string | string[]): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialize."));
        return;
      }

      // 参数归一化
      const _keys = Array.isArray(keys) ? keys : [keys];

      const transaction = this.db.transaction(storeName, "readwrite");
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
      limit?: number;
    }
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialize."));
        return;
      }

      const { limit = 30 } = options;
      const transaction = this.db.transaction(storeName, "readwrite");
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

  /**
   * 更新
   * 暂不处理复合主键
   */
  public updateByKeys(
    storeName: string,
    keys: string | string[],
    newData: Record<string, any>
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialize."));
        return;
      }

      const _keys = Array.isArray(keys) ? keys : [keys];

      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const keyPath = store.keyPath;

      let updateCount = 0;

      _keys.forEach(async (key) => {
        const existingData = await store.get(key);
        if (!existingData) {
          console.warn(`Failed to Update key ${key}, not data.`);
          return;
        }

        let updateData = { ...existingData, ...newData };

        if (keyPath) {
          if (!Array.isArray(keyPath)) {
            updateData = { ...updateData, [keyPath]: key };
          }
          // 复合数组的key对象处理
          //
        }

        const request = keyPath ? store.put(updateData) : store.put(updateData, key);

        request.onsuccess = () => updateCount++;
        request.onerror = () => {
          // TODO: 可记录，错误埋点的警告级别
          console.warn(`Failed to Update key ${key}.`);
        };
      });

      transaction.oncomplete = () => {
        resolve(updateCount); //其实最好的是记录操作条数和更新的key数组
      };
      transaction.onerror = () => {
        reject(new Error("Update keys transaction failed."));
      };
    });
  }

  /**
   *通过条件批量更新，比如姓别为男的，某个属性改为xx
   */
  public putByCondition(
    storeName: string,
    condition: (item: Record<string, any>) => boolean | IDBKeyRange,
    updateCallback: (item: Record<string, any>) => Record<string, any>
  ) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialize."));
        return;
      }

      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      let request: IDBRequest<IDBCursorWithValue | null>;
      if (condition instanceof IDBKeyRange) {
        request = store.openCursor(condition);
      } else if (typeof condition === "function") {
        request = store.openCursor();
      } else {
        reject(new Error("Error condition."));
        return;
      }

      let updateCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (!cursor) {
          resolve(updateCount);
          return;
        }

        // 函数条件 & 且不符合的进行跳过
        if (typeof condition === "function" && !condition(cursor.value)) {
          cursor.continue();
          return;
        }

        const newData = updateCallback(cursor.value);
        cursor.update({ ...cursor.value, ...newData });
        updateCount++;
        cursor.continue();
      };
      request.onerror = () => {
        // TODO: 可记录，错误埋点的警告级别
        console.warn(`Failed to update.`);
      };

      transaction.oncomplete = () => {
        // TODO: 可移除，测试触发时机
        console.log("transaction complete.");
      };
      transaction.onerror = () => {
        reject(new Error("update transaction failed."));
      };
    });
  }
}

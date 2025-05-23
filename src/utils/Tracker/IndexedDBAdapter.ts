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
  protected db: IDBDatabase | null = null;

  constructor(private dbName: string) {
    this.dbName = dbName;
  }

  /**
   * DB检查
   */
  private assertDBReady(): asserts this is this & { db: IDBDatabase } {
    if (!this.db) throw new Error("Database not initialize.");
  }

  /**
   * 获取store对象
   * @param storeName
   * @param mode
   * @returns { transaction, store }
   */
  private getObjectStore(
    storeName: string,
    mode: IDBTransactionMode = "readonly"
  ): { transaction: IDBTransaction; store: IDBObjectStore } {
    this.assertDBReady();
    const transaction = this.db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);

    // transaction.oncomplete = () => {};
    // transaction.onerror = () => {};

    return { transaction, store };
  }

  /**
   * 初始化
   * @param options
   */
  public async initialize(options: InitializeOptions) {
    if (this.db) return this.db;

    try {
      const _options = Array.isArray(options) ? options : [options]; // 参数归一化处理

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
   * 添加数据
   * @param storeName
   * @param data
   * @returns addCount
   */
  public add<T extends Record<string, any>>(storeName: string, data: T | T[]): Promise<number> {
    const _data = Array.isArray(data) ? data : [data]; //参数归一化
    const { transaction, store } = this.getObjectStore(storeName, "readwrite");

    return new Promise((resolve, reject) => {
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
  public deleteByKeys(storeName: string, keys: string | string[]): Promise<number> {
    const _keys = Array.isArray(keys) ? keys : [keys]; // 参数归一化
    const { transaction, store } = this.getObjectStore(storeName, "readwrite");

    return new Promise((resolve, reject) => {
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
   * 根据条件删除
   * @param storeName
   * @param condition
   * @param index
   * @returns
   * 完成度：90%
   * 剩余request error返回的处理，以及性能数据的存储
   */
  public deleteByCondition<T>(
    storeName: string,
    condition: ((item: T) => boolean) | IDBKeyRange,
    index?: string,
    BATCH_SIZE: number = 100
  ): Promise<number> {
    const { store } = this.getObjectStore(storeName, "readwrite");

    return new Promise((resolve, reject) => {
      let request: IDBRequest<IDBCursorWithValue | null>;

      if (condition instanceof IDBKeyRange) {
        // 针对索引的判断和警告，可简略
        if (index) {
          if (!store.indexNames.contains(index)) {
            reject(new Error(`Index ${index} not found in store ${storeName}.`));
            return;
          }
          const source = store.index(index);
          request = source.openCursor(condition);
        } else {
          request = store.openCursor(condition);
        }
      } else if (typeof condition === "function") {
        // 函数条件时不使用索引
        if (index) {
          console.warn(`Index '${index}' is ignored when using function condition.`);
        }
        request = store.openCursor();
      } else {
        reject(new Error("Invalid condition type."));
        return;
      }

      const startTime = performance.now(); // 性能计算
      let deleteCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (!cursor) {
          console.log(`Deleted ${deleteCount} items in ${performance.now() - startTime}ms`);
          resolve(deleteCount);
          return;
        }

        // 函数条件 & 不符合条件的进行跳过
        if (typeof condition === "function" && !condition(cursor.value)) {
          cursor.continue();
          return;
        }

        cursor.delete();
        deleteCount++;

        // 分块处理，避免大数据量下处理阻塞线程
        if (deleteCount % BATCH_SIZE === 0) {
          cursor.advance(BATCH_SIZE);
        } else {
          cursor.continue();
        }
      };
      request.onerror = () => {
        // TODO: 可记录，错误埋点的警告级别
        console.warn(`Failed to delete.`);
      };
    });
  }

  /**
   * 根据主键更新
   * @param storeName
   * @param keys
   * @param newData
   * @returns updateCount
   */
  public updateByKeys(
    storeName: string,
    keys: string | string[],
    newData: Record<string, any>
  ): Promise<number> {
    const { transaction, store } = this.getObjectStore(storeName, "readwrite");
    const keyPath = store.keyPath;
    const _keys = Array.isArray(keys) ? keys : [keys];

    return new Promise((resolve, reject) => {
      let updateCount = 0;

      _keys.forEach(async (key) => {
        const existingData = await store.get(key);
        if (!existingData) {
          console.warn(`Failed to Update key ${key}, it's not data.`);
          return;
        }

        const updateData = this.protectedPrimaryKey(existingData, newData, keyPath);

        const request = keyPath ? store.put(updateData) : store.put(updateData, key);

        request.onsuccess = () => updateCount++;
        request.onerror = () => {
          // TODO: 可记录，错误埋点的警告级别
          console.warn(`Failed to Update key ${key}.`);
        };
      });

      transaction.oncomplete = () => {
        resolve(updateCount);
      };
    });
  }

  /**
   * 根据条件更新
   * @param storeName
   * @param condition
   * @param updateCallback
   * @returns updateCount
   */
  public updateByCondition<T>(
    storeName: string,
    condition: ((item: T) => boolean) | IDBKeyRange,
    updateCallback: (item: T) => Partial<T>
  ): Promise<number> {
    const { store } = this.getObjectStore(storeName, "readwrite");
    const keyPath = store.keyPath;

    return new Promise((resolve, reject) => {
      let request: IDBRequest<IDBCursorWithValue | null>;

      if (condition instanceof IDBKeyRange) {
        request = store.openCursor(condition);
      } else if (typeof condition === "function") {
        request = store.openCursor();
      } else {
        reject(new Error("Invalid condition type."));
        return;
      }

      let updateCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        // 更新完成 & 退出
        if (!cursor) {
          resolve(updateCount);
          return;
        }

        // 函数条件 & 不符合条件的进行跳过
        if (typeof condition === "function" && !condition(cursor.value)) {
          cursor.continue();
          return;
        }

        // 更新数据
        const newData = this.protectedPrimaryKey(
          cursor.value,
          updateCallback(cursor.value),
          keyPath
        );
        cursor.update(newData);
        updateCount++;
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 保护主键，避免更新数据覆盖主键导致更新出错
   * @param existingData
   * @param newData
   * @param keyPath
   * @returns
   */
  private protectedPrimaryKey<T extends Record<string, any>>(
    existingData: T,
    newData: Partial<T>,
    keyPath: string | string[]
  ): T {
    if (!keyPath) return { ...existingData, ...newData };

    const protectedData = { ...newData };
    const paths = Array.isArray(keyPath) ? keyPath : [keyPath]; // 复合主键处理与归一化

    paths.forEach((path) => {
      if (protectedData.hasOwnProperty(path)) {
        delete protectedData[path];
      }
    });

    return { ...existingData, ...protectedData };
  }

  /**
   * 根据主键查询
   * @param storeName
   * @param keys
   * @returns result
   * @description get系列适合少量精准查询
   */
  public queryByKeys<T extends Record<string, any>>(
    storeName: string,
    keys: string | string[]
  ): Promise<T[]> {
    const _keys = Array.isArray(keys) ? keys : [keys];
    const { transaction, store } = this.getObjectStore(storeName);

    return new Promise((resolve, reject) => {
      const result: T[] = [];

      _keys.forEach((key) => {
        const request = store.get(key);
        request.onsuccess = (event) => {
          result.push(request.result);
        };
        request.onerror = () => {
          console.warn(`Failed to query data by key ${key}.`);
        };
      });

      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(new Error("Execute queryByKeys transaction failed."));
    });
  }

  /**
   * 根据条件查询
   * @param storeName
   * @param options
   * @returns result
   * @description 游标适合大量数据或者复杂查询
   */
  public queryByCondition(
    storeName: string,
    options: Partial<{
      index: string;
      keyRange: IDBKeyRange;
      direction: IDBCursorDirection;
      limit: number;
    }>
  ): Promise<Record<string, any>[]> {
    const { limit = 30 } = options;
    const { transaction, store } = this.getObjectStore(storeName);

    return new Promise((resolve, reject) => {
      const source = options.index ? store.index(options.index) : store;
      const request = source.openCursor(options.keyRange, options.direction);

      const result: Record<string, any>[] = [];
      const startTime = performance.now();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor && result.length < limit) {
          result.push(cursor.value);
          cursor.continue();
        } else {
          console.log(`Execute query in ${performance.now() - startTime}ms`);
          resolve(result);
          return;
        }
      };
      request.onerror = () => {
        reject(new Error("Query cursor transaction failed."));
      };

      transaction.oncomplete = () => {
        // TODO: 可移除，测试触发时机
        console.log("transaction complete");
      };
      transaction.onerror = () => reject(new Error("Execute queryByCondition transaction failed."));
    });
  }
}

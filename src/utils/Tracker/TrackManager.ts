/**
 * 设计改善
 * 1. 直接进行数据上报，可能会因为网络问题或者页面关闭等意外情况造成数据丢失，所以需要数据持久化。
 * 2. 过多的数据进行同步持久化，会导致线程阻塞，因此我们需要异步、且存储量大的IndexDB。
 * 3. 设计阈值队列，避免频繁操作数据库。
 * 4. 设计存储队列，防止异步存储写入延迟导致阈值队列频繁触发。
 * 5. 针对网络情况、页面关闭等情况做额外处理、上报。
 */

export default class TrackManager {
  private trackingData: TrackingPayloadType[] = [];
  private readonly THRESHOLD: number = 30;
  private saveQueue: TrackingPayloadType[] = [];

  // 添加埋点数据
  public push() {}

  // 持久化埋点数据
  public save() {}

  // flush
  //   public flush() {}

  // 上报埋点数据
  public report() {}
}

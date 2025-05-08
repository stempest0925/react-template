import { networkTracker } from "./NetworkTracker";

type SendBatchType = {
  id: string;
  attempts: number;
  data: TrackingPayloadType[];
};

class TrackingTransmitter {
  private ThresholdQueue: TrackingPayloadType[] = []; // 阈值队列
  private readonly THRESHOLD = 30; // 触发发送的阈值

  private SendQueue: SendBatchType[] = []; // 发送队列
  private readonly RETRY_COUNT = 3; // 发送重试的次数

  private networkTacker = networkTracker;
  // 先完成数据的采集，在考虑存储和发送的事情。
  constructor() {
    this.networkTacker.subscribe((state) => {
      if (state === "online" && this.SendQueue.length > 0) this.flush();
    });
  }
  // 添加数据并检查阈值，添加到发送队列
  add(data: any): void {
    this.ThresholdQueue.push(data);
    if (this.ThresholdQueue.length >= this.THRESHOLD) {
      this.SendQueue.push({
        id: Date.now().toString(), //generateUUID() 这里临时用时间戳替代下
        attempts: 0,
        data: this.ThresholdQueue
      });
      this.ThresholdQueue = [];
    }
  }

  tryFlush() {
    if (this.networkTacker.currentState === "online") {
      this.flush();
    } else {
      // 通过IndexDB存储
    }
  }

  flush() {}

  // 批量更新，需要批量数字段，  链式更新，还有更新的优先级，先更新错误，然后是性能行为，重试次数过多的缓存到indexdb，更新后续规则进行更新

  async send(): Promise<any> {}

  async sendByImage(): Promise<any> {}

  async sendByBeacon(): Promise<any> {}
}

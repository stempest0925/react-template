interface IDataBuilderStrategy {
  build: (rawData: any) => TrackingPayloadType;
}

export class ErrorStrategy implements IDataBuilderStrategy {
  build(rawData) {}
}
export class PerformanceStrategy implements IDataBuilderStrategy {
  build: (rawData) => {};
}
export class BehaviorStrategy implements IDataBuilderStrategy {
  build: (rawData: any) => {};
}

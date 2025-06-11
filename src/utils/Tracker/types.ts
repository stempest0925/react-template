// 基础追踪元数据
interface TrackerBasePayload {
  track_id: string; // 追踪唯一ID
  track_type: "error" | "performance" | "behavior";

  timestamp: number; // 发生时间戳
  app_version: string; // 发生应用版本

  user: {
    user_id: string; // 用户ID/指纹（脱敏数据）
    session_id: string; // 会话ID
  };

  device: {
    ip?: string; // IP地址
    os: string; // 操作系统
    browser: string; // 浏览器
    screen: string; // 屏幕尺寸
  };

  page: {
    url: string; // 当前页面URL
    referrer: string; // 来源页面
  };
}

// 错误联合类型
type TrackerErrorPayload = HttpErrorPayload | JsErrorPayload | ResourceErrorPayload;

// HTTP错误字段
interface HttpErrorPayload extends TrackerBasePayload {
  track_type: "error";
  error_type: "http";
  api: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  status_code: number;
  duration: number;
}

// JS错误字段
interface JsErrorPayload extends TrackerBasePayload {
  error_type: "js";
  stack: string;
  component?: string;
}

// 资源错误字段
interface ResourceErrorPayload extends TrackerBasePayload {
  error_type: "resource";
  url: string;
  status: number;
  size: number;
}

// 性能联合类型
type TrackerPerformancePayload =
  | VitalsPerformancePayload
  | ApiPerformancePayload
  | ComponentPerformancePayload;

// 重要性能字段
interface VitalsPerformancePayload extends TrackerBasePayload {
  track_type: "performance";
  performance_type: "vitals";
}

// API性能字段(耗时等)
interface ApiPerformancePayload extends TrackerBasePayload {
  track_type: "performance";
  performance_type: "api";
}

// 组件性能字段(耗时等)
interface ComponentPerformancePayload extends TrackerBasePayload {
  track_type: "performance";
  performance_type: "component";
}

// 行为联合类型
type TrackerBehaviorPayload = ClickBehaviorPayload | ViewBehaviorPayload | SummitBehaviorPayload;

// 点击行为字段
interface ClickBehaviorPayload extends TrackerBasePayload {
  track_type: "behavior";
  behavior_type: "click";
}

// 浏览行为字段
interface ViewBehaviorPayload extends TrackerBasePayload {
  track_type: "behavior";
  behavior_type: "view";
}

// 提交行为字段
interface SummitBehaviorPayload extends TrackerBasePayload {
  track_type: "behavior";
  behavior_type: "summit";
}

// 整合数据类型
export type TrackerPayload =
  | TrackerErrorPayload
  | TrackerPerformancePayload
  | TrackerBehaviorPayload;

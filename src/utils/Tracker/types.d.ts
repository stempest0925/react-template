// 基础追踪元数据
interface BaseTrackingPayload {
  track_id: string; // 追踪唯一ID
  track_type: "error" | "performance" | "behavior"; // 追踪类型 错误、性能、行为

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

// 错误类型联合类型
type ErrorTrackPayload = HttpErrorData | JsErrorData | ResourceErrorData;

// HTTP错误专属字段
interface HttpErrorData extends BaseTrackingPayload {
  error_type: "http_error";
  api: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  status_code: number;
  duration: number;
}

// JS错误专属字段
interface JsErrorData extends BaseTrackingPayload {
  error_type: "js_error";
  stack: string;
  component?: string;
}

// 资源错误专属字段
interface ResourceErrorData extends BaseTrackingPayload {
  error_type: "resource_error";
  url: string;
  status: number;
  size: number;
}

// 整合追踪数据类型
type TrackingPayloadType = ErrorTrackPayload;

export interface BasicTrackPayload {
  // 基础信息
  event_id: string; // 唯一事件ID
  timestamp: number; // 事件发生时间戳

  // 设备信息
  ua: string; // UserAgent
  screen: string; // 屏幕分辨率
  language: string; // 浏览器语言

  // 用户信息
  user_id?: string; // 用户ID（需脱敏）
  session_id: string; // 会话ID

  // 页面信息
  url: string; // 当前页面URL
  referrer: string; // 来源页面

  // 事件详情
  event_type: string; // 事件类型标识
  event_data: Record<string, any>; // 自定义参数
}

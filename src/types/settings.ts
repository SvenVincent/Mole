// 设置接口定义

export interface Settings {
  theme: 'light' | 'dark' | 'system' // 主题
  language: 'zh' | 'en'              // 语言
  liquidGlassEffect: boolean          // 液态玻璃效果
  autoRefreshInterval: number         // 自动刷新间隔(ms)
}
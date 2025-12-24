// 进程监控接口定义

export interface Process {
  pid: number           // 进程ID
  name: string          // 进程名
  cpuUsage?: number     // CPU使用率(%)
  memoryUsage?: number  // 内存使用率(%)
  status?: string       // 进程状态
  startTime: number     // 启动时间(unix timestamp)
}

export interface ProcessList {
  processes: Process[]  // 进程列表
}
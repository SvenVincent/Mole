// 系统信息接口定义

export interface SystemInfo {
  hostname: string      // 主机名
  osVersion: string     // 系统版本
  kernelVersion: string // 内核版本
  uptime: number        // 运行时间(秒)
  loadAverage: number[] // 系统负载
}

export interface CpuInfo {
  name: string          // CPU 名称
  vendorId: string      // 制造商
  brand: string         // 品牌
  frequency: number     // 频率(MHz)
  cpuUsage: number      // CPU 使用率(%)
  physicalCores: number // 物理核心数
  logicalCores: number  // 逻辑核心数
}

export interface MemoryInfo {
  totalMem: number      // 总内存(bytes)
  usedMem: number       // 已使用内存(bytes)
  freeMem: number       // 空闲内存(bytes)
  memUsage: number      // 内存使用率(%)
  swapTotal: number     // 交换空间总大小(bytes)
  swapUsed: number      // 已使用交换空间(bytes)
}

export interface GpuInfo {
  name: string          // GPU名称
  gpu_usage: number     // GPU使用率(0-100)
  memory_usage: number  // 显存使用率(0-100)
}

export interface Disk {
  name: string          // 磁盘名称
  mountPoint: string    // 挂载点
  totalSpace: number    // 总空间(bytes)
  availableSpace: number // 可用空间(bytes)
  usedSpace: number     // 已使用空间(bytes)
  diskUsage: number     // 磁盘使用率(%)
}

export interface DiskInfo {
  totalSpace: number    // 总空间(bytes)
  availableSpace: number // 可用空间(bytes)
  usedSpace: number     // 已使用空间(bytes)
  diskUsage: number     // 磁盘使用率(%)
  disks: Disk[]         // 各分区信息
}

export interface BatteryInfo {
  has_battery: boolean   // 是否有电池
  power_connected: boolean // 是否连接电源适配器
  percentage: number     // 电量百分比 (0-100)
  is_charging: boolean   // 是否正在充电
  is_full: boolean       // 是否已充满
  time_remaining: number // 充电时:充满还需时间/未充电:可用时间(分钟)，-1表示未知
  health: number         // 电池健康度 (0-100)
  cycle_count: number    // 循环次数
  voltage: number        // 电压 (mV)
  amperage: number       // 电流 (mA)，正数充电，负数放电
  power_watts: number    // 功率 (W)
  current_capacity: number // 当前容量 (mAh)
  max_capacity: number   // 最大容量 (mAh)
  design_capacity: number // 设计容量 (mAh)
}

export interface NetworkInterface {
  name: string            // 接口名称
  ip_addresses: string[]  // IP 地址列表
  mac_address: string     // MAC 地址
  received_bytes: number  // 接收字节数
  transmitted_bytes: number // 发送字节数
  interface_type: string  // 接口类型 (wifi/ethernet/vpn/other)
  is_connected: boolean   // 是否连接
}

export interface NetworkSpeed {
  download_speed: number    // 下载速度(bytes/s)
  upload_speed: number      // 上传速度(bytes/s)
  total_received: number    // 总接收字节数
  total_transmitted: number // 总发送字节数
  local_ip: string          // 本机 IPv4
  local_ipv6: string        // 本机 IPv6
  public_ip: string         // 公网/VPN 出口 IP
  country_code: string      // 国家代码 (ISO 3166-1 alpha-2)
  wifi_ssid: string         // WiFi 名称
  network_type: string      // 网络类型 (wifi/ethernet)
  interfaces: NetworkInterface[] // 网络接口列表
}

// 别名
export type NetworkInfo = NetworkSpeed
//! 系统信息数据模型

use serde::{Deserialize, Serialize};

/// 系统基本信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    /// 主机名
    pub hostname: String,
    /// 系统版本
    pub os_version: String,
    /// 内核版本
    pub kernel_version: String,
    /// 运行时间(秒)
    pub uptime: u64,
    /// 系统负载
    pub load_average: [f64; 3],
}

/// CPU信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuInfo {
    /// CPU名称
    pub name: String,
    /// 制造商
    pub vendor_id: String,
    /// 品牌
    pub brand: String,
    /// 频率(MHz)
    pub frequency: u64,
    /// CPU使用率(0-1)
    pub cpu_usage: f32,
    /// 物理核心数
    pub physical_cores: usize,
    /// 逻辑核心数
    pub logical_cores: usize,
}

/// 内存信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryInfo {
    /// 总内存(bytes)
    pub total_mem: u64,
    /// 已使用内存(bytes)
    pub used_mem: u64,
    /// 空闲内存(bytes)
    pub free_mem: u64,
    /// 内存使用率(0-1)
    pub mem_usage: f32,
    /// 交换空间总大小(bytes)
    pub swap_total: u64,
    /// 已使用交换空间(bytes)
    pub swap_used: u64,
}

/// GPU信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuInfo {
    /// GPU名称
    pub name: String,
    /// GPU使用率(0-100)
    pub gpu_usage: f32,
    /// 显存使用率(0-100)
    pub memory_usage: f32,
}

/// 磁盘信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Disk {
    /// 磁盘名称
    pub name: String,
    /// 挂载点
    pub mount_point: String,
    /// 总空间(bytes)
    pub total_space: u64,
    /// 可用空间(bytes)
    pub available_space: u64,
    /// 已使用空间(bytes)
    pub used_space: u64,
    /// 磁盘使用率(0-1)
    pub disk_usage: f32,
}

/// 磁盘信息集合
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskInfo {
    /// 总空间(bytes)
    pub total_space: u64,
    /// 可用空间(bytes)
    pub available_space: u64,
    /// 已使用空间(bytes)
    pub used_space: u64,
    /// 磁盘使用率(0-1)
    pub disk_usage: f32,
    /// 各分区信息
    pub disks: Vec<Disk>,
}

/// 电池信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatteryInfo {
    /// 是否有电池
    pub has_battery: bool,
    /// 是否连接电源适配器
    pub power_connected: bool,
    /// 电量百分比 (0-100)
    pub percentage: f32,
    /// 是否正在充电
    pub is_charging: bool,
    /// 是否已充满
    pub is_full: bool,
    /// 充电时: 充满还需时间(分钟)，未充电时: 可用时间(分钟)，-1表示未知
    pub time_remaining: i32,
    /// 电池健康度 (0-100)
    pub health: f32,
    /// 循环次数
    pub cycle_count: u32,
    /// 电压 (mV)
    pub voltage: u32,
    /// 电流 (mA)，正数表示充电，负数表示放电
    pub amperage: i32,
    /// 功率 (W)
    pub power_watts: f32,
    /// 当前容量 (mAh)
    pub current_capacity: u32,
    /// 最大容量 (mAh)
    pub max_capacity: u32,
    /// 设计容量 (mAh)
    pub design_capacity: u32,
}

/// 网络接口信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInterface {
    /// 接口名称
    pub name: String,
    /// IP 地址列表
    pub ip_addresses: Vec<String>,
    /// MAC 地址
    pub mac_address: String,
    /// 接收字节数
    pub received_bytes: u64,
    /// 发送字节数
    pub transmitted_bytes: u64,
    /// 接口类型 (wifi/ethernet/vpn/other)
    pub interface_type: String,
    /// 是否连接
    pub is_connected: bool,
}

/// 网络速度信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkSpeed {
    /// 下载速度 (bytes/s)
    pub download_speed: u64,
    /// 上传速度 (bytes/s)
    pub upload_speed: u64,
    /// 总接收字节数
    pub total_received: u64,
    /// 总发送字节数
    pub total_transmitted: u64,
    /// 本机 IPv4 地址
    pub local_ip: String,
    /// 本机 IPv6 地址
    pub local_ipv6: String,
    /// 公网/VPN 出口 IP 地址
    pub public_ip: String,
    /// 公网 IP 对应的国家代码 (ISO 3166-1 alpha-2)
    pub country_code: String,
    /// WiFi 网络名称 (SSID)
    pub wifi_ssid: String,
    /// 当前网络类型 (wifi/ethernet)
    pub network_type: String,
    /// 网络接口列表
    pub interfaces: Vec<NetworkInterface>,
}
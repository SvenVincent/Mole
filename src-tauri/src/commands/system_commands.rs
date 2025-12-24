//! 系统信息相关命令

use tauri::command;
use crate::services::system_service::SystemService;
use crate::models::system::{SystemInfo, CpuInfo, MemoryInfo, DiskInfo, BatteryInfo, NetworkSpeed, GpuInfo};

/// 获取系统基本信息
#[command]
pub fn get_system_info() -> SystemInfo {
    let service = SystemService::new();
    service.get_system_info()
}

/// 获取CPU信息
#[command]
pub fn get_cpu_info() -> CpuInfo {
    let service = SystemService::new();
    service.get_cpu_info()
}

/// 获取内存信息
#[command]
pub fn get_memory_info() -> MemoryInfo {
    let service = SystemService::new();
    service.get_memory_info()
}

/// 获取磁盘信息
#[command]
pub fn get_disk_info() -> DiskInfo {
    let service = SystemService::new();
    service.get_disk_info()
}

/// 获取电池信息
#[command]
pub fn get_battery_info() -> BatteryInfo {
    let service = SystemService::new();
    service.get_battery_info()
}

/// 获取GPU信息
#[command]
pub fn get_gpu_info() -> GpuInfo {
    let service = SystemService::new();
    service.get_gpu_info()
}

/// 获取网络速度信息
#[command]
pub fn get_network_speed() -> NetworkSpeed {
    let service = SystemService::new();
    service.get_network_speed()
}
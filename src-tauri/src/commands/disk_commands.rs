//! 磁盘分析相关命令

use tauri::command;
use crate::services::disk_service::DiskService;
use crate::models::disk::{DirectoryScanResult, LargeFilesResult, DeepScanResult, DiskTreeNode};

/// 扫描目录
#[command]
pub fn scan_directory(path: &str) -> Result<DirectoryScanResult, String> {
    let service = DiskService::new();
    service.scan_directory(path)
}

/// 查找大文件
#[command]
pub fn find_large_files(path: &str, limit: usize, min_size: u64) -> Result<LargeFilesResult, String> {
    let service = DiskService::new();
    service.find_large_files(path, limit, min_size)
}

/// 深度扫描目录
#[command]
pub fn scan_directory_deep(path: &str, max_depth: u32, top_files_limit: usize) -> Result<DeepScanResult, String> {
    let service = DiskService::new();
    service.scan_directory_deep(path, max_depth, top_files_limit)
}

/// 获取子目录详情
#[command]
pub fn get_directory_children(path: &str) -> Result<Vec<DiskTreeNode>, String> {
    let service = DiskService::new();
    service.get_directory_children(path)
}

/// 获取用户主目录
#[command]
pub fn get_home_directory() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "无法获取用户主目录".to_string())
}
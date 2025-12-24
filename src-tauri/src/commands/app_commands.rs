//! 应用管理相关命令

use tauri::command;
use crate::services::app_service::AppService;
use crate::models::app::{InstalledApps, UninstallResult, AppRelatedFiles, DuplicateResult};

/// 获取已安装的应用列表
#[command]
pub fn get_installed_apps() -> Result<InstalledApps, String> {
    let service = AppService::new();
    service.get_installed_apps()
}

/// 获取支持双开的应用列表
#[command]
pub fn get_duplicatable_apps() -> Result<InstalledApps, String> {
    let service = AppService::new();
    service.get_duplicatable_apps()
}

/// 获取单个应用的大小
#[command]
pub fn get_app_size(app_path: &str) -> u64 {
    let service = AppService::new();
    service.get_single_app_size(app_path)
}

/// 获取单个应用的图标
#[command]
pub fn get_app_icon(app_path: &str) -> String {
    let service = AppService::new();
    service.get_single_app_icon(app_path)
}

/// 卸载应用
#[command]
pub fn uninstall_app(app_path: &str, remove_residuals: bool) -> Result<UninstallResult, String> {
    let service = AppService::new();
    service.uninstall_app(app_path, remove_residuals)
}

/// 获取应用相关文件
#[command]
pub fn get_app_related_files(app_path: &str, identifier: &str) -> AppRelatedFiles {
    let service = AppService::new();
    service.get_app_related_files(app_path, identifier)
}

/// 强制卸载应用（彻底删除）
#[command]
pub fn force_uninstall_app(app_path: &str, file_paths: Vec<String>) -> Result<UninstallResult, String> {
    let service = AppService::new();
    service.force_uninstall_app(app_path, file_paths)
}

/// 强制删除文件
#[command]
pub fn force_delete_files(file_paths: Vec<String>) -> Result<UninstallResult, String> {
    let service = AppService::new();
    service.force_delete_files(file_paths)
}

/// 快速双开应用
#[command]
pub fn quick_duplicate_app(app_path: &str) -> DuplicateResult {
    let service = AppService::new();
    service.quick_duplicate_app(app_path)
}

/// 创建应用副本
#[command]
pub fn create_duplicate_app(app_path: &str, app_name: &str, identifier: &str, icon_emoji: Option<String>) -> DuplicateResult {
    let service = AppService::new();
    service.create_duplicate_app(app_path, app_name, identifier, icon_emoji)
}
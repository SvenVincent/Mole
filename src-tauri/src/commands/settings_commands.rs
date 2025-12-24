//! 设置相关命令

use tauri::command;
use crate::services::settings_service::SettingsService;
use crate::models::settings::Settings;

/// 获取设置
#[command]
pub fn get_settings() -> Result<Settings, String> {
    let service = SettingsService::new();
    service.get_settings()
}

/// 更新设置
#[command]
pub fn update_settings(settings: Settings) -> Result<bool, String> {
    let service = SettingsService::new();
    service.update_settings(&settings)
}
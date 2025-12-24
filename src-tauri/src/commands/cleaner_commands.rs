//! 系统清理相关命令

use tauri::command;
use crate::services::cleaner_service::CleanerService;
use crate::models::cleaner::{CleanPlanPreview, CleanResult, CleanItem};

/// 预览清理计划
#[command]
pub fn preview_clean_plan(clean_types: Vec<String>) -> Result<CleanPlanPreview, String> {
    let service = CleanerService::new();
    service.preview_clean_plan(clean_types)
}

/// 执行清理
#[command]
pub fn execute_clean(items: Vec<CleanItem>) -> Result<CleanResult, String> {
    let service = CleanerService::new();
    service.execute_clean(items)
}
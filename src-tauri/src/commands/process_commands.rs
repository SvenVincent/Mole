//! 进程管理相关命令

use tauri::command;
use crate::services::process_service::ProcessService;
use crate::models::process::ProcessList;

/// 获取进程列表
#[command]
pub fn get_process_list() -> ProcessList {
    let service = ProcessService::new();
    service.get_process_list()
}

/// 结束进程
#[command]
pub fn kill_process(pid: u32) -> bool {
    let service = ProcessService::new();
    service.kill_process(pid)
}
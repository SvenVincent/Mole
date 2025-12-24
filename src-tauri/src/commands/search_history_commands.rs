//! 搜索历史相关命令

use tauri::command;
use crate::services::search_history_service::SearchHistoryService;
use crate::models::search_history::SearchHistoryItem;

/// 获取搜索历史
#[command]
pub fn get_search_history(page: String) -> Vec<SearchHistoryItem> {
    let service = SearchHistoryService::new();
    service.get_search_history(&page)
}

/// 添加搜索历史
#[command]
pub fn add_search_history(keyword: String, page: String) -> bool {
    let service = SearchHistoryService::new();
    service.add_search_history(keyword, page)
}

/// 清除搜索历史
#[command]
pub fn clear_search_history(page: String) -> bool {
    let service = SearchHistoryService::new();
    service.clear_search_history(&page)
}

/// 删除单条搜索历史
#[command]
pub fn delete_search_history(keyword: String, page: String) -> bool {
    let service = SearchHistoryService::new();
    service.delete_search_history(&keyword, &page)
}

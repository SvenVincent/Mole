//! 搜索历史数据模型

use serde::{Deserialize, Serialize};

/// 搜索历史记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchHistoryItem {
    /// 搜索关键词
    pub keyword: String,
    /// 页面来源标识
    pub page: String,
    /// 搜索时间戳
    pub timestamp: u64,
}

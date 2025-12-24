//! 系统清理数据模型

use serde::{Deserialize, Serialize};

/// 清理项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanItem {
    /// 清理类型
    pub type_: String,
    /// 路径
    pub path: String,
    /// 大小(bytes)
    pub size: u64,
    /// 描述
    pub description: String,
}

/// 清理计划预览
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanPlanPreview {
    /// 待清理项
    pub items: Vec<CleanItem>,
    /// 总大小(bytes)
    pub total_size: u64,
}

/// 清理结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanResult {
    /// 是否成功
    pub success: bool,
    /// 已清理大小(bytes)
    pub cleaned_size: u64,
    /// 失败项列表
    pub failed_items: Vec<String>,
}
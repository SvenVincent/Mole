//! 应用管理数据模型

use serde::{Deserialize, Serialize};

/// 应用信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    /// 应用名称
    pub name: String,
    /// 应用标识符
    pub identifier: String,
    /// 版本号
    pub version: String,
    /// 安装路径
    pub path: String,
    /// 图标路径
    pub icon_path: String,
    /// 应用大小(bytes)
    pub size: u64,
    /// 是否为双开副本
    pub is_duplicate: bool,
}

/// 已安装应用列表
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledApps {
    /// 应用列表
    pub apps: Vec<AppInfo>,
}

/// 卸载结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UninstallResult {
    /// 是否成功
    pub success: bool,
    /// 结果消息
    pub message: String,
    /// 移除的路径列表
    pub removed_paths: Vec<String>,
}

/// 应用相关文件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppRelatedFile {
    /// 文件名
    pub name: String,
    /// 文件路径
    pub path: String,
    /// 文件大小
    pub size: u64,
    /// 文件类型
    pub file_type: String,
}

/// 应用相关文件分组
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppRelatedFiles {
    /// 应用名称
    pub app_name: String,
    /// 应用路径
    pub app_path: String,
    /// 应用本体大小
    pub app_size: u64,
    /// 总大小
    pub total_size: u64,
    /// 文件总数
    pub total_files: u32,
    /// 二进制文件
    pub binary_files: Vec<AppRelatedFile>,
    /// 沙盒文件
    pub sandbox_files: Vec<AppRelatedFile>,
    /// 其他文件
    pub other_files: Vec<AppRelatedFile>,
}

/// 双开结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateResult {
    /// 是否成功
    pub success: bool,
    /// 结果消息
    pub message: String,
    /// 操作步骤日志
    pub steps: Vec<String>,
}

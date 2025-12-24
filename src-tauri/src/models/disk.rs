//! 磁盘分析数据模型

use serde::{Deserialize, Serialize};

/// 目录项信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectoryItem {
    /// 名称
    pub name: String,
    /// 完整路径
    pub path: String,
    /// 大小(bytes)
    pub size: u64,
    /// 是否为目录
    pub is_directory: bool,
    /// 最后修改时间(unix timestamp)
    pub last_modified: u64,
}

/// 目录扫描结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectoryScanResult {
    /// 扫描路径
    pub path: String,
    /// 总大小(bytes)
    pub size: u64,
    /// 文件/目录项
    pub items: Vec<DirectoryItem>,
}

/// 文件信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    /// 文件名
    pub name: String,
    /// 完整路径
    pub path: String,
    /// 文件大小(bytes)
    pub size: u64,
    /// 最后修改时间(unix timestamp)
    pub last_modified: u64,
}

/// 大文件查找结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LargeFilesResult {
    /// 大文件列表
    pub files: Vec<FileInfo>,
}

/// 深度扫描目录节点
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskTreeNode {
    /// 名称
    pub name: String,
    /// 完整路径
    pub path: String,
    /// 大小(bytes) - 目录则为所有子项总大小
    pub size: u64,
    /// 是否为目录
    pub is_directory: bool,
    /// 子节点（仅目录有）
    pub children: Vec<DiskTreeNode>,
    /// 文件数量
    pub file_count: u64,
    /// 目录数量
    pub dir_count: u64,
}

/// 深度扫描结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeepScanResult {
    /// 扫描路径
    pub path: String,
    /// 总大小(bytes)
    pub total_size: u64,
    /// 文件数量
    pub file_count: u64,
    /// 目录数量
    pub dir_count: u64,
    /// 目录树（第一层子目录）
    pub tree: Vec<DiskTreeNode>,
    /// Top 大文件
    pub large_files: Vec<FileInfo>,
    /// 按文件类型统计
    pub type_stats: Vec<FileTypeStats>,
}

/// 文件类型统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileTypeStats {
    /// 文件类型/扩展名
    pub extension: String,
    /// 文件数量
    pub count: u64,
    /// 总大小
    pub total_size: u64,
}
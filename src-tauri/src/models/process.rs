//! 进程信息数据模型

use serde::{Deserialize, Serialize};

/// 进程信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Process {
    /// 进程ID
    pub pid: u32,
    /// 进程名
    pub name: String,
    /// CPU使用率(0-1)
    pub cpu_usage: f32,
    /// 内存使用率(0-1)
    pub memory_usage: f32,
    /// 进程状态
    pub status: String,
    /// 启动时间(unix timestamp)
    pub start_time: u64,
}

/// 进程列表
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessList {
    /// 进程列表
    pub processes: Vec<Process>,
}
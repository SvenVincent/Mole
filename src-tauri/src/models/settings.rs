//! 设置数据模型

use serde::{Deserialize, Serialize};

/// 设置信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    /// 主题
    pub theme: String, // "light", "dark", "system"
    /// 语言
    pub language: String, // "zh", "en"
    /// 液态玻璃效果
    pub liquid_glass_effect: bool,
    /// 自动刷新间隔(ms)
    pub auto_refresh_interval: u64,
}
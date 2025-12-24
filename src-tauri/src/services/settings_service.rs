//! 设置服务实现

use std::fs;
use std::path::Path;
use crate::models::settings::Settings;

/// 设置服务
pub struct SettingsService {
    config_path: String,
}

impl SettingsService {
    /// 创建新的设置服务实例
    pub fn new() -> Self {
        // 在实际应用中，这里应该是用户的配置文件路径
        let config_path = "mole_settings.json".to_string();
        SettingsService { config_path }
    }

    /// 获取设置
    pub fn get_settings(&self) -> Result<Settings, String> {
        // 如果配置文件存在，读取配置文件
        if Path::new(&self.config_path).exists() {
            if let Ok(content) = fs::read_to_string(&self.config_path) {
                if let Ok(settings) = serde_json::from_str(&content) {
                    return Ok(settings);
                }
            }
        }

        // 如果配置文件不存在或读取失败，返回默认设置
        Ok(Settings {
            theme: "system".to_string(),
            language: "zh".to_string(),
            liquid_glass_effect: false,
            auto_refresh_interval: 500,
        })
    }

    /// 更新设置
    pub fn update_settings(&self, settings: &Settings) -> Result<bool, String> {
        // 将设置序列化为 JSON 并保存到文件
        match serde_json::to_string_pretty(settings) {
            Ok(json) => {
                match fs::write(&self.config_path, json) {
                    Ok(_) => Ok(true),
                    Err(e) => Err(format!("无法保存设置文件: {}", e)),
                }
            }
            Err(e) => Err(format!("无法序列化设置: {}", e)),
        }
    }
}
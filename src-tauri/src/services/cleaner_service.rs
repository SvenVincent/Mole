//! 清理服务实现

use std::fs;
use std::path::Path;
use std::process::Command;
use crate::models::cleaner::{CleanItem, CleanPlanPreview, CleanResult};

/// 清理服务
pub struct CleanerService;

impl CleanerService {
    /// 创建新的清理服务实例
    pub fn new() -> Self {
        CleanerService
    }

    /// 获取用户主目录
    fn get_home_dir() -> Option<String> {
        dirs::home_dir().map(|p| p.to_string_lossy().to_string())
    }

    /// 获取目录总大小（不递归列出每个文件）
    fn get_dir_as_single_item(&self, path: &str, clean_type: &str, description: &str) -> Vec<CleanItem> {
        let mut items = Vec::new();
        let path = Path::new(path);
        
        if !path.exists() {
            return items;
        }

        let size = self.calculate_dir_size(path);
        if size > 0 {
            items.push(CleanItem {
                type_: clean_type.to_string(),
                path: path.to_string_lossy().to_string(),
                size,
                description: description.to_string(),
            });
        }

        items
    }

    /// 计算目录总大小
    fn calculate_dir_size(&self, path: &Path) -> u64 {
        let mut size = 0u64;
        
        if path.is_file() {
            return fs::metadata(path).map(|m| m.len()).unwrap_or(0);
        }

        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let entry_path = entry.path();
                if entry_path.is_file() {
                    size += fs::metadata(&entry_path).map(|m| m.len()).unwrap_or(0);
                } else if entry_path.is_dir() {
                    size += self.calculate_dir_size(&entry_path);
                }
            }
        }

        size
    }

    /// 扫描废纸篓
    fn scan_trash(&self) -> Vec<CleanItem> {
        let mut items = Vec::new();
        
        // 使用 osascript 通过 Finder 获取废纸篓内容
        // 这种方式可以绕过权限限制
        let script = r#"
            tell application "Finder"
                set trashItems to items of trash
                set output to ""
                repeat with anItem in trashItems
                    set itemPath to POSIX path of (anItem as alias)
                    set itemName to name of anItem
                    try
                        set itemSize to size of anItem
                    on error
                        set itemSize to 0
                    end try
                    set output to output & itemPath & "|" & itemName & "|" & itemSize & "
"
                end repeat
                return output
            end tell
        "#;
        
        let result = Command::new("osascript")
            .arg("-e")
            .arg(script)
            .output();
        
        match result {
            Ok(output) => {
                if output.status.success() {
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    for line in stdout.lines() {
                        let parts: Vec<&str> = line.split('|').collect();
                        if parts.len() >= 3 {
                            let path = parts[0].to_string();
                            let name = parts[1].to_string();
                            let size: u64 = parts[2].parse().unwrap_or(0);
                            
                            // 跳过 .DS_Store
                            if name == ".DS_Store" {
                                continue;
                            }
                            
                            items.push(CleanItem {
                                type_: "trash".to_string(),
                                path,
                                size,
                                description: format!("废纸篓: {}", name),
                            });
                        }
                    }
                } else {
                    eprintln!("[调试] osascript 失败: {}", String::from_utf8_lossy(&output.stderr));
                }
            }
            Err(e) => {
                eprintln!("[调试] 执行 osascript 失败: {}", e);
            }
        }
        
        // 如果 osascript 失败，尝试直接读取
        if items.is_empty() {
            if let Some(home) = Self::get_home_dir() {
                let trash_path = format!("{}/.Trash", home);
                let path = Path::new(&trash_path);
                
                if path.exists() && path.is_dir() {
                    if let Ok(entries) = fs::read_dir(path) {
                        for entry in entries.flatten() {
                            let entry_path = entry.path();
                            
                            if let Some(name) = entry_path.file_name() {
                                if name.to_string_lossy() == ".DS_Store" {
                                    continue;
                                }
                            }

                            let size = if entry_path.is_file() {
                                fs::metadata(&entry_path).map(|m| m.len()).unwrap_or(0)
                            } else {
                                self.calculate_dir_size(&entry_path)
                            };

                            let name = entry_path.file_name()
                                .map(|n| n.to_string_lossy().to_string())
                                .unwrap_or_else(|| "未知".to_string());

                            items.push(CleanItem {
                                type_: "trash".to_string(),
                                path: entry_path.to_string_lossy().to_string(),
                                size,
                                description: format!("废纸篓: {}", name),
                            });
                        }
                    }
                }
            }
        }
        
        // 如果仍然没有数据，返回提示
        if items.is_empty() {
            items.push(CleanItem {
                type_: "trash".to_string(),
                path: "~/.Trash".to_string(),
                size: 0,
                description: "废纸篓为空或需要完全磁盘访问权限".to_string(),
            });
        }
        
        items
    }

    /// 扫描缓存
    fn scan_cache(&self) -> Vec<CleanItem> {
        let mut items = Vec::new();
        
        if let Some(home) = Self::get_home_dir() {
            let cache_path = format!("{}/Library/Caches", home);
            let path = Path::new(&cache_path);
            
            if path.exists() {
                // 列出缓存目录中的每个应用缓存
                if let Ok(entries) = fs::read_dir(path) {
                    for entry in entries.flatten() {
                        let entry_path = entry.path();
                        
                        // 跳过系统关键缓存
                        if let Some(name) = entry_path.file_name() {
                            let name_str = name.to_string_lossy();
                            if name_str.starts_with("com.apple.") || name_str == ".DS_Store" {
                                continue;
                            }
                        }

                        let size = if entry_path.is_file() {
                            fs::metadata(&entry_path).map(|m| m.len()).unwrap_or(0)
                        } else {
                            self.calculate_dir_size(&entry_path)
                        };

                        // 只显示大于 1MB 的缓存
                        if size < 1024 * 1024 {
                            continue;
                        }

                        let name = entry_path.file_name()
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_else(|| "未知".to_string());

                        items.push(CleanItem {
                            type_: "cache".to_string(),
                            path: entry_path.to_string_lossy().to_string(),
                            size,
                            description: format!("缓存: {}", name),
                        });
                    }
                }
            }
        }

        items
    }

    /// 扫描日志
    fn scan_logs(&self) -> Vec<CleanItem> {
        let mut items = Vec::new();
        
        if let Some(home) = Self::get_home_dir() {
            let logs_path = format!("{}/Library/Logs", home);
            let path = Path::new(&logs_path);
            
            if path.exists() {
                if let Ok(entries) = fs::read_dir(path) {
                    for entry in entries.flatten() {
                        let entry_path = entry.path();
                        
                        if let Some(name) = entry_path.file_name() {
                            if name.to_string_lossy() == ".DS_Store" {
                                continue;
                            }
                        }

                        let size = if entry_path.is_file() {
                            fs::metadata(&entry_path).map(|m| m.len()).unwrap_or(0)
                        } else {
                            self.calculate_dir_size(&entry_path)
                        };

                        // 只显示大于 100KB 的日志
                        if size < 100 * 1024 {
                            continue;
                        }

                        let name = entry_path.file_name()
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_else(|| "未知".to_string());

                        items.push(CleanItem {
                            type_: "logs".to_string(),
                            path: entry_path.to_string_lossy().to_string(),
                            size,
                            description: format!("日志: {}", name),
                        });
                    }
                }
            }
        }

        items
    }

    /// 扫描下载文件夹
    fn scan_downloads(&self) -> Vec<CleanItem> {
        let mut items = Vec::new();
        
        if let Some(home) = Self::get_home_dir() {
            let downloads_path = format!("{}/Downloads", home);
            let path = Path::new(&downloads_path);
            
            if path.exists() {
                if let Ok(entries) = fs::read_dir(path) {
                    for entry in entries.flatten() {
                        let entry_path = entry.path();
                        
                        if let Some(name) = entry_path.file_name() {
                            if name.to_string_lossy() == ".DS_Store" {
                                continue;
                            }
                        }

                        let size = if entry_path.is_file() {
                            fs::metadata(&entry_path).map(|m| m.len()).unwrap_or(0)
                        } else {
                            self.calculate_dir_size(&entry_path)
                        };

                        let name = entry_path.file_name()
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_else(|| "未知".to_string());

                        items.push(CleanItem {
                            type_: "downloads".to_string(),
                            path: entry_path.to_string_lossy().to_string(),
                            size,
                            description: format!("下载: {}", name),
                        });
                    }
                }
            }
        }

        items
    }

    /// 扫描临时文件
    fn scan_temp(&self) -> Vec<CleanItem> {
        let mut items = Vec::new();
        
        // 扫描 /tmp
        let tmp_path = "/tmp";
        if let Ok(entries) = fs::read_dir(tmp_path) {
            for entry in entries.flatten() {
                let entry_path = entry.path();
                
                // 只扫描当前用户的临时文件
                if let Ok(metadata) = fs::metadata(&entry_path) {
                    let size = if entry_path.is_file() {
                        metadata.len()
                    } else {
                        self.calculate_dir_size(&entry_path)
                    };

                    // 只显示大于 1MB 的临时文件
                    if size < 1024 * 1024 {
                        continue;
                    }

                    let name = entry_path.file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_else(|| "未知".to_string());

                    items.push(CleanItem {
                        type_: "temp".to_string(),
                        path: entry_path.to_string_lossy().to_string(),
                        size,
                        description: format!("临时文件: {}", name),
                    });
                }
            }
        }

        // 扫描用户临时目录
        if let Some(home) = Self::get_home_dir() {
            let user_tmp = format!("{}/Library/Application Support/CrashReporter", home);
            let sub_items = self.get_dir_as_single_item(&user_tmp, "temp", "崩溃报告");
            items.extend(sub_items);
        }

        items
    }

    /// 预览清理计划
    pub fn preview_clean_plan(&self, clean_types: Vec<String>) -> Result<CleanPlanPreview, String> {
        let mut items = Vec::new();

        for clean_type in clean_types {
            match clean_type.as_str() {
                "cache" => {
                    items.extend(self.scan_cache());
                }
                "logs" => {
                    items.extend(self.scan_logs());
                }
                "trash" => {
                    items.extend(self.scan_trash());
                }
                "downloads" => {
                    items.extend(self.scan_downloads());
                }
                "temp" => {
                    items.extend(self.scan_temp());
                }
                _ => {}
            }
        }

        // 按大小排序（大的在前）
        items.sort_by(|a, b| b.size.cmp(&a.size));

        let total_size = items.iter().map(|i| i.size).sum();

        Ok(CleanPlanPreview {
            items,
            total_size,
        })
    }

    /// 执行清理
    pub fn execute_clean(&self, items: Vec<CleanItem>) -> Result<CleanResult, String> {
        let mut cleaned_size = 0u64;
        let mut failed_items = Vec::new();
        let mut success = true;

        for item in items {
            let path = Path::new(&item.path);
            
            let result = if path.is_dir() {
                fs::remove_dir_all(path)
            } else {
                fs::remove_file(path)
            };

            match result {
                Ok(_) => {
                    cleaned_size += item.size;
                }
                Err(e) => {
                    failed_items.push(format!("{}: {}", item.path, e));
                    success = false;
                }
            }
        }

        Ok(CleanResult {
            success: success || cleaned_size > 0,
            cleaned_size,
            failed_items,
        })
    }
}

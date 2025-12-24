//! 应用管理服务实现

use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use base64::{Engine as _, engine::general_purpose};
use crate::models::app::{AppInfo, InstalledApps, UninstallResult, AppRelatedFile, AppRelatedFiles, DuplicateResult};

/// 应用管理服务
pub struct AppService;

impl AppService {
    /// 创建新的应用管理服务实例
    pub fn new() -> Self {
        AppService
    }

    /// 获取已安装的应用列表（快速版，不计算大小）
    pub fn get_installed_apps(&self) -> Result<InstalledApps, String> {
        let mut apps: Vec<AppInfo> = Vec::new();
        
        // 只扫描主要应用目录（跳过系统应用以加快速度）
        let app_directories = vec![
            "/Applications".to_string(),
            dirs::home_dir()
                .map(|h| h.join("Applications").to_string_lossy().to_string())
                .unwrap_or_default(),
        ];

        for dir in app_directories {
            if dir.is_empty() {
                continue;
            }
            self.scan_apps_in_directory_fast(&dir, &mut apps);
        }

        // 按名称排序
        apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

        Ok(InstalledApps { apps })
    }

    /// 快速扫描目录中的应用（不计算大小）
    fn scan_apps_in_directory_fast(&self, dir: &str, apps: &mut Vec<AppInfo>) {
        let path = Path::new(dir);
        if !path.exists() || !path.is_dir() {
            return;
        }

        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let entry_path = entry.path();
                
                if entry_path.is_dir() {
                    if let Some(ext) = entry_path.extension() {
                        if ext == "app" {
                            if let Some(app_info) = self.get_app_info_fast(&entry_path) {
                                apps.push(app_info);
                            }
                        }
                    }
                }
            }
        }
    }

    /// 获取单个应用的大小
    pub fn get_single_app_size(&self, app_path: &str) -> u64 {
        let path = Path::new(app_path);
        self.get_app_size(path)
    }

    /// 获取单个应用的图标（Base64 格式）
    pub fn get_single_app_icon(&self, app_path: &str) -> String {
        let path = Path::new(app_path);
        let info_plist = path.join("Contents/Info.plist");
        if info_plist.exists() {
            self.get_icon_path(path, &info_plist)
        } else {
            String::new()
        }
    }

    /// 获取支持双开的应用列表（支持已双开的应用）
    pub fn get_duplicatable_apps(&self) -> Result<InstalledApps, String> {
        // 支持双开的应用名称关键词（不区分大小写）
        let keywords = [
            "qq", "wechat", "微信", "企业微信", "wecom",
            "dingtalk", "钉钉", "feishu", "飞书", "lark",
        ];
        
        // 排除的应用（不显示）
        let excluded = ["qqmusic", "qqlive", "qqbrowser"];

        let mut apps: Vec<AppInfo> = Vec::new();
        
        // 扫描 /Applications 目录
        self.scan_duplicatable_apps("/Applications", &keywords, &excluded, &mut apps);
        
        // 扫描用户应用目录
        if let Some(home) = dirs::home_dir() {
            let user_apps_dir = home.join("Applications");
            self.scan_duplicatable_apps(
                &user_apps_dir.to_string_lossy(),
                &keywords,
                &excluded,
                &mut apps
            );
        }

        Ok(InstalledApps { apps })
    }

    /// 扫描目录中支持双开的应用
    fn scan_duplicatable_apps(
        &self,
        dir: &str,
        keywords: &[&str],
        excluded: &[&str],
        apps: &mut Vec<AppInfo>
    ) {
        let path = Path::new(dir);
        if !path.exists() || !path.is_dir() {
            return;
        }

        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let entry_path = entry.path();
                
                if entry_path.is_dir() {
                    if let Some(ext) = entry_path.extension() {
                        if ext == "app" {
                            // 获取应用名称（小写）
                            let app_name = entry_path.file_stem()
                                .map(|s| s.to_string_lossy().to_lowercase())
                                .unwrap_or_default();
                            
                            // 检查是否在排除列表中
                            if excluded.iter().any(|e| app_name.contains(e)) {
                                continue;
                            }
                            
                            // 检查是否包含关键词
                            if keywords.iter().any(|k| app_name.contains(k)) {
                                if let Some(app_info) = self.get_app_info_with_icon(&entry_path) {
                                    // 避免重复
                                    if !apps.iter().any(|a| a.path == app_info.path) {
                                        apps.push(app_info);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /// 快速获取应用信息（不计算大小）
    fn get_app_info_fast(&self, app_path: &Path) -> Option<AppInfo> {
        let info_plist = app_path.join("Contents/Info.plist");
        
        if !info_plist.exists() {
            return None;
        }

        let name = self.read_plist_value(&info_plist, "CFBundleName")
            .or_else(|| self.read_plist_value(&info_plist, "CFBundleDisplayName"))
            .or_else(|| {
                app_path.file_stem()
                    .map(|s| s.to_string_lossy().to_string())
            })
            .unwrap_or_else(|| "Unknown".to_string());

        let identifier = self.read_plist_value(&info_plist, "CFBundleIdentifier")
            .unwrap_or_else(|| format!("unknown.{}", name.replace(" ", "")));

        let version = self.read_plist_value(&info_plist, "CFBundleShortVersionString")
            .or_else(|| self.read_plist_value(&info_plist, "CFBundleVersion"))
            .unwrap_or_else(|| "1.0".to_string());

        // 不获取图标，异步加载以加快页面加载速度
        let icon_path = String::new();
        
        // 判断是否为双开副本（应用名包含数字，如 "WeChat 2"、"微信2"）
        let app_file_name = app_path.file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        let is_duplicate = app_file_name.chars().any(|c| c.is_ascii_digit());

        Some(AppInfo {
            name,
            identifier,
            version,
            path: app_path.to_string_lossy().to_string(),
            icon_path,
            size: 0, // 不计算大小，加快速度
            is_duplicate,
        })
    }

    /// 获取应用信息（包含图标，用于双开应用）
    fn get_app_info_with_icon(&self, app_path: &Path) -> Option<AppInfo> {
        let info_plist = app_path.join("Contents/Info.plist");
        
        if !info_plist.exists() {
            return None;
        }

        let name = self.read_plist_value(&info_plist, "CFBundleName")
            .or_else(|| self.read_plist_value(&info_plist, "CFBundleDisplayName"))
            .or_else(|| {
                app_path.file_stem()
                    .map(|s| s.to_string_lossy().to_string())
            })
            .unwrap_or_else(|| "Unknown".to_string());

        let identifier = self.read_plist_value(&info_plist, "CFBundleIdentifier")
            .unwrap_or_else(|| format!("unknown.{}", name.replace(" ", "")));

        let version = self.read_plist_value(&info_plist, "CFBundleShortVersionString")
            .or_else(|| self.read_plist_value(&info_plist, "CFBundleVersion"))
            .unwrap_or_else(|| "1.0".to_string());

        // 获取图标
        let icon_path = self.get_icon_path(app_path, &info_plist);
        
        // 判断是否为双开副本
        let app_file_name = app_path.file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        let is_duplicate = app_file_name.chars().any(|c| c.is_ascii_digit());

        Some(AppInfo {
            name,
            identifier,
            version,
            path: app_path.to_string_lossy().to_string(),
            icon_path,
            size: 0,
            is_duplicate,
        })
    }

    /// 获取应用大小
    fn get_app_size(&self, app_path: &Path) -> u64 {
        // 使用 du 命令快速获取目录大小
        let output = Command::new("du")
            .args(["-sk", &app_path.to_string_lossy()])
            .output();

        if let Ok(output) = output {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                // du -sk 输出格式: "12345\t/path/to/app"
                if let Some(size_str) = stdout.split_whitespace().next() {
                    if let Ok(size_kb) = size_str.parse::<u64>() {
                        return size_kb * 1024; // 转换为 bytes
                    }
                }
            }
        }
        0
    }

    /// 读取 plist 文件中的值（支持中文）
    fn read_plist_value(&self, plist_path: &Path, key: &str) -> Option<String> {
        // 使用 PlistBuddy 读取，能正确处理中文
        let output = Command::new("/usr/libexec/PlistBuddy")
            .args(["-c", &format!("Print :{}", key), &plist_path.to_string_lossy()])
            .output();

        if let Ok(output) = output {
            if output.status.success() {
                let value = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !value.is_empty() && !value.contains("Does Not Exist") {
                    return Some(value);
                }
            }
        }

        // 备用：使用 defaults read
        let output = Command::new("defaults")
            .args(["read", &plist_path.to_string_lossy(), key])
            .output()
            .ok()?;

        if output.status.success() {
            let value = String::from_utf8_lossy(&output.stdout).trim().to_string();
            // 解码 Unicode 转义序列
            let decoded = self.decode_unicode_escapes(&value);
            if !decoded.is_empty() {
                return Some(decoded);
            }
        }
        None
    }

    /// 解码 Unicode 转义序列 (\uXXXX)
    fn decode_unicode_escapes(&self, input: &str) -> String {
        let mut result = String::new();
        let mut chars = input.chars().peekable();
        
        while let Some(c) = chars.next() {
            if c == '\\' {
                if let Some(&'u') = chars.peek() {
                    chars.next(); // 消费 'u'
                    let hex: String = chars.by_ref().take(4).collect();
                    if hex.len() == 4 {
                        if let Ok(code) = u32::from_str_radix(&hex, 16) {
                            if let Some(unicode_char) = char::from_u32(code) {
                                result.push(unicode_char);
                                continue;
                            }
                        }
                    }
                    // 如果解码失败，保留原始字符
                    result.push('\\');
                    result.push('u');
                    result.push_str(&hex);
                } else {
                    result.push(c);
                }
            } else {
                result.push(c);
            }
        }
        result
    }

    /// 获取应用图标路径（转换为 PNG）
    fn get_icon_path(&self, app_path: &Path, info_plist: &Path) -> String {
        // 尝试从 Info.plist 获取图标文件名
        let icon_file = self.read_plist_value(info_plist, "CFBundleIconFile")
            .unwrap_or_else(|| "AppIcon".to_string());

        let resources_path = app_path.join("Contents/Resources");
        
        // 查找 icns 文件
        let icon_extensions = [".icns", ".png", ""];
        let mut icns_path: Option<PathBuf> = None;
        
        for ext in icon_extensions {
            let icon_name = if icon_file.ends_with(".icns") || icon_file.ends_with(".png") {
                icon_file.clone()
            } else {
                format!("{}{}", icon_file, ext)
            };
            
            let icon_path = resources_path.join(&icon_name);
            if icon_path.exists() {
                // 如果已经是 PNG，直接返回
                if icon_name.ends_with(".png") {
                    return icon_path.to_string_lossy().to_string();
                }
                icns_path = Some(icon_path);
                break;
            }
        }

        // 如果找到 icns，转换为 PNG
        if let Some(icns) = icns_path {
            if let Some(png_path) = self.convert_icns_to_png(&icns, app_path) {
                return png_path;
            }
            // 转换失败，返回原始路径
            return icns.to_string_lossy().to_string();
        }

        // 默认图标路径
        resources_path.join("AppIcon.icns").to_string_lossy().to_string()
    }

    /// 将 icns 转换为 PNG 并返回 Base64 数据 URL（使用临时目录缓存）
    fn convert_icns_to_png(&self, icns_path: &Path, app_path: &Path) -> Option<String> {
        // 使用应用名生成缓存文件名
        let app_name = app_path.file_stem()?
            .to_string_lossy()
            .replace(" ", "_");
        let cache_dir = std::env::temp_dir().join("mole_icons");
        let _ = fs::create_dir_all(&cache_dir);
        let cache_path = cache_dir.join(format!("{}.png", app_name));

        // 如果缓存存在，直接读取
        if cache_path.exists() {
            if let Ok(png_data) = fs::read(&cache_path) {
                let base64_str = general_purpose::STANDARD.encode(&png_data);
                return Some(format!("data:image/png;base64,{}", base64_str));
            }
        }

        // 转换并缓存
        let output = Command::new("sips")
            .args([
                "-s", "format", "png",
                "-z", "64", "64",
                &icns_path.to_string_lossy(),
                "--out", &cache_path.to_string_lossy()
            ])
            .output();

        if let Ok(output) = output {
            if output.status.success() {
                if let Ok(png_data) = fs::read(&cache_path) {
                    let base64_str = general_purpose::STANDARD.encode(&png_data);
                    return Some(format!("data:image/png;base64,{}", base64_str));
                }
            }
        }

        None
    }

    /// 卸载应用
    pub fn uninstall_app(&self, app_path: &str, remove_residuals: bool) -> Result<UninstallResult, String> {
        let path = Path::new(app_path);
        
        if !path.exists() {
            return Err("应用不存在".to_string());
        }

        let mut removed_paths = Vec::new();

        // 移动应用到废纸篓
        let trash_result = Command::new("osascript")
            .args([
                "-e",
                &format!(
                    "tell application \"Finder\" to delete POSIX file \"{}\"",
                    app_path
                ),
            ])
            .output();

        match trash_result {
            Ok(output) if output.status.success() => {
                removed_paths.push(app_path.to_string());
            }
            _ => {
                return Err("无法将应用移动到废纸篓".to_string());
            }
        }

        // 如果需要移除残留文件
        if remove_residuals {
            // 获取应用标识符
            if let Some(identifier) = self.get_app_identifier_from_path(app_path) {
                let residual_paths = self.find_residual_files(&identifier);
                for residual in residual_paths {
                    if let Ok(_) = fs::remove_dir_all(&residual) {
                        removed_paths.push(residual);
                    } else if let Ok(_) = fs::remove_file(&residual) {
                        removed_paths.push(residual);
                    }
                }
            }
        }

        Ok(UninstallResult {
            success: true,
            message: "已移动到废纸篓".to_string(),
            removed_paths,
        })
    }

    /// 从应用路径获取标识符
    fn get_app_identifier_from_path(&self, app_path: &str) -> Option<String> {
        let info_plist = PathBuf::from(app_path).join("Contents/Info.plist");
        self.read_plist_value(&info_plist, "CFBundleIdentifier")
    }

    /// 查找应用残留文件
    fn find_residual_files(&self, identifier: &str) -> Vec<String> {
        let mut residuals = Vec::new();
        
        if let Some(home) = dirs::home_dir() {
            let residual_locations = [
                home.join("Library/Application Support").join(identifier),
                home.join("Library/Preferences").join(format!("{}.plist", identifier)),
                home.join("Library/Caches").join(identifier),
                home.join("Library/Logs").join(identifier),
                home.join("Library/Saved Application State").join(format!("{}.savedState", identifier)),
            ];

            for path in residual_locations {
                if path.exists() {
                    residuals.push(path.to_string_lossy().to_string());
                }
            }
        }

        residuals
    }

    /// 获取应用相关文件
    pub fn get_app_related_files(&self, app_path: &str, identifier: &str) -> AppRelatedFiles {
        let app_path_obj = Path::new(app_path);
        let app_name = app_path_obj.file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "Unknown".to_string());
        
        let app_size = self.get_single_app_size(app_path);
        
        let mut binary_files: Vec<AppRelatedFile> = Vec::new();
        let mut sandbox_files: Vec<AppRelatedFile> = Vec::new();
        let mut other_files: Vec<AppRelatedFile> = Vec::new();
        
        // 添加应用本体到二进制文件
        binary_files.push(AppRelatedFile {
            name: format!("{}.app", app_name),
            path: app_path.to_string(),
            size: app_size,
            file_type: "app".to_string(),
        });
        
        // 扫描应用内的其他 .app 文件
        let contents_path = app_path_obj.join("Contents");
        if let Ok(entries) = fs::read_dir(&contents_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map(|e| e == "app").unwrap_or(false) {
                    let size = self.get_single_app_size(&path.to_string_lossy());
                    binary_files.push(AppRelatedFile {
                        name: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                        path: path.to_string_lossy().to_string(),
                        size,
                        file_type: "helper".to_string(),
                    });
                }
            }
        }
        
        // 扫描沙盒文件 (~/Library/Containers/)
        if let Some(home) = dirs::home_dir() {
            let containers_dir = home.join("Library/Containers");
            if containers_dir.exists() {
                if let Ok(entries) = fs::read_dir(&containers_dir) {
                    for entry in entries.flatten() {
                        let entry_name = entry.file_name().to_string_lossy().to_string();
                        if entry_name.contains(identifier) || entry_name.to_lowercase().contains(&app_name.to_lowercase()) {
                            let path = entry.path();
                            let size = self.get_dir_size(&path);
                            sandbox_files.push(AppRelatedFile {
                                name: entry_name,
                                path: path.to_string_lossy().to_string(),
                                size,
                                file_type: "container".to_string(),
                            });
                        }
                    }
                }
            }
            
            // 扫描其他相关文件
            let other_locations = [
                home.join("Library/Application Support"),
                home.join("Library/Preferences"),
                home.join("Library/Caches"),
                home.join("Library/Logs"),
            ];
            
            for location in &other_locations {
                if location.exists() {
                    if let Ok(entries) = fs::read_dir(location) {
                        for entry in entries.flatten() {
                            let entry_name = entry.file_name().to_string_lossy().to_string();
                            if entry_name.contains(identifier) || entry_name.to_lowercase().contains(&app_name.to_lowercase()) {
                                let path = entry.path();
                                let size = if path.is_dir() {
                                    self.get_dir_size(&path)
                                } else {
                                    path.metadata().map(|m| m.len()).unwrap_or(0)
                                };
                                other_files.push(AppRelatedFile {
                                    name: entry_name,
                                    path: path.to_string_lossy().to_string(),
                                    size,
                                    file_type: location.file_name().unwrap_or_default().to_string_lossy().to_string(),
                                });
                            }
                        }
                    }
                }
            }
        }
        
        let total_size = binary_files.iter().map(|f| f.size).sum::<u64>()
            + sandbox_files.iter().map(|f| f.size).sum::<u64>()
            + other_files.iter().map(|f| f.size).sum::<u64>();
        let total_files = (binary_files.len() + sandbox_files.len() + other_files.len()) as u32;
        
        AppRelatedFiles {
            app_name,
            app_path: app_path.to_string(),
            app_size,
            total_size,
            total_files,
            binary_files,
            sandbox_files,
            other_files,
        }
    }
    
    /// 获取目录大小
    fn get_dir_size(&self, path: &Path) -> u64 {
        let output = Command::new("du")
            .args(["-sk", &path.to_string_lossy()])
            .output();
        
        if let Ok(output) = output {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                if let Some(size_str) = stdout.split_whitespace().next() {
                    if let Ok(size_kb) = size_str.parse::<u64>() {
                        return size_kb * 1024;
                    }
                }
            }
        }
        0
    }

    /// 强制卸载应用（彻底删除）
    pub fn force_uninstall_app(&self, app_path: &str, file_paths: Vec<String>) -> Result<UninstallResult, String> {
        let path = Path::new(app_path);
        
        if !path.exists() {
            return Err("应用不存在".to_string());
        }

        let mut removed_paths = Vec::new();
        let mut failed_paths = Vec::new();

        // 删除所有指定的文件
        for file_path in &file_paths {
            let p = Path::new(file_path);
            if p.exists() {
                let result = if p.is_dir() {
                    fs::remove_dir_all(p)
                } else {
                    fs::remove_file(p)
                };
                
                match result {
                    Ok(_) => removed_paths.push(file_path.clone()),
                    Err(_) => {
                        // 尝试使用 rm 命令
                        let rm_result = Command::new("rm")
                            .args(["-rf", file_path])
                            .output();
                        
                        match rm_result {
                            Ok(output) if output.status.success() => {
                                removed_paths.push(file_path.clone());
                            }
                            _ => {
                                failed_paths.push(file_path.clone());
                            }
                        }
                    }
                }
            }
        }

        if removed_paths.is_empty() && !failed_paths.is_empty() {
            return Err("无法删除文件，可能需要管理员权限".to_string());
        }

        Ok(UninstallResult {
            success: !removed_paths.is_empty(),
            message: if failed_paths.is_empty() {
                "已彻底删除".to_string()
            } else {
                format!("部分文件删除失败: {:?}", failed_paths)
            },
            removed_paths,
        })
    }

    /// 强制删除文件
    pub fn force_delete_files(&self, file_paths: Vec<String>) -> Result<UninstallResult, String> {
        let mut removed_paths = Vec::new();
        let mut failed_paths = Vec::new();

        for file_path in &file_paths {
            let p = Path::new(file_path);
            if p.exists() {
                let result = if p.is_dir() {
                    fs::remove_dir_all(p)
                } else {
                    fs::remove_file(p)
                };
                
                match result {
                    Ok(_) => removed_paths.push(file_path.clone()),
                    Err(_) => {
                        // 尝试使用 rm 命令
                        let rm_result = Command::new("rm")
                            .args(["-rf", file_path])
                            .output();
                        
                        match rm_result {
                            Ok(output) if output.status.success() => {
                                removed_paths.push(file_path.clone());
                            }
                            _ => {
                                failed_paths.push(file_path.clone());
                            }
                        }
                    }
                }
            }
        }

        Ok(UninstallResult {
            success: !removed_paths.is_empty() || file_paths.is_empty(),
            message: if failed_paths.is_empty() {
                "已彻底删除".to_string()
            } else {
                format!("部分文件删除失败: {:?}", failed_paths)
            },
            removed_paths,
        })
    }

    /// 快速双开应用 - 直接运行应用内部可执行文件
    pub fn quick_duplicate_app(&self, app_path: &str) -> DuplicateResult {
        let path = Path::new(app_path);
        
        if !path.exists() {
            return DuplicateResult {
                success: false,
                message: "应用不存在".to_string(),
                steps: vec![],
            };
        }

        // 获取应用名称
        let app_name = path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("App");

        // 构建可执行文件路径
        let macos_path = path.join("Contents/MacOS");
        
        if !macos_path.exists() {
            return DuplicateResult {
                success: false,
                message: "找不到应用的可执行文件".to_string(),
                steps: vec![],
            };
        }

        // 查找可执行文件
        let executable = if let Ok(entries) = fs::read_dir(&macos_path) {
            entries
                .flatten()
                .find(|e| {
                    let path = e.path();
                    path.is_file() && !path.file_name()
                        .and_then(|n| n.to_str())
                        .map(|n| n.starts_with('.'))
                        .unwrap_or(true)
                })
                .map(|e| e.path())
        } else {
            None
        };

        let exec_path = match executable {
            Some(p) => p,
            None => {
                // 尝试使用应用名称作为可执行文件名
                macos_path.join(app_name)
            }
        };

        if !exec_path.exists() {
            return DuplicateResult {
                success: false,
                message: format!("找不到可执行文件: {:?}", exec_path),
                steps: vec![],
            };
        }

        // 使用 nohup 运行，使其在后台运行
        let result = Command::new("nohup")
            .arg(&exec_path)
            .arg("/dev/null")
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn();

        match result {
            Ok(_) => DuplicateResult {
                success: true,
                message: format!("{} 已启动新实例", app_name),
                steps: vec![
                    format!("找到可执行文件: {:?}", exec_path),
                    "正在启动新实例...".to_string(),
                    "启动成功!".to_string(),
                ],
            },
            Err(e) => DuplicateResult {
                success: false,
                message: format!("启动失败: {}", e),
                steps: vec![format!("尝试运行: {:?}", exec_path)],
            },
        }
    }

    /// 创建应用副本 - 复制应用并修改标识符
    pub fn create_duplicate_app(&self, app_path: &str, app_name: &str, identifier: &str, icon_emoji: Option<String>) -> DuplicateResult {
        let source_path = Path::new(app_path);
        let mut steps = Vec::new();
        
        if !source_path.exists() {
            return DuplicateResult {
                success: false,
                message: "源应用不存在".to_string(),
                steps,
            };
        }

        // 确定副本名称和路径
        let parent_dir = source_path.parent().unwrap_or(Path::new("/Applications"));
        let mut copy_number = 2;
        let mut dest_path;
        
        // 如果有图标 emoji，添加到名称前
        let name_prefix = icon_emoji.clone().map(|e| format!("{} ", e)).unwrap_or_default();
        
        loop {
            let new_name = format!("{}{} {}.app", name_prefix, app_name, copy_number);
            dest_path = parent_dir.join(&new_name);
            if !dest_path.exists() {
                break;
            }
            copy_number += 1;
            if copy_number > 99 {
                return DuplicateResult {
                    success: false,
                    message: "副本数量超出限制".to_string(),
                    steps,
                };
            }
        }

        steps.push(format!("副本将创建为: {:?}", dest_path));

        // 复制应用
        steps.push("正在复制应用文件...".to_string());
        let copy_result = Command::new("cp")
            .args(["-R", app_path, dest_path.to_str().unwrap()])
            .output();

        match copy_result {
            Ok(output) if output.status.success() => {
                steps.push("复制完成".to_string());
            }
            Ok(output) => {
                return DuplicateResult {
                    success: false,
                    message: format!("复制失败: {}", String::from_utf8_lossy(&output.stderr)),
                    steps,
                };
            }
            Err(e) => {
                return DuplicateResult {
                    success: false,
                    message: format!("复制失败: {}", e),
                    steps,
                };
            }
        }

        // 修改 Bundle Identifier
        let info_plist = dest_path.join("Contents/Info.plist");
        let new_identifier = format!("{}_{}", identifier, copy_number);
        
        steps.push(format!("修改标识符为: {}", new_identifier));
        
        let plistbuddy_result = Command::new("/usr/libexec/PlistBuddy")
            .args([
                "-c",
                &format!("Set :CFBundleIdentifier {}", new_identifier),
                info_plist.to_str().unwrap(),
            ])
            .output();

        if let Ok(output) = plistbuddy_result {
            if output.status.success() {
                steps.push("标识符修改成功".to_string());
            } else {
                steps.push(format!("标识符修改失败: {}", String::from_utf8_lossy(&output.stderr)));
            }
        }

        // 删除扩展属性
        steps.push("删除扩展属性...".to_string());
        let _ = Command::new("xattr")
            .args(["-cr", dest_path.to_str().unwrap()])
            .output();

        // 重新签名
        steps.push("重新签名应用...".to_string());
        let codesign_result = Command::new("codesign")
            .args([
                "--force",
                "--deep",
                "--sign",
                "-",
                dest_path.to_str().unwrap(),
            ])
            .output();

        match codesign_result {
            Ok(output) if output.status.success() => {
                steps.push("签名成功".to_string());
            }
            Ok(output) => {
                steps.push(format!("签名失败 (可能不影响使用): {}", String::from_utf8_lossy(&output.stderr)));
            }
            Err(e) => {
                steps.push(format!("签名失败: {}", e));
            }
        }

        DuplicateResult {
            success: true,
            message: format!("{} 副本创建成功", app_name),
            steps,
        }
    }
}

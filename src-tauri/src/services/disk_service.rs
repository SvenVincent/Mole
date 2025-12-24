//! 磁盘服务实现

use std::collections::HashMap;
use std::fs;
use std::path::Path;
use crate::models::disk::{DirectoryItem, DirectoryScanResult, FileInfo, LargeFilesResult, DeepScanResult, DiskTreeNode, FileTypeStats};

/// 磁盘服务
pub struct DiskService;

impl DiskService {
    /// 创建新的磁盘服务实例
    pub fn new() -> Self {
        DiskService
    }

    /// 扫描目录
    pub fn scan_directory(&self, path: &str) -> Result<DirectoryScanResult, String> {
        let dir_path = Path::new(path);
        if !dir_path.exists() {
            return Err("目录不存在".to_string());
        }

        if !dir_path.is_dir() {
            return Err("路径不是目录".to_string());
        }

        let mut items = Vec::new();
        let mut total_size = 0u64;

        if let Ok(entries) = fs::read_dir(dir_path) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let file_path = entry.path();
                    let metadata = match fs::metadata(&file_path) {
                        Ok(metadata) => metadata,
                        Err(_) => continue,
                    };

                    let name = match file_path.file_name() {
                        Some(name) => name.to_string_lossy().to_string(),
                        None => continue,
                    };

                    let size = metadata.len();
                    total_size += size;

                    items.push(DirectoryItem {
                        name,
                        path: file_path.to_string_lossy().to_string(),
                        size,
                        is_directory: metadata.is_dir(),
                        last_modified: metadata
                            .modified()
                            .map(|time| {
                                time.duration_since(std::time::UNIX_EPOCH)
                                    .map(|dur| dur.as_secs())
                                    .unwrap_or(0)
                            })
                            .unwrap_or(0),
                    });
                }
            }
        }

        Ok(DirectoryScanResult {
            path: path.to_string(),
            size: total_size,
            items,
        })
    }

    /// 查找大文件
    pub fn find_large_files(&self, path: &str, limit: usize, min_size: u64) -> Result<LargeFilesResult, String> {
        let dir_path = Path::new(path);
        if !dir_path.exists() {
            return Err("目录不存在".to_string());
        }

        if !dir_path.is_dir() {
            return Err("路径不是目录".to_string());
        }

        let mut files = Vec::new();

        self.find_large_files_recursive(dir_path, &mut files, min_size);

        // 按大小排序
        files.sort_by(|a, b| b.size.cmp(&a.size));

        // 限制返回数量
        files.truncate(limit);

        Ok(LargeFilesResult { files })
    }

    /// 递归查找大文件
    fn find_large_files_recursive(&self, dir_path: &Path, files: &mut Vec<FileInfo>, min_size: u64) {
        if let Ok(entries) = fs::read_dir(dir_path) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let file_path = entry.path();
                    let metadata = match fs::metadata(&file_path) {
                        Ok(metadata) => metadata,
                        Err(_) => continue,
                    };

                    if metadata.is_file() && metadata.len() >= min_size {
                        let name = match file_path.file_name() {
                            Some(name) => name.to_string_lossy().to_string(),
                            None => continue,
                        };

                        files.push(FileInfo {
                            name,
                            path: file_path.to_string_lossy().to_string(),
                            size: metadata.len(),
                            last_modified: metadata
                                .modified()
                                .map(|time| {
                                    time.duration_since(std::time::UNIX_EPOCH)
                                        .map(|dur| dur.as_secs())
                                        .unwrap_or(0)
                                })
                                .unwrap_or(0),
                        });
                    } else if metadata.is_dir() {
                        self.find_large_files_recursive(&file_path, files, min_size);
                    }
                }
            }
        }
    }

    /// 深度扫描目录 - 计算所有子目录大小
    pub fn scan_directory_deep(&self, path: &str, max_depth: u32, top_files_limit: usize) -> Result<DeepScanResult, String> {
        let dir_path = Path::new(path);
        if !dir_path.exists() {
            return Err("目录不存在".to_string());
        }

        if !dir_path.is_dir() {
            return Err("路径不是目录".to_string());
        }

        let mut total_size = 0u64;
        let mut file_count = 0u64;
        let mut dir_count = 0u64;
        let mut large_files: Vec<FileInfo> = Vec::new();
        let mut type_stats: HashMap<String, (u64, u64)> = HashMap::new();

        let mut tree: Vec<DiskTreeNode> = Vec::new();

        if let Ok(entries) = fs::read_dir(dir_path) {
            for entry in entries.flatten() {
                let file_path = entry.path();
                let name = match file_path.file_name() {
                    Some(name) => name.to_string_lossy().to_string(),
                    None => continue,
                };

                if name.starts_with('.') {
                    continue;
                }

                let metadata = match fs::symlink_metadata(&file_path) {
                    Ok(metadata) => metadata,
                    Err(_) => continue,
                };

                if metadata.file_type().is_symlink() {
                    continue;
                }

                if metadata.is_dir() {
                    dir_count += 1;
                    let (sub_size, sub_files, sub_dirs, sub_types) = 
                        self.calculate_dir_size_deep(&file_path, max_depth - 1, &mut large_files);
                    
                    total_size += sub_size;
                    file_count += sub_files;
                    dir_count += sub_dirs;
                    
                    for (ext, (count, size)) in sub_types {
                        let entry = type_stats.entry(ext).or_insert((0, 0));
                        entry.0 += count;
                        entry.1 += size;
                    }

                    tree.push(DiskTreeNode {
                        name,
                        path: file_path.to_string_lossy().to_string(),
                        size: sub_size,
                        is_directory: true,
                        children: Vec::new(),
                        file_count: sub_files,
                        dir_count: sub_dirs,
                    });
                } else {
                    let size = metadata.len();
                    total_size += size;
                    file_count += 1;

                    let ext = file_path.extension()
                        .map(|e| e.to_string_lossy().to_lowercase())
                        .unwrap_or_else(|| "其他".to_string());
                    let entry = type_stats.entry(ext).or_insert((0, 0));
                    entry.0 += 1;
                    entry.1 += size;

                    if size > 50 * 1024 * 1024 {
                        let last_modified = metadata.modified()
                            .map(|time| time.duration_since(std::time::UNIX_EPOCH).map(|dur| dur.as_secs()).unwrap_or(0))
                            .unwrap_or(0);
                        
                        large_files.push(FileInfo {
                            name: name.clone(),
                            path: file_path.to_string_lossy().to_string(),
                            size,
                            last_modified,
                        });
                    }

                    tree.push(DiskTreeNode {
                        name,
                        path: file_path.to_string_lossy().to_string(),
                        size,
                        is_directory: false,
                        children: Vec::new(),
                        file_count: 0,
                        dir_count: 0,
                    });
                }
            }
        }

        tree.sort_by(|a, b| b.size.cmp(&a.size));
        large_files.sort_by(|a, b| b.size.cmp(&a.size));
        large_files.truncate(top_files_limit);

        let mut type_stats_vec: Vec<FileTypeStats> = type_stats
            .into_iter()
            .map(|(extension, (count, total_size))| FileTypeStats { extension, count, total_size })
            .collect();
        type_stats_vec.sort_by(|a, b| b.total_size.cmp(&a.total_size));
        type_stats_vec.truncate(20);

        Ok(DeepScanResult {
            path: path.to_string(),
            total_size,
            file_count,
            dir_count,
            tree,
            large_files,
            type_stats: type_stats_vec,
        })
    }

    fn calculate_dir_size_deep(
        &self, 
        dir_path: &Path, 
        depth: u32,
        large_files: &mut Vec<FileInfo>,
    ) -> (u64, u64, u64, HashMap<String, (u64, u64)>) {
        let mut size = 0u64;
        let mut file_count = 0u64;
        let mut dir_count = 0u64;
        let mut type_stats: HashMap<String, (u64, u64)> = HashMap::new();

        if let Ok(entries) = fs::read_dir(dir_path) {
            for entry in entries.flatten() {
                let file_path = entry.path();
                let metadata = match fs::symlink_metadata(&file_path) {
                    Ok(metadata) => metadata,
                    Err(_) => continue,
                };

                if metadata.file_type().is_symlink() {
                    continue;
                }

                if metadata.is_dir() {
                    dir_count += 1;
                    if depth > 0 {
                        let (sub_size, sub_files, sub_dirs, sub_types) = 
                            self.calculate_dir_size_deep(&file_path, depth - 1, large_files);
                        size += sub_size;
                        file_count += sub_files;
                        dir_count += sub_dirs;
                        
                        for (ext, (count, ext_size)) in sub_types {
                            let entry = type_stats.entry(ext).or_insert((0, 0));
                            entry.0 += count;
                            entry.1 += ext_size;
                        }
                    }
                } else {
                    let file_size = metadata.len();
                    size += file_size;
                    file_count += 1;

                    let ext = file_path.extension()
                        .map(|e| e.to_string_lossy().to_lowercase())
                        .unwrap_or_else(|| "其他".to_string());
                    let entry = type_stats.entry(ext).or_insert((0, 0));
                    entry.0 += 1;
                    entry.1 += file_size;

                    if file_size > 50 * 1024 * 1024 {
                        let name = file_path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
                        let last_modified = metadata.modified()
                            .map(|time| time.duration_since(std::time::UNIX_EPOCH).map(|dur| dur.as_secs()).unwrap_or(0))
                            .unwrap_or(0);

                        large_files.push(FileInfo {
                            name,
                            path: file_path.to_string_lossy().to_string(),
                            size: file_size,
                            last_modified,
                        });
                    }
                }
            }
        }

        (size, file_count, dir_count, type_stats)
    }

    /// 获取子目录详情（用于展开节点）
    pub fn get_directory_children(&self, path: &str) -> Result<Vec<DiskTreeNode>, String> {
        let dir_path = Path::new(path);
        if !dir_path.exists() {
            return Err("目录不存在".to_string());
        }

        if !dir_path.is_dir() {
            return Err("路径不是目录".to_string());
        }

        let mut children: Vec<DiskTreeNode> = Vec::new();

        if let Ok(entries) = fs::read_dir(dir_path) {
            for entry in entries.flatten() {
                let file_path = entry.path();
                let name = match file_path.file_name() {
                    Some(name) => name.to_string_lossy().to_string(),
                    None => continue,
                };

                if name.starts_with('.') {
                    continue;
                }

                let metadata = match fs::symlink_metadata(&file_path) {
                    Ok(metadata) => metadata,
                    Err(_) => continue,
                };

                if metadata.file_type().is_symlink() {
                    continue;
                }

                let (size, file_count, dir_count) = if metadata.is_dir() {
                    let (s, fc, dc, _) = self.calculate_dir_size_deep(&file_path, 10, &mut Vec::new());
                    (s, fc, dc)
                } else {
                    (metadata.len(), 0, 0)
                };

                children.push(DiskTreeNode {
                    name,
                    path: file_path.to_string_lossy().to_string(),
                    size,
                    is_directory: metadata.is_dir(),
                    children: Vec::new(),
                    file_count,
                    dir_count,
                });
            }
        }

        children.sort_by(|a, b| b.size.cmp(&a.size));
        Ok(children)
    }
}

// 应用管理接口定义

export interface AppInfo {
  name: string          // 应用名称
  identifier: string    // 应用标识符
  version: string       // 版本号
  path: string          // 安装路径
  icon_path: string     // 图标路径
  size: number          // 应用大小(bytes)
  is_duplicate: boolean // 是否为双开副本
}

export interface InstalledApps {
  apps: AppInfo[]       // 应用列表
}

export interface UninstallResult {
  success: boolean      // 是否成功
  removed_paths: string[] // 移除的路径列表
}

// 应用相关文件
export interface AppRelatedFile {
  name: string          // 文件名
  path: string          // 文件路径
  size: number          // 文件大小
  file_type: string     // 文件类型: app, container, cache, preferences, etc.
}

// 应用相关文件分组
export interface AppRelatedFiles {
  app_name: string             // 应用名称
  app_path: string             // 应用路径
  app_size: number             // 应用本体大小
  total_size: number           // 总大小
  total_files: number          // 文件总数
  binary_files: AppRelatedFile[]    // 二进制文件
  sandbox_files: AppRelatedFile[]   // 沙盒文件
  other_files: AppRelatedFile[]     // 其他文件
}

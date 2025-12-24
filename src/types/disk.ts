// 磁盘分析接口定义

export interface DirectoryItem {
  name: string          // 名称
  path: string          // 完整路径
  size: number          // 大小(bytes)
  is_directory: boolean // 是否为目录
  last_modified: number // 最后修改时间(unix timestamp)
}

export interface DirectoryScanResult {
  path: string          // 扫描路径
  size: number          // 总大小(bytes)
  items: DirectoryItem[] // 文件/目录项
}

export interface FileInfo {
  name: string          // 文件名
  path: string          // 完整路径
  size: number          // 文件大小(bytes)
  last_modified: number // 最后修改时间(unix timestamp)
}

export interface LargeFilesResult {
  files: FileInfo[]     // 大文件列表
}

// 深度扫描目录节点
export interface DiskTreeNode {
  name: string          // 名称
  path: string          // 完整路径
  size: number          // 大小(bytes)
  is_directory: boolean // 是否为目录
  children: DiskTreeNode[] // 子节点
  file_count: number    // 文件数量
  dir_count: number     // 目录数量
}

// 文件类型统计
export interface FileTypeStats {
  extension: string     // 扩展名
  count: number         // 文件数量
  total_size: number    // 总大小
}

// 深度扫描结果
export interface DeepScanResult {
  path: string          // 扫描路径
  total_size: number    // 总大小
  file_count: number    // 文件数量
  dir_count: number     // 目录数量
  tree: DiskTreeNode[]  // 目录树
  large_files: FileInfo[] // 大文件列表
  type_stats: FileTypeStats[] // 文件类型统计
}
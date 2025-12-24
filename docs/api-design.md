# Mole API 接口设计文档

## 1. 接口规范

### 1.1 通用响应格式
```typescript
interface ApiResponse<T> {
  code: number;        // 状态码：0 表示成功，其他表示失败
  message: string;     // 返回消息
  data: T;             // 实际数据
}
```

### 1.2 状态码定义
| 状态码 | 说明 |
|-------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 1002 | 权限不足 |
| 1003 | 数据不存在 |
| 5000 | 服务器内部错误 |

## 2. 系统信息相关接口

### 2.1 获取系统基本信息
- 接口名称：getSystemInfo
- 请求方式：Tauri invoke
- 请求参数：无
- 响应数据：
```typescript
interface SystemInfo {
  hostname: string;      // 主机名
  osVersion: string;     // 系统版本
  kernelVersion: string; // 内核版本
  uptime: number;        // 运行时间(秒)
  loadAverage: number[]; // 系统负载
}
```

### 2.2 获取CPU信息
- 接口名称：getCpuInfo
- 请求方式：Tauri invoke
- 请求参数：无
- 响应数据：
```typescript
interface CpuInfo {
  name: string;          // CPU 名称
  vendorId: string;      // 制造商
  brand: string;         // 品牌
  frequency: number;     // 频率(MHz)
  cpuUsage: number;      // CPU 使用率(%)
  physicalCores: number; // 物理核心数
  logicalCores: number;  // 逻辑核心数
}
```

### 2.3 获取内存信息
- 接口名称：getMemoryInfo
- 请求方式：Tauri invoke
- 请求参数：无
- 响应数据：
```typescript
interface MemoryInfo {
  totalMem: number;      // 总内存(bytes)
  usedMem: number;       // 已使用内存(bytes)
  freeMem: number;       // 空闲内存(bytes)
  memUsage: number;      // 内存使用率(%)
  swapTotal: number;     // 交换空间总大小(bytes)
  swapUsed: number;      // 已使用交换空间(bytes)
}
```

### 2.4 获取磁盘信息
- 接口名称：getDiskInfo
- 请求方式：Tauri invoke
- 请求参数：无
- 响应数据：
```typescript
interface DiskInfo {
  totalSpace: number;    // 总空间(bytes)
  availableSpace: number; // 可用空间(bytes)
  usedSpace: number;     // 已使用空间(bytes)
  diskUsage: number;     // 磁盘使用率(%)
  disks: Disk[];         // 各分区信息
}

interface Disk {
  name: string;          // 磁盘名称
  mountPoint: string;    // 挂载点
  totalSpace: number;    // 总空间(bytes)
  availableSpace: number; // 可用空间(bytes)
  usedSpace: number;     // 已使用空间(bytes)
  diskUsage: number;     // 磁盘使用率(%)
}
```

## 3. 进程监控相关接口

### 3.1 获取进程列表
- 接口名称：getProcessList
- 请求方式：Tauri invoke
- 请求参数：无
- 响应数据：
```typescript
interface ProcessList {
  processes: Process[];  // 进程列表
}

interface Process {
  pid: number;           // 进程ID
  name: string;          // 进程名
  cpuUsage: number;      // CPU使用率(%)
  memoryUsage: number;   // 内存使用率(%)
  status: string;        // 进程状态
  startTime: number;     // 启动时间(unix timestamp)
}
```

### 3.2 结束进程
- 接口名称：killProcess
- 请求方式：Tauri invoke
- 请求参数：
```typescript
interface KillProcessParams {
  pid: number;           // 进程ID
}
```
- 响应数据：
```typescript
interface KillProcessResult {
  success: boolean;      // 是否成功
}
```

## 4. 磁盘分析相关接口

### 4.1 扫描目录大小
- 接口名称：scanDirectory
- 请求方式：Tauri invoke
- 请求参数：
```typescript
interface ScanDirectoryParams {
  path: string;          // 目录路径
}
```
- 响应数据：
```typescript
interface DirectoryScanResult {
  path: string;          // 扫描路径
  size: number;          // 总大小(bytes)
  items: DirectoryItem[]; // 文件/目录项
}

interface DirectoryItem {
  name: string;          // 名称
  path: string;          // 完整路径
  size: number;          // 大小(bytes)
  isDirectory: boolean;  // 是否为目录
  lastModified: number;  // 最后修改时间(unix timestamp)
}
```

### 4.2 查找大文件
- 接口名称：findLargeFiles
- 请求方式：Tauri invoke
- 请求参数：
```typescript
interface FindLargeFilesParams {
  path: string;          // 搜索路径
  limit: number;         // 返回数量限制
  minSize: number;       // 最小文件大小(bytes)
}
```
- 响应数据：
```typescript
interface LargeFilesResult {
  files: FileInfo[];     // 大文件列表
}

interface FileInfo {
  name: string;          // 文件名
  path: string;          // 完整路径
  size: number;          // 文件大小(bytes)
  lastModified: number;  // 最后修改时间(unix timestamp)
}
```

## 5. 系统清理相关接口

### 5.1 预览清理计划
- 接口名称：previewCleanPlan
- 请求方式：Tauri invoke
- 请求参数：
```typescript
interface PreviewCleanPlanParams {
  cleanTypes: string[];  // 清理类型列表
}
```
- 响应数据：
```typescript
interface CleanPlanPreview {
  items: CleanItem[];    // 待清理项
  totalSize: number;     // 总大小(bytes)
}

interface CleanItem {
  type: string;          // 清理类型
  path: string;          // 路径
  size: number;          // 大小(bytes)
  description: string;   // 描述
}
```

### 5.2 执行清理
- 接口名称：executeClean
- 请求方式：Tauri invoke
- 请求参数：
```typescript
interface ExecuteCleanParams {
  items: CleanItem[];    // 清理项列表
}
```
- 响应数据：
```typescript
interface CleanResult {
  success: boolean;      // 是否成功
  cleanedSize: number;   // 已清理大小(bytes)
  failedItems: string[]; // 失败项列表
}
```

## 6. 软件管理相关接口

### 6.1 获取已安装应用列表
- 接口名称：getInstalledApps
- 请求方式：Tauri invoke
- 请求参数：无
- 响应数据：
```typescript
interface InstalledApps {
  apps: AppInfo[];       // 应用列表
}

interface AppInfo {
  name: string;          // 应用名称
  identifier: string;    // 应用标识符
  version: string;       // 版本号
  path: string;          // 安装路径
  iconPath: string;      // 图标路径
}
```

### 6.2 卸载应用
- 接口名称：uninstallApp
- 请求方式：Tauri invoke
- 请求参数：
```typescript
interface UninstallAppParams {
  identifier: string;    // 应用标识符
  removeResiduals: boolean; // 是否移除残留文件
}
```
- 响应数据：
```typescript
interface UninstallResult {
  success: boolean;      // 是否成功
  removedPaths: string[]; // 移除的路径列表
}
```

## 7. 系统优化相关接口

### 7.1 获取系统健康状态
- 接口名称：getSystemHealth
- 请求方式：Tauri invoke
- 请求参数：无
- 响应数据：
```typescript
interface SystemHealth {
  score: number;         // 健康评分(0-100)
  issues: HealthIssue[]; // 问题列表
  suggestions: string[]; // 建议列表
}

interface HealthIssue {
  type: string;          // 问题类型
  description: string;   // 问题描述
  severity: 'low' | 'medium' | 'high'; // 严重程度
}
```

### 7.2 应用系统优化
- 接口名称：applyOptimizations
- 请求方式：Tauri invoke
- 请求参数：
```typescript
interface ApplyOptimizationsParams {
  optimizationTypes: string[]; // 优化类型列表
}
```
- 响应数据：
```typescript
interface OptimizationResult {
  success: boolean;      // 是否成功
  appliedOptimizations: string[]; // 已应用的优化项
  failedOptimizations: string[];  // 失败的优化项
}
```

## 8. 设置相关接口

### 8.1 获取设置
- 接口名称：getSettings
- 请求方式：Tauri invoke
- 请求参数：无
- 响应数据：
```typescript
interface Settings {
  theme: 'light' | 'dark' | 'system'; // 主题
  language: 'zh' | 'en';              // 语言
  liquidGlassEffect: boolean;         // 液态玻璃效果
  autoRefreshInterval: number;        // 自动刷新间隔(ms)
}
```

### 8.2 更新设置
- 接口名称：updateSettings
- 请求方式：Tauri invoke
- 请求参数：
```typescript
interface UpdateSettingsParams {
  settings: Partial<Settings>;       // 更新的设置项
}
```
- 响应数据：
```typescript
interface UpdateSettingsResult {
  success: boolean;                  // 是否成功
}
```
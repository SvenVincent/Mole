# Mole - macOS 系统优化工具

Mole 是一款基于现代全栈架构的 macOS 系统优化工具，面向普通 macOS 用户。支持展示系统信息、深度清理、系统优化、进程监控、磁盘分析、软件卸载、应用双开、主题及语言设置等功能。

## 技术栈

### 前端
- **框架**: React 19.2 + TypeScript 5.9
- **状态管理**: Zustand (客户端状态) + React Query (服务端状态)
- **路由**: React Router v7
- **样式**: Tailwind CSS + CSS Variables
- **构建**: Vite 6.0
- **包管理**: bun 1.0.26

### 后端
- **框架**: Rust + Tauri 2.0
- **系统信息**: sysinfo
- **通信**: Tauri IPC

## 功能特性

| 功能 | 描述 |
|------|------|
| 📊 系统总览 | 实时显示 CPU、内存、磁盘、电池等系统信息 |
| 🧹 系统清理 | 清理缓存、日志、临时文件、废纸篓等 |
| ⚡ 系统优化 | 优化系统性能和启动项 |
| 📈 进程监控 | 查看和管理系统进程 |
| 💾 磁盘分析 | 分析磁盘使用情况，查找大文件 |
| 📦 应用卸载 | 彻底卸载应用及残留文件 |
| 🔄 应用双开 | 创建应用副本实现多开 |
| 🎨 主题支持 | 深色/浅色/跟随系统，玻璃效果 |

## 项目结构

```
.
├── src/                        # 前端源码 (React)
│   ├── components/             # UI 组件
│   │   └── Shared/             # 通用组件 (GlassCard, Button, Sidebar...)
│   ├── hooks/                  # React Query Hooks
│   │   ├── useSystemInfo.ts    # 系统信息查询
│   │   └── useCleaner.ts       # 清理功能查询
│   ├── layouts/                # 布局组件
│   │   └── AppLayout.tsx       # 主布局
│   ├── pages/                  # 页面组件
│   │   ├── Dashboard.tsx       # 系统总览
│   │   ├── CleanerPage.tsx     # 系统清理
│   │   ├── OptimizerPage.tsx   # 系统优化
│   │   ├── ProcessPage.tsx     # 进程监控
│   │   ├── DiskPage.tsx        # 磁盘分析
│   │   ├── UninstallPage.tsx   # 应用卸载
│   │   ├── DuplicatorPage.tsx  # 应用双开
│   │   └── SettingsPage.tsx    # 设置
│   ├── router/                 # 路由配置
│   ├── stores/                 # Zustand 状态管理
│   │   ├── theme.ts            # 主题状态
│   │   └── ui.ts               # UI 状态
│   ├── styles/                 # 全局样式
│   │   └── globals.css         # CSS 变量 + Tailwind
│   ├── types/                  # TypeScript 类型定义
│   ├── App.tsx                 # 根组件
│   └── main.tsx                # 入口文件
│
├── src-tauri/                  # 后端源码 (Rust)
│   ├── src/
│   │   ├── commands/           # Tauri 命令处理
│   │   │   ├── system_commands.rs
│   │   │   ├── cleaner_commands.rs
│   │   │   ├── disk_commands.rs
│   │   │   ├── process_commands.rs
│   │   │   ├── app_commands.rs
│   │   │   └── settings_commands.rs
│   │   ├── models/             # 数据模型定义
│   │   ├── services/           # 业务逻辑服务
│   │   ├── lib.rs              # 库入口
│   │   └── main.rs             # 主程序入口
│   ├── Cargo.toml              # Rust 依赖配置
│   └── tauri.conf.json         # Tauri 配置
│
├── docs/                       # 文档
│   ├── ui-ux-design.md         # UI/UX 设计规范
│   └── tech-stack-migration.md # 技术栈迁移指南
│
├── index.html                  # HTML 入口
├── package.json                # 前端依赖配置
├── tailwind.config.js          # Tailwind 配置
├── tsconfig.json               # TypeScript 配置
└── vite.config.ts              # Vite 配置
```

## 开发指南

### 环境准备

1. 安装 [Rust](https://www.rust-lang.org/)
2. 安装 [bun](https://bun.sh/)
3. 安装 [Tauri CLI](https://tauri.app/)

### 安装依赖

```bash
bun install
```

### 开发模式

```bash
bun run tauri dev
```

### 构建应用

```bash
bun run tauri build
```

## 架构设计

### 前端架构

- **React 19** 函数式组件 + Hooks
- **Zustand** 管理客户端状态 (UI、主题、用户选择)
- **React Query** 管理服务端状态 (API 请求、缓存、轮询)
- **Tailwind CSS** + CSS 变量实现主题系统
- **Glassmorphism** 玻璃拟态设计风格

### 后端架构

- 基于 **Rust** 和 **Tauri 2.0** 构建
- 模块化设计：commands / models / services 分层
- 使用 **sysinfo** 库获取系统信息
- 通过 **Tauri IPC** 机制与前端通信

## API 设计

所有前后端通信通过 Tauri 的 invoke 机制实现：

| 模块 | 接口 |
|------|------|
| 系统信息 | `get_system_info`, `get_cpu_info`, `get_memory_info`, `get_disk_info`, `get_network_info` |
| 进程管理 | `get_process_list`, `kill_process` |
| 磁盘分析 | `scan_directory`, `scan_directory_deep`, `find_large_files` |
| 系统清理 | `preview_clean_plan`, `execute_clean`, `empty_trash` |
| 应用管理 | `get_installed_apps`, `uninstall_app`, `create_duplicate_app` |
| 设置管理 | `get_settings`, `update_settings` |

## 设计规范

UI/UX 设计参考 CleanMyMac X，采用 Glassmorphism 风格：
- 玻璃效果卡片
- 三套主题 (浅色/深色/跟随系统)
- 温和友好的文案
- 所有操作可取消/可撤销

详见 [UI/UX 设计规范](docs/ui-ux-design.md)

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进 Mole。

## 许可证

[MIT](LICENSE)

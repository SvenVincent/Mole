# Mole 技术栈迁移指南

> **从 Vue + Pinia → React 19 + Zustand + React Query**

---

## 一、技术栈对比

### 原技术栈 (Vue)
- **框架**: Vue 3.9 + TypeScript5.9
- **状态管理**: Pinia
- **路由**: Vue Router 4.6
- **UI 库**: Naive UI
- **构建**: Vite 7.0
- **包管理**: bun 1.0.26

### 新技术栈 (React)
- **框架**: React 19.2 + TypeScript 5.9
- **状态管理**: Zustand (客户端) + React Query (服务端)
- **路由**: React Router v6+
- **UI 库**: 自定义组件 + Tailwind CSS
- **构建**: Vite 7.0
- **包管理**: bun 1.0.26

---

## 二、状态管理架构

### 2.1 客户端状态 (Zustand)

Zustand 适合管理：
- UI 状态 (Modal, Drawer, Tabs)
- 全局业务状态 (token, 用户选择)
- 跨组件共享的非接口数据
- 临时状态 / 派生状态

**示例 - 主题设置**:
```typescript
// stores/theme.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  mode: 'auto' | 'light' | 'dark'
  glassIntensity: number
  animationSpeed: number
  setMode: (mode: 'auto' | 'light' | 'dark') => void
  setGlassIntensity: (intensity: number) => void
  setAnimationSpeed: (speed: number) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'auto',
      glassIntensity: 3,
      animationSpeed: 3,
      setMode: (mode) => set({ mode }),
      setGlassIntensity: (intensity) => set({ glassIntensity: intensity }),
      setAnimationSpeed: (speed) => set({ animationSpeed: speed })
    }),
    {
      name: 'theme-storage'
    }
  )
)
```

**示例 - UI 状态**:
```typescript
// stores/ui.ts
import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  activeModal: string | null
  toasts: Toast[]
  toggleSidebar: () => void
  openModal: (modal: string) => void
  closeModal: () => void
  addToast: (toast: Toast) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  activeModal: null,
  toasts: [],
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  addToast: (toast) => set((state) => ({ toasts: [...state.toasts, toast] })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
}))
```

### 2.2 服务端状态 (React Query)

React Query 适合管理：
- API 请求 / 重试 / 错误处理
- 缓存与失效
- 自动重新请求 (focus / reconnect)
- 分页、无限滚动
- 与 React 19 的 use / Suspense 深度兼容

**示例 - 系统信息**:
```typescript
// hooks/useSystemInfo.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'

// 获取系统信息
export const useSystemInfo = () => {
  return useQuery({
    queryKey: ['system', 'info'],
    queryFn: async () => {
      const result = await invoke('get_system_info')
      return result as SystemInfo
    },
    refetchInterval: 2000, // 2秒轮询
    staleTime: 1000, // 1秒后视为过期
    retry: 2,
    suspense: true // 支持 React 19 Suspense
  })
}

// 获取 CPU 信息
export const useCpuInfo = () => {
  return useQuery({
    queryKey: ['system', 'cpu'],
    queryFn: async () => {
      const result = await invoke('get_cpu_info')
      return result as CpuInfo
    },
    refetchInterval: 2000,
    staleTime: 1000
  })
}

// 获取进程列表
export const useProcessList = () => {
  return useQuery({
    queryKey: ['processes'],
    queryFn: async () => {
      const result = await invoke('get_process_list')
      return result as ProcessList
    },
    refetchInterval: 2000,
    staleTime: 1000,
    retry: 1
  })
}

// 结束进程
export const useKillProcess = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pid: number) => {
      return await invoke('kill_process', { pid })
    },
    onSuccess: () => {
      // 失效并重新获取进程列表
      queryClient.invalidateQueries({ queryKey: ['processes'] })
    }
  })
}
```

**示例 - 磁盘分析**:
```typescript
// hooks/useDiskAnalysis.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'

// 扫描目录
export const useScanDirectory = (path: string) => {
  return useQuery({
    queryKey: ['disk', 'scan', path],
    queryFn: async () => {
      const result = await invoke('scan_directory', { path })
      return result as DirectoryScanResult
    },
    enabled: !!path, // 只有在有路径时才执行
    staleTime: Infinity // 扫描结果不自动过期
  })
}

// 深度扫描
export const useScanDirectoryDeep = (path: string, maxDepth: number) => {
  return useQuery({
    queryKey: ['disk', 'deep', path, maxDepth],
    queryFn: async () => {
      const result = await invoke('scan_directory_deep', {
        path,
        maxDepth,
        topFilesLimit: 10
      })
      return result as DeepScanResult
    },
    enabled: !!path,
    staleTime: Infinity
  })
}

// 查找大文件
export const useFindLargeFiles = (path: string, minSize: number) => {
  return useQuery({
    queryKey: ['disk', 'large', path, minSize],
    queryFn: async () => {
      const result = await invoke('find_large_files', {
        path,
        limit: 20,
        minSize
      })
      return result as LargeFilesResult
    },
    enabled: !!path,
    staleTime: Infinity
  })
}
```

### 2.3 混合状态示例

```typescript
// hooks/useCleaner.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@/stores/ui'
import { invoke } from '@tauri-apps/api/core'

// 清理计划预览
export const useCleanPlan = () => {
  return useQuery({
    queryKey: ['cleaner', 'plan'],
    queryFn: async () => {
      const result = await invoke('preview_clean_plan')
      return result as CleanPlan
    },
    enabled: false, // 手动触发
    staleTime: Infinity
  })
}

// 执行清理
export const useExecuteClean = () => {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()

  return useMutation({
    mutationFn: async (selectedPaths: string[]) => {
      return await invoke('execute_clean', { paths: selectedPaths })
    },
    onSuccess: (result: any) => {
      // 显示成功提示
      addToast({
        id: `clean-${Date.now()}`,
        type: 'success',
        message: `清理完成，释放 ${formatBytes(result.releasedSize)}`
      })

      // 失效相关查询
      queryClient.invalidateQueries({ queryKey: ['cleaner'] })
      queryClient.invalidateQueries({ queryKey: ['disk'] })
    },
    onError: (error) => {
      addToast({
        id: `clean-error-${Date.now()}`,
        type: 'error',
        message: `清理失败: ${error.message}`
      })
    }
  })
}
```

---

## 三、路由配置 (React Router v6)

### 3.1 路由结构

```typescript
// router/index.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import Dashboard from '@/pages/Dashboard'
import CleanerPage from '@/pages/CleanerPage'
import OptimizerPage from '@/pages/OptimizerPage'
import ProcessPage from '@/pages/ProcessPage'
import DiskPage from '@/pages/DiskPage'
import UninstallPage from '@/pages/UninstallPage'
import DuplicatorPage from '@/pages/DuplicatorPage'
import SettingsPage from '@/pages/SettingsPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'cleaner', element: <CleanerPage /> },
      { path: 'optimizer', element: <OptimizerPage /> },
      { path: 'process', element: <ProcessPage /> },
      { path: 'disk', element: <DiskPage /> },
      { path: 'uninstall', element: <UninstallPage /> },
      { path: 'duplicator', element: <DuplicatorPage /> },
      { path: 'settings', element: <SettingsPage /> }
    ]
  }
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
```

### 3.2 布局组件

```typescript
// layouts/AppLayout.tsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Shared/Sidebar'
import { useThemeStore } from '@/stores/theme'
import { useUIStore } from '@/stores/ui'

export default function AppLayout() {
  const { mode, glassIntensity } = useThemeStore()
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="app" data-theme={mode}>
      <Sidebar collapsed={sidebarCollapsed} />
      <main className="main-content">
        <Outlet /> {/* 子路由渲染 */}
      </main>
    </div>
  )
}
```

### 3.3 导航守卫

```typescript
// hooks/useAuth.ts
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export const useAuthGuard = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // 检查权限或配置
    const hasPermission = checkSystemPermission()
    if (!hasPermission) {
      navigate('/settings/permissions', { replace: true })
    }
  }, [navigate])
}

// 在页面中使用
export default function SomePage() {
  useAuthGuard()
  // ... 页面内容
}
```

---

## 四、组件设计模式

### 4.1 玻璃卡片组件

```typescript
// components/Shared/GlassCard.tsx
import { ReactNode, useState, useCallback } from 'react'
import { useThemeStore } from '@/stores/theme'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  intensity?: number
  onClick?: () => void
}

export const GlassCard = ({
  children,
  className = '',
  hover = true,
  intensity,
  onClick
}: GlassCardProps) => {
  const { mode, glassIntensity: globalIntensity } = useThemeStore()
  const [isHovered, setIsHovered] = useState(false)

  const finalIntensity = intensity ?? globalIntensity

  const handleMouseEnter = useCallback(() => {
    if (hover) setIsHovered(true)
  }, [hover])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  const glassStyle = {
    background: mode === 'dark'
      ? `rgba(20,20,20,${0.90 + finalIntensity * 0.02})`
      : `rgba(255,255,255,${0.80 + finalIntensity * 0.03})`,
    backdropFilter: `blur(${20 + finalIntensity * 3}px) saturate(180%)`,
    border: `1px solid ${mode === 'dark'
      ? `rgba(255,255,255,${0.15 - finalIntensity * 0.02})`
      : `rgba(0,0,0,${0.08 + finalIntensity * 0.02})`}`,
    transition: 'all 0.2s ease-out',
    transform: isHovered && hover ? 'translateY(-2px)' : 'none',
    boxShadow: isHovered && hover
      ? (mode === 'dark'
          ? '0 6px 32px rgba(0,0,0,0.5)'
          : '0 6px 32px rgba(0,0,0,0.12)')
      : 'none'
  }

  return (
    <div
      className={`glass-card ${hover ? 'hoverable' : ''} ${className}`}
      style={glassStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
```

### 4.2 进度环组件

```typescript
// components/Shared/ProgressRing.tsx
import { useEffect, useState } from 'react'

interface ProgressRingProps {
  percentage: number // 0-100
  size?: number
  strokeWidth?: number
  className?: string
  animated?: boolean
}

export const ProgressRing = ({
  percentage,
  size = 80,
  strokeWidth = 6,
  className = '',
  animated = false
}: ProgressRingProps) => {
  const [displayPercentage, setDisplayPercentage] = useState(0)

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayPercentage(percentage), 50)
      return () => clearTimeout(timer)
    }
    setDisplayPercentage(percentage)
  }, [percentage, animated])

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (displayPercentage / 100) * circumference

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* 背景圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-current opacity-20"
          strokeWidth={strokeWidth}
        />

        {/* 进度圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-current transition-all duration-300 ease-out"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset
          }}
        />
      </svg>

      {/* 中心文字 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{Math.round(displayPercentage)}%</span>
      </div>
    </div>
  )
}
```

### 4.3 按钮组件

```typescript
// components/Shared/Button.tsx
import { ReactNode, ButtonHTMLAttributes } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
}

const variantClasses = {
  primary: 'bg-blue-500 hover:bg-blue-600 text-white',
  secondary: 'bg-purple-500 hover:bg-purple-600 text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  ghost: 'bg-transparent border border-gray-300 hover:bg-gray-100'
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className = '',
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`
        rounded-lg font-semibold transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner size={size === 'sm' ? 14 : 16} />}
      {icon && !loading && <span className="icon">{icon}</span>}
      {!loading && children}
    </button>
  )
}
```

---

## 五、页面组件示例

### 5.1 Dashboard 页面

```typescript
// pages/Dashboard.tsx
import { useEffect } from 'react'
import { useSystemInfo, useCpuInfo, useMemoryInfo, useDiskInfo } from '@/hooks/useSystemInfo'
import { GlassCard } from '@/components/Shared/GlassCard'
import { MetricCard } from '@/components/SystemInfo/MetricCard'
import { useUIStore } from '@/stores/ui'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const { addToast } = useUIStore()

  // 使用 React Query 获取数据
  const { data: systemInfo, isLoading: systemLoading } = useSystemInfo()
  const { data: cpuInfo, isLoading: cpuLoading } = useCpuInfo()
  const { data: memoryInfo, isLoading: memoryLoading } = useMemoryInfo()
  const { data: diskInfo, isLoading: diskLoading } = useDiskInfo()

  // 计算健康分数
  const healthScore = calculateHealthScore(cpuInfo, memoryInfo, diskInfo)

  const handleQuickAction = (action: 'clean' | 'optimize' | 'scan') => {
    switch(action) {
      case 'clean':
        navigate('/cleaner')
        break
      case 'optimize':
        navigate('/optimizer')
        break
      case 'scan':
        navigate('/disk')
        break
    }
  }

  if (systemLoading || cpuLoading || memoryLoading || diskLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 顶部区域 */}
      <div className="flex justify-between items-start gap-6">
        <GlassCard className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-2">系统状态总览</h1>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-green-500">{healthScore}</div>
            <div className="text-sm text-gray-600">
              <div>系统健康评分</div>
              <div>上次清理: 2天前</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 min-w-[200px]">
          <h2 className="text-lg font-semibold mb-3">快速操作</h2>
          <div className="space-y-2">
            <Button onClick={() => handleQuickAction('clean')}>深度清理</Button>
            <Button
              variant="secondary"
              onClick={() => handleQuickAction('optimize')}
            >
              系统优化
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleQuickAction('scan')}
            >
              磁盘扫描
            </Button>
          </div>
        </GlassCard>
      </div>

      {/* 指标网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="CPU"
          value={cpuInfo?.cpu_usage || 0}
          type="cpu"
          unit="%"
        />
        <MetricCard
          title="内存"
          value={memoryInfo?.mem_usage || 0}
          type="memory"
          unit="%"
        />
        <MetricCard
          title="磁盘"
          value={diskInfo?.disk_usage || 0}
          type="disk"
          unit="%"
        />
        <MetricCard
          title="GPU"
          value={0.12}
          type="gpu"
          unit="%"
        />
        <MetricCard
          title="电池"
          value={0.87}
          type="battery"
          unit="%"
        />
        <MetricCard
          title="网络"
          value={50}
          type="network"
          unit="MB/s"
        />
      </div>

      {/* 洞察与建议 */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold mb-3">洞察与建议</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="text-green-500">●</span>
            发现 12 个可清理项目 (预计释放 2.3 GB)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-orange-500">●</span>
            建议优化: 禁用 3 个非必要开机项
          </li>
        </ul>
      </GlassCard>
    </div>
  )
}
```

### 5.2 Cleaner 页面 (带 Suspense)

```typescript
// pages/CleanerPage.tsx
import { useState, Suspense } from 'react'
import { useCleanPlan, useExecuteClean } from '@/hooks/useCleaner'
import { GlassCard } from '@/components/Shared/GlassCard'
import { Button } from '@/components/Shared/Button'
import { LoadingSpinner } from '@/components/Shared/LoadingSpinner'
import { useUIStore } from '@/stores/ui'

// 空状态组件
const EmptyState = ({ onScan }: { onScan: () => void }) => (
  <GlassCard className="p-12 text-center">
    <div className="text-6xl mb-4">✨</div>
    <h2 className="text-2xl font-bold mb-2">一键扫描系统垃圾文件</h2>
    <p className="text-gray-600 mb-6">
      缓存文件、日志、临时文件、应用残留<br/>
      安全快速，不删除系统关键文件
    </p>
    <Button size="lg" onClick={onScan}>开始扫描</Button>
    <p className="text-xs text-gray-500 mt-4">
      💡 小提示: 您可以随时取消扫描，所有操作都是可逆的
    </p>
  </GlassCard>
)

// 扫描结果组件
const ScanResults = ({ plan, onExecute }: {
  plan: any,
  onExecute: (selected: string[]) => void
}) => {
  const [selected, setSelected] = useState<string[]>([])

  const toggleSelect = (path: string) => {
    setSelected(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    )
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-bold">总计: {plan.totalItems} 项</span>
            <span className="mx-2">|</span>
            <span>可释放: {plan.totalSize}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setSelected(plan.items.map((i: any) => i.path))}
            >
              全选
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSelected([])}
            >
              取消全选
            </Button>
          </div>
        </div>
      </GlassCard>

      {plan.categories.map((cat: any) => (
        <GlassCard key={cat.name} className="p-4">
          <h3 className="font-semibold mb-2">
            {cat.icon} {cat.name} ({cat.items.length} 项, {cat.size})
          </h3>
          <div className="space-y-1 ml-6">
            {cat.items.map((item: any) => (
              <label key={item.path} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(item.path)}
                  onChange={() => toggleSelect(item.path)}
                />
                <span className="truncate">{item.path}</span>
              </label>
            ))}
          </div>
        </GlassCard>
      ))}

      <Button
        size="lg"
        disabled={selected.length === 0}
        onClick={() => onExecute(selected)}
      >
        清理选中项目 ({selected.length} 项)
      </Button>
    </div>
  )
}

// 主组件
export default function CleanerPage() {
  const [scanning, setScanning] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const { refetch: fetchPlan, data: plan, isLoading: planLoading } = useCleanPlan()
  const executeClean = useExecuteClean()

  const handleScan = async () => {
    setScanning(true)
    await fetchPlan()
    setScanning(false)
    setShowResults(true)
  }

  const handleExecute = (selected: string[]) => {
    executeClean.mutate(selected)
  }

  // 扫描中状态
  if (scanning) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <GlassCard className="p-12 text-center">
          <div className="mb-4">
            <LoadingSpinner size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold mb-2">正在扫描系统垃圾文件</h2>
          <p className="text-gray-600">已发现: {plan?.totalItems || 0} 项</p>
          <Button variant="ghost" onClick={() => setScanning(false)}>
            取消扫描
          </Button>
        </GlassCard>
      </div>
    )
  }

  // 初始状态
  if (!showResults) {
    return (
      <div className="p-6">
        <EmptyState onScan={handleScan} />
      </div>
    )
  }

  // 结果展示
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">系统清理 - 扫描结果</h1>

      <Suspense fallback={<div className="p-8 text-center">加载中...</div>}>
        {plan && <ScanResults plan={plan} onExecute={handleExecute} />}
      </Suspense>

      {executeClean.isSuccess && (
        <GlassCard className="p-6 bg-green-50 border-green-200">
          <h3 className="text-xl font-bold text-green-700 mb-2">✅ 清理完成！</h3>
          <p className="text-green-600">
            成功释放: {executeClean.data?.releasedSize} GB
          </p>
        </GlassCard>
      )}
    </div>
  )
}
```

---

## 六、React 19 新特性集成

### 6.1 use Hook

```typescript
// 使用 use 直接读取 Promise
import { use } from 'react'

function SystemInfo({ systemPromise }) {
  const systemInfo = use(systemPromise) // 直接使用 Promise

  return <div>{systemInfo.hostname}</div>
}

// 父组件
function Dashboard() {
  const systemPromise = useMemo(() =>
    invoke('get_system_info'),
    []
  )

  return <SystemInfo systemPromise={systemPromise} />
}
```

### 6.2 自动批处理

```typescript
// React 19 自动批处理，无需手动使用 startTransition
function OptimisticUpdate() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    // 这些更新会自动批处理
    setCount(c => c + 1)
    setSomeOtherState('updating')
    // 无需 startTransition
  }
}
```

### 6.3 Suspense 边界

```typescript
// 使用 Suspense 包裹异步组件
import useSuspenseense
import { Suspense } from 'react'

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Dashboard />
    </Suspense>
  )
}

// 在组件中使用 use + Suspense
function Dashboard() {
  const systemInfo = use(useSystemInfo().data) // 直接使用
  // ...
}
```

---

## 七、迁移步骤

### 阶段 1: 基础架构 (1-2 天)
1. ✅ 创建 React 19 + TypeScript 项目
2. ✅ 安装依赖 (Zustand, React Query, React Router, Tailwind)
3. ✅ 配置 Vite 和 TypeScript
4. ✅ 创建基本目录结构

### 阶段 2: 状态管理 (2-3 天)
1. ✅ 迁移 Pinia stores 到 Zustand
2. ✅ 创建 React Query hooks
3. ✅ 测试状态管理逻辑

### 阶段 3: 组件迁移 (3-5 天)
1. ✅ 创建基础组件 (GlassCard, Button, ProgressRing)
2. ✅ 迁移页面组件
3. ✅ 实现玻璃效果和主题系统

### 阶段 4: 路由和布局 (1-2 天)
1. ✅ 配置 React Router
2. ✅ 创建布局组件
3. ✅ 实现导航

### 阶段 5: 测试和优化 (2-3 天)
1. ✅ 功能测试
2. ✅ 性能优化
3. ✅ 类型检查

---

## 八、关键差异对比

### 8.1 状态订阅

**Vue (Pinia)**:
```vue
<script setup>
import { useSystemStore } from '@/stores/system'
const systemStore = useSystemStore()

// 自动响应式
systemStore.fetchSystemInfo()
</script>

<template>
  <div>{{ systemStore.cpuInfo }}</div>
</template>
```

**React (Zustand + Query)**:
```tsx
import { useSystemInfo } from '@/hooks/useSystemInfo'

function Dashboard() {
  const { data, isLoading } = useSystemInfo()

  if (isLoading) return <Loading />

  return <div>{data.cpuInfo}</div>
}
```

### 8.2 路由导航

**Vue**:
```vue
<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

router.push('/cleaner')
</script>
```

**React**:
```tsx
import { useNavigate } from 'react-router-dom'

function Component() {
  const navigate = useNavigate()

  navigate('/cleaner')
}
```

### 8.3 组件通信

**Vue**:
```vue
<script setup>
const props = defineProps(['message'])
const emit = defineEmits(['update'])
</script>
```

**React**:
```tsx
interface Props {
  message: string
  onUpdate: (value: string) => void
}

function Component({ message, onUpdate }: Props) {
  // ...
}
```

---

## 九、性能优化建议

### 9.1 React Query 配置
```typescript
// query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分钟
      cacheTime: 1000 * 60 * 10, // 10分钟
      refetchOnWindowFocus: false,
      retry: 2
    }
  }
})
```

### 9.2 虚拟滚动
```typescript
// 对于长列表使用 react-window
import { FixedSizeList as List } from 'react-window'

const ProcessList = ({ processes }) => (
  <List
    height={400}
    itemCount={processes.length}
    itemSize={50}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        {processes[index].name}
      </div>
    )}
  </List>
)
```

### 9.3 懒加载
```typescript
const CleanerPage = lazy(() => import('@/pages/CleanerPage'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CleanerPage />
    </Suspense>
  )
}
```

---

## 十、迁移检查清单

- [ ] 创建 React 19 项目结构
- [ ] 安装所有依赖
- [ ] 配置 TypeScript 和 Vite
- [ ] 迁移 Zustand stores
- [ ] 创建 React Query hooks
- [ ] 实现基础组件库
- [ ] 配置 React Router
- [ ] 迁移所有页面组件
- [ ] 实现玻璃效果和主题系统
- [ ] 测试所有功能
- [ ] 优化性能
- [ ] 类型检查通过

---

**文档结束**
**版本**: v1.0
**创建时间**: 2024-12-24
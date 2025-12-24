import { useState, useMemo } from 'react'
import { useProcessList, useKillProcess } from '@/hooks/useProcess'
import GlassCard from '@/components/Shared/GlassCard'
import Button from '@/components/Shared/Button'
import LoadingSpinner from '@/components/Shared/LoadingSpinner'
import { Search, X, AlertTriangle, Cpu, HardDrive } from 'lucide-react'
import type { Process } from '@/types/process'

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

// 进程行组件
function ProcessRow({
  process,
  onKill
}: {
  process: Process
  onKill: (pid: number) => void
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const isSystemProcess = process.pid < 100 || process.name.includes('kernel')

  // 安全地获取CPU和内存使用率，处理undefined情况
  const cpuUsage = process.cpuUsage ?? 0
  const memoryUsage = process.memoryUsage ?? 0

  const handleKill = () => {
    if (showConfirm) {
      onKill(process.pid)
      setShowConfirm(false)
    } else {
      setShowConfirm(true)
      setTimeout(() => setShowConfirm(false), 3000)
    }
  }

  return (
    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center p-3 hover:bg-[var(--state-hover)] rounded-lg transition-colors">
      <div className="min-w-0">
        <div className="font-medium text-primary truncate">{process.name}</div>
        <div className="text-xs text-tertiary">PID: {process.pid}</div>
      </div>
      <div className="text-sm text-secondary">
        {cpuUsage.toFixed(1)}%
      </div>
      <div className="text-sm text-secondary">
        {memoryUsage.toFixed(1)}%
      </div>
      <div className="text-sm text-tertiary">
        {formatTime(process.startTime)}
      </div>
      <div className="flex justify-end">
        {isSystemProcess ? (
          <span className="text-xs text-tertiary px-2 py-1 bg-[var(--state-hover)] rounded">
            系统进程
          </span>
        ) : (
          <Button
            variant={showConfirm ? 'danger' : 'ghost'}
            size="sm"
            onClick={handleKill}
            icon={showConfirm ? <AlertTriangle size={14} /> : <X size={14} />}
          >
            {showConfirm ? '确认' : '结束'}
          </Button>
        )}
      </div>
    </div>
  )
}

export default function ProcessPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'cpu' | 'memory' | 'name'>('cpu')
  
  const { data, isLoading, error } = useProcessList()
  const killProcess = useKillProcess()

  const processes = useMemo(() => {
    if (!data?.processes) return []
    
    let filtered = data.processes
    
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.pid.toString().includes(query)
      )
    }
    
    // 排序
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'cpu':
          return (b.cpuUsage ?? 0) - (a.cpuUsage ?? 0)
        case 'memory':
          return (b.memoryUsage ?? 0) - (a.memoryUsage ?? 0)
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })
    
    return filtered.slice(0, 50) // 只显示前50个
  }, [data, searchQuery, sortBy])

  const handleKill = (pid: number) => {
    killProcess.mutate(pid)
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto hidden-scrollbar flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size={48} />
          <p className="text-secondary mt-4">加载进程列表中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-6 overflow-y-auto hidden-scrollbar">
        <GlassCard className="p-6">
          <p className="text-danger">加载失败: {error.message}</p>
        </GlassCard>
      </div>
    )
  }

  const totalCpu = processes.reduce((sum, p) => sum + (p.cpuUsage ?? 0), 0)
  const totalMemory = processes.reduce((sum, p) => sum + (p.memoryUsage ?? 0), 0)

  return (
    <div className="flex-1 p-6 overflow-y-auto hidden-scrollbar">
      <div className="space-y-6 max-w-7xl mx-auto">
        <h1 className="text-h1 font-bold text-primary">进程监控</h1>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <Cpu size={24} className="text-primary" />
              <div>
                <div className="text-sm text-secondary">总进程数</div>
                <div className="text-number font-bold text-primary">
                  {processes.length}
                </div>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <Cpu size={24} className="text-warning" />
              <div>
                <div className="text-sm text-secondary">总CPU使用</div>
                <div className="text-number font-bold text-warning">
                  {totalCpu.toFixed(1)}%
                </div>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive size={24} className="text-info" />
              <div>
                <div className="text-sm text-secondary">总内存使用</div>
                <div className="text-number font-bold text-info">
                  {totalMemory.toFixed(1)}%
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* 搜索和排序 */}
        <GlassCard className="p-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
              <input
                type="text"
                placeholder="搜索进程名称或PID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-medium rounded-lg 
                         text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 
                         focus:ring-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'cpu' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('cpu')}
              >
                CPU
              </Button>
              <Button
                variant={sortBy === 'memory' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('memory')}
              >
                内存
              </Button>
              <Button
                variant={sortBy === 'name' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('name')}
              >
                名称
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* 进程列表 */}
        <GlassCard className="p-4">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center p-3 border-b border-medium mb-2">
            <div className="font-semibold text-secondary">进程名称</div>
            <div className="font-semibold text-secondary">CPU</div>
            <div className="font-semibold text-secondary">内存</div>
            <div className="font-semibold text-secondary">启动时间</div>
            <div></div>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {processes.length === 0 ? (
              <div className="text-center py-8 text-tertiary">
                没有找到匹配的进程
              </div>
            ) : (
              processes.map((process) => (
                <ProcessRow
                  key={process.pid}
                  process={process}
                  onKill={handleKill}
                />
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

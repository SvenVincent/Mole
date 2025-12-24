import { useState } from 'react'
import { useCleanPlan, useExecuteClean } from '@/hooks/useCleaner'
import GlassCard from '@/components/Shared/GlassCard'
import Button from '@/components/Shared/Button'
import ProgressRing from '@/components/Shared/ProgressRing'
import { Sparkles, XCircle, Folder, FileText, Trash2, CheckCircle2 } from 'lucide-react'

// 格式化字节
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 空状态组件
const EmptyState = ({ onScan }: { onScan: () => void }) => (
  <GlassCard className="p-12 text-center">
    <div className="mb-4 flex justify-center">
      <Sparkles size={64} className="text-primary" />
    </div>
    <h2 className="text-2xl font-bold mb-2 text-primary">一键扫描系统垃圾文件</h2>
    <p className="text-secondary mb-6 max-w-md mx-auto">
      缓存文件、日志、临时文件、应用残留<br/>
      安全快速，不删除系统关键文件
    </p>
    <Button size="lg" icon={<Sparkles size={20} />} onClick={onScan}>
      开始扫描
    </Button>
    <p className="text-xs text-tertiary mt-4">
      提示: 您可以随时取消扫描，所有操作都是可逆的
    </p>
  </GlassCard>
)

// 扫描中状态
const ScanningState = ({
  onCancel,
  scannedCount
}: {
  onCancel: () => void
  scannedCount: number
}) => (
  <GlassCard className="p-12 text-center">
    <div className="mb-6 flex justify-center">
      <ProgressRing
        percentage={0}
        size={80}
        strokeWidth={6}
        showText={false}
        animated={true}
        type="progress"
      />
    </div>
    <h2 className="text-xl font-bold mb-2 text-primary">正在扫描系统垃圾文件</h2>
    <p className="text-secondary mb-6">已发现: {scannedCount} 项</p>
    <Button variant="ghost" onClick={onCancel}>
      取消扫描
    </Button>
  </GlassCard>
)

// 扫描结果组件
const ScanResults = ({ 
  plan, 
  onExecute 
}: { 
  plan: any
  onExecute: (selected: string[]) => void
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleSelect = (path: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelected(new Set(plan.items.map((item: any) => item.path)))
  }

  const deselectAll = () => {
    setSelected(new Set())
  }

  // 按类型分组
  const grouped = plan.items.reduce((acc: Record<string, any[]>, item: any) => {
    const type = item.type || '其他'
    if (!acc[type]) acc[type] = []
    acc[type].push(item)
    return acc
  }, {})

  const selectedSize = Array.from(selected).reduce((total, path) => {
    const item = plan.items.find((i: any) => i.path === path)
    return total + (item?.size || 0)
  }, 0)

  const getTypeIcon = (type: string) => {
    if (type.includes('缓存') || type.includes('Cache')) return <Folder size={16} />
    if (type.includes('日志') || type.includes('Log')) return <FileText size={16} />
    return <Trash2 size={16} />
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <span className="font-bold text-primary">总计: {plan.totalItems || plan.items.length} 项</span>
            <span className="mx-2 text-tertiary">|</span>
            <span className="text-secondary">可释放: {formatBytes(plan.totalSize)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              全选
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              取消全选
            </Button>
          </div>
        </div>
      </GlassCard>

      {Object.entries(grouped).map(([type, items]) => {
        const typedItems = items as any[]
        const typeSize = typedItems.reduce((sum, item) => sum + item.size, 0)
        return (
          <GlassCard key={type} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              {getTypeIcon(type)}
              <h3 className="font-semibold text-primary">
                {type} ({typedItems.length} 项, {formatBytes(typeSize)})
              </h3>
            </div>
            <div className="space-y-1 ml-6 max-h-64 overflow-y-auto">
              {typedItems.map((item) => (
                <label
                  key={item.path}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-[var(--state-hover)] p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(item.path)}
                    onChange={() => toggleSelect(item.path)}
                    className="cursor-pointer"
                  />
                  <span className="truncate flex-1 text-secondary">{item.path}</span>
                  <span className="text-tertiary text-xs">{formatBytes(item.size)}</span>
                </label>
              ))}
            </div>
          </GlassCard>
        )
      })}

      <Button
        size="lg"
        disabled={selected.size === 0}
        onClick={() => onExecute(Array.from(selected))}
        icon={<Trash2 size={20} />}
      >
        清理选中项目 ({selected.size} 项, {formatBytes(selectedSize)})
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
    try {
      await fetchPlan()
      setScanning(false)
      setShowResults(true)
    } catch (error) {
      setScanning(false)
    }
  }

  const handleCancel = () => {
    setScanning(false)
  }

  const handleExecute = (selected: string[]) => {
    executeClean.mutate(selected, {
      onSuccess: () => {
        setShowResults(false)
      }
    })
  }

  // 扫描中状态
  if (scanning || planLoading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto hidden-scrollbar">
        <div className="space-y-6 max-w-4xl mx-auto">
          <h1 className="text-h1 font-bold text-primary">系统清理</h1>
          <ScanningState 
            onCancel={handleCancel} 
            scannedCount={plan?.totalItems || 0} 
          />
        </div>
      </div>
    )
  }

  // 初始状态
  if (!showResults) {
    return (
      <div className="flex-1 p-6 overflow-y-auto hidden-scrollbar">
        <div className="space-y-6 max-w-4xl mx-auto">
          <h1 className="text-h1 font-bold text-primary">系统清理</h1>
          <EmptyState onScan={handleScan} />
        </div>
      </div>
    )
  }

  // 结果展示
  return (
    <div className="flex-1 p-6 overflow-y-auto hidden-scrollbar">
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-h1 font-bold text-primary">系统清理 - 扫描结果</h1>

        {plan && <ScanResults plan={plan} onExecute={handleExecute} />}

        {executeClean.isSuccess && (
          <GlassCard className="p-6 border-2 border-success">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 size={24} className="text-success" />
              <h3 className="text-xl font-bold text-success">清理完成！</h3>
            </div>
            <p className="text-secondary">
              成功释放: {formatBytes(executeClean.data?.released_size || 0)}
            </p>
            <Button 
              variant="ghost" 
              className="mt-4"
              onClick={() => {
                setShowResults(false)
                executeClean.reset()
              }}
            >
              返回
            </Button>
          </GlassCard>
        )}

        {executeClean.isError && (
          <GlassCard className="p-6 border-2 border-danger">
            <div className="flex items-center gap-3 mb-2">
              <XCircle size={24} className="text-danger" />
              <h3 className="text-xl font-bold text-danger">清理失败</h3>
            </div>
            <p className="text-secondary">
              {executeClean.error?.message || '未知错误'}
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  )
}

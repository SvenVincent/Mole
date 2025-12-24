import { useState } from 'react'
import GlassCard from '@/components/Shared/GlassCard'
import Button from '@/components/Shared/Button'
import { Zap, AlertTriangle, Info, Shield } from 'lucide-react'
import { useUIStore } from '@/stores/ui'

interface OptimizationItem {
  id: string
  title: string
  description: string
  category: string
  risk: 'safe' | 'medium' | 'high'
  enabled: boolean
  impact: string
}

const defaultOptimizations: OptimizationItem[] = [
  {
    id: 'disable-animations',
    title: '减少动画效果',
    description: '减少系统动画以提高性能',
    category: '性能',
    risk: 'safe',
    enabled: false,
    impact: '轻微提升性能，视觉体验略有下降'
  },
  {
    id: 'disable-startup-items',
    title: '禁用非必要启动项',
    description: '禁用不必要的开机启动应用',
    category: '启动',
    risk: 'safe',
    enabled: false,
    impact: '加快启动速度'
  },
  {
    id: 'clear-dns-cache',
    title: '清理DNS缓存',
    description: '清理系统DNS缓存',
    category: '网络',
    risk: 'safe',
    enabled: false,
    impact: '可能改善网络连接'
  },
  {
    id: 'optimize-storage',
    title: '优化存储空间',
    description: '清理系统临时文件和缓存',
    category: '存储',
    risk: 'safe',
    enabled: false,
    impact: '释放存储空间'
  },
]

export default function OptimizerPage() {
  const [optimizations, setOptimizations] = useState<OptimizationItem[]>(defaultOptimizations)
  const [applying, setApplying] = useState(false)
  const { addToast } = useUIStore()

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'safe':
        return <Shield size={16} className="text-success" />
      case 'medium':
        return <AlertTriangle size={16} className="text-warning" />
      case 'high':
        return <AlertTriangle size={16} className="text-danger" />
      default:
        return <Info size={16} />
    }
  }

  const toggleOptimization = (id: string) => {
    setOptimizations(prev =>
      prev.map(opt =>
        opt.id === id ? { ...opt, enabled: !opt.enabled } : opt
      )
    )
  }

  const handleApply = async () => {
    const selected = optimizations.filter(opt => opt.enabled)
    if (selected.length === 0) {
      addToast({
        type: 'warning',
        message: '请至少选择一项优化',
      })
      return
    }

    setApplying(true)
    try {
      // 这里应该调用后端API
      // await invoke('apply_optimizations', { items: selected.map(opt => opt.id) })
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      addToast({
        type: 'success',
        message: `已应用 ${selected.length} 项优化`,
      })
    } catch (error: any) {
      addToast({
        type: 'error',
        message: `优化失败: ${error.message}`,
      })
    } finally {
      setApplying(false)
    }
  }

  const safeOptimizations = optimizations.filter(opt => opt.risk === 'safe')
  const mediumOptimizations = optimizations.filter(opt => opt.risk === 'medium')
  const highOptimizations = optimizations.filter(opt => opt.risk === 'high')

  return (
    <div className="flex-1 p-6 overflow-y-auto hidden-scrollbar">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-h1 font-bold text-primary">系统优化</h1>
          <Button
            size="lg"
            icon={<Zap size={20} />}
            onClick={handleApply}
            loading={applying}
            disabled={optimizations.filter(opt => opt.enabled).length === 0}
          >
            应用选中优化
          </Button>
        </div>

        {/* 安全优化 */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-primary flex items-center gap-2">
            <Shield size={20} className="text-success" />
            安全优化（推荐）
          </h2>
          <div className="space-y-3">
            {safeOptimizations.map((opt) => (
              <GlassCard key={opt.id} className="p-4 cursor-pointer hover:shadow-lg transition-all">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={opt.enabled}
                    onChange={() => toggleOptimization(opt.id)}
                    className="mt-1 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-primary">{opt.title}</h3>
                      {getRiskIcon(opt.risk)}
                    </div>
                    <p className="text-sm text-secondary mb-2">{opt.description}</p>
                    <p className="text-xs text-tertiary">{opt.impact}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* 中等风险优化 */}
        {mediumOptimizations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-primary flex items-center gap-2">
              <AlertTriangle size={20} className="text-warning" />
              需注意的优化
            </h2>
            <div className="space-y-3">
              {mediumOptimizations.map((opt) => (
                <GlassCard key={opt.id} className="p-4 cursor-pointer hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={opt.enabled}
                      onChange={() => toggleOptimization(opt.id)}
                      className="mt-1 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-primary">{opt.title}</h3>
                        {getRiskIcon(opt.risk)}
                      </div>
                      <p className="text-sm text-secondary mb-2">{opt.description}</p>
                      <p className="text-xs text-tertiary">{opt.impact}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* 高风险优化 */}
        {highOptimizations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-primary flex items-center gap-2">
              <AlertTriangle size={20} className="text-danger" />
              高风险优化（谨慎使用）
            </h2>
            <div className="space-y-3">
              {highOptimizations.map((opt) => (
                <GlassCard key={opt.id} className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-warning">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={opt.enabled}
                      onChange={() => toggleOptimization(opt.id)}
                      className="mt-1 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-primary">{opt.title}</h3>
                        {getRiskIcon(opt.risk)}
                      </div>
                      <p className="text-sm text-secondary mb-2">{opt.description}</p>
                      <p className="text-xs text-warning font-medium flex items-center gap-1">
                        <AlertTriangle size={12} />
                        {opt.impact}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* 提示信息 */}
        <GlassCard className="p-4 bg-[var(--bg-elevated)]">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-info flex-shrink-0 mt-0.5" />
            <div className="text-sm text-secondary">
              <p className="font-medium mb-1">优化说明</p>
              <p>所有优化操作都可以在24小时内撤销。建议先应用安全优化，观察效果后再考虑其他优化项。</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

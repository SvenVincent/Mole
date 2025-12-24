import { useNavigate } from 'react-router-dom'
import {
  useCpuInfo,
  useMemoryInfo,
  useSystemInfo,
  useDiskInfo,
  useBatteryInfo,
  useGpuInfo,
  useNetworkInfo
} from '@/hooks/useSystemInfo'
import GlassCard from '@/components/Shared/GlassCard'
import Button from '@/components/Shared/Button'
import ProgressRing from '@/components/Shared/ProgressRing'
import LoadingSpinner from '@/components/Shared/LoadingSpinner'
import { Trash2, Zap, HardDrive, Cpu, Wifi, Battery, Gpu } from 'lucide-react'

// 格式化字节
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 指标卡片组件
interface MetricCardProps {
  title: string
  value: number
  icon: React.ReactNode
  unit?: string
  subtitle?: string
  color?: string
  onClick?: () => void
}

function MetricCard({ title, value, icon, unit = '%', subtitle, color, onClick }: MetricCardProps) {
  return (
    <GlassCard 
      className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <ProgressRing 
          percentage={value} 
          size={60} 
          strokeWidth={5}
          color={color}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-secondary mb-1">
            <span className="flex-shrink-0">{icon}</span>
            <span className="text-sm font-medium truncate">{title}</span>
          </div>
          <div className="text-number font-bold text-primary">
            {value.toFixed(1)}{unit}
          </div>
          {subtitle && (
            <div className="text-xs text-tertiary truncate mt-0.5">{subtitle}</div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  
  const { data: cpuInfo, isLoading: cpuLoading } = useCpuInfo()
  const { data: memoryInfo, isLoading: memoryLoading } = useMemoryInfo()
  const { data: systemInfo, isLoading: systemLoading } = useSystemInfo()
  const { data: diskInfo, isLoading: diskLoading } = useDiskInfo()
  const { data: batteryInfo, isLoading: batteryLoading } = useBatteryInfo()
  const { data: gpuInfo, isLoading: gpuLoading } = useGpuInfo()
  const { data: networkInfo, isLoading: networkLoading } = useNetworkInfo()

  const isLoading = cpuLoading || memoryLoading || systemLoading || diskLoading || 
                    batteryLoading || gpuLoading || networkLoading

  // 计算健康分数
  const cpuUsage = cpuInfo?.cpuUsage ?? 0
  const memUsage = memoryInfo?.memUsage ?? 0
  const diskUsage = diskInfo?.diskUsage ?? 0
  const healthScore = Math.max(0, Math.min(100, 100 - (cpuUsage * 0.2 + memUsage * 0.3 + diskUsage * 0.1)))

  // 获取健康分数颜色
  const getHealthColor = (score: number) => {
    if (score >= 90) return 'var(--status-excellent)'
    if (score >= 70) return 'var(--status-good)'
    if (score >= 50) return 'var(--status-fair)'
    if (score >= 30) return 'var(--status-poor)'
    return 'var(--status-critical)'
  }

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

  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto hidden-scrollbar flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size={48} />
          <p className="text-secondary mt-4">加载系统信息中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto hidden-scrollbar">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* 顶部区域 */}
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* 系统健康 */}
          <GlassCard className="flex-1 p-6">
            <h1 className="text-h2 font-bold mb-4 text-primary">系统状态总览</h1>
            <div className="flex items-center gap-6">
              <ProgressRing 
                percentage={healthScore} 
                size={100} 
                strokeWidth={8}
                color={getHealthColor(healthScore)}
              />
              <div>
                <div 
                  className="text-number-lg font-bold mb-1"
                  style={{ color: getHealthColor(healthScore) }}
                >
                  {healthScore.toFixed(0)}
                </div>
                <div className="text-secondary font-medium">系统健康评分</div>
                <div className="text-caption text-tertiary mt-1">
                  {systemInfo?.hostname || '未知设备'}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* 快速操作 */}
          <GlassCard className="p-6 w-full lg:w-64">
            <h2 className="text-lg font-semibold mb-4 text-primary">快速操作</h2>
            <div className="space-y-3">
              <Button 
                block 
                icon={<Trash2 size={18} />}
                onClick={() => handleQuickAction('clean')}
              >
                深度清理
              </Button>
              <Button 
                block 
                variant="secondary"
                icon={<Zap size={18} />}
                onClick={() => handleQuickAction('optimize')}
              >
                系统优化
              </Button>
              <Button 
                block 
                variant="ghost"
                icon={<HardDrive size={18} />}
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
            value={cpuUsage}
            icon={<Cpu size={16} />}
            subtitle={cpuInfo?.brand || '未知'}
            onClick={() => navigate('/process')}
          />
          <MetricCard
            title="内存"
            value={memUsage}
            icon={<Cpu size={16} />}
            subtitle={memoryInfo ? `${formatBytes(memoryInfo.usedMem)} / ${formatBytes(memoryInfo.totalMem)}` : ''}
            onClick={() => navigate('/process')}
          />
          <MetricCard
            title="磁盘"
            value={diskUsage}
            icon={<HardDrive size={16} />}
            subtitle={diskInfo ? `${formatBytes(diskInfo.usedSpace)} / ${formatBytes(diskInfo.totalSpace)}` : '点击查看详情'}
            onClick={() => navigate('/disk')}
          />
          <MetricCard
            title="GPU"
            value={gpuInfo?.gpu_usage ?? 0}
            icon={<Gpu size={16} />}
            subtitle={gpuInfo?.name || 'Apple Silicon'}
          />
          <MetricCard
            title="电池"
            value={batteryInfo?.percentage ?? 0}
            icon={<Battery size={16} />}
            subtitle={batteryInfo?.is_charging ? '正在充电' : batteryInfo?.is_full ? '已充满' : '未充电'}
            color={batteryInfo?.percentage && batteryInfo.percentage < 20 ? 'var(--status-poor)' : undefined}
          />
          <MetricCard
            title="网络"
            value={networkInfo ? Math.min(100, (networkInfo.download_speed / (10 * 1024 * 1024)) * 100) : 0}
            icon={<Wifi size={16} />}
            subtitle={networkInfo?.wifi_ssid || networkInfo?.network_type || '已连接'}
            unit="%"
          />
        </div>

        {/* 洞察与建议 */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-primary">洞察与建议</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm">
              <span className="w-2 h-2 rounded-full bg-success flex-shrink-0"></span>
              <span className="text-secondary">发现 12 个可清理项目（预计释放 2.3 GB）</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <span className="w-2 h-2 rounded-full bg-warning flex-shrink-0"></span>
              <span className="text-secondary">建议优化：禁用 3 个非必要开机项</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <span className="w-2 h-2 rounded-full bg-info flex-shrink-0"></span>
              <span className="text-secondary">系统运行正常，无需立即处理</span>
            </li>
          </ul>
        </GlassCard>
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { useDuplicatableApps, useQuickDuplicateApp, useCreateDuplicateApp } from '@/hooks/useApp'
import GlassCard from '@/components/Shared/GlassCard'
import Button from '@/components/Shared/Button'
import LoadingSpinner from '@/components/Shared/LoadingSpinner'
import { Search, Copy, Folder, X } from 'lucide-react'
import type { AppInfo } from '@/types/app'

// 格式化字节
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function DuplicatorPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [duplicateName, setDuplicateName] = useState('')
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null)

  const { data, isLoading } = useDuplicatableApps()
  const quickDuplicate = useQuickDuplicateApp()
  const createDuplicate = useCreateDuplicateApp()

  const apps = useMemo(() => {
    if (!data?.apps) return []
    if (!searchQuery) return data.apps
    const query = searchQuery.toLowerCase()
    return data.apps.filter(app =>
      app.name.toLowerCase().includes(query) ||
      app.identifier.toLowerCase().includes(query)
    )
  }, [data, searchQuery])

  const handleQuickDuplicate = async (app: AppInfo) => {
    if (!confirm(`确定要为 ${app.name} 创建副本吗？`)) return

    quickDuplicate.mutate(app.path, {
      onSuccess: () => {
        setSelectedApp(null)
      }
    })
  }

  const handleCustomDuplicate = async () => {
    if (!selectedApp || !duplicateName.trim()) {
      alert('请输入副本名称')
      return
    }

    createDuplicate.mutate({
      appPath: selectedApp.path,
      duplicateName: duplicateName.trim(),
    }, {
      onSuccess: () => {
        setSelectedApp(null)
        setDuplicateName('')
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto hidden-scrollbar flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size={48} />
          <p className="text-secondary mt-4">加载应用列表中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto hidden-scrollbar">
      <div className="space-y-6 max-w-6xl mx-auto">
        <h1 className="text-h1 font-bold text-primary">应用双开</h1>

        {/* 说明 */}
        <GlassCard className="p-4 bg-[var(--bg-elevated)]">
          <p className="text-sm text-secondary">
            应用双开功能允许您为应用创建独立副本，每个副本拥有独立的数据目录，互不干扰。
            适用于需要同时登录多个账号的应用。
          </p>
        </GlassCard>

        {/* 搜索栏 */}
        <GlassCard className="p-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              type="text"
              placeholder="搜索可双开的应用..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-medium rounded-lg 
                       text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 
                       focus:ring-primary transition-all"
            />
          </div>
        </GlassCard>

        {/* 应用列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map((app) => (
            <GlassCard 
              key={app.identifier} 
              className="p-4 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setSelectedApp(app)}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[var(--bg-elevated)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Folder size={24} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-primary truncate">{app.name}</h3>
                  <p className="text-xs text-tertiary truncate">{app.identifier}</p>
                  <p className="text-sm text-secondary mt-1">
                    {formatBytes(app.size)} | {app.path}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickDuplicate(app)
                      }}
                      icon={<Copy size={14} />}
                    >
                      快速创建
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedApp(app)
                        setDuplicateName(`${app.name} 副本`)
                      }}
                      icon={<Copy size={14} />}
                    >
                      自定义创建
                    </Button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* 自定义创建对话框 */}
        {selectedApp && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary">
                为 {selectedApp.name} 创建副本
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedApp(null)
                  setDuplicateName('')
                }}
                icon={<X size={14} />}
              >
                关闭
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-secondary mb-2 block">
                  副本名称
                </label>
                <input
                  type="text"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  placeholder="输入副本名称..."
                  className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-medium rounded-lg 
                           text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 
                           focus:ring-primary transition-all"
                />
              </div>

              <div className="p-3 bg-[var(--bg-elevated)] rounded-lg">
                <p className="text-xs text-tertiary mb-1">原应用路径</p>
                <p className="text-sm text-secondary">{selectedApp.path}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  block
                  onClick={handleCustomDuplicate}
                  loading={createDuplicate.isPending}
                  icon={<Copy size={18} />}
                >
                  创建副本
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedApp(null)
                    setDuplicateName('')
                  }}
                >
                  取消
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {apps.length === 0 && (
          <GlassCard className="p-12 text-center">
            <p className="text-secondary">未找到可双开的应用</p>
          </GlassCard>
        )}
      </div>
    </div>
  )
}

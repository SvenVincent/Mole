import { useState, useMemo } from 'react'
import { useInstalledApps, useAppRelatedFiles, useUninstallApp, useForceUninstallApp } from '@/hooks/useApp'
import GlassCard from '@/components/Shared/GlassCard'
import Button from '@/components/Shared/Button'
import LoadingSpinner from '@/components/Shared/LoadingSpinner'
import { Search, Trash2, Folder, X } from 'lucide-react'
import type { AppInfo } from '@/types/app'

// 格式化字节
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function UninstallPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null)
  const [showRelatedFiles, setShowRelatedFiles] = useState(false)
  const [removeResiduals, setRemoveResiduals] = useState(true)

  const { data, isLoading } = useInstalledApps()
  const { data: relatedFiles, isLoading: relatedFilesLoading } = useAppRelatedFiles(
    selectedApp?.identifier || '',
    showRelatedFiles && !!selectedApp
  )
  const uninstallApp = useUninstallApp()
  const forceUninstallApp = useForceUninstallApp()

  const apps = useMemo(() => {
    if (!data?.apps) return []
    if (!searchQuery) return data.apps
    const query = searchQuery.toLowerCase()
    return data.apps.filter(app =>
      app.name.toLowerCase().includes(query) ||
      app.identifier.toLowerCase().includes(query)
    )
  }, [data, searchQuery])

  const handleViewFiles = (app: AppInfo) => {
    setSelectedApp(app)
    setShowRelatedFiles(true)
  }

  const handleUninstall = async (app: AppInfo) => {
    if (!confirm(`确定要卸载 ${app.name} 吗？`)) return

    uninstallApp.mutate({
      identifier: app.identifier,
      removeResiduals,
    })
  }

  const handleForceUninstall = async () => {
    if (!selectedApp) return
    if (!confirm(`确定要彻底卸载 ${selectedApp.name} 及其所有相关文件吗？此操作不可撤销！`)) return

    const paths = relatedFiles
      ? [
          ...relatedFiles.binary_files.map(f => f.path),
          ...relatedFiles.sandbox_files.map(f => f.path),
          ...relatedFiles.other_files.map(f => f.path),
        ]
      : []

    forceUninstallApp.mutate({
      identifier: selectedApp.identifier,
      paths,
    }, {
      onSuccess: () => {
        setSelectedApp(null)
        setShowRelatedFiles(false)
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
        <h1 className="text-h1 font-bold text-primary">应用卸载</h1>

        {/* 搜索栏 */}
        <GlassCard className="p-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              type="text"
              placeholder="搜索应用名称..."
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
            <GlassCard key={app.identifier} className="p-4 hover:shadow-lg transition-all">
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
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewFiles(app)}
                      icon={<Folder size={14} />}
                    >
                      查看文件
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleUninstall(app)}
                      icon={<Trash2 size={14} />}
                    >
                      卸载
                    </Button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* 相关文件详情 */}
        {showRelatedFiles && selectedApp && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary">
                {selectedApp.name} 相关文件
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowRelatedFiles(false)
                  setSelectedApp(null)
                }}
                icon={<X size={14} />}
              >
                关闭
              </Button>
            </div>

            {relatedFilesLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner size={32} />
                <p className="text-secondary mt-2">加载中...</p>
              </div>
            ) : relatedFiles ? (
              <div className="space-y-4">
                <div className="p-3 bg-[var(--bg-elevated)] rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-primary">总大小</span>
                    <span className="text-sm font-bold text-primary">
                      {formatBytes(relatedFiles.total_size)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-tertiary">
                    <span>文件总数: {relatedFiles.total_files}</span>
                    <span>应用本体: {formatBytes(relatedFiles.app_size)}</span>
                  </div>
                </div>

                {relatedFiles.binary_files.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-primary mb-2">应用文件</h3>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {relatedFiles.binary_files.map((file) => (
                        <div key={file.path} className="text-xs text-secondary truncate">
                          {file.path}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {relatedFiles.sandbox_files.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-primary mb-2">沙盒文件</h3>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {relatedFiles.sandbox_files.map((file) => (
                        <div key={file.path} className="text-xs text-secondary truncate">
                          {file.path}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {relatedFiles.other_files.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-primary mb-2">其他文件</h3>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {relatedFiles.other_files.map((file) => (
                        <div key={file.path} className="text-xs text-secondary truncate">
                          {file.path}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-medium">
                  <input
                    type="checkbox"
                    id="removeResiduals"
                    checked={removeResiduals}
                    onChange={(e) => setRemoveResiduals(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <label htmlFor="removeResiduals" className="text-sm text-secondary cursor-pointer">
                    同时删除残留文件
                  </label>
                </div>

                <Button
                  variant="danger"
                  block
                  onClick={handleForceUninstall}
                  icon={<Trash2 size={18} />}
                >
                  彻底卸载
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-tertiary">
                未找到相关文件
              </div>
            )}
          </GlassCard>
        )}

        {apps.length === 0 && (
          <GlassCard className="p-12 text-center">
            <p className="text-secondary">未找到匹配的应用</p>
          </GlassCard>
        )}
      </div>
    </div>
  )
}

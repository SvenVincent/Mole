import { useState, useEffect } from 'react'
import { useDiskInfo, useScanDirectory, useFindLargeFiles } from '@/hooks/useDisk'
import GlassCard from '@/components/Shared/GlassCard'
import Button from '@/components/Shared/Button'
import LoadingSpinner from '@/components/Shared/LoadingSpinner'
import ProgressRing from '@/components/Shared/ProgressRing'
import { HardDrive, Search, Folder, File, ChevronRight, Home } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'

// 格式化字节
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function DiskPage() {
  const [scanPath, setScanPath] = useState<string>('')
  const [scanning, setScanning] = useState(false)
  const [viewMode, setViewMode] = useState<'overview' | 'scan' | 'large'>('overview')
  const [homeDir, setHomeDir] = useState<string>('/Users')

  // 获取用户主目录
  useEffect(() => {
    invoke<string>('get_home_directory')
      .then(setHomeDir)
      .catch(console.error)
  }, [])

  const { data: diskInfo, isLoading: diskLoading } = useDiskInfo()
  const { data: scanResult, isLoading: scanLoading } = useScanDirectory(
    scanPath,
    scanning && !!scanPath
  )
  const { data: largeFiles, isLoading: largeFilesLoading } = useFindLargeFiles(
    scanPath || homeDir,
    100 * 1024 * 1024, // 100MB
    viewMode === 'large' && !!scanPath
  )

  const handleScan = async (path: string) => {
    setScanPath(path)
    setScanning(true)
    setViewMode('scan')
  }

  const handleFindLargeFiles = async (path: string) => {
    setScanPath(path)
    setViewMode('large')
  }

  if (diskLoading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto hidden-scrollbar flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size={48} />
          <p className="text-secondary mt-4">加载磁盘信息中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto hidden-scrollbar">
      <div className="space-y-6 max-w-7xl mx-auto">
        <h1 className="text-h1 font-bold text-primary">磁盘分析</h1>

        {/* 磁盘概览 */}
        {diskInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {diskInfo.disks.map((disk: any) => (
              <GlassCard key={disk.name} className="p-6 cursor-pointer hover:shadow-lg transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <HardDrive size={32} className="text-primary" />
                  <div className="flex-1">
                    <div className="font-semibold text-primary">{disk.name}</div>
                    <div className="text-sm text-tertiary">{disk.mountPoint}</div>
                  </div>
                </div>
                <ProgressRing 
                  percentage={disk.diskUsage} 
                  size={80} 
                  strokeWidth={6}
                />
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">已使用</span>
                    <span className="text-primary font-medium">{formatBytes(disk.usedSpace)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">可用</span>
                    <span className="text-primary font-medium">{formatBytes(disk.availableSpace)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">总计</span>
                    <span className="text-primary font-medium">{formatBytes(disk.totalSpace)}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleScan(disk.mountPoint)}
                    icon={<Search size={14} />}
                  >
                    扫描
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFindLargeFiles(disk.mountPoint)}
                    icon={<File size={14} />}
                  >
                    大文件
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* 快速操作 */}
        <GlassCard className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-primary">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="ghost"
              icon={<Home size={18} />}
              onClick={() => handleScan(homeDir)}
            >
              扫描用户目录
            </Button>
            <Button
              variant="ghost"
              icon={<Folder size={18} />}
              onClick={() => handleScan('/Applications')}
            >
              扫描应用目录
            </Button>
            <Button
              variant="ghost"
              icon={<File size={18} />}
              onClick={() => handleFindLargeFiles(homeDir)}
            >
              查找大文件
            </Button>
          </div>
        </GlassCard>

        {/* 扫描结果 */}
        {viewMode === 'scan' && scanPath && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary">扫描结果: {scanPath}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setScanning(false)
                  setViewMode('overview')
                }}
              >
                返回
              </Button>
            </div>
            {scanLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner size={32} />
                <p className="text-secondary mt-2">扫描中...</p>
              </div>
            ) : scanResult ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                <div className="text-sm text-secondary mb-2">
                  总大小: {formatBytes(scanResult.size)} | 项目数: {scanResult.items.length}
                </div>
                {scanResult.items.map((item) => (
                  <div
                    key={item.path}
                    className="flex items-center gap-3 p-2 hover:bg-[var(--state-hover)] rounded cursor-pointer"
                    onClick={async () => {
                      if (item.is_directory) {
                        try {
                          const children = await invoke('get_directory_children', { path: item.path })
                          console.log('Children:', children)
                        } catch (error) {
                          console.error('Error:', error)
                        }
                      }
                    }}
                  >
                    {item.is_directory ? (
                      <Folder size={16} className="text-primary" />
                    ) : (
                      <File size={16} className="text-secondary" />
                    )}
                    <span className="flex-1 text-sm text-secondary truncate">{item.name}</span>
                    <span className="text-xs text-tertiary">{formatBytes(item.size)}</span>
                    {item.is_directory && (
                      <ChevronRight size={14} className="text-tertiary" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-tertiary">
                暂无数据
              </div>
            )}
          </GlassCard>
        )}

        {/* 大文件列表 */}
        {viewMode === 'large' && scanPath && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary">大文件列表: {scanPath}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewMode('overview')
                }}
              >
                返回
              </Button>
            </div>
            {largeFilesLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner size={32} />
                <p className="text-secondary mt-2">查找中...</p>
              </div>
            ) : largeFiles?.files && largeFiles.files.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {largeFiles.files.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center gap-3 p-3 hover:bg-[var(--state-hover)] rounded cursor-pointer"
                  >
                    <File size={20} className="text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-primary truncate">{file.name}</div>
                      <div className="text-xs text-tertiary truncate">{file.path}</div>
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      {formatBytes(file.size)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-tertiary">
                未找到大文件（大于100MB）
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import type {
  DirectoryScanResult,
  LargeFilesResult,
  DeepScanResult
} from '@/types/disk'
import type { DiskInfo } from '@/types/system'

// 获取磁盘信息
export const useDiskInfo = () => {
  return useQuery({
    queryKey: ['disk', 'info'],
    queryFn: async () => {
      const result = await invoke('get_disk_info')
      return result as DiskInfo
    },
    refetchInterval: 5000, // 5秒轮询
    staleTime: 2000,
  })
}

// 扫描目录
export const useScanDirectory = (path: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['disk', 'scan', path],
    queryFn: async () => {
      const result = await invoke('scan_directory', { path })
      return result as DirectoryScanResult
    },
    enabled: enabled && !!path,
    staleTime: Infinity,
  })
}

// 深度扫描目录
export const useScanDirectoryDeep = (
  path: string,
  maxDepth: number = 3,
  enabled: boolean = false
) => {
  return useQuery({
    queryKey: ['disk', 'deep', path, maxDepth],
    queryFn: async () => {
      const result = await invoke('scan_directory_deep', {
        path,
        maxDepth,
        topFilesLimit: 20,
      })
      return result as DeepScanResult
    },
    enabled: enabled && !!path,
    staleTime: Infinity,
  })
}

// 查找大文件
export const useFindLargeFiles = (
  path: string,
  minSize: number = 100 * 1024 * 1024, // 默认100MB
  enabled: boolean = false
) => {
  return useQuery({
    queryKey: ['disk', 'large', path, minSize],
    queryFn: async () => {
      const result = await invoke('find_large_files', {
        path,
        limit: 50,
        minSize,
      })
      return result as LargeFilesResult
    },
    enabled: enabled && !!path,
    staleTime: Infinity,
  })
}


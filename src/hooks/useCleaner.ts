import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { useUIStore } from '@/stores/ui'
import type { CleanPlan, CleanResult } from '@/types/cleaner'

// 格式化字节
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 预览清理计划
export const useCleanPlan = (types?: string[]) => {
  return useQuery({
    queryKey: ['cleaner', 'plan', types],
    queryFn: async () => {
      const result = await invoke('preview_clean_plan', { types: types || [] })
      return result as CleanPlan
    },
    enabled: false, // 手动触发
    staleTime: Infinity,
  })
}

// 执行清理
export const useExecuteClean = () => {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore.getState()
  
  return useMutation({
    mutationFn: async (paths: string[]) => {
      const result = await invoke('execute_clean', { paths })
      return result as CleanResult
    },
    onSuccess: (result) => {
      addToast({
        type: 'success',
        message: `清理完成，释放 ${formatBytes(result.released_size)}`,
      })
      
      // 失效相关查询
      queryClient.invalidateQueries({ queryKey: ['cleaner'] })
      queryClient.invalidateQueries({ queryKey: ['disk'] })
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        message: `清理失败: ${error.message}`,
      })
    },
  })
}

// 清空废纸篓
export const useEmptyTrash = () => {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore.getState()
  
  return useMutation({
    mutationFn: async () => {
      const result = await invoke('empty_trash')
      return result as CleanResult
    },
    onSuccess: (result) => {
      addToast({
        type: 'success',
        message: `废纸篓已清空，释放 ${formatBytes(result.released_size)}`,
      })
      queryClient.invalidateQueries({ queryKey: ['cleaner'] })
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        message: `清空废纸篓失败: ${error.message}`,
      })
    },
  })
}

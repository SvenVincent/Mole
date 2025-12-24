import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { useUIStore } from '@/stores/ui'
import type { ProcessList } from '@/types/process'

// 获取进程列表
export const useProcessList = () => {
  return useQuery({
    queryKey: ['processes'],
    queryFn: async () => {
      const result = await invoke('get_process_list')
      return result as ProcessList
    },
    refetchInterval: 2000, // 2秒轮询
    staleTime: 1000,
    retry: 1,
  })
}

// 结束进程
export const useKillProcess = () => {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore.getState()

  return useMutation({
    mutationFn: async (pid: number) => {
      const result = await invoke('kill_process', { pid })
      return result as { success: boolean }
    },
    onSuccess: (result, pid) => {
      if (result.success) {
        addToast({
          type: 'success',
          message: `进程 ${pid} 已结束`,
        })
        queryClient.invalidateQueries({ queryKey: ['processes'] })
      }
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        message: `结束进程失败: ${error.message}`,
      })
    },
  })
}


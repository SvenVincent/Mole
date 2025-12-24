import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { useUIStore } from '@/stores/ui'
import type {
  InstalledApps,
  UninstallResult,
  AppRelatedFiles
} from '@/types/app'

// 获取已安装应用列表
export const useInstalledApps = () => {
  return useQuery({
    queryKey: ['apps', 'installed'],
    queryFn: async () => {
      const result = await invoke('get_installed_apps')
      return result as InstalledApps
    },
    staleTime: 1000 * 60 * 5, // 5分钟
  })
}

// 获取可双开应用列表
export const useDuplicatableApps = () => {
  return useQuery({
    queryKey: ['apps', 'duplicatable'],
    queryFn: async () => {
      const result = await invoke('get_duplicatable_apps')
      return result as InstalledApps
    },
    staleTime: 1000 * 60 * 5,
  })
}

// 获取应用大小
export const useAppSize = (appPath: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['apps', 'size', appPath],
    queryFn: async () => {
      const result = await invoke('get_app_size', { appPath })
      return result as { size: number }
    },
    enabled: enabled && !!appPath,
    staleTime: Infinity,
  })
}

// 获取应用图标
export const useAppIcon = (appPath: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['apps', 'icon', appPath],
    queryFn: async () => {
      const result = await invoke('get_app_icon', { appPath })
      return result as { iconPath: string }
    },
    enabled: enabled && !!appPath,
    staleTime: Infinity,
  })
}

// 获取应用相关文件
export const useAppRelatedFiles = (identifier: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['apps', 'related', identifier],
    queryFn: async () => {
      const result = await invoke('get_app_related_files', { identifier })
      return result as AppRelatedFiles
    },
    enabled: enabled && !!identifier,
    staleTime: Infinity,
  })
}

// 卸载应用
export const useUninstallApp = () => {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore.getState()

  return useMutation({
    mutationFn: async ({ identifier, removeResiduals }: { 
      identifier: string
      removeResiduals: boolean 
    }) => {
      const result = await invoke('uninstall_app', { identifier, removeResiduals })
      return result as UninstallResult
    },
    onSuccess: (result) => {
      if (result.success) {
        addToast({
          type: 'success',
          message: '应用已卸载',
        })
        queryClient.invalidateQueries({ queryKey: ['apps'] })
      }
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        message: `卸载失败: ${error.message}`,
      })
    },
  })
}

// 强制卸载应用
export const useForceUninstallApp = () => {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore.getState()

  return useMutation({
    mutationFn: async ({ identifier, paths }: { 
      identifier: string
      paths: string[]
    }) => {
      const result = await invoke('force_uninstall_app', { identifier, paths })
      return result as UninstallResult
    },
    onSuccess: (result) => {
      if (result.success) {
        addToast({
          type: 'success',
          message: '应用已彻底卸载',
        })
        queryClient.invalidateQueries({ queryKey: ['apps'] })
      }
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        message: `卸载失败: ${error.message}`,
      })
    },
  })
}

// 创建应用副本（快速）
export const useQuickDuplicateApp = () => {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore.getState()

  return useMutation({
    mutationFn: async (appPath: string) => {
      const result = await invoke('quick_duplicate_app', { appPath })
      return result as { success: boolean; duplicatePath: string }
    },
    onSuccess: (result) => {
      if (result.success) {
        addToast({
          type: 'success',
          message: '应用副本已创建',
        })
        queryClient.invalidateQueries({ queryKey: ['apps'] })
      }
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        message: `创建副本失败: ${error.message}`,
      })
    },
  })
}

// 创建应用副本（自定义）
export const useCreateDuplicateApp = () => {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore.getState()

  return useMutation({
    mutationFn: async ({ appPath, duplicateName }: { 
      appPath: string
      duplicateName: string 
    }) => {
      const result = await invoke('create_duplicate_app', { appPath, duplicateName })
      return result as { success: boolean; duplicatePath: string }
    },
    onSuccess: (result) => {
      if (result.success) {
        addToast({
          type: 'success',
          message: '应用副本已创建',
        })
        queryClient.invalidateQueries({ queryKey: ['apps'] })
      }
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        message: `创建副本失败: ${error.message}`,
      })
    },
  })
}


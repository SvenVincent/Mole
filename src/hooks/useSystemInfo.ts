import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import type {
  SystemInfo,
  CpuInfo,
  MemoryInfo,
  NetworkInfo,
  DiskInfo,
  BatteryInfo,
  GpuInfo
} from '@/types/system'

// 获取系统信息
export const useSystemInfo = () => {
  return useQuery({
    queryKey: ['system', 'info'],
    queryFn: async () => {
      const result = await invoke('get_system_info')
      return result as SystemInfo
    },
    refetchInterval: 5000, // 5秒轮询
    staleTime: 2000,
  })
}

// 获取 CPU 信息
export const useCpuInfo = () => {
  return useQuery({
    queryKey: ['system', 'cpu'],
    queryFn: async () => {
      const result = await invoke('get_cpu_info')
      return result as CpuInfo
    },
    refetchInterval: 2000,
    staleTime: 1000,
  })
}

// 获取内存信息
export const useMemoryInfo = () => {
  return useQuery({
    queryKey: ['system', 'memory'],
    queryFn: async () => {
      const result = await invoke('get_memory_info')
      return result as MemoryInfo
    },
    refetchInterval: 2000,
    staleTime: 1000,
  })
}

// 获取磁盘信息
export const useDiskInfo = () => {
  return useQuery({
    queryKey: ['system', 'disk'],
    queryFn: async () => {
      const result = await invoke('get_disk_info')
      return result as DiskInfo
    },
    refetchInterval: 5000, // 5秒轮询
    staleTime: 2000,
  })
}

// 获取电池信息
export const useBatteryInfo = () => {
  return useQuery({
    queryKey: ['system', 'battery'],
    queryFn: async () => {
      const result = await invoke('get_battery_info')
      return result as BatteryInfo
    },
    refetchInterval: 5000, // 5秒轮询
    staleTime: 2000,
  })
}

// 获取GPU信息
export const useGpuInfo = () => {
  return useQuery({
    queryKey: ['system', 'gpu'],
    queryFn: async () => {
      const result = await invoke('get_gpu_info')
      return result as GpuInfo
    },
    refetchInterval: 2000, // 2秒轮询
    staleTime: 1000,
  })
}

// 获取网络信息
export const useNetworkInfo = () => {
  return useQuery({
    queryKey: ['system', 'network'],
    queryFn: async () => {
      const result = await invoke('get_network_speed')
      return result as NetworkInfo
    },
    refetchInterval: 10000, // 10秒轮询
    staleTime: 5000,
  })
}

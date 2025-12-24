import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { invoke } from '@tauri-apps/api/core'

type ThemeMode = 'auto' | 'light' | 'dark'

// 主题颜色配置
const THEME_COLORS = {
  light: { r: 245, g: 245, b: 245, a: 0.95 },
  dark: { r: 20, g: 20, b: 20, a: 0.95 },
}

// 同步窗口背景色到 Rust
const syncWindowBgColor = async (theme: 'light' | 'dark') => {
  try {
    const color = THEME_COLORS[theme]
    await invoke('set_window_bg_color', color)
    console.log('[Theme] Window background synced:', theme)
  } catch (e) {
    console.warn('[Theme] Failed to sync window background:', e)
  }
}

interface ThemeState {
  mode: ThemeMode
  glassIntensity: number // 1-5
  animationSpeed: number // 1-5
  resolvedTheme: 'light' | 'dark'
  
  setMode: (mode: ThemeMode) => void
  setGlassIntensity: (intensity: number) => void
  setAnimationSpeed: (speed: number) => void
}

// 检测系统主题
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

// 根据模式计算实际主题
const resolveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  return mode === 'auto' ? getSystemTheme() : mode
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'auto',
      glassIntensity: 3,
      animationSpeed: 3,
      resolvedTheme: getSystemTheme(),
      
      setMode: (mode) => {
        const resolvedTheme = resolveTheme(mode)
        set({ mode, resolvedTheme })
        // 同步到原生窗口背景
        syncWindowBgColor(resolvedTheme)
      },
      
      setGlassIntensity: (intensity) => set({ glassIntensity: intensity }),
      
      setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
    }),
    {
      name: 'mole-theme-storage',
      partialize: (state) => ({
        mode: state.mode,
        glassIntensity: state.glassIntensity,
        animationSpeed: state.animationSpeed,
      }),
      // 从 localStorage 恢复状态后的回调
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 根据恢复的 mode 重新计算 resolvedTheme
          const resolvedTheme = resolveTheme(state.mode)
          // 更新 resolvedTheme
          useThemeStore.setState({ resolvedTheme })
          // 同步到原生窗口
          console.log('[Theme] Rehydrated, syncing:', state.mode, '->', resolvedTheme)
          syncWindowBgColor(resolvedTheme)
        }
      },
    }
  )
)

// 监听系统主题变化
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { mode, setMode } = useThemeStore.getState()
    if (mode === 'auto') {
      setMode('auto') // 触发 resolvedTheme 更新
    }
  })
}

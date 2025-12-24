import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeMode = 'auto' | 'light' | 'dark'

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

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'auto',
      glassIntensity: 3,
      animationSpeed: 3,
      resolvedTheme: getSystemTheme(),
      
      setMode: (mode) => {
        const resolvedTheme = mode === 'auto' ? getSystemTheme() : mode
        set({ mode, resolvedTheme })
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

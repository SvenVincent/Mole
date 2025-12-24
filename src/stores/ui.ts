import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface ModalState {
  id: string
  props?: Record<string, unknown>
}

interface UIState {
  // 侧边栏
  sidebarCollapsed: boolean
  
  // Modal
  activeModal: ModalState | null
  
  // Toast 通知
  toasts: Toast[]
  
  // 全局加载状态
  globalLoading: boolean
  loadingText: string
  
  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  
  openModal: (id: string, props?: Record<string, unknown>) => void
  closeModal: () => void
  
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  
  setGlobalLoading: (loading: boolean, text?: string) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  // 初始状态
  sidebarCollapsed: false,
  activeModal: null,
  toasts: [],
  globalLoading: false,
  loadingText: '',
  
  // 侧边栏
  toggleSidebar: () => set((state) => ({ 
    sidebarCollapsed: !state.sidebarCollapsed 
  })),
  
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  // Modal
  openModal: (id, props) => set({ 
    activeModal: { id, props } 
  }),
  
  closeModal: () => set({ activeModal: null }),
  
  // Toast
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const newToast: Toast = { ...toast, id }
    
    set((state) => ({ 
      toasts: [...state.toasts, newToast] 
    }))
    
    // 自动移除
    const duration = toast.duration ?? 3000
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),
  
  // 全局加载
  setGlobalLoading: (loading, text = '') => set({ 
    globalLoading: loading, 
    loadingText: text 
  }),
}))

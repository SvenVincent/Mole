import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Trash2, 
  Zap, 
  Activity, 
  HardDrive, 
  AppWindow, 
  Copy, 
  Settings,
  Sun,
  Moon,
} from 'lucide-react'
import { useThemeStore } from '@/stores/theme'
import { useUIStore } from '@/stores/ui'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { path: '/', label: '系统总览', icon: <LayoutDashboard size={20} /> },
  { path: '/cleaner', label: '系统清理', icon: <Trash2 size={20} /> },
  { path: '/optimizer', label: '系统优化', icon: <Zap size={20} /> },
  { path: '/process', label: '进程监控', icon: <Activity size={20} /> },
  { path: '/disk', label: '磁盘分析', icon: <HardDrive size={20} /> },
  { path: '/uninstall', label: '应用卸载', icon: <AppWindow size={20} /> },
  { path: '/duplicator', label: '应用双开', icon: <Copy size={20} /> },
  { path: '/settings', label: '设置', icon: <Settings size={20} /> },
]

export default function Sidebar() {
  const { sidebarCollapsed } = useUIStore()
  const { resolvedTheme, setMode } = useThemeStore()

  const toggleTheme = () => {
    setMode(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <aside 
      className={`
        flex flex-col h-full bg-card
        border-r border-light
        transition-all duration-300
        ${sidebarCollapsed ? 'w-16' : 'w-56'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-light">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        {!sidebarCollapsed && (
          <span className="ml-2 text-xl font-bold text-primary">Mole</span>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 py-4 overflow-y-auto hidden-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg
              transition-all duration-200
              ${isActive 
                ? 'bg-primary text-white' 
                : 'text-secondary hover:bg-[var(--state-hover)]'
              }
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
          >
            {item.icon}
            {!sidebarCollapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* 底部操作 */}
      <div className="p-3 border-t border-light">
        <button
          onClick={toggleTheme}
          className={`
            flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
            text-secondary hover:bg-[var(--state-hover)]
            transition-all duration-200
            ${sidebarCollapsed ? 'justify-center' : ''}
          `}
        >
          {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          {!sidebarCollapsed && (
            <span className="text-sm font-medium">
              {resolvedTheme === 'dark' ? '浅色模式' : '深色模式'}
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}

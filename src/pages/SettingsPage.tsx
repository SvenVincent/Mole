import { useThemeStore } from '@/stores/theme'
import GlassCard from '@/components/Shared/GlassCard'
import Button from '@/components/Shared/Button'
import { Sun, Moon, Monitor, Sparkles, Zap, Info } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { useState } from 'react'

export default function SettingsPage() {
  const { 
    mode, 
    setMode, 
    glassIntensity, 
    setGlassIntensity, 
    animationSpeed, 
    setAnimationSpeed,
    resolvedTheme
  } = useThemeStore()
  
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5)

  const handleSaveSettings = async () => {
    try {
      await invoke('update_settings', {
        settings: {
          theme: mode,
          language,
          liquidGlassEffect: glassIntensity > 1,
          autoRefreshInterval: refreshInterval * 1000,
        }
      })
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto hidden-scrollbar">
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-h1 font-bold text-primary">设置</h1>
        
        {/* 外观设置 */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
            <Sparkles size={20} />
            外观
          </h2>
          
          {/* 主题选择 */}
          <div className="mb-6">
            <label className="text-sm font-medium text-secondary mb-3 block">主题模式</label>
            <div className="flex gap-2">
              <Button
                variant={mode === 'auto' ? 'primary' : 'ghost'}
                size="sm"
                icon={<Monitor size={16} />}
                onClick={() => setMode('auto')}
              >
                跟随系统
              </Button>
              <Button
                variant={mode === 'light' ? 'primary' : 'ghost'}
                size="sm"
                icon={<Sun size={16} />}
                onClick={() => setMode('light')}
              >
                浅色
              </Button>
              <Button
                variant={mode === 'dark' ? 'primary' : 'ghost'}
                size="sm"
                icon={<Moon size={16} />}
                onClick={() => setMode('dark')}
              >
                深色
              </Button>
            </div>
            <p className="text-xs text-tertiary mt-2">
              当前主题: {resolvedTheme === 'dark' ? '深色' : '浅色'}
            </p>
          </div>

          {/* 玻璃强度 */}
          <div className="mb-6">
            <label className="text-sm font-medium text-secondary mb-2 block">
              玻璃效果强度: {glassIntensity}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={glassIntensity}
              onChange={(e) => setGlassIntensity(Number(e.target.value))}
              className="w-full h-2 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs text-tertiary mt-1">
              <span>弱</span>
              <span>强</span>
            </div>
          </div>

          {/* 动画速度 */}
          <div>
            <label className="text-sm font-medium text-secondary mb-2 block">
              动画速度: {animationSpeed}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(Number(e.target.value))}
              className="w-full h-2 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs text-tertiary mt-1">
              <span>慢</span>
              <span>快</span>
            </div>
          </div>
        </GlassCard>

        {/* 功能设置 */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
            <Zap size={20} />
            功能
          </h2>
          
          {/* 语言设置 */}
          <div className="mb-6">
            <label className="text-sm font-medium text-secondary mb-3 block">语言</label>
            <div className="flex gap-2">
              <Button
                variant={language === 'zh' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setLanguage('zh')}
              >
                中文
              </Button>
              <Button
                variant={language === 'en' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setLanguage('en')}
              >
                English
              </Button>
            </div>
          </div>

          {/* 自动刷新 */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="cursor-pointer"
              />
              <span className="text-sm text-secondary">启用自动刷新</span>
            </label>
            {autoRefresh && (
              <div className="mt-3 ml-6">
                <label className="text-sm text-secondary mb-2 block">
                  刷新间隔: {refreshInterval} 秒
                </label>
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  disabled={!autoRefresh}
                  className="w-full h-2 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                           [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                           [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
                           disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}
          </div>
        </GlassCard>

        {/* 关于 */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
            <Info size={20} />
            关于
          </h2>
          <div className="text-sm text-secondary space-y-2">
            <p className="font-medium text-primary">Mole - macOS 系统优化工具</p>
            <p>版本: 1.0.0</p>
            <p>© 2024 Mole Team</p>
          </div>
        </GlassCard>

        {/* 保存按钮 */}
        <Button
          size="lg"
          block
          onClick={handleSaveSettings}
        >
          保存设置
        </Button>
      </div>
    </div>
  )
}

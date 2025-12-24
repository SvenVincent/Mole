import { ReactNode, useState, useCallback, CSSProperties } from 'react'
import { useThemeStore } from '@/stores/theme'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  intensity?: number
  onClick?: () => void
  style?: CSSProperties
}

export default function GlassCard({
  children,
  className = '',
  hover = true,
  intensity,
  onClick,
  style,
}: GlassCardProps) {
  const { resolvedTheme, glassIntensity: globalIntensity } = useThemeStore()
  const [isHovered, setIsHovered] = useState(false)

  const finalIntensity = intensity ?? globalIntensity

  const handleMouseEnter = useCallback(() => {
    if (hover) setIsHovered(true)
  }, [hover])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  const glassStyle: CSSProperties = {
    background: resolvedTheme === 'dark'
      ? `rgba(20, 20, 20, ${0.90 + finalIntensity * 0.02})`
      : `rgba(255, 255, 255, ${0.80 + finalIntensity * 0.03})`,
    backdropFilter: `blur(${20 + finalIntensity * 3}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${20 + finalIntensity * 3}px) saturate(180%)`,
    border: `1px solid ${resolvedTheme === 'dark'
      ? `rgba(255, 255, 255, ${0.15 - finalIntensity * 0.02})`
      : `rgba(0, 0, 0, ${0.08 + finalIntensity * 0.02})`}`,
    borderRadius: '12px',
    transition: 'all 0.2s ease-out',
    transform: isHovered && hover ? 'translateY(-2px)' : 'none',
    boxShadow: isHovered && hover
      ? (resolvedTheme === 'dark'
          ? '0 6px 32px rgba(0, 0, 0, 0.5)'
          : '0 6px 32px rgba(0, 0, 0, 0.12)')
      : 'none',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  }

  return (
    <div
      className={className}
      style={glassStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

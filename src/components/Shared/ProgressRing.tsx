import { useEffect, useState } from 'react'

interface ProgressRingProps {
  percentage: number // 0-100
  size?: number
  strokeWidth?: number
  className?: string
  animated?: boolean
  color?: string
  showText?: boolean
  // 类型 1: 旋转圆环 (扫描/清理中) - 1.5s 一圈
  // 类型 2: 呼吸动画 (分析中)
  type?: 'progress' | 'loading'
}

export default function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 6,
  className = '',
  animated = true,
  color,
  showText = true,
  type = 'progress',
}: ProgressRingProps) {
  const [displayPercentage, setDisplayPercentage] = useState(animated ? 0 : percentage)

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayPercentage(percentage), 50)
      return () => clearTimeout(timer)
    }
    setDisplayPercentage(percentage)
  }, [percentage, animated])

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (displayPercentage / 100) * circumference

  // 根据百分比动态计算颜色
  const getColor = () => {
    if (color) return color
    if (percentage >= 90) return 'var(--status-critical)'
    if (percentage >= 70) return 'var(--status-poor)'
    if (percentage >= 50) return 'var(--status-fair)'
    return 'var(--status-good)'
  }

  // 类型 2: 呼吸动画
  if (type === 'loading') {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 animate-pulse"
        >
          {/* 背景圆 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-light)"
            strokeWidth={strokeWidth}
            opacity="0.3"
          />

          {/* 呼吸圆环 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color || 'var(--primary)'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
            style={{
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </svg>
      </div>
    )
  }

  // 类型 1: 旋转圆环 (扫描/清理中)
  if (percentage === 0 && animated) {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
          style={{
            animation: 'spin 1.5s linear infinite',
          }}
        >
          {/* 背景圆 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-light)"
            strokeWidth={strokeWidth}
            opacity="0.3"
          />

          {/* 旋转圆环 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color || 'var(--primary)'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference * 0.7}
            strokeDashoffset={0}
            opacity="0.8"
          />
        </svg>
      </div>
    )
  }

  // 标准进度环
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* 背景圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-light)"
          strokeWidth={strokeWidth}
        />

        {/* 进度圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: 'stroke-dashoffset 0.3s ease-out, stroke 0.3s ease-out',
          }}
        />
      </svg>

      {/* 中心文字 */}
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-bold"
            style={{
              fontSize: size / 4,
              color: getColor(),
            }}
          >
            {Math.round(displayPercentage)}%
          </span>
        </div>
      )}
    </div>
  )
}

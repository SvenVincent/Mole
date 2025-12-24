import { ReactNode, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  block?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary hover:brightness-110 text-white',
  secondary: 'bg-secondary hover:brightness-110 text-white',
  danger: 'bg-danger hover:brightness-110 text-white',
  success: 'bg-success hover:brightness-110 text-white',
  ghost: 'bg-transparent border border-medium hover:bg-[var(--state-hover)] text-primary',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2.5',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  block = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center
        rounded-button font-semibold
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${block ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 16} />}
      {icon && !loading && <span className="icon">{icon}</span>}
      {!loading && children}
      {loading && <span className="ml-1">加载中...</span>}
    </button>
  )
}

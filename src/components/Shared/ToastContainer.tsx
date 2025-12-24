import { useUIStore } from '@/stores/ui'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const iconMap = {
  success: <CheckCircle size={20} className="text-success" />,
  error: <XCircle size={20} className="text-danger" />,
  warning: <AlertTriangle size={20} className="text-warning" />,
  info: <Info size={20} className="text-info" />,
}

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="
              flex items-center gap-3 px-4 py-3
              bg-elevated rounded-lg shadow-lg
              border border-light
              min-w-[280px] max-w-[400px]
            "
          >
            {iconMap[toast.type]}
            <span className="flex-1 text-sm text-primary">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-tertiary hover:text-primary transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

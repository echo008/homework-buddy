import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn, subscribeToast, type ToastMessage, type ToastType } from '@/lib/utils'

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle
}

const colorMap: Record<ToastType, string> = {
  success: 'bg-success-50 text-success-600 border-success-200',
  error: 'bg-danger-50 text-danger-600 border-danger-200',
  info: 'bg-primary-50 text-primary-600 border-primary-200',
  warning: 'bg-warning-50 text-warning-600 border-warning-200'
}

const iconColorMap: Record<ToastType, string> = {
  success: 'text-success-500',
  error: 'text-danger-500',
  info: 'text-primary-500',
  warning: 'text-warning-500'
}

interface ToastItemProps {
  toast: ToastMessage
  onClose: () => void
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const Icon = iconMap[toast.type]

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))

    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onClose, 300)
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-card min-w-[280px] max-w-[90vw] transition-all duration-300',
        colorMap[toast.type],
        isVisible && !isExiting ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0', iconColorMap[toast.type])} />
      <span className="flex-1 text-sm font-medium text-gray-800">{toast.message}</span>
      <button
        onClick={() => {
          setIsExiting(true)
          setTimeout(onClose, 300)
        }}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  )
}

export function Toast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToast((toast) => {
      setToasts(prev => [...prev, toast])
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pt-safe">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

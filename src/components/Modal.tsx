import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  onConfirm?: () => void
}

export default function Modal({ open, onClose, title, children, footer, onConfirm }: ModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isRendered, setIsRendered] = useState(false)

  useEffect(() => {
    if (open) {
      setIsRendered(true)
      requestAnimationFrame(() => setIsVisible(true))
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => setIsRendered(false), 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  if (!isRendered) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          'absolute inset-0 bg-black/50 transition-opacity duration-300',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full max-w-md bg-white rounded-2xl shadow-card overflow-hidden transition-all duration-300',
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        )}
        <div className="px-5 py-4">
          {children}
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          {footer !== undefined ? (
            footer
          ) : (
            <>
              <button
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={onConfirm}
                className="btn-primary flex-1"
              >
                确定
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

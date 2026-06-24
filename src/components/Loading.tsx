import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  fullScreen?: boolean
}

export default function Loading({ fullScreen }: LoadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-8',
        fullScreen && 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50 h-screen w-screen'
      )}
    >
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <span className="text-sm text-gray-500">加载中...</span>
    </div>
  )
}

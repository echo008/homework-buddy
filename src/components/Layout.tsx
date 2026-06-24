import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Mic, BookOpen, Users, User, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LayoutProps {
  title?: string
  showBack?: boolean
  activeTab: string
  children: React.ReactNode
}

const tabs = [
  { id: 'home', label: '首页', icon: Home, path: '/' },
  { id: 'dictation', label: '听写', icon: Mic, path: '/dictation' },
  { id: 'units', label: '词库', icon: BookOpen, path: '/units' },
  { id: 'classes', label: '班级', icon: Users, path: '/classes' },
  { id: 'profile', label: '我的', icon: User, path: '/profile' }
]

export default function Layout({ title, showBack, activeTab, children }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center h-14 px-4 pt-safe">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          ) : (
            <div className="w-9" />
          )}
          <h1 className="flex-1 text-center text-lg font-semibold text-gray-800">
            {title}
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(4rem + var(--safe-bottom))' }}>
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="flex items-center justify-around pb-safe">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id || location.pathname === tab.path
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'nav-item flex-1',
                  isActive && 'nav-item-active'
                )}
              >
                <Icon className="w-6 h-6" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

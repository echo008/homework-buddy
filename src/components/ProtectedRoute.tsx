import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = useUserStore(state => state.token)
  const init = useUserStore(state => state.init)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    init()
    setIsInitialized(true)
  }, [init])

  if (!isInitialized) {
    return null
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

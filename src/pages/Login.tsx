import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Headphones } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { toast } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Mode = 'login' | 'register'

export default function Login() {
  const navigate = useNavigate()
  const { login, register, loading, token } = useUserStore()

  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true })
    }
  }, [token, navigate])

  const validate = (): string | null => {
    if (!username.trim()) return '请输入用户名'
    if (username.length < 2 || username.length > 20) return '用户名长度为2-20个字符'
    if (!password) return '请输入密码'
    if (password.length < 6) return '密码至少6位'
    if (mode === 'register') {
      if (password !== confirmPassword) return '两次密码输入不一致'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const error = validate()
    if (error) {
      toast.error(error)
      return
    }

    try {
      if (mode === 'login') {
        await login(username.trim(), password)
      } else {
        await register(username.trim(), password, nickname.trim() || undefined)
      }
      toast.success(mode === 'login' ? '登录成功' : '注册成功')
      navigate('/')
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || (mode === 'login' ? '登录失败' : '注册失败')
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-card flex items-center justify-center mb-4">
            <Headphones className="w-16 h-16 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">智听</h1>
          <p className="text-gray-500 mt-1">智能听写助手</p>
        </div>

        <div className="card">
          <div className="flex border-b border-gray-100 -mx-4 px-4 -mt-4 mb-5">
            <button
              onClick={() => setMode('login')}
              className={cn('tab-item', mode === 'login' && 'tab-item-active')}
            >
              登录
            </button>
            <button
              onClick={() => setMode('register')}
              className={cn('tab-item', mode === 'register' && 'tab-item-active')}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">用户名</label>
              <input
                type="text"
                className="input"
                placeholder="请输入用户名"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="label">昵称（可选）</label>
                <input
                  type="text"
                  className="input"
                  placeholder="请输入昵称"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="label">密码</label>
              <input
                type="password"
                className="input"
                placeholder="请输入密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="label">确认密码</label>
                <input
                  type="password"
                  className="input"
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            )}

            <button
              type="submit"
              className="btn-primary btn-lg w-full mt-2"
              disabled={loading}
            >
              {loading ? '处理中...' : (mode === 'login' ? '登录' : '注册')}
            </button>
          </form>
        </div>

        {token && (
          <p className="text-center text-sm text-gray-500 mt-4">已登录，正在跳转...</p>
        )}
      </div>
    </div>
  )
}

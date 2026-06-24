import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, History, ClipboardList, Library, HelpCircle, Info, ChevronRight, LogOut, Volume2, Eye } from 'lucide-react'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { useUserStore } from '@/store/userStore'
import { logApi } from '@/api'
import { toast, formatDate } from '@/lib/utils'
import { speak } from '@/lib/speech'
import { SUBJECT_LABELS, MODE_LABELS } from '@shared/constants'
import type { DictationLog } from '@shared/types'

export default function Profile() {
  const navigate = useNavigate()
  const { user, fetchMe, logout } = useUserStore()
  const [logs, setLogs] = useState<DictationLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  const loadHistory = async () => {
    if (showHistory) {
      setShowHistory(false)
      return
    }
    setShowHistory(true)
    setLogsLoading(true)
    try {
      const res = await logApi.list(20)
      if (res.data) {
        setLogs(res.data)
      }
    } catch {
      toast.error('加载历史记录失败')
    } finally {
      setLogsLoading(false)
    }
  }

  const handleLogout = () => {
    setShowLogoutConfirm(false)
    logout()
  }

  const viewLogDetail = (log: DictationLog) => {
    toast.info(`正确率: ${log.accuracy}%，共${log.totalWords}题`)
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-success-600 bg-success-50'
    if (accuracy >= 70) return 'text-primary-600 bg-primary-50'
    if (accuracy >= 50) return 'text-warning-600 bg-warning-50'
    return 'text-danger-600 bg-danger-50'
  }

  const nickname = user?.nickname || user?.username || '用户'
  const registerDate = user?.createdAt ? formatDate(user.createdAt).split(' ')[0] : ''

  const menuItems = [
    { id: 'history', icon: History, label: '听写历史', onClick: loadHistory },
    { id: 'wrong', icon: ClipboardList, label: '错题本', onClick: () => navigate('/wrong-words') },
    { id: 'preset', icon: Library, label: '预置词库', onClick: () => navigate('/preset') },
    { id: 'help', icon: HelpCircle, label: '使用帮助', onClick: () => toast.info('功能开发中') },
    { id: 'about', icon: Info, label: '关于我们', onClick: () => setShowAbout(true) }
  ]

  return (
    <Layout activeTab="profile" title="我的">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-5 text-white shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <User className="w-9 h-9 text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{nickname}</h2>
              <p className="text-white/70 text-sm mt-0.5">@{user?.username || 'user'}</p>
              {registerDate && (
                <p className="text-white/60 text-xs mt-1">注册于 {registerDate}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <span className="flex-1 text-left text-gray-700 font-medium">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            )
          })}
        </div>

        {showHistory && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">听写历史</h3>
            {logsLoading ? (
              <Loading />
            ) : logs.length === 0 ? (
              <div className="card">
                <EmptyState title="暂无听写记录" description="还没有听写记录，快去开始听写吧！" />
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map(log => (
                  <div key={log.id} className="card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="badge bg-primary-50 text-primary-600">
                          {SUBJECT_LABELS[log.subject]}
                        </span>
                        <span className="badge bg-gray-100 text-gray-600">
                          {MODE_LABELS[log.mode]}
                        </span>
                      </div>
                      <span className={`badge ${getAccuracyColor(log.accuracy)} font-semibold`}>
                        {log.accuracy}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        {formatDate(log.createdAt)} · {log.correctCount}/{log.totalWords}题
                      </div>
                      <button
                        onClick={() => viewLogDetail(log)}
                        className="flex items-center gap-1 text-primary-600 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        详情
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="btn-danger w-full mt-4"
        >
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </div>

      <Modal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="确认退出"
        onConfirm={handleLogout}
      >
        <p className="text-gray-600">确定要退出登录吗？</p>
      </Modal>

      <Modal
        open={showAbout}
        onClose={() => setShowAbout(false)}
        title="关于我们"
        footer={
          <button onClick={() => setShowAbout(false)} className="btn-primary w-full">
            确定
          </button>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Volume2 className="w-9 h-9 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">智听</h3>
          <p className="text-gray-500 mt-1">v2.0.0</p>
          <p className="text-sm text-gray-400 mt-3">智能听写助手</p>
        </div>
      </Modal>
    </Layout>
  )
}

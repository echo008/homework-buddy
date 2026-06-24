import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, BookOpen, Users, Camera, Library, ClipboardList, ChevronRight } from 'lucide-react'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import { useUserStore } from '@/store/userStore'
import { logApi } from '@/api'
import { formatDate } from '@/lib/utils'
import { SUBJECT_LABELS, MODE_LABELS } from '@shared/constants'
import type { DictationLog } from '@shared/types'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return '早上好'
  if (hour >= 12 && hour < 18) return '下午好'
  return '晚上好'
}

interface FeatureItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  large?: boolean
}

const features: FeatureItem[] = [
  { id: 'dictation', label: '开始听写', icon: Mic, path: '/dictation', large: true },
  { id: 'units', label: '我的词库', icon: BookOpen, path: '/units' },
  { id: 'classes', label: '班级共享', icon: Users, path: '/classes' },
  { id: 'ocr', label: '拍照识字', icon: Camera, path: '/ocr' },
  { id: 'preset', label: '预置词库', icon: Library, path: '/preset' },
  { id: 'wrong-words', label: '错题本', icon: ClipboardList, path: '/wrong-words' },
]

export default function Home() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [logs, setLogs] = useState<DictationLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await logApi.list(3)
        if (res.data) {
          setLogs(res.data)
        }
      } catch {
        setLogs([])
      } finally {
        setLogsLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const nickname = user?.nickname || user?.username || '同学'
  const greeting = getGreeting()

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'bg-success-500'
    if (accuracy >= 70) return 'bg-primary-500'
    if (accuracy >= 50) return 'bg-warning-500'
    return 'bg-danger-500'
  }

  return (
    <Layout activeTab="home" title="智听">
      <div className="px-4 pt-4 pb-6 space-y-5">
        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white border-none shadow-card">
          <p className="text-primary-100 text-sm">{greeting}</p>
          <h2 className="text-2xl font-bold mt-1">你好，{nickname}！</h2>
          <p className="text-primary-100 text-sm mt-2">今天也要坚持听写哦 🎯</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {features.map(feature => {
            const Icon = feature.icon
            if (feature.large) {
              return (
                <button
                  key={feature.id}
                  onClick={() => feature.path !== '#' && navigate(feature.path)}
                  className="col-span-2 flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-card hover:shadow-lg active:scale-[0.98] transition-all"
                >
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xl font-bold">{feature.label}</p>
                    <p className="text-primary-100 text-sm mt-0.5">选择词库，开始练习</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-white/70" />
                </button>
              )
            }
            return (
              <button
                key={feature.id}
                onClick={() => feature.path !== '#' && navigate(feature.path)}
                className="card flex flex-col items-center gap-3 py-5 hover:shadow-card active:scale-[0.97] transition-all"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{feature.label}</span>
              </button>
            )
          })}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">最近听写</h3>
          </div>

          {logsLoading ? (
            <Loading />
          ) : logs.length === 0 ? (
            <div className="card">
              <EmptyState
                title="暂无听写记录"
                description="还没有听写过？点击上方「开始听写」来练习吧！"
                action={
                  <button
                    onClick={() => navigate('/dictation')}
                    className="btn-primary btn-sm"
                  >
                    开始第一次听写
                  </button>
                }
              />
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
                    <span className="text-xs text-gray-400">{formatDate(log.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">正确率</span>
                        <span className="text-sm font-semibold text-gray-800">{log.accuracy}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getAccuracyColor(log.accuracy)}`}
                          style={{ width: `${log.accuracy}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <p>{log.correctCount}/{log.totalWords}题</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

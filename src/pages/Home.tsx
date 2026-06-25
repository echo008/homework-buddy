import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage, type Unit, type DictationRecord } from '@/lib/storage'

function formatDate(dateInput: string | number | Date): string {
  const d = new Date(dateInput)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

export default function Home() {
  const navigate = useNavigate()
  const [units, setUnits] = useState<Unit[]>([])
  const [records, setRecords] = useState<DictationRecord[]>([])
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    setUnits(storage.getUnits())
    setRecords(storage.getRecords().slice(0, 5))
  }

  function quickStart(subject: 'english' | 'chinese') {
    const subjectUnits = storage.getUnits().filter(u => u.subject === subject)
    if (subjectUnits.length === 0) {
      navigate('/presets')
      return
    }
    navigate('/dictation', { state: { subject, quickStart: true } })
  }

  const totalWords = units.reduce((sum, u) => sum + storage.getWordCount(u.id), 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white pb-24">
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-gray-900">智听</h1>
          <button onClick={() => navigate('/settings')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl">⚙️</button>
        </div>
        <p className="text-gray-500">智能听写助手 · 家长省心，孩子开心</p>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => quickStart('english')}
            className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white text-left shadow-lg shadow-blue-200 active:scale-95 transition-transform"
          >
            <div className="text-3xl mb-2">🔤</div>
            <div className="text-lg font-bold">英语听写</div>
            <div className="text-xs text-blue-100 mt-1">一键开始听英文</div>
          </button>
          <button
            onClick={() => quickStart('chinese')}
            className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white text-left shadow-lg shadow-rose-200 active:scale-95 transition-transform"
          >
            <div className="text-3xl mb-2">📝</div>
            <div className="text-lg font-bold">语文听写</div>
            <div className="text-xs text-rose-100 mt-1">一键开始听词语</div>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => navigate('/units')}
            className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100 active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-1">📚</div>
            <div className="text-xs text-gray-700 font-medium">我的词库</div>
          </button>
          <button
            onClick={() => navigate('/presets')}
            className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100 active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-1">📖</div>
            <div className="text-xs text-gray-700 font-medium">教材词库</div>
          </button>
          <button
            onClick={() => navigate('/ocr')}
            className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100 active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-1">📷</div>
            <div className="text-xs text-gray-700 font-medium">拍照识字</div>
          </button>
          <button
            onClick={() => navigate('/import')}
            className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100 active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-1">📋</div>
            <div className="text-xs text-gray-700 font-medium">批量导入</div>
          </button>
        </div>

        {units.length === 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">👋</div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 mb-1">欢迎使用智听！</h3>
                <p className="text-sm text-amber-800 mb-3">点击下方按钮导入教材同步词库，立即开始听写。</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/presets')}
                    className="px-4 py-2 bg-amber-500 text-white rounded-xl font-medium text-sm active:scale-95"
                  >📖 浏览教材词库</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {units.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800">我的词库</h3>
              <button onClick={() => navigate('/units')} className="text-sm text-indigo-600 font-medium">管理 →</button>
            </div>
            <div className="space-y-2">
              {units.slice(0, 4).map(unit => (
                <button
                  key={unit.id}
                  onClick={() => navigate(`/units/${unit.id}/words`)}
                  className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 active:bg-gray-50 text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${unit.subject === 'english' ? 'bg-blue-100' : 'bg-rose-100'}`}>
                    {unit.subject === 'english' ? '🔤' : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{unit.name}</div>
                    {unit.description && <div className="text-xs text-gray-400 truncate">{unit.description}</div>}
                  </div>
                  <div className="text-sm text-gray-500">{storage.getWordCount(unit.id)} 词</div>
                </button>
              ))}
              {units.length > 4 && (
                <button onClick={() => navigate('/units')} className="w-full py-3 text-center text-indigo-600 font-medium text-sm">
                  查看全部 {units.length} 个单元 →
                </button>
              )}
            </div>
          </div>
        )}

        {records.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3">最近听写</h3>
            <div className="space-y-2">
              {records.map(r => (
                <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900 truncate flex-1">{r.unitNames.join(', ') || '自由听写'}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <span>{formatDate(r.createdAt)}</span>
                    <span>·</span>
                    <span>{r.totalCount}词</span>
                    {r.duration > 0 && (
                      <>
                        <span>·</span>
                        <span>{r.duration < 60 ? `${r.duration}秒` : `${Math.round(r.duration / 60)}分钟`}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <div className="text-xs text-gray-400">
            共 {units.length} 个单元 · {totalWords} 个词
          </div>
        </div>
      </div>
    </div>
  )
}

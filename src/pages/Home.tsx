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
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    setUnits(storage.getUnits())
    setRecords(storage.getRecords().slice(0, 5))
  }

  function importEnglishSample() {
    if (!confirm('导入英语示例词库？（不会覆盖现有数据）')) return
    const sampleWords = [
      { word: 'apple', meaning: '苹果', phonetic: '/ˈæpl/' },
      { word: 'banana', meaning: '香蕉', phonetic: '/bəˈnænə/' },
      { word: 'cat', meaning: '猫', phonetic: '/kæt/' },
      { word: 'dog', meaning: '狗', phonetic: '/dɔːɡ/' },
      { word: 'hello', meaning: '你好', phonetic: '/həˈləʊ/' },
      { word: 'book', meaning: '书', phonetic: '/bʊk/' },
      { word: 'pen', meaning: '钢笔', phonetic: '/pen/' },
      { word: 'teacher', meaning: '老师', phonetic: '/ˈtiːtʃə(r)/' },
    ]
    storage.importPreset('示例词库 (英语入门)', 'english', sampleWords)
    loadData()
    alert('英语示例词库已导入！')
  }

  function importChineseSample() {
    if (!confirm('导入语文示例词库？（不会覆盖现有数据）')) return
    const sampleWords = [
      { word: '苹果', meaning: '一种水果', phonetic: 'píng guǒ' },
      { word: '学校', meaning: '学习的地方', phonetic: 'xué xiào' },
      { word: '老师', meaning: '传授知识的人', phonetic: 'lǎo shī' },
      { word: '朋友', meaning: '友好的伙伴', phonetic: 'péng yǒu' },
      { word: '快乐', meaning: '高兴的心情', phonetic: 'kuài lè' },
      { word: '美丽', meaning: '好看的样子', phonetic: 'měi lì' },
      { word: '认真', meaning: '专心仔细', phonetic: 'rèn zhēn' },
      { word: '努力', meaning: '尽力去做', phonetic: 'nǔ lì' },
    ]
    storage.importPreset('示例词库 (语文入门)', 'chinese', sampleWords)
    loadData()
    alert('语文示例词库已导入！')
  }

  function exportData() {
    const dataStr = storage.exportData()
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `智听-词库备份-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowSettings(false)
  }

  function importData() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const content = reader.result as string
        if (storage.importData(content)) {
          loadData()
          alert('导入成功！数据已恢复')
        } else {
          alert('导入失败，请检查文件格式')
        }
      }
      reader.readAsText(file)
    }
    input.click()
    setShowSettings(false)
  }

  function clearAll() {
    if (confirm('确定清空所有数据？此操作不可恢复！')) {
      storage.clearAll()
      loadData()
      setShowSettings(false)
    }
  }

  const totalWords = units.reduce((sum, u) => sum + storage.getWordCount(u.id), 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white pb-24">
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-gray-900">智听</h1>
          <button onClick={() => setShowSettings(true)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl">⚙️</button>
        </div>
        <p className="text-gray-500">智能听写助手 · 家长省心，孩子开心</p>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => navigate('/dictation')}
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white text-left shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
          >
            <div className="text-3xl mb-2">🎤</div>
            <div className="text-lg font-bold">开始听写</div>
            <div className="text-xs text-indigo-100 mt-1">自动语音播报</div>
          </button>
          <button
            onClick={() => navigate('/units')}
            className="bg-white rounded-2xl p-5 text-left shadow-sm border border-gray-100 active:scale-95 transition-transform"
          >
            <div className="text-3xl mb-2">📚</div>
            <div className="text-lg font-bold text-gray-900">我的词库</div>
            <div className="text-xs text-gray-400 mt-1">{units.length}个单元 · {totalWords}词</div>
          </button>
          <button
            onClick={() => navigate('/presets')}
            className="col-span-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white text-left shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">📖</div>
              <div>
                <div className="text-lg font-bold">教材词库</div>
                <div className="text-xs text-emerald-100 mt-0.5">小学到高中 · 语文+英语教材同步</div>
              </div>
              <div className="ml-auto text-white/70 text-lg">→</div>
            </div>
          </button>
        </div>

        {units.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-800 mb-3">我的词库</h3>
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
                    <div className="font-medium text-gray-900 truncate flex-1">{r.unitNames.join(', ')}</div>
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
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowSettings(false)}>
          <div className="w-full bg-white rounded-t-3xl p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">设置与数据</h3>
            <div className="space-y-2">
              <button onClick={exportData} className="w-full py-4 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium text-left px-4 flex items-center gap-3">
                <span className="text-xl">💾</span>
                <span>导出词库备份（JSON文件）</span>
              </button>
              <button onClick={importData} className="w-full py-4 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium text-left px-4 flex items-center gap-3">
                <span className="text-xl">📥</span>
                <span>从备份文件恢复</span>
              </button>
              <button onClick={clearAll} className="w-full py-4 bg-white border border-red-200 rounded-xl text-red-500 font-medium text-left px-4 flex items-center gap-3">
                <span className="text-xl">🗑</span>
                <span>清空所有数据</span>
              </button>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full py-4 mt-4 bg-gray-100 text-gray-700 rounded-xl font-medium">关闭</button>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage, type Unit, type DictationRecord } from '@/lib/storage'
import { formatDate } from '@/lib/utils'

export default function Home() {
  const navigate = useNavigate()
  const [units, setUnits] = useState<Unit[]>([])
  const [records, setRecords] = useState<DictationRecord[]>([])
  const [totalWords, setTotalWords] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    const u = storage.getUnits()
    setUnits(u)
    setRecords(storage.getRecords().slice(0, 5))
    let count = 0
    u.forEach(unit => { count += storage.getWordCount(unit.id) })
    setTotalWords(count)
  }

  function goDictation() {
    if (units.length === 0) {
      alert('还没有词库，请先创建单元添加单词')
      navigate('/units')
      return
    }
    navigate('/dictation')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-24">
      <div className="px-4 pt-12 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">智听</h1>
        <p className="text-gray-500 mt-1">智能听写助手 · 家长省心，孩子开心</p>
      </div>

      <div className="px-4 mb-6">
        <button
          onClick={goDictation}
          className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl shadow-xl shadow-indigo-200 font-bold text-xl active:scale-98 transition-transform"
        >
          🎤 开始听写
        </button>
      </div>

      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => navigate('/units')} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-3xl mb-1">📚</div>
            <div className="text-sm text-gray-700 font-medium">我的词库</div>
            <div className="text-xs text-gray-400 mt-1">{units.length}个单元</div>
          </button>
          <button onClick={() => navigate('/dictation')} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-3xl mb-1">✍️</div>
            <div className="text-sm text-gray-700 font-medium">快速听写</div>
            <div className="text-xs text-gray-400 mt-1">{totalWords}个单词</div>
          </button>
          <button onClick={() => {
            const sampleWords = [
              { word: 'apple', meaning: '苹果', phonetic: '/ˈæpl/' },
              { word: 'banana', meaning: '香蕉', phonetic: '/bəˈnænə/' },
              { word: 'cat', meaning: '猫', phonetic: '/kæt/' },
              { word: 'dog', meaning: '狗', phonetic: '/dɔːɡ/' },
              { word: 'hello', meaning: '你好', phonetic: '/həˈləʊ/' },
            ]
            storage.importPreset('示例词库 (入门)', 'english', sampleWords)
            loadData()
            alert('示例词库已导入！可以开始听写了')
          }} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-3xl mb-1">✨</div>
            <div className="text-sm text-gray-700 font-medium">导入示例</div>
            <div className="text-xs text-gray-400 mt-1">快速体验</div>
          </button>
        </div>
      </div>

      <div className="px-4">
        <h3 className="text-base font-semibold text-gray-800 mb-3">我的词库</h3>
        {units.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <div className="text-5xl mb-3">📖</div>
            <p className="text-gray-500 mb-3">还没有创建词库</p>
            <button onClick={() => navigate('/units')} className="text-indigo-600 font-medium">去创建单元 →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {units.map(unit => {
              const count = storage.getWordCount(unit.id)
              return (
                <button
                  key={unit.id}
                  onClick={() => navigate(`/units/${unit.id}/words`)}
                  className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 active:bg-gray-50"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${unit.subject === 'english' ? 'bg-blue-100' : 'bg-red-100'}`}>
                    {unit.subject === 'english' ? '🔤' : '📝'}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">{unit.name}</div>
                    {unit.description && <div className="text-sm text-gray-500">{unit.description}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-indigo-600">{count}</div>
                    <div className="text-xs text-gray-400">词</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-4 mt-6 mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-3">最近听写</h3>
        {records.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
            <p className="text-gray-400 text-sm">还没有听写记录，开始第一次听写吧！</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{r.unitNames.join(', ')}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatDate(r.createdAt)} · {r.words.length}词</div>
                  </div>
                  <div className="text-sm text-gray-500">{r.duration}秒</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-around">
        <button onClick={() => navigate('/')} className="flex flex-col items-center py-2 px-4 text-indigo-600">
          <span className="text-xl">🏠</span>
          <span className="text-xs mt-1">首页</span>
        </button>
        <button onClick={goDictation} className="flex flex-col items-center py-2 px-4 text-gray-400">
          <span className="text-xl">🎤</span>
          <span className="text-xs mt-1">听写</span>
        </button>
        <button onClick={() => navigate('/units')} className="flex flex-col items-center py-2 px-4 text-gray-400">
          <span className="text-xl">📚</span>
          <span className="text-xs mt-1">词库</span>
        </button>
      </div>
    </div>
  )
}

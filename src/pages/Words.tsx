import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { storage, type Unit, type Word } from '@/lib/storage'

export default function Words() {
  const navigate = useNavigate()
  const { unitId } = useParams<{ unitId: string }>()
  const [unit, setUnit] = useState<Unit | null>(null)
  const [words, setWords] = useState<Word[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [editingWord, setEditingWord] = useState<Word | null>(null)

  const [word, setWord] = useState('')
  const [meaning, setMeaning] = useState('')
  const [phonetic, setPhonetic] = useState('')
  const [lesson, setLesson] = useState(1)
  const [batchText, setBatchText] = useState('')

  useEffect(() => {
    if (!unitId) return
    const u = storage.getUnits().find(x => x.id === unitId)
    if (u) {
      setUnit(u)
      loadWords()
    } else {
      navigate('/units')
    }
  }, [unitId])

  function loadWords() {
    if (!unitId) return
    setWords(storage.getWords(unitId))
  }

  function openAddModal() {
    setEditingWord(null)
    setWord('')
    setMeaning('')
    setPhonetic('')
    setLesson(1)
    setShowAddModal(true)
  }

  function openEditModal(w: Word) {
    setEditingWord(w)
    setWord(w.word)
    setMeaning(w.meaning)
    setPhonetic(w.phonetic || '')
    setLesson(w.lesson || 1)
    setShowAddModal(true)
  }

  function saveWord() {
    if (!unitId || !word.trim() || !meaning.trim()) return
    if (editingWord) {
      storage.updateWord(editingWord.id, {
        word: word.trim(),
        meaning: meaning.trim(),
        phonetic: phonetic.trim() || undefined,
        lesson
      })
    } else {
      storage.addWord({
        unitId,
        word: word.trim(),
        meaning: meaning.trim(),
        phonetic: phonetic.trim() || undefined,
        lesson,
        pinyin: unit?.subject === 'chinese' ? phonetic.trim() : undefined
      })
    }
    setShowAddModal(false)
    loadWords()
  }

  function importBatch() {
    if (!unitId || !batchText.trim()) return
    const lines = batchText.trim().split('\n').filter(l => l.trim())
    const newWords: Array<{unitId: string; word: string; meaning: string; lesson: number}> = []
    lines.forEach(line => {
      const parts = line.split(/[,，\t]/).map(p => p.trim()).filter(Boolean)
      if (parts.length >= 2) {
        newWords.push({
          unitId,
          word: parts[0],
          meaning: parts[1],
          lesson: lesson
        })
      }
    })
    if (newWords.length > 0) {
      storage.addWordsBatch(newWords)
      setBatchText('')
      setShowBatchModal(false)
      loadWords()
      alert(`成功导入 ${newWords.length} 个单词`)
    } else {
      alert('没有识别到有效单词，请检查格式')
    }
  }

  function deleteWord(id: string, w: string) {
    if (confirm(`确定删除单词「${w}」吗？`)) {
      storage.deleteWord(id)
      loadWords()
    }
  }

  function goDictation() {
    navigate('/dictation')
  }

  if (!unit) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-28">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate('/units')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-xl">←</button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">{unit.name}</h1>
          <div className="text-xs text-gray-500">{unit.subject === 'english' ? '🔤 英语' : '📝 语文'} · {words.length}个单词</div>
        </div>
        <button onClick={goDictation} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm shadow-md shadow-indigo-200">听写</button>
      </div>

      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setShowBatchModal(true)} className="flex-1 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium text-sm">📋 批量导入</button>
          <button onClick={openAddModal} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm shadow-md shadow-indigo-200">+ 添加单词</button>
        </div>

        {words.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <div className="text-6xl mb-4">✏️</div>
            <p className="text-gray-500 mb-4">还没有添加单词</p>
            <button onClick={openAddModal} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium">添加第一个单词</button>
          </div>
        ) : (
          <div className="space-y-2">
            {words.map((w, idx) => (
              <div key={w.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-sm font-medium flex-shrink-0">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-900 text-lg">{w.word}</span>
                      {w.phonetic && <span className="text-sm text-gray-400">{w.phonetic}</span>}
                      {w.lesson && <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">第{w.lesson}课</span>}
                    </div>
                    <div className="text-gray-600 mt-1">{w.meaning}</div>
                  </div>
                  <button onClick={() => openEditModal(w)} className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">✏️</button>
                  <button onClick={() => deleteWord(w.id, w.word)} className="w-9 h-9 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50">🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={openAddModal}
          className="fixed bottom-24 right-5 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-300 flex items-center justify-center text-3xl active:scale-95 transition-transform z-20"
        >+</button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-5">{editingWord ? '编辑单词' : unit.subject === 'english' ? '添加英语单词' : '添加语文词语'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">{unit.subject === 'english' ? '单词' : '词语'} *</label>
                <input
                  type="text"
                  value={word}
                  onChange={e => setWord(e.target.value)}
                  placeholder={unit.subject === 'english' ? '例如：apple' : '例如：山水'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-lg"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">{unit.subject === 'english' ? '中文释义' : '释义/拼音'} *</label>
                <input
                  type="text"
                  value={meaning}
                  onChange={e => setMeaning(e.target.value)}
                  placeholder={unit.subject === 'english' ? '例如：苹果' : '例如：shān shuǐ 山水'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>
              {unit.subject === 'english' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">音标（选填）</label>
                  <input
                    type="text"
                    value={phonetic}
                    onChange={e => setPhonetic(e.target.value)}
                    placeholder="例如：/ˈæpl/"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-600 mb-2">课次</label>
                <input
                  type="number"
                  value={lesson}
                  onChange={e => setLesson(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="py-4 rounded-xl font-medium bg-gray-100 text-gray-700">取消</button>
              <button onClick={saveWord} disabled={!word.trim() || !meaning.trim()} className="py-4 rounded-xl font-medium bg-indigo-600 text-white disabled:opacity-50">{editingWord ? '保存' : '添加'}</button>
            </div>
          </div>
        </div>
      )}

      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowBatchModal(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-3">批量导入</h3>
            <p className="text-sm text-gray-500 mb-4">每行一个单词，格式：<code className="bg-gray-100 px-1 rounded">单词,释义</code>（用逗号或Tab分隔）</p>
            <textarea
              value={batchText}
              onChange={e => setBatchText(e.target.value)}
              placeholder={`apple,苹果\nbanana,香蕉\ncat,猫`}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none h-40 resize-none font-mono text-sm"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={() => setShowBatchModal(false)} className="py-4 rounded-xl font-medium bg-gray-100 text-gray-700">取消</button>
              <button onClick={importBatch} disabled={!batchText.trim()} className="py-4 rounded-xl font-medium bg-indigo-600 text-white disabled:opacity-50">导入</button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-around">
        <button onClick={() => navigate('/')} className="flex flex-col items-center py-2 px-4 text-gray-400">
          <span className="text-xl">🏠</span>
          <span className="text-xs mt-1">首页</span>
        </button>
        <button onClick={goDictation} className="flex flex-col items-center py-2 px-4 text-gray-400">
          <span className="text-xl">🎤</span>
          <span className="text-xs mt-1">听写</span>
        </button>
        <button onClick={() => navigate('/units')} className="flex flex-col items-center py-2 px-4 text-indigo-600">
          <span className="text-xl">📚</span>
          <span className="text-xs mt-1">词库</span>
        </button>
      </div>
    </div>
  )
}

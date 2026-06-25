import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { storage, type Unit, type Word } from '@/lib/storage'
import { toast } from '@/lib/utils'

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
  const [batchText, setBatchText] = useState('')

  const isChinese = unit?.subject === 'chinese'

  useEffect(() => {
    if (unitId) loadData()
  }, [unitId])

  function loadData() {
    if (!unitId) return
    const u = storage.getUnit(unitId)
    setUnit(u)
    setWords(storage.getWords(unitId))
  }

  function openAdd() {
    setEditingWord(null)
    setWord('')
    setMeaning('')
    setPhonetic('')
    setShowAddModal(true)
  }

  function openEdit(w: Word) {
    setEditingWord(w)
    setWord(w.word)
    setMeaning(w.meaning)
    setPhonetic(w.phonetic || '')
    setShowAddModal(true)
  }

  function handleSave() {
    if (!word.trim() || !meaning.trim()) {
      toast.error(isChinese ? '请填写词语和释义' : '请填写单词和释义')
      return
    }
    if (!unitId) return

    if (editingWord) {
      storage.updateWord(editingWord.id, {
        word: word.trim(),
        meaning: meaning.trim(),
        phonetic: phonetic.trim()
      })
    } else {
      storage.addWord({
        unitId,
        word: word.trim(),
        meaning: meaning.trim(),
        phonetic: phonetic.trim()
      })
    }
    setShowAddModal(false)
    loadData()
  }

  function handleDelete(id: string) {
    if (confirm('确定删除这个词？')) {
      storage.deleteWord(id)
      loadData()
    }
  }

  function handleBatchImport() {
    if (!batchText.trim() || !unitId) return

    const lines = batchText.trim().split('\n').filter(l => l.trim())
    const newWords: Array<{ unitId: string; word: string; meaning: string; phonetic: string }> = []

    lines.forEach(line => {
      const parts = line.split(/[,，\t]/).map(s => s.trim()).filter(Boolean)
      if (parts.length >= 2) {
        newWords.push({
          unitId,
          word: parts[0],
          phonetic: parts.length >= 3 ? parts[1] : '',
          meaning: parts.length >= 3 ? parts[2] : parts[1]
        })
      }
    })

    if (newWords.length === 0) {
      toast.error('格式错误，请检查每行格式')
      return
    }

    storage.addWordsBatch(newWords)
    setBatchText('')
    setShowBatchModal(false)
    loadData()
    toast.success(`成功导入 ${newWords.length} 个词`)
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">单元不存在</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-xl">←</button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">{unit.name}</h1>
          <p className="text-xs text-gray-500">{isChinese ? '语文' : '英语'} · {words.length} 个词</p>
        </div>
        <button
          onClick={() => setShowBatchModal(true)}
          className="px-3 py-2 text-sm text-indigo-600 font-medium"
        >批量导入</button>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm shadow-md"
        >+ 添加</button>
      </div>

      <div className="p-4">
        {words.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{isChinese ? '📝' : '🔤'}</div>
            <p className="text-gray-500 mb-4">还没有添加任何{isChinese ? '词语' : '单词'}</p>
            <button
              onClick={openAdd}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-md"
            >添加第一个{isChinese ? '词语' : '单词'}</button>
          </div>
        ) : (
          <div className="space-y-2">
            {words.map((w, idx) => (
              <div
                key={w.id}
                className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 flex-shrink-0">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-gray-900 text-lg">{w.word}</span>
                    {w.phonetic && <span className="text-sm text-gray-400">{w.phonetic}</span>}
                  </div>
                  <div className="text-sm text-gray-600 mt-0.5">{w.meaning}</div>
                </div>
                <button
                  onClick={() => openEdit(w)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-indigo-500"
                >✏️</button>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500"
                >🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowAddModal(false)}>
          <div className="w-full bg-white rounded-t-3xl p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editingWord ? '编辑' : '添加'}{isChinese ? '词语' : '单词'}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{isChinese ? '词语' : '单词'}</label>
                <input
                  type="text"
                  value={word}
                  onChange={e => setWord(e.target.value)}
                  placeholder={isChinese ? '如：苹果' : '如：apple'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{isChinese ? '拼音（选填）' : '音标（选填）'}</label>
                <input
                  type="text"
                  value={phonetic}
                  onChange={e => setPhonetic(e.target.value)}
                  placeholder={isChinese ? '如：píng guǒ' : '如：/ˈæpl/'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{isChinese ? '释义' : '中文释义'}</label>
                <input
                  type="text"
                  value={meaning}
                  onChange={e => setMeaning(e.target.value)}
                  placeholder={isChinese ? '如：一种水果' : '如：苹果'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
              >取消</button>
              <button
                onClick={handleSave}
                disabled={!word.trim() || !meaning.trim()}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
              >保存</button>
            </div>
          </div>
        </div>
      )}

      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowBatchModal(false)}>
          <div className="w-full bg-white rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">批量导入</h3>
            <p className="text-sm text-gray-500 mb-4">
              每行一个词，格式：{isChinese ? '词语,拼音,释义' : '单词,音标,中文释义'}（用逗号或Tab分隔，拼音/音标可省略）
            </p>

            <textarea
              value={batchText}
              onChange={e => setBatchText(e.target.value)}
              placeholder={isChinese
                ? '苹果,píng guǒ,一种水果\n香蕉,xiāng jiāo,一种水果\n猫,māo,一种动物'
                : 'apple,/ˈæpl/,苹果\nbanana,/bəˈnænə/,香蕉\ncat,/kæt/,猫'}
              className="w-full h-48 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none font-mono text-sm"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowBatchModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
              >取消</button>
              <button
                onClick={handleBatchImport}
                disabled={!batchText.trim()}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
              >导入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage, type Unit } from '@/lib/storage'
import { SUBJECTS } from '@shared/constants'

export default function Units() {
  const navigate = useNavigate()
  const [units, setUnits] = useState<Unit[]>([])
  const [showModal, setShowModal] = useState(false)
  const [subject, setSubject] = useState<'english' | 'chinese'>(SUBJECTS.ENGLISH)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    loadUnits()
  }, [])

  function loadUnits() {
    setUnits(storage.getUnits())
  }

  function handleCreate() {
    if (!name.trim()) return
    storage.createUnit({ name: name.trim(), subject, description: description.trim() })
    setName('')
    setDescription('')
    setShowModal(false)
    loadUnits()
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm('确定删除这个单元及其所有单词？')) {
      storage.deleteUnit(id)
      loadUnits()
    }
  }

  const englishUnits = units.filter(u => u.subject === SUBJECTS.ENGLISH)
  const chineseUnits = units.filter(u => u.subject === SUBJECTS.CHINESE)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-xl">←</button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">我的词库</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm shadow-md"
        >+ 新建</button>
      </div>

      <div className="p-4 space-y-6">
        {englishUnits.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>🔤</span> 英语词库 ({englishUnits.length}个单元)
            </h2>
            <div className="space-y-2">
              {englishUnits.map(unit => {
                const count = storage.getWordCount(unit.id)
                return (
                  <div
                    key={unit.id}
                    onClick={() => navigate(`/units/${unit.id}/words`)}
                    className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 active:bg-gray-50 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl flex-shrink-0">📖</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{unit.name}</div>
                      {unit.description && <div className="text-sm text-gray-500 truncate">{unit.description}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-indigo-600">{count} 词</div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(unit.id, e)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500"
                    >🗑</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {chineseUnits.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>📝</span> 语文词库 ({chineseUnits.length}个单元)
            </h2>
            <div className="space-y-2">
              {chineseUnits.map(unit => {
                const count = storage.getWordCount(unit.id)
                return (
                  <div
                    key={unit.id}
                    onClick={() => navigate(`/units/${unit.id}/words`)}
                    className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 active:bg-gray-50 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-2xl flex-shrink-0">📚</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{unit.name}</div>
                      {unit.description && <div className="text-sm text-gray-500 truncate">{unit.description}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-rose-600">{count} 词</div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(unit.id, e)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500"
                    >🗑</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {units.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-500 mb-4">还没有创建任何词库单元</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-md"
            >创建第一个单元</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowModal(false)}>
          <div className="w-full bg-white rounded-t-3xl p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">新建词库单元</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">学科</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSubject(SUBJECTS.ENGLISH)}
                  className={`py-3 rounded-xl font-medium ${subject === SUBJECTS.ENGLISH ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >🔤 英语</button>
                <button
                  onClick={() => setSubject(SUBJECTS.CHINESE)}
                  className={`py-3 rounded-xl font-medium ${subject === SUBJECTS.CHINESE ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >📝 语文</button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">单元名称</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={subject === SUBJECTS.ENGLISH ? '如：三年级上册 Unit 1' : '如：三年级上册 第一单元'}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">备注（选填）</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="如：人教版课本单词"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
              >取消</button>
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
              >创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

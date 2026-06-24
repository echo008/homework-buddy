import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage, type Unit } from '@/lib/storage'
import { SUBJECTS } from '@shared/constants'

export default function Units() {
  const navigate = useNavigate()
  const [units, setUnits] = useState<Unit[]>([])
  const [subject, setSubject] = useState<'english' | 'chinese'>(SUBJECTS.ENGLISH)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  useEffect(() => { loadUnits() }, [subject])

  function loadUnits() {
    setUnits(storage.getUnits().filter(u => u.subject === subject))
  }

  function createUnit() {
    if (!newName.trim()) return
    storage.createUnit({ name: newName.trim(), subject, description: newDesc.trim() || undefined })
    setNewName('')
    setNewDesc('')
    setShowModal(false)
    loadUnits()
  }

  function deleteUnit(id: string, name: string) {
    if (confirm(`确定删除单元「${name}」吗？里面的所有单词都会被删除。`)) {
      storage.deleteUnit(id)
      loadUnits()
    }
  }

  const filtered = units.filter(u => u.subject === subject)

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-28">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-xl">←</button>
        <h1 className="text-xl font-bold text-gray-900">我的词库</h1>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => setSubject(SUBJECTS.ENGLISH)}
            className={`py-3 rounded-2xl font-medium transition-all ${subject === SUBJECTS.ENGLISH ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-700 border border-gray-200'}`}
          >🔤 英语</button>
          <button
            onClick={() => setSubject(SUBJECTS.CHINESE)}
            className={`py-3 rounded-2xl font-medium transition-all ${subject === SUBJECTS.CHINESE ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-700 border border-gray-200'}`}
          >📝 语文</button>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-gray-500 mb-4">还没有{subject === 'english' ? '英语' : '语文'}单元</p>
            <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium">创建第一个单元</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(unit => {
              const count = storage.getWordCount(unit.id)
              return (
                <div key={unit.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => navigate(`/units/${unit.id}/words`)}
                      className="flex-1 flex items-start gap-3 text-left"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${subject === 'english' ? 'bg-blue-100' : 'bg-red-100'}`}>
                        {subject === 'english' ? '🔤' : '📝'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-lg">{unit.name}</div>
                        {unit.description && <div className="text-sm text-gray-500 mt-0.5">{unit.description}</div>}
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-medium">{count} 个单词</span>
                        </div>
                      </div>
                    </button>
                    <button onClick={() => deleteUnit(unit.id, unit.name)} className="w-10 h-10 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50">🗑</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-300 flex items-center justify-center text-3xl active:scale-95 transition-transform z-20"
        >+</button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-5">创建{subject === 'english' ? '英语' : '语文'}单元</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">单元名称 *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder={subject === 'english' ? '例如：Unit 1 Hello' : '例如：第一单元 识字一'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-lg"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">备注（选填）</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="例如：三年级上册 人教版"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="py-4 rounded-xl font-medium bg-gray-100 text-gray-700">取消</button>
              <button onClick={createUnit} disabled={!newName.trim()} className="py-4 rounded-xl font-medium bg-indigo-600 text-white disabled:opacity-50">确定</button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-around">
        <button onClick={() => navigate('/')} className="flex flex-col items-center py-2 px-4 text-gray-400">
          <span className="text-xl">🏠</span>
          <span className="text-xs mt-1">首页</span>
        </button>
        <button onClick={() => navigate('/dictation')} className="flex flex-col items-center py-2 px-4 text-gray-400">
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

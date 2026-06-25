import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage } from '@/lib/storage'
import {
  getPresetsBySubject,
  groupPresetsByGrade,
  GRADE_LABELS,
  GRADE_ORDER,
  type PresetUnit
} from '@/data/presets'
import { toast } from '@/lib/utils'

export default function Presets() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState<'english' | 'chinese'>('english')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set(['primary3']))
  const [importing, setImporting] = useState(false)

  const presets = useMemo(() => getPresetsBySubject(subject), [subject])
  const grouped = useMemo(() => groupPresetsByGrade(presets), [presets])

  const totalWordsSelected = useMemo(() => {
    let count = 0
    presets.forEach(p => {
      if (selectedIds.has(p.id)) count += p.words.length
    })
    return count
  }, [selectedIds, presets])

  function toggleGrade(grade: string) {
    const newSet = new Set(expandedGrades)
    if (newSet.has(grade)) newSet.delete(grade)
    else newSet.add(grade)
    setExpandedGrades(newSet)
  }

  function toggleSelect(preset: PresetUnit) {
    const newSet = new Set(selectedIds)
    if (newSet.has(preset.id)) newSet.delete(preset.id)
    else newSet.add(preset.id)
    setSelectedIds(newSet)
  }

  function selectAllGrade(grade: string) {
    const gradeUnits = grouped[grade] || []
    const newSet = new Set(selectedIds)
    const allSelected = gradeUnits.every(u => newSet.has(u.id))
    if (allSelected) {
      gradeUnits.forEach(u => newSet.delete(u.id))
    } else {
      gradeUnits.forEach(u => newSet.add(u.id))
    }
    setSelectedIds(newSet)
  }

  function importSelected() {
    if (selectedIds.size === 0) {
      toast.error('请先选择要导入的单元')
      return
    }
    setImporting(true)

    let count = 0
    const selectedPresets = presets.filter(p => selectedIds.has(p.id))

    selectedPresets.forEach(p => {
      const existingUnits = storage.getUnits()
      const exists = existingUnits.find(u => u.name === p.name)
      if (exists) return

      const unit = storage.createUnit({
        name: p.name,
        subject: p.subject,
        description: `${p.textbook} · ${GRADE_LABELS[p.grade]}`
      })
      storage.addWordsBatch(p.words.map(w => ({
        unitId: unit.id,
        word: w.word,
        meaning: w.meaning,
        phonetic: w.phonetic || ''
      })))
      count += p.words.length
    })

    setImporting(false)
    toast.success(`成功导入 ${selectedPresets.length} 个单元，共 ${count} 个词！`)
    setSelectedIds(new Set())
  }

  function importGrade(grade: string) {
    const gradeUnits = grouped[grade] || []
    if (gradeUnits.length === 0) return
    let count = 0
    const existingUnits = storage.getUnits()

    gradeUnits.forEach(p => {
      const exists = existingUnits.find(u => u.name === p.name)
      if (exists) return

      const unit = storage.createUnit({
        name: p.name,
        subject: p.subject,
        description: `${p.textbook} · ${GRADE_LABELS[p.grade]}`
      })
      storage.addWordsBatch(p.words.map(w => ({
        unitId: unit.id,
        word: w.word,
        meaning: w.meaning,
        phonetic: w.phonetic || ''
      })))
      count += p.words.length
    })

    toast.success(`已导入${GRADE_LABELS[grade]}词库，共 ${count} 个词！`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-xl">←</button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">教材词库</h1>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-2xl p-1 flex gap-1 mb-4 shadow-sm border border-gray-100">
          <button
            onClick={() => { setSubject('english'); setSelectedIds(new Set()) }}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${subject === 'english' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600'}`}
          >🔤 英语教材</button>
          <button
            onClick={() => { setSubject('chinese'); setSelectedIds(new Set()) }}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${subject === 'chinese' ? 'bg-rose-600 text-white shadow' : 'text-gray-600'}`}
          >📝 语文教材</button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {subject === 'english' ? '人教PEP版/人教版小学到初中教材单词' : '人教部编版小学到初中教材词语'}
        </p>

        <div className="space-y-3">
          {GRADE_ORDER.map(grade => {
            const units = grouped[grade]
            if (!units || units.length === 0) return null
            const isExpanded = expandedGrades.has(grade)
            const totalWords = units.reduce((s, u) => s + u.words.length, 0)
            const allSelected = units.every(u => selectedIds.has(u.id))
            const someSelected = units.some(u => selectedIds.has(u.id))

            return (
              <div key={grade} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleGrade(grade)}
                  className="w-full px-4 py-4 flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${subject === 'english' ? 'bg-blue-100' : 'bg-rose-100'}`}>
                    {subject === 'english' ? '🔤' : '📝'}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900">{GRADE_LABELS[grade]}</div>
                    <div className="text-sm text-gray-500">{units.length}个单元 · {totalWords}词</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); importGrade(grade) }}
                      className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg font-medium"
                    >全部导入</button>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 flex items-center justify-center text-gray-400"
                    >
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                        onChange={() => selectAllGrade(grade)}
                        className="w-5 h-5 rounded accent-indigo-600"
                      />
                    </div>
                    <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {units.map(unit => (
                      <label key={unit.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(unit.id)}
                          onChange={() => toggleSelect(unit)}
                          className="w-5 h-5 rounded accent-indigo-600 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm">{unit.name}</div>
                          <div className="text-xs text-gray-500">{unit.words.length}词</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-20">
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <div className="text-sm text-gray-600">
              已选 <span className="font-bold text-indigo-600">{selectedIds.size}</span> 单元，<span className="font-bold text-indigo-600">{totalWordsSelected}</span> 词
            </div>
            <button
              onClick={importSelected}
              disabled={importing}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              {importing ? '导入中...' : '导入选中'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

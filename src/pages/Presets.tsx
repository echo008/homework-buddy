import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage } from '@/lib/storage'
import {
  getPresetsBySubject,
  getTextbooks,
  groupPresetsByGrade,
  GRADE_LABELS,
  GRADE_ORDER,
  type PresetUnit
} from '@/data/presets'
import { toast } from '@/lib/utils'

export default function Presets() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState<'english' | 'chinese'>('english')
  const [textbook, setTextbook] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)

  const textbooks = useMemo(() => getTextbooks(subject), [subject])

  const presets = useMemo(() => {
    const all = getPresetsBySubject(subject)
    if (!textbook) return all
    return all.filter(p => p.textbook === textbook)
  }, [subject, textbook])

  const totalCount = useMemo(() => getPresetsBySubject(subject).length, [subject])
  const totalWords = useMemo(() => getPresetsBySubject(subject).reduce((s, u) => s + u.words.length, 0), [subject])

  const grouped = useMemo(() => groupPresetsByGrade(presets), [presets])

  const totalWordsSelected = useMemo(() => {
    const all = getPresetsBySubject(subject)
    let count = 0
    all.forEach(p => { if (selectedIds.has(p.id)) count += p.words.length })
    return count
  }, [selectedIds, subject])

  function changeSubject(s: 'english' | 'chinese') {
    setSubject(s)
    setTextbook('')
    setSelectedIds(new Set())
    setExpandedGrades(new Set())
  }

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
    if (allSelected) gradeUnits.forEach(u => newSet.delete(u.id))
    else gradeUnits.forEach(u => newSet.add(u.id))
    setSelectedIds(newSet)
  }

  function importUnits(units: PresetUnit[]) {
    const existingUnits = storage.getUnits()
    let count = 0
    let skipped = 0
    units.forEach(p => {
      const exists = existingUnits.find(u => u.name === p.name)
      if (exists) { skipped++; return }
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
    return { count, skipped }
  }

  function importSelected() {
    if (selectedIds.size === 0) {
      toast.error('请先选择要导入的单元')
      return
    }
    setImporting(true)
    const all = getPresetsBySubject(subject)
    const selectedPresets = all.filter(p => selectedIds.has(p.id))
    const { count, skipped } = importUnits(selectedPresets)
    setImporting(false)
    let msg = `成功导入 ${selectedPresets.length - skipped} 个单元，共 ${count} 个词！`
    if (skipped > 0) msg += `（已跳过${skipped}个已存在单元）`
    toast.success(msg)
    setSelectedIds(new Set())
  }

  function importGrade(grade: string) {
    const gradeUnits = grouped[grade] || []
    if (gradeUnits.length === 0) return
    const { count, skipped } = importUnits(gradeUnits)
    let msg = `已导入${GRADE_LABELS[grade]}词库，共 ${count} 个词！`
    if (skipped > 0) msg += `（跳过${skipped}个已存在单元）`
    toast.success(msg)
  }

  function importAllVisible() {
    if (!confirm(`确定导入当前筛选下的所有 ${presets.length} 个单元（共${presets.reduce((s,u)=>s+u.words.length,0)}词）？`)) return
    const { count, skipped } = importUnits(presets)
    toast.success(`导入完成！新增 ${count} 词，跳过 ${skipped} 个已存在单元`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-xl">←</button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">教材词库</h1>
        <button onClick={importAllVisible} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg font-medium">一键导入全部</button>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-2xl p-1 flex gap-1 mb-3 shadow-sm border border-gray-100">
          <button
            onClick={() => changeSubject('english')}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${subject === 'english' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600'}`}
          >🔤 英语</button>
          <button
            onClick={() => changeSubject('chinese')}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${subject === 'chinese' ? 'bg-rose-600 text-white shadow' : 'text-gray-600'}`}
          >📝 语文</button>
        </div>

        <div className="bg-indigo-50 rounded-xl p-3 mb-3 flex items-center justify-between text-sm">
          <span className="text-indigo-800">共 <b>{totalCount}</b> 个单元 · <b>{totalWords}</b> 个词</span>
          <span className="text-indigo-600">{textbooks.length}个教材版本</span>
        </div>

        <div className="mb-3 -mx-4 px-4 overflow-x-auto pb-1">
          <div className="flex gap-2 whitespace-nowrap">
            <button
              onClick={() => setTextbook('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!textbook ? (subject === 'english' ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white') : 'bg-white text-gray-700 border border-gray-200'}`}
            >全部版本</button>
            {textbooks.map(tb => (
              <button
                key={tb}
                onClick={() => setTextbook(tb === textbook ? '' : tb)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${tb === textbook ? (subject === 'english' ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white') : 'bg-white text-gray-700 border border-gray-200'}`}
              >{tb}</button>
            ))}
          </div>
        </div>

        {textbook && (
          <p className="text-sm text-gray-500 mb-3 px-1">当前筛选：{textbook} · {presets.length}个单元</p>
        )}

        <div className="space-y-3">
          {GRADE_ORDER.map(grade => {
            const units = grouped[grade]
            if (!units || units.length === 0) return null
            const isExpanded = expandedGrades.has(grade)
            const totalWordCount = units.reduce((s, u) => s + u.words.length, 0)
            const textbooksInGrade = Array.from(new Set(units.map(u => u.textbook)))
            const allSelected = units.every(u => selectedIds.has(u.id))
            const someSelected = units.some(u => selectedIds.has(u.id))

            return (
              <div key={grade} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button onClick={() => toggleGrade(grade)} className="w-full px-4 py-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${subject === 'english' ? 'bg-blue-100' : 'bg-rose-100'}`}>
                    {subject === 'english' ? '🔤' : '📝'}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900">{GRADE_LABELS[grade]}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {units.length}单元 · {totalWordCount}词
                      {textbooksInGrade.length <= 2 && textbooksInGrade.map(tb => (
                        <span key={tb} className="ml-1 text-gray-400">· {tb}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); importGrade(grade) }}
                      className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg font-medium"
                    >全导入</button>
                    <div onClick={(e) => e.stopPropagation()} className="w-8 h-8 flex items-center justify-center">
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
                    {(() => {
                      const byTb: Record<string, PresetUnit[]> = {}
                      units.forEach(u => {
                        if (!byTb[u.textbook]) byTb[u.textbook] = []
                        byTb[u.textbook].push(u)
                      })
                      return Object.entries(byTb).map(([tb, tbUnits]) => (
                        <div key={tb}>
                          {textbooksInGrade.length > 1 && (
                            <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100">{tb}</div>
                          )}
                          {tbUnits.map(unit => (
                            <label key={unit.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(unit.id)}
                                onChange={() => toggleSelect(unit)}
                                className="w-5 h-5 rounded accent-indigo-600 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm truncate">{unit.name}</div>
                                <div className="text-xs text-gray-500">{unit.words.length}词</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      ))
                    })()}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {presets.length === 0 && (
          <div className="text-center py-12 text-gray-400">当前筛选下无单元</div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-20">
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <div className="text-sm text-gray-600 flex-1">
              已选 <span className="font-bold text-indigo-600">{selectedIds.size}</span> 单元 · <span className="font-bold text-indigo-600">{totalWordsSelected}</span> 词
            </div>
            <button
              onClick={importSelected}
              disabled={importing}
              className="py-3 px-6 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              {importing ? '导入中...' : '导入选中'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

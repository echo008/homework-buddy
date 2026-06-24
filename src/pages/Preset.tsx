import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Eye, Download, Check, BookOpen } from 'lucide-react'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { presetApi } from '@/api'
import { toast } from '@/lib/utils'
import { SUBJECTS, SUBJECT_LABELS } from '@shared/constants'
import type { Subject, PresetTextbook, PresetUnit, PresetWord } from '@shared/types'

const gradeLevelOptions = [
  { value: 'primary', label: '小学' },
  { value: 'junior', label: '初中' },
  { value: 'senior', label: '高中' }
]

const subjectOptions = [
  { value: SUBJECTS.ENGLISH, label: SUBJECT_LABELS[SUBJECTS.ENGLISH] },
  { value: SUBJECTS.CHINESE, label: SUBJECT_LABELS[SUBJECTS.CHINESE] }
]

export default function Preset() {
  const navigate = useNavigate()
  const [gradeLevel, setGradeLevel] = useState('primary')
  const [subject, setSubject] = useState<Subject>(SUBJECTS.ENGLISH)
  const [textbooks, setTextbooks] = useState<PresetTextbook[]>([])
  const [textbooksLoading, setTextbooksLoading] = useState(false)
  const [expandedTextbookId, setExpandedTextbookId] = useState<string | null>(null)
  const [units, setUnits] = useState<Record<string, PresetUnit[]>>({})
  const [unitsLoading, setUnitsLoading] = useState(false)
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set())
  const [previewUnit, setPreviewUnit] = useState<PresetUnit | null>(null)
  const [previewWords, setPreviewWords] = useState<PresetWord[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [importing, setImporting] = useState(false)

  const loadTextbooks = async () => {
    setTextbooksLoading(true)
    try {
      const res = await presetApi.textbooks({ gradeLevel, subject })
      if (res.data) {
        setTextbooks(res.data)
        setExpandedTextbookId(null)
        setUnits({})
        setSelectedUnits(new Set())
      }
    } catch {
      toast.error('加载教材失败')
      setTextbooks([])
    } finally {
      setTextbooksLoading(false)
    }
  }

  useEffect(() => {
    loadTextbooks()
  }, [gradeLevel, subject])

  const toggleTextbook = async (textbookId: string) => {
    if (expandedTextbookId === textbookId) {
      setExpandedTextbookId(null)
      return
    }
    setExpandedTextbookId(textbookId)
    if (!units[textbookId]) {
      setUnitsLoading(true)
      try {
        const res = await presetApi.units(textbookId)
        if (res.data) {
          setUnits(prev => ({ ...prev, [textbookId]: res.data! }))
        }
      } catch {
        toast.error('加载单元失败')
      } finally {
        setUnitsLoading(false)
      }
    }
  }

  const toggleUnitSelection = (unitId: string) => {
    setSelectedUnits(prev => {
      const next = new Set(prev)
      if (next.has(unitId)) {
        next.delete(unitId)
      } else {
        next.add(unitId)
      }
      return next
    })
  }

  const openPreview = async (unit: PresetUnit) => {
    setPreviewUnit(unit)
    setPreviewLoading(true)
    setPreviewWords([])
    try {
      const res = await presetApi.previewWords(unit.id, 20)
      if (res.data) {
        setPreviewWords(res.data)
      }
    } catch {
      toast.error('加载预览失败')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleImport = async () => {
    if (selectedUnits.size === 0) {
      toast.warning('请先选择要导入的单元')
      return
    }
    setImporting(true)
    try {
      await presetApi.importUnits(Array.from(selectedUnits))
      toast.success(`成功导入 ${selectedUnits.size} 个单元`)
      setSelectedUnits(new Set())
      navigate('/units')
    } catch {
      toast.error('导入失败')
    } finally {
      setImporting(false)
    }
  }

  const handleSingleImport = async (unitId: string) => {
    setImporting(true)
    try {
      await presetApi.importUnits([unitId])
      toast.success('导入成功')
      navigate('/units')
    } catch {
      toast.error('导入失败')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Layout activeTab="units" showBack title="预置词库">
      <div className="px-4 pt-4 pb-32 space-y-4">
        <div className="card space-y-4">
          <div>
            <label className="label">学段</label>
            <div className="flex gap-2">
              {gradeLevelOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setGradeLevel(opt.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    gradeLevel === opt.value
                      ? 'bg-primary-600 text-white shadow-soft'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">学科</label>
            <div className="flex gap-2">
              {subjectOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSubject(opt.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    subject === opt.value
                      ? 'bg-primary-600 text-white shadow-soft'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {textbooksLoading ? (
          <Loading />
        ) : textbooks.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<BookOpen className="w-16 h-16" />}
              title="暂无教材"
              description="该筛选条件下暂无预置教材"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {textbooks.map(tb => {
              const isExpanded = expandedTextbookId === tb.id
              const tbUnits = units[tb.id] || []
              return (
                <div key={tb.id} className="card overflow-hidden">
                  <button
                    onClick={() => toggleTextbook(tb.id)}
                    className="w-full flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{tb.version} {tb.name}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      {unitsLoading && !tbUnits.length ? (
                        <Loading />
                      ) : tbUnits.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">暂无单元</p>
                      ) : (
                        tbUnits.map(unit => (
                          <div
                            key={unit.id}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                              selectedUnits.has(unit.id) ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedUnits.has(unit.id)}
                              onChange={() => toggleUnitSelection(unit.id)}
                              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{unit.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{unit.wordCount} 个词</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openPreview(unit)}
                                className="btn-ghost btn-sm px-3"
                              >
                                <Eye className="w-4 h-4" />
                                预览
                              </button>
                              <button
                                onClick={() => handleSingleImport(unit.id)}
                                disabled={importing}
                                className="btn-primary btn-sm px-3"
                              >
                                <Download className="w-4 h-4" />
                                导入
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedUnits.size > 0 && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-100 z-40">
          <button
            onClick={handleImport}
            disabled={importing}
            className="btn-primary btn-lg w-full"
          >
            <Check className="w-5 h-5" />
            导入选中 ({selectedUnits.size} 个单元)
          </button>
        </div>
      )}

      <Modal
        open={!!previewUnit}
        onClose={() => setPreviewUnit(null)}
        title={previewUnit ? `预览: ${previewUnit.name}` : ''}
        footer={
          <button onClick={() => setPreviewUnit(null)} className="btn-primary w-full">
            关闭
          </button>
        }
      >
        {previewLoading ? (
          <Loading />
        ) : previewWords.length === 0 ? (
          <p className="text-center text-gray-400 py-8">暂无单词</p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {previewWords.map((word, idx) => (
              <div key={word.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-medium flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {word.word}
                    {word.phonetic && <span className="text-gray-400 text-sm ml-2">/{word.phonetic}/</span>}
                  </p>
                  <p className="text-sm text-gray-500">
                    {word.pinyin && <span className="mr-2">{word.pinyin}</span>}
                    {word.meaning}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Layout>
  )
}

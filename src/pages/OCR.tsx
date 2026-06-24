import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, RefreshCw, X, CheckSquare, Square, Plus, Volume2 } from 'lucide-react'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { ocrApi, unitApi, wordApi } from '@/api'
import { toast } from '@/lib/utils'
import { speak } from '@/lib/speech'
import { SUBJECTS, SUBJECT_LABELS } from '@shared/constants'
import type { Subject, Unit } from '@shared/types'

interface OcrWordItem {
  id: string
  word: string
  meaning: string
  selected: boolean
}

export default function OCR() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [subject, setSubject] = useState<Subject>(SUBJECTS.ENGLISH)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [ocrWords, setOcrWords] = useState<OcrWordItem[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [unitsLoading, setUnitsLoading] = useState(false)
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const [showCreateUnit, setShowCreateUnit] = useState(false)
  const [newUnitName, setNewUnitName] = useState('')
  const [creatingUnit, setCreatingUnit] = useState(false)

  useEffect(() => {
    loadUnits()
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const loadUnits = async () => {
    setUnitsLoading(true)
    try {
      const res = await unitApi.list(subject)
      if (res.data) {
        setUnits(res.data)
        if (res.data.length > 0 && !selectedUnitId) {
          setSelectedUnitId(res.data[0].id)
        }
      }
    } catch {
      toast.error('加载单元列表失败')
    } finally {
      setUnitsLoading(false)
    }
  }

  useEffect(() => {
    loadUnits()
  }, [subject])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
      setOcrWords([])
      setParseError(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setFile(droppedFile)
      setPreviewUrl(URL.createObjectURL(droppedFile))
      setOcrWords([])
      setParseError(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const resetFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setFile(null)
    setPreviewUrl(null)
    setOcrWords([])
    setParseError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const startParse = async () => {
    if (!file) {
      toast.warning('请先选择图片')
      return
    }
    setParsing(true)
    setParseError(null)
    setOcrWords([])
    try {
      const res = await ocrApi.parseImage(file, subject)
      if (res.data && res.data.words.length > 0) {
        const words: OcrWordItem[] = res.data.words.map((w, idx) => ({
          id: `ocr_${idx}_${Date.now()}`,
          word: w,
          meaning: '',
          selected: true
        }))
        setOcrWords(words)
      } else {
        setParseError('未识别到文字，请尝试更清晰的图片')
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '识别失败'
      setParseError(message)
    } finally {
      setParsing(false)
    }
  }

  const toggleWordSelection = (id: string) => {
    setOcrWords(prev => prev.map(w => w.id === id ? { ...w, selected: !w.selected } : w))
  }

  const toggleSelectAll = () => {
    const allSelected = ocrWords.every(w => w.selected)
    setOcrWords(prev => prev.map(w => ({ ...w, selected: !allSelected })))
  }

  const updateWordField = (id: string, field: 'word' | 'meaning', value: string) => {
    setOcrWords(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w))
  }

  const speakWord = (word: string) => {
    const lang = subject === SUBJECTS.ENGLISH ? 'en-US' : 'zh-CN'
    speak(word, lang)
  }

  const handleCreateUnit = async () => {
    if (!newUnitName.trim()) {
      toast.warning('请输入单元名称')
      return
    }
    setCreatingUnit(true)
    try {
      const res = await unitApi.create({ name: newUnitName.trim(), subject })
      if (res.data) {
        toast.success('单元创建成功')
        setUnits(prev => [res.data!, ...prev])
        setSelectedUnitId(res.data.id)
        setShowCreateUnit(false)
        setNewUnitName('')
      }
    } catch {
      toast.error('创建单元失败')
    } finally {
      setCreatingUnit(false)
    }
  }

  const handleImport = async () => {
    const selectedWords = ocrWords.filter(w => w.selected && w.word.trim())
    if (selectedWords.length === 0) {
      toast.warning('请选择要导入的单词')
      return
    }
    if (!selectedUnitId) {
      toast.warning('请选择目标单元')
      return
    }
    setImporting(true)
    try {
      const wordsToImport = selectedWords.map(w => ({
        word: w.word.trim(),
        meaning: w.meaning.trim()
      }))
      await wordApi.batchImport(wordsToImport, selectedUnitId)
      toast.success(`成功导入 ${selectedWords.length} 个单词`)
      navigate('/units')
    } catch {
      toast.error('导入失败')
    } finally {
      setImporting(false)
    }
  }

  const allSelected = ocrWords.length > 0 && ocrWords.every(w => w.selected)
  const selectedCount = ocrWords.filter(w => w.selected).length

  return (
    <Layout activeTab="home" showBack title="拍照识字">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="card">
          <label className="label">学科</label>
          <div className="flex gap-2">
            <button
              onClick={() => setSubject(SUBJECTS.ENGLISH)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                subject === SUBJECTS.ENGLISH
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {SUBJECT_LABELS[SUBJECTS.ENGLISH]}
            </button>
            <button
              onClick={() => setSubject(SUBJECTS.CHINESE)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                subject === SUBJECTS.CHINESE
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {SUBJECT_LABELS[SUBJECTS.CHINESE]}
            </button>
          </div>
        </div>

        <div className="card">
          <label className="label">上传图片</label>
          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-gray-600 font-medium">点击上传或拖拽图片到此处</p>
                <p className="text-sm text-gray-400 mt-1">支持 JPG、PNG 格式</p>
              </div>
              <Upload className="w-5 h-5 text-primary-500" />
            </div>
          ) : (
            <div className="relative">
              <img
                src={previewUrl}
                alt="预览"
                className="w-full rounded-xl max-h-64 object-contain bg-gray-50"
              />
              <button
                onClick={resetFile}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {file && !parsing && ocrWords.length === 0 && !parseError && (
          <button
            onClick={startParse}
            className="btn-primary btn-lg w-full"
          >
            <Camera className="w-5 h-5" />
            开始识别
          </button>
        )}

        {parsing && (
          <div className="card">
            <Loading />
          </div>
        )}

        {parseError && (
          <div className="card">
            <div className="text-center py-4">
              <p className="text-danger-600 mb-4">{parseError}</p>
              <button
                onClick={startParse}
                className="btn-primary"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
            </div>
          </div>
        )}

        {ocrWords.length > 0 && (
          <>
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">识别结果 ({ocrWords.length} 个)</h3>
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1 text-sm text-primary-600 font-medium"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {allSelected ? '取消全选' : '全选'}
                </button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {ocrWords.map((w, idx) => (
                  <div
                    key={w.id}
                    className={`p-3 rounded-xl border transition-all ${
                      w.selected ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleWordSelection(w.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        {w.selected ? (
                          <CheckSquare className="w-5 h-5 text-primary-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-5">{idx + 1}.</span>
                          <input
                            type="text"
                            value={w.word}
                            onChange={e => updateWordField(w.id, 'word', e.target.value)}
                            className="flex-1 input input-sm bg-white"
                            placeholder={subject === SUBJECTS.ENGLISH ? '单词' : '汉字'}
                          />
                          <button
                            onClick={() => speakWord(w.word)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={w.meaning}
                          onChange={e => updateWordField(w.id, 'meaning', e.target.value)}
                          className="w-full input input-sm bg-white"
                          placeholder={subject === SUBJECTS.ENGLISH ? '释义（可选）' : '拼音/释义（可选）'}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card space-y-4">
              <h3 className="font-semibold text-gray-800">导入到词库</h3>
              <div>
                <label className="label">目标单元</label>
                {unitsLoading ? (
                  <div className="h-12 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                  </div>
                ) : units.length === 0 ? (
                  <EmptyState
                    title="暂无单元"
                    description="请先创建一个单元"
                    action={
                      <button
                        onClick={() => setShowCreateUnit(true)}
                        className="btn-primary btn-sm"
                      >
                        <Plus className="w-4 h-4" />
                        创建单元
                      </button>
                    }
                  />
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={selectedUnitId}
                      onChange={e => setSelectedUnitId(e.target.value)}
                      className="input flex-1"
                    >
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.wordCount}词)</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowCreateUnit(true)}
                      className="btn-secondary px-3"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleImport}
                disabled={importing || selectedCount === 0 || !selectedUnitId}
                className="btn-primary btn-lg w-full"
              >
                <CheckSquare className="w-5 h-5" />
                导入到词库 ({selectedCount} 个词)
              </button>
            </div>
          </>
        )}
      </div>

      <Modal
        open={showCreateUnit}
        onClose={() => {
          setShowCreateUnit(false)
          setNewUnitName('')
        }}
        title="创建新单元"
        onConfirm={handleCreateUnit}
      >
        <div>
          <label className="label">单元名称</label>
          <input
            type="text"
            value={newUnitName}
            onChange={e => setNewUnitName(e.target.value)}
            className="input"
            placeholder="请输入单元名称"
            autoFocus
          />
        </div>
        {creatingUnit && (
          <div className="mt-3 text-center text-sm text-gray-500">创建中...</div>
        )}
      </Modal>
    </Layout>
  )
}

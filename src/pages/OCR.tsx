import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage } from '@/lib/storage'
import { toast } from '@/lib/utils'
import Tesseract from 'tesseract.js'

type Subject = 'english' | 'chinese'

interface RecognizedWord {
  word: string
  selected: boolean
}

const SUBJECT_LABELS = { english: '英语', chinese: '语文' }

export default function OCR() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState<Subject>('english')
  const [unitName, setUnitName] = useState('')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [recognizing, setRecognizing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [recognized, setRecognized] = useState<RecognizedWord[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setImagePreview(dataUrl)
      await recognizeImage(dataUrl)
    }
    reader.readAsDataURL(file)
  }, [subject])

  async function recognizeImage(dataUrl: string) {
    setRecognizing(true)
    setProgress(0)
    setProgressText('正在加载识别引擎...')
    setRecognized([])

    try {
      const lang = subject === 'english' ? 'eng' : 'chi_sim+eng'
      const result = await Tesseract.recognize(dataUrl, lang, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round((m.progress || 0) * 100))
            setProgressText(`正在识别文字... ${Math.round((m.progress || 0) * 100)}%`)
          } else {
            setProgressText(m.status || '识别中...')
          }
        }
      })
      const text = result.data.text || ''
      const words = parseRecognizedText(text, subject)
      setRecognized(words.map(w => ({ word: w, selected: true })))
      if (words.length === 0) {
        toast.error('未识别出有效文字，请确保图片清晰且文字方向正确')
      } else {
        toast.success(`识别完成，共 ${words.length} 个${subject === 'english' ? '单词' : '词语'}`)
      }
    } catch (err: any) {
      toast.error('识别失败：' + (err?.message || '未知错误'))
    } finally {
      setRecognizing(false)
      setProgressText('')
    }
  }

  function parseRecognizedText(text: string, sub: Subject): string[] {
    const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean)
    const words: string[] = []
    const seen = new Set<string>()

    if (sub === 'english') {
      for (const line of lines) {
        const tokens = line.split(/[^a-zA-Z'-]+/).filter(t => /^[a-zA-Z][a-zA-Z'-]{1,}$/.test(t))
        for (const t of tokens) {
          const w = t.toLowerCase()
          if (!seen.has(w)) {
            seen.add(w)
            words.push(t)
          }
        }
      }
    } else {
      for (const line of lines) {
        const tokens = line.split(/[\s,。，、；;:!?？！""''（）()【】\[\]《》<>…—\-]+/).filter(Boolean)
        for (const t of tokens) {
          const cleaned = t.replace(/[0-9a-zA-Z\p{P}]/gu, '').trim()
          if (cleaned.length >= 1 && cleaned.length <= 8 && /[\u4e00-\u9fa5]/.test(cleaned)) {
            if (!seen.has(cleaned)) {
              seen.add(cleaned)
              words.push(cleaned)
            }
          }
        }
      }
    }
    return words
  }

  function toggleSelect(idx: number) {
    setRecognized(prev => prev.map((w, i) => i === idx ? { ...w, selected: !w.selected } : w))
  }

  function selectAll() {
    setRecognized(prev => prev.map(w => ({ ...w, selected: true })))
  }

  function deselectAll() {
    setRecognized(prev => prev.map(w => ({ ...w, selected: false })))
  }

  function removeWord(idx: number) {
    setRecognized(prev => prev.filter((_, i) => i !== idx))
  }

  function editWord(idx: number, value: string) {
    setRecognized(prev => prev.map((w, i) => i === idx ? { ...w, word: value } : w))
  }

  function importToLibrary() {
    const selected = recognized.filter(w => w.selected && w.word.trim())
    if (selected.length === 0) {
      toast.error('请至少选择一个词')
      return
    }
    const name = unitName.trim() || `OCR识别 - ${new Date().toLocaleDateString('zh-CN')}`
    const existing = storage.getUnits().find(u => u.name === name)
    let unitId: string
    if (existing) {
      if (!confirm(`单元"${name}"已存在，是否追加导入到该单元？`)) return
      unitId = existing.id
    } else {
      const unit = storage.createUnit({ name, subject, description: '来自拍照/图片识别' })
      unitId = unit.id
    }
    const wordsToAdd = selected.map(w => ({
      unitId,
      word: w.word.trim(),
      meaning: '',
      phonetic: ''
    }))
    storage.addWordsBatch(wordsToAdd)
    toast.success(`已导入 ${selected.length} 个${subject === 'english' ? '单词' : '词语'}到"${name}"！`)
    navigate(`/units/${unitId}/words`)
  }

  const selectedCount = recognized.filter(w => w.selected).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white pb-8">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-xl">←</button>
        <h1 className="text-xl font-bold text-gray-900">拍照识字</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-amber-800 text-sm">📸 拍摄课本、练习册上的单词表/词语表，自动识别并导入词库</p>
        </div>

        <div>
          <label className="text-base font-semibold text-gray-800 mb-2 block">识别学科</label>
          <div className="grid grid-cols-2 gap-3">
            {(['english', 'chinese'] as Subject[]).map(s => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`py-3 rounded-xl font-medium transition-all ${subject === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-700'}`}
              >{SUBJECT_LABELS[s]}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-base font-semibold text-gray-800 mb-2 block">导入单元名称</label>
          <input
            type="text"
            value={unitName}
            onChange={e => setUnitName(e.target.value)}
            placeholder={`自动命名：OCR识别 - 日期`}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {!imagePreview && !recognizing && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => cameraRef.current?.click()}
              className="py-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl font-medium text-lg shadow-lg shadow-indigo-200 active:scale-95 transition-transform flex flex-col items-center gap-2"
            >
              <span className="text-3xl">📷</span>
              <span>拍照识别</span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="py-6 bg-white border-2 border-dashed border-gray-300 text-gray-700 rounded-2xl font-medium text-lg active:scale-95 transition-transform flex flex-col items-center gap-2"
            >
              <span className="text-3xl">🖼</span>
              <span>选择图片</span>
            </button>
          </div>
        )}

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ''
          }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ''
          }}
        />

        {imagePreview && (
          <div className="bg-white rounded-2xl p-3 border border-gray-200">
            <img src={imagePreview} alt="预览" className="w-full rounded-xl max-h-80 object-contain bg-gray-50" />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setImagePreview(''); setRecognized([]) }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
              >重新选择</button>
            </div>
          </div>
        )}

        {recognizing && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-2">{progressText || '识别中...'}</p>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {recognized.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800">识别结果（{selectedCount}/{recognized.length}已选）</h3>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-sm text-indigo-600 px-3 py-1">全选</button>
                <button onClick={deselectAll} className="text-sm text-gray-500 px-3 py-1">全不选</button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-2">点击词语可编辑，点复选框可取消选择</p>
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {recognized.map((w, idx) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={w.selected}
                    onChange={() => toggleSelect(idx)}
                    className="w-5 h-5 rounded accent-indigo-600 flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={w.word}
                    onChange={e => editWord(idx, e.target.value)}
                    className="flex-1 px-2 py-1 border-b border-gray-100 focus:border-indigo-400 focus:outline-none"
                  />
                  <button
                    onClick={() => removeWord(idx)}
                    className="text-red-400 hover:text-red-600 text-lg px-1"
                  >✕</button>
                </div>
              ))}
            </div>

            <button
              onClick={importToLibrary}
              disabled={selectedCount === 0}
              className="w-full py-4 mt-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              导入 {selectedCount} 个词到词库
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

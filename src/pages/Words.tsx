import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Upload, Pencil, Trash2, Volume2, Loader2 } from 'lucide-react'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { unitApi, wordApi } from '@/api'
import { toast } from '@/lib/utils'
import { speak } from '@/lib/speech'
import { SUBJECTS, SUBJECT_LABELS } from '@shared/constants'
import type { Unit, Word } from '@shared/types'

export default function Words() {
  const { unitId } = useParams<{ unitId: string }>()
  const navigate = useNavigate()
  const [unit, setUnit] = useState<Unit | null>(null)
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [batchText, setBatchText] = useState('')
  const [formData, setFormData] = useState({
    word: '',
    meaning: '',
    phonetic: '',
    pinyin: '',
    lesson: 1
  })
  const [submitting, setSubmitting] = useState(false)
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const wordInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (unitId) {
      loadData()
    }
  }, [unitId])

  useEffect(() => {
    if (showAddModal) {
      resetForm()
      setTimeout(() => wordInputRef.current?.focus(), 300)
    }
  }, [showAddModal])

  useEffect(() => {
    if (editingWord) {
      setFormData({
        word: editingWord.word,
        meaning: editingWord.meaning,
        phonetic: editingWord.phonetic || '',
        pinyin: editingWord.pinyin || '',
        lesson: editingWord.lesson || 1
      })
      setTimeout(() => wordInputRef.current?.focus(), 300)
    }
  }, [editingWord])

  function resetForm() {
    setFormData({
      word: '',
      meaning: '',
      phonetic: '',
      pinyin: '',
      lesson: 1
    })
  }

  async function loadData() {
    setLoading(true)
    try {
      const [unitRes, wordsRes] = await Promise.all([
        unitApi.list(),
        wordApi.listByUnit(unitId!)
      ])
      if (unitRes.data) {
        const foundUnit = unitRes.data.find(u => u.id === unitId)
        setUnit(foundUnit || null)
      }
      if (wordsRes.data) {
        setWords(wordsRes.data)
      }
    } catch {
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadWords() {
    try {
      const res = await wordApi.listByUnit(unitId!)
      if (res.data) {
        setWords(res.data)
      }
    } catch {
      toast.error('加载单词列表失败')
    }
  }

  function closeModals() {
    setShowAddModal(false)
    setEditingWord(null)
    setShowBatchModal(false)
    setBatchText('')
  }

  async function handleSubmit() {
    if (!formData.word.trim()) {
      toast.warning(unit?.subject === SUBJECTS.ENGLISH ? '请输入单词' : '请输入汉字')
      return
    }
    if (!formData.meaning.trim()) {
      toast.warning('请输入释义')
      return
    }
    setSubmitting(true)
    try {
      const data: Partial<Word> = {
        unitId: unitId!,
        word: formData.word.trim(),
        meaning: formData.meaning.trim(),
        lesson: formData.lesson
      }
      if (unit?.subject === SUBJECTS.ENGLISH) {
        data.phonetic = formData.phonetic.trim()
      } else {
        data.pinyin = formData.pinyin.trim()
      }
      if (editingWord) {
        await wordApi.update(editingWord.id, data)
        toast.success('更新成功')
      } else {
        await wordApi.create(data)
        toast.success('添加成功')
      }
      closeModals()
      loadWords()
      loadData()
    } catch {
      toast.error(editingWord ? '更新失败' : '添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBatchImport() {
    const lines = batchText.split('\n').map(l => l.trim()).filter(l => l)
    if (lines.length === 0) {
      toast.warning('请输入要导入的单词')
      return
    }
    const parsedWords: Partial<Word>[] = []
    for (const line of lines) {
      const parts = line.split(/[\s\t]+/)
      if (parts.length >= 2) {
        const word = parts[0]
        const meaning = parts.slice(1).join(' ')
        parsedWords.push({
          word,
          meaning,
          unitId: unitId!,
          lesson: 1
        })
      }
    }
    if (parsedWords.length === 0) {
      toast.warning('没有解析到有效单词，请检查格式')
      return
    }
    setBatchSubmitting(true)
    try {
      const res = await wordApi.batchImport(parsedWords, unitId!)
      toast.success(`成功导入 ${res.data?.count || parsedWords.length} 个单词`)
      closeModals()
      loadWords()
      loadData()
    } catch {
      toast.error('批量导入失败')
    } finally {
      setBatchSubmitting(false)
    }
  }

  async function handleDelete(word: Word) {
    if (!window.confirm(`确定要删除「${word.word}」吗？`)) {
      return
    }
    try {
      await wordApi.remove(word.id)
      toast.success('删除成功')
      loadWords()
      loadData()
    } catch {
      toast.error('删除失败')
    }
  }

  function handleSpeak(word: Word) {
    if (unit?.subject === SUBJECTS.ENGLISH) {
      speak(word.word, 'en-US')
    } else {
      speak(word.word, 'zh-CN')
    }
  }

  const subject = unit?.subject || SUBJECTS.ENGLISH
  const isEnglish = subject === SUBJECTS.ENGLISH

  if (loading) {
    return (
      <Layout activeTab="units" title="加载中..." showBack>
        <Loading fullScreen />
      </Layout>
    )
  }

  if (!unit) {
    return (
      <Layout activeTab="units" title="单词列表" showBack>
        <EmptyState
          title="单元不存在"
          description="该单元可能已被删除"
          action={
            <button
              onClick={() => navigate('/units')}
              className="btn-primary btn-sm"
            >
              返回词库
            </button>
          }
        />
      </Layout>
    )
  }

  return (
    <Layout activeTab="units" title={unit.name} showBack>
      <div className="px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="badge bg-primary-50 text-primary-600">
              {SUBJECT_LABELS[subject]}
            </span>
            <span className="text-sm text-gray-500">{words.length} 个单词</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBatchModal(true)}
              className="btn-secondary btn-sm"
            >
              <Upload className="w-4 h-4" />
              批量导入
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary btn-sm"
            >
              <Plus className="w-4 h-4" />
              添加单词
            </button>
          </div>
        </div>

        {words.length === 0 ? (
          <EmptyState
            title="该单元暂无单词"
            description="点击右上角按钮添加你的第一个单词"
            action={
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary btn-sm"
              >
                <Plus className="w-4 h-4" />
                添加单词
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {words.map(word => (
              <div key={word.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-800">{word.word}</h3>
                      {word.lesson > 0 && (
                        <span className="badge bg-gray-100 text-gray-600">
                          第{word.lesson}课
                        </span>
                      )}
                    </div>
                    {(isEnglish ? word.phonetic : word.pinyin) && (
                      <p className="text-sm text-gray-400 mb-1">
                        {isEnglish ? `/${word.phonetic}/` : word.pinyin}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">{word.meaning}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleSpeak(word)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Volume2 className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setEditingWord(word)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Pencil className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(word)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showAddModal || !!editingWord}
        onClose={closeModals}
        title={editingWord ? '编辑单词' : isEnglish ? '添加英语单词' : '添加语文词语'}
        footer={
          <>
            <button
              onClick={closeModals}
              disabled={submitting}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {editingWord ? '更新中...' : '添加中...'}
                </>
              ) : (
                '确定'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">{isEnglish ? '单词' : '汉字'} <span className="text-danger-500">*</span></label>
            <input
              ref={wordInputRef}
              type="text"
              value={formData.word}
              onChange={e => setFormData(prev => ({ ...prev, word: e.target.value }))}
              placeholder={isEnglish ? '例如：apple' : '例如：春天'}
              className="input"
            />
          </div>
          <div>
            <label className="label">释义 <span className="text-danger-500">*</span></label>
            <input
              type="text"
              value={formData.meaning}
              onChange={e => setFormData(prev => ({ ...prev, meaning: e.target.value }))}
              placeholder="例如：苹果"
              className="input"
            />
          </div>
          <div>
            <label className="label">{isEnglish ? '音标' : '拼音'}</label>
            <input
              type="text"
              value={isEnglish ? formData.phonetic : formData.pinyin}
              onChange={e => {
                if (isEnglish) {
                  setFormData(prev => ({ ...prev, phonetic: e.target.value }))
                } else {
                  setFormData(prev => ({ ...prev, pinyin: e.target.value }))
                }
              }}
              placeholder={isEnglish ? '例如：/ˈæpl/' : '例如：chūn tiān'}
              className="input"
            />
          </div>
          <div>
            <label className="label">课次</label>
            <input
              type="number"
              min={1}
              value={formData.lesson}
              onChange={e => setFormData(prev => ({ ...prev, lesson: parseInt(e.target.value) || 1 }))}
              placeholder="1"
              className="input"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={showBatchModal}
        onClose={closeModals}
        title="批量导入"
        footer={
          <>
            <button
              onClick={closeModals}
              disabled={batchSubmitting}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              onClick={handleBatchImport}
              disabled={batchSubmitting}
              className="btn-primary flex-1"
            >
              {batchSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  导入中...
                </>
              ) : (
                '开始导入'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            每行一个单词，格式：{isEnglish ? '单词 释义' : '汉字 释义'}，用空格分隔
          </p>
          <textarea
            value={batchText}
            onChange={e => setBatchText(e.target.value)}
            placeholder={isEnglish ? 'apple 苹果\nbanana 香蕉\ncat 猫' : '春天 春季\n夏天 夏季\n秋天 秋季'}
            rows={10}
            className="input font-mono text-sm resize-none"
          />
        </div>
      </Modal>
    </Layout>
  )
}

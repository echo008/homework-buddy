import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Volume2, Check, X, ChevronLeft, ChevronRight, Play, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/utils'
import Layout from '@/components/Layout'
import { useDictationStore } from '@/store/dictationStore'
import { unitApi } from '@/api'
import { speak, stopSpeak } from '@/lib/speech'
import { SUBJECTS, MODES, SUBJECT_LABELS, MODE_LABELS, PROMPT_TYPES } from '@shared/constants'
import type { Subject, DictationMode, Unit, DictationConfig, AnswerItem } from '@shared/types'

interface DictationResult {
  totalWords: number
  correctCount: number
  wrongCount: number
  accuracy: number
  duration: number
  wrongWords: AnswerItem[]
}

const ENGLISH_MODES: DictationMode[] = [MODES.EN2CN, MODES.CN2EN]
const CHINESE_MODES: DictationMode[] = [MODES.PINYIN2HANZI, MODES.HANZI2PINYIN]

export default function Dictation() {
  const navigate = useNavigate()
  const {
    questions,
    currentIndex,
    answers,
    isPlaying,
    start,
    setAnswer,
    markWrong,
    next,
    prev,
    setPlaying,
    finish
  } = useDictationStore()

  const [isConfiguring, setIsConfiguring] = useState(true)
  const [subject, setSubject] = useState<Subject>(SUBJECTS.ENGLISH)
  const [mode, setMode] = useState<DictationMode>(MODES.EN2CN)
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
  const [wordCountMin, setWordCountMin] = useState(1)
  const [wordCountMax, setWordCountMax] = useState(10)
  const [lessonMin, setLessonMin] = useState<string>('')
  const [lessonMax, setLessonMax] = useState<string>('')
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const totalWords = units
    .filter(u => selectedUnitIds.includes(u.id))
    .reduce((sum, u) => sum + u.wordCount, 0)

  const availableModes = subject === SUBJECTS.ENGLISH ? ENGLISH_MODES : CHINESE_MODES

  useEffect(() => {
    if (!availableModes.includes(mode)) {
      setMode(availableModes[0])
    }
  }, [subject, availableModes, mode])

  useEffect(() => {
    let cancelled = false
    async function loadUnits() {
      setLoadingUnits(true)
      try {
        const res = await unitApi.list(subject)
        if (!cancelled && res.data) {
          setUnits(res.data)
        }
      } catch {
        toast.error('加载单元列表失败')
      } finally {
        if (!cancelled) setLoadingUnits(false)
      }
    }
    loadUnits()
    return () => {
      cancelled = true
    }
  }, [subject])

  useEffect(() => {
    if (wordCountMax > totalWords && totalWords > 0) {
      setWordCountMax(Math.min(10, totalWords))
    }
    if (wordCountMin > totalWords && totalWords > 0) {
      setWordCountMin(1)
    }
  }, [totalWords, wordCountMax, wordCountMin])

  const speakCurrent = useCallback(() => {
    const question = questions[currentIndex]
    if (!question) return

    stopSpeak()
    if (audioElement) {
      audioElement.pause()
      audioElement.currentTime = 0
    }

    setPlaying(true)
    const ttsLang = question.ttsLang || (question.subject === SUBJECTS.ENGLISH ? 'en-US' : 'zh-CN')

    if (question.audioUrl && question.promptType === PROMPT_TYPES.ENGLISH) {
      const audio = new Audio(question.audioUrl)
      audio.onended = () => setPlaying(false)
      audio.onerror = () => {
        setPlaying(false)
        speak(question.prompt, ttsLang)
      }
      setAudioElement(audio)
      audio.play().catch(() => {
        setPlaying(false)
        speak(question.prompt, ttsLang)
      })
    } else {
      speak(question.prompt, ttsLang)
      setTimeout(() => setPlaying(false), 1500)
    }
  }, [questions, currentIndex, setPlaying, audioElement])

  useEffect(() => {
    if (questions.length > 0 && !isConfiguring) {
      setUserInput('')
      setShowAnswer(false)
      const timer = setTimeout(() => {
        speakCurrent()
        inputRef.current?.focus()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, isConfiguring, questions.length, speakCurrent])

  useEffect(() => {
    if (!isConfiguring && !showAnswer) {
      inputRef.current?.focus()
    }
  }, [isConfiguring, showAnswer])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isConfiguring) return
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        speakCurrent()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isConfiguring, speakCurrent])

  function toggleUnit(unitId: string) {
    setSelectedUnitIds(prev =>
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    )
  }

  async function handleStart() {
    if (selectedUnitIds.length === 0) {
      toast.warning('请至少选择一个单元')
      return
    }
    if (wordCountMin < 1 || wordCountMax < 1) {
      toast.warning('单词数量不能小于1')
      return
    }
    if (wordCountMin > wordCountMax) {
      toast.warning('最小数量不能大于最大数量')
      return
    }

    const newConfig: DictationConfig = {
      subject,
      mode,
      unitIds: selectedUnitIds,
      wordCountRange: { min: wordCountMin, max: wordCountMax }
    }

    if (lessonMin && lessonMax) {
      const min = parseInt(lessonMin)
      const max = parseInt(lessonMax)
      if (!isNaN(min) && !isNaN(max) && min <= max) {
        newConfig.lessonRange = { min, max }
      }
    }

    setStarting(true)
    try {
      await start(newConfig)
      setIsConfiguring(false)
    } catch {
      toast.error('开始听写失败，请重试')
    } finally {
      setStarting(false)
    }
  }

  function handleSubmitAnswer() {
    const question = questions[currentIndex]
    if (!question) return

    if (userInput.trim()) {
      setAnswer(currentIndex, userInput.trim())
    } else {
      markWrong(currentIndex)
    }

    if (currentIndex === questions.length - 1) {
      handleFinish()
    } else {
      setUserInput('')
      setShowAnswer(false)
      next()
    }
  }

  function handleRevealAnswer() {
    if (!answers.has(currentIndex)) {
      markWrong(currentIndex)
    }
    setShowAnswer(true)
  }

  async function handleFinish() {
    setSubmitting(true)
    try {
      const result = await finish()
      navigate('/dictation/result', {
        state: { result } as { result: DictationResult }
      })
    } catch {
      toast.error('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  function goToQuestion(index: number) {
    if (index >= 0 && index < questions.length) {
      const existingAnswer = answers.get(currentIndex)
      if (!existingAnswer) {
        if (userInput.trim()) {
          setAnswer(currentIndex, userInput.trim())
        }
      }
      setUserInput('')
      setShowAnswer(false)
      useDictationStore.setState({ currentIndex: index })
    }
  }

  const currentQuestion = questions[currentIndex]
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0
  const isLastQuestion = currentIndex === questions.length - 1
  const hasAnswered = answers.has(currentIndex)
  const currentAnswerItem = answers.get(currentIndex)

  if (isConfiguring) {
    return (
      <Layout activeTab="dictation" title="听写">
        <div className="p-4 space-y-5">
          <div className="card">
            <h2 className="text-base font-semibold text-gray-800 mb-3">选择学科</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(SUBJECTS).map(s => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={cn(
                    'py-5 rounded-2xl border-2 font-semibold text-lg transition-all',
                    subject === s
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-soft'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  {SUBJECT_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-base font-semibold text-gray-800 mb-3">听写模式</h2>
            <div className="grid grid-cols-2 gap-3">
              {availableModes.map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'py-4 px-3 rounded-2xl border-2 font-medium text-center transition-all',
                    mode === m
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-soft'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-base font-semibold text-gray-800 mb-3">
              选择单元
              {selectedUnitIds.length > 0 && (
                <span className="ml-2 text-sm font-normal text-primary-600">
                  已选 {selectedUnitIds.length} 个
                </span>
              )}
            </h2>
            {loadingUnits ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : units.length === 0 ? (
              <div className="text-center py-8 text-gray-400">暂无单元，请先添加词库</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                {units.map(unit => (
                  <label
                    key={unit.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                      selectedUnitIds.includes(unit.id)
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUnitIds.includes(unit.id)}
                      onChange={() => toggleUnit(unit.id)}
                      className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{unit.name}</div>
                      <div className="text-sm text-gray-500">{unit.wordCount} 个词</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-base font-semibold text-gray-800 mb-3">单词数量</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="label">最少</label>
                <input
                  type="number"
                  min={1}
                  max={totalWords || 1}
                  value={wordCountMin}
                  onChange={e => setWordCountMin(Math.max(1, parseInt(e.target.value) || 1))}
                  className="input text-center"
                />
              </div>
              <span className="text-gray-400 mt-6">—</span>
              <div className="flex-1">
                <label className="label">最多</label>
                <input
                  type="number"
                  min={1}
                  max={totalWords || 1}
                  value={wordCountMax}
                  onChange={e => setWordCountMax(Math.min(totalWords || 1, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="input text-center"
                />
              </div>
            </div>
            {totalWords > 0 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                所选单元共 {totalWords} 个词
              </p>
            )}
          </div>

          <div className="card">
            <h2 className="text-base font-semibold text-gray-800 mb-3">课次范围（可选）</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="label">起始课次</label>
                <input
                  type="number"
                  min={1}
                  placeholder="不限"
                  value={lessonMin}
                  onChange={e => setLessonMin(e.target.value)}
                  className="input text-center"
                />
              </div>
              <span className="text-gray-400 mt-6">—</span>
              <div className="flex-1">
                <label className="label">结束课次</label>
                <input
                  type="number"
                  min={1}
                  placeholder="不限"
                  value={lessonMax}
                  onChange={e => setLessonMax(e.target.value)}
                  className="input text-center"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={starting || loadingUnits}
            className="btn-primary btn-lg w-full mt-4"
          >
            {starting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                准备中...
              </>
            ) : (
              '开始听写'
            )}
          </button>
        </div>
      </Layout>
    )
  }

  if (!currentQuestion) {
    return (
      <Layout activeTab="dictation" title="听写" showBack>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout activeTab="dictation" title="听写" showBack>
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center text-sm font-medium text-gray-600">
            第 {currentIndex + 1} / {questions.length} 题
          </div>
        </div>

        <div className="flex justify-center gap-2 flex-wrap">
          {questions.map((_, idx) => {
            const answered = answers.has(idx)
            const answerItem = answers.get(idx)
            return (
              <button
                key={idx}
                onClick={() => goToQuestion(idx)}
                className={cn(
                  'w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-all',
                  idx === currentIndex
                    ? 'bg-primary-500 text-white shadow-md scale-110'
                    : answered
                    ? answerItem?.isCorrect
                      ? 'bg-success-500 text-white'
                      : 'bg-danger-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                )}
              >
                {answered ? (
                  answerItem?.isCorrect ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )
                ) : (
                  idx + 1
                )}
              </button>
            )
          })}
        </div>

        <div className="rounded-3xl shadow-card bg-white p-8 text-center space-y-6">
          <div
            className={cn(
              'text-5xl font-bold text-gray-800 leading-tight',
              currentQuestion.promptType === PROMPT_TYPES.ENGLISH ? 'tracking-wide' : ''
            )}
          >
            {currentQuestion.prompt}
          </div>

          <button
            onClick={speakCurrent}
            className={cn(
              'mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-all',
              isPlaying
                ? 'bg-primary-100 text-primary-600 animate-pulse'
                : 'bg-primary-500 text-white hover:bg-primary-600 active:scale-95 shadow-lg'
            )}
          >
            {currentQuestion.audioUrl && currentQuestion.subject === SUBJECTS.ENGLISH ? (
              <Play className="w-7 h-7 ml-1" fill="currentColor" />
            ) : (
              <Volume2 className="w-7 h-7" />
            )}
          </button>
        </div>

        {showAnswer || (hasAnswered && currentAnswerItem) ? (
          <div className="card text-center space-y-3">
            <div className="text-sm text-gray-500">正确答案</div>
            <div className="text-2xl font-bold text-success-600">
              {currentQuestion.answer}
            </div>
            {hasAnswered && currentAnswerItem && !currentAnswerItem.isCorrect && currentAnswerItem.userAnswer && (
              <div className="text-lg text-danger-500 line-through">
                你的答案：{currentAnswerItem.userAnswer}
              </div>
            )}
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSubmitAnswer()
              }
            }}
            placeholder="输入答案后按回车"
            className="input text-center text-xl py-4"
            autoFocus
          />
        )}

        {!showAnswer && !hasAnswered && (
          <button
            onClick={handleRevealAnswer}
            className="btn-ghost w-full"
          >
            不会，看答案
          </button>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              if (userInput.trim()) {
                setAnswer(currentIndex, userInput.trim())
              } else if (!answers.has(currentIndex)) {
                markWrong(currentIndex)
              }
              setUserInput('')
              setShowAnswer(false)
              prev()
            }}
            disabled={currentIndex === 0}
            className="btn-secondary flex-1 py-3 gap-1"
          >
            <ChevronLeft className="w-5 h-5" />
            上一题
          </button>
          <button
            onClick={speakCurrent}
            className="btn-secondary px-5 py-3"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleSubmitAnswer}
            disabled={submitting}
            className={cn(
              'flex-1 py-3 gap-1',
              isLastQuestion ? 'btn-success' : 'btn-primary'
            )}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLastQuestion ? (
              '提交'
            ) : (
              <>
                下一题
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pt-2">
          提示：按空格键重播，按回车键提交答案
        </p>
      </div>
    </Layout>
  )
}

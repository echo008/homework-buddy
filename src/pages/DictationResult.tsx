import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Trophy, Volume2, RotateCcw, Home, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Layout from '@/components/Layout'
import { useDictationStore } from '@/store/dictationStore'
import { speak } from '@/lib/speech'
import { SUBJECTS } from '@shared/constants'
import type { Question, AnswerItem } from '@shared/types'

interface DictationResult {
  totalWords: number
  correctCount: number
  wrongCount: number
  accuracy: number
  duration: number
  wrongWords: AnswerItem[]
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) {
    return `${secs}秒`
  }
  return `${mins}分${secs}秒`
}

function getResultTheme(accuracy: number) {
  if (accuracy >= 90) {
    return {
      title: '太棒了！',
      bgGradient: 'from-green-400 to-emerald-600',
      bgLight: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    }
  }
  if (accuracy >= 70) {
    return {
      title: '不错哦！',
      bgGradient: 'from-blue-400 to-indigo-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    }
  }
  if (accuracy >= 60) {
    return {
      title: '继续加油！',
      bgGradient: 'from-yellow-400 to-amber-500',
      bgLight: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    }
  }
  return {
    title: '再练习一下吧',
    bgGradient: 'from-orange-400 to-orange-600',
    bgLight: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600'
  }
}

export default function DictationResult() {
  const navigate = useNavigate()
  const location = useLocation()
  const { reset, start } = useDictationStore()
  const [practicingWrong, setPracticingWrong] = useState(false)

  const result = (location.state as { result?: DictationResult })?.result

  if (!result) {
    return (
      <Layout activeTab="dictation" title="听写结果" showBack>
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500">暂无结果数据</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-6">
            返回首页
          </button>
        </div>
      </Layout>
    )
  }

  const theme = getResultTheme(result.accuracy)

  function playAnswer(item: AnswerItem) {
    const lang = item.subject === SUBJECTS.ENGLISH ? 'en-US' : 'zh-CN'
    speak(item.correctAnswer, lang)
  }

  function handleRetry() {
    reset()
    navigate(-1)
  }

  async function handlePracticeWrong() {
    if (result.wrongWords.length === 0) return

    setPracticingWrong(true)

    const questions: Question[] = result.wrongWords.map((w, idx) => ({
      index: idx,
      wordId: w.wordId,
      unitId: w.unitId,
      word: w.word,
      meaning: w.meaning,
      pinyin: w.pinyin,
      subject: w.subject,
      mode: w.mode,
      prompt: w.prompt,
      promptType: w.promptType,
      answer: w.correctAnswer,
      answerType: w.answerType,
      audioUrl: w.audioUrl
    }))

    useDictationStore.setState({
      questions,
      unitNames: ['错题练习'],
      currentIndex: 0,
      answers: new Map(),
      startTime: Date.now(),
      isPlaying: false
    })

    navigate('/dictation')
    setPracticingWrong(false)
  }

  function handleGoHome() {
    reset()
    navigate('/')
  }

  return (
    <Layout activeTab="dictation" title="听写结果" showBack>
      <div className="p-4 space-y-5">
        <div className={cn(
          'rounded-3xl p-6 text-center text-white bg-gradient-to-br shadow-card',
          theme.bgGradient
        )}>
          <div className={cn('w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-white/20')}>
            <Trophy className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{theme.title}</h1>
          <div className="text-6xl font-bold mb-4">{result.accuracy}%</div>
          <div className="flex justify-center gap-6 text-white/90">
            <div className="text-center">
              <div className="text-2xl font-semibold">{result.correctCount}</div>
              <div className="text-sm opacity-80">正确</div>
            </div>
            <div className="w-px bg-white/30" />
            <div className="text-center">
              <div className="text-2xl font-semibold">{result.totalWords}</div>
              <div className="text-sm opacity-80">总题数</div>
            </div>
            <div className="w-px bg-white/30" />
            <div className="text-center">
              <div className="text-2xl font-semibold">{result.wrongCount}</div>
              <div className="text-sm opacity-80">错误</div>
            </div>
            <div className="w-px bg-white/30" />
            <div className="text-center">
              <div className="text-2xl font-semibold">{formatDuration(result.duration)}</div>
              <div className="text-sm opacity-80">用时</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {result.wrongWords.length === 0 ? '全对啦！🎉' : '错题回顾'}
          </h2>

          {result.wrongWords.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              太棒了，没有错题！
            </div>
          ) : (
            <div className="space-y-3">
              {result.wrongWords.map((item, idx) => (
                <div
                  key={`${item.wordId}-${idx}`}
                  className={cn(
                    'p-4 rounded-2xl border',
                    theme.bgLight,
                    theme.borderColor
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">第{idx + 1}题</span>
                        <span className="text-lg font-semibold text-gray-800">{item.prompt}</span>
                      </div>
                      {item.userAnswer && (
                        <div className="text-danger-500 line-through text-base">
                          你的答案：{item.userAnswer}
                        </div>
                      )}
                      <div className="text-success-600 text-lg font-semibold">
                        正确答案：{item.correctAnswer}
                      </div>
                    </div>
                    <button
                      onClick={() => playAnswer(item)}
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95',
                        theme.iconBg,
                        theme.iconColor
                      )}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={handleRetry}
            className="btn-primary btn-lg w-full gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            再来一次
          </button>

          {result.wrongWords.length > 0 && (
            <button
              onClick={handlePracticeWrong}
              disabled={practicingWrong}
              className="btn-secondary btn-lg w-full gap-2"
            >
              {practicingWrong ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              只练错题（{result.wrongWords.length}题）
            </button>
          )}

          <button
            onClick={handleGoHome}
            className="btn-ghost btn-lg w-full gap-2"
          >
            <Home className="w-5 h-5" />
            返回首页
          </button>
        </div>
      </div>
    </Layout>
  )
}

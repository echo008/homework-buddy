import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Volume2, ClipboardList, Play, XCircle } from 'lucide-react'
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import { logApi } from '@/api'
import { useDictationStore } from '@/store/dictationStore'
import { toast } from '@/lib/utils'
import { speak } from '@/lib/speech'
import { SUBJECTS, SUBJECT_LABELS, MODE_LABELS, MODES } from '@shared/constants'
import type { Word, Question, Subject } from '@shared/types'

export default function WrongWords() {
  const navigate = useNavigate()
  const [wrongWords, setWrongWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [startingDictation, setStartingDictation] = useState(false)

  useEffect(() => {
    loadWrongWords()
  }, [])

  const loadWrongWords = async () => {
    setLoading(true)
    try {
      const res = await logApi.getWrongWords()
      if (res.data) {
        setWrongWords(res.data)
      }
    } catch {
      toast.error('加载错题失败')
      setWrongWords([])
    } finally {
      setLoading(false)
    }
  }

  const speakWord = (word: Word) => {
    const lang = word.unitId ? (word.word && /[\u4e00-\u9fa5]/.test(word.word) ? 'zh-CN' : 'en-US') : 'en-US'
    speak(word.word, lang)
  }

  const startWrongWordsDictation = async () => {
    if (wrongWords.length === 0) {
      toast.warning('没有错题可以练习')
      return
    }

    setStartingDictation(true)
    try {
      const subject: Subject = wrongWords.some(w => /[\u4e00-\u9fa5]/.test(w.word))
        ? SUBJECTS.CHINESE
        : SUBJECTS.ENGLISH

      const mode = subject === SUBJECTS.ENGLISH ? MODES.EN2CN : MODES.PINYIN2HANZI

      const questions: Question[] = wrongWords.map((w, idx) => {
        const isEnglish = !/[\u4e00-\u9fa5]/.test(w.word)
        if (isEnglish) {
          return {
            index: idx,
            wordId: w.id,
            unitId: w.unitId,
            word: w.word,
            meaning: w.meaning,
            pinyin: w.pinyin,
            subject: SUBJECTS.ENGLISH,
            mode: MODES.EN2CN,
            prompt: w.word,
            promptType: 'english',
            answer: w.meaning,
            answerType: 'chinese',
            audioUrl: w.audioUrl
          }
        } else {
          return {
            index: idx,
            wordId: w.id,
            unitId: w.unitId,
            word: w.word,
            meaning: w.meaning,
            pinyin: w.pinyin,
            subject: SUBJECTS.CHINESE,
            mode: MODES.PINYIN2HANZI,
            prompt: w.pinyin || w.meaning,
            promptType: w.pinyin ? 'pinyin' : 'chinese',
            answer: w.word,
            answerType: 'chinese',
            audioUrl: w.audioUrl
          }
        }
      })

      useDictationStore.setState({
        questions,
        currentIndex: 0,
        answers: new Map(),
        isPlaying: false,
        startTime: Date.now(),
        unitNames: ['错题本']
      })

      navigate('/dictation')
    } catch {
      toast.error('开始听写失败')
      setStartingDictation(false)
    }
  }

  return (
    <Layout activeTab="profile" showBack title="错题本">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="card bg-gradient-to-r from-danger-50 to-danger-100 border-danger-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-danger-600 font-medium">错题总数</p>
              <p className="text-3xl font-bold text-danger-700 mt-1">{wrongWords.length}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-danger-500 flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : wrongWords.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<ClipboardList className="w-16 h-16" />}
              title="还没有错题，继续保持！"
              description="每次听写后，答错的单词会自动收集到这里"
            />
          </div>
        ) : (
          <>
            <div className="space-y-3 pb-24">
              {wrongWords.map(word => {
                const isEnglish = word.word && !/[\u4e00-\u9fa5]/.test(word.word)
                return (
                  <div key={word.id} className="card">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => speakWord(word)}
                        className="p-2 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors flex-shrink-0"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-800">{word.word}</h3>
                          {isEnglish && word.phonetic && (
                            <span className="text-sm text-gray-400">/{word.phonetic}/</span>
                          )}
                        </div>
                        <p className="text-gray-600">
                          {word.pinyin && <span className="text-gray-400 mr-2">{word.pinyin}</span>}
                          {word.meaning}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="w-5 h-5 text-danger-400" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {wrongWords.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-100 z-40">
          <button
            onClick={startWrongWordsDictation}
            disabled={startingDictation}
            className="btn-primary btn-lg w-full"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            开始错题听写 ({wrongWords.length} 题)
          </button>
        </div>
      )}
    </Layout>
  )
}

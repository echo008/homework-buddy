import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage, type Unit, type Word } from '@/lib/storage'
import { SUBJECTS, MODES, PROMPT_TYPES } from '@shared/constants'
import { speak, stopSpeak } from '@/lib/speech'
import { toast } from '@/lib/utils'

type Mode = 'en2cn' | 'cn2en'
type Phase = 'config' | 'playing' | 'finished'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface DictationWord extends Word {
  promptType: string
  prompt: string
  ttsLang: string
}

export default function Dictation() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('config')
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
  const [mode, setMode] = useState<Mode>('en2cn')
  const [subject, setSubject] = useState<'english' | 'chinese'>(SUBJECTS.ENGLISH)
  const [interval, setIntervalSec] = useState(5)
  const [shuffleWords, setShuffleWords] = useState(false)
  const [repeatCount, setRepeatCount] = useState(1)

  const [words, setWords] = useState<DictationWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const timerRef = useRef<number | null>(null)
  const currentIndexRef = useRef(0)

  useEffect(() => {
    setUnits(storage.getUnits())
  }, [])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      stopSpeak()
    }
  }, [])

  const filteredUnits = units.filter(u => u.subject === subject)

  const prepareWords = useCallback(() => {
    if (selectedUnitIds.length === 0) {
      toast.error('请先选择单元')
      return null
    }

    let allWords: Word[] = []
    selectedUnitIds.forEach(uid => {
      allWords = allWords.concat(storage.getWords(uid))
    })

    if (allWords.length === 0) {
      toast.error('所选单元没有单词')
      return null
    }

    let dictationWords: DictationWord[] = allWords.map(w => {
      if (mode === 'en2cn') {
        return {
          ...w,
          promptType: PROMPT_TYPES.ENGLISH,
          prompt: w.word,
          ttsLang: 'en-US'
        }
      } else {
        return {
          ...w,
          promptType: PROMPT_TYPES.CHINESE,
          prompt: w.meaning,
          ttsLang: 'zh-CN'
        }
      }
    })

    if (shuffleWords) {
      dictationWords = shuffle(dictationWords)
    }

    return dictationWords
  }, [selectedUnitIds, mode, shuffleWords])

  const speakCurrent = useCallback((index: number, wordList: DictationWord[]) => {
    if (index >= wordList.length) {
      finishDictation(wordList)
      return
    }

    const w = wordList[index]
    setIsPlaying(true)

    for (let i = 0; i < repeatCount; i++) {
      setTimeout(() => {
        speak(w.prompt, w.ttsLang, 0.9)
      }, i * 1500)
    }

    timerRef.current = window.setTimeout(() => {
      setIsPlaying(false)
      if (!isPaused) {
        goNext(wordList)
      }
    }, interval * 1000 + (repeatCount - 1) * 1500)
  }, [interval, repeatCount, isPaused])

  const goNext = useCallback((wordList?: DictationWord[]) => {
    const list = wordList || words
    const nextIdx = currentIndexRef.current + 1
    if (nextIdx >= list.length) {
      finishDictation(list)
    } else {
      setCurrentIndex(nextIdx)
      setTimeout(() => speakCurrent(nextIdx, list), 500)
    }
  }, [words, speakCurrent])

  const goPrev = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    stopSpeak()
    const prevIdx = Math.max(0, currentIndex - 1)
    setCurrentIndex(prevIdx)
    setTimeout(() => speakCurrent(prevIdx, words), 300)
  }, [currentIndex, words, speakCurrent])

  const replay = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    stopSpeak()
    speakCurrent(currentIndex, words)
  }, [currentIndex, words, speakCurrent])

  const togglePause = useCallback(() => {
    if (isPaused) {
      setIsPaused(false)
      speakCurrent(currentIndex, words)
    } else {
      if (timerRef.current) clearTimeout(timerRef.current)
      stopSpeak()
      setIsPaused(true)
      setIsPlaying(false)
    }
  }, [isPaused, currentIndex, words, speakCurrent])

  const finishDictation = useCallback((wordList: DictationWord[]) => {
    stopSpeak()
    setIsPlaying(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase('finished')

    const unitNames = selectedUnitIds.map(uid => units.find(u => u.id === uid)?.name || '').filter(Boolean)
    storage.addRecord({
      unitIds: selectedUnitIds,
      unitNames,
      subject,
      mode,
      totalCount: wordList.length,
      createdAt: Date.now(),
      duration: Math.round((Date.now() - startTime) / 1000),
      words: wordList.map(w => ({ word: w.word, meaning: w.meaning }))
    })
  }, [selectedUnitIds, units, subject, mode, startTime])

  const startDictation = () => {
    const prepared = prepareWords()
    if (!prepared) return

    setWords(prepared)
    setCurrentIndex(0)
    setIsPaused(false)
    setShowAnswer(false)
    setStartTime(Date.now())
    setPhase('playing')

    setTimeout(() => speakCurrent(0, prepared), 800)
  }

  const handleReplay = () => {
    replay()
  }

  const exitDictation = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    stopSpeak()
    navigate('/')
  }

  if (phase === 'config') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-24">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-xl">←</button>
          <h1 className="text-xl font-bold text-gray-900">开始听写</h1>
        </div>

        <div className="p-4 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-3">选择学科</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setSubject(SUBJECTS.ENGLISH); setSelectedUnitIds([]); setMode('en2cn') }}
                className={`py-4 rounded-2xl font-medium text-lg transition-all ${subject === SUBJECTS.ENGLISH ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-700 border border-gray-200'}`}
              >英语</button>
              <button
                onClick={() => { setSubject(SUBJECTS.CHINESE); setSelectedUnitIds([]); setMode('cn2en') }}
                className={`py-4 rounded-2xl font-medium text-lg transition-all ${subject === SUBJECTS.CHINESE ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-700 border border-gray-200'}`}
              >语文</button>
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-3">听写模式</h2>
            <div className="grid grid-cols-2 gap-3">
              {subject === SUBJECTS.ENGLISH ? (
                <>
                  <button
                    onClick={() => setMode('en2cn')}
                    className={`py-4 rounded-2xl font-medium transition-all ${mode === 'en2cn' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white text-gray-700 border border-gray-200'}`}
                  >报英文 ↓ 写中文</button>
                  <button
                    onClick={() => setMode('cn2en')}
                    className={`py-4 rounded-2xl font-medium transition-all ${mode === 'cn2en' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white text-gray-700 border border-gray-200'}`}
                  >报中文 ↓ 写英文</button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setMode('cn2en')}
                    className={`py-4 rounded-2xl font-medium transition-all col-span-2 ${mode === 'cn2en' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white text-gray-700 border border-gray-200'}`}
                  >看拼音写汉字 / 家长报词</button>
                </>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-3">选择单元 ({selectedUnitIds.length}个已选)</h2>
            {filteredUnits.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
                <p className="text-gray-500">还没有{subject === SUBJECTS.ENGLISH ? '英语' : '语文'}词库单元</p>
                <button onClick={() => navigate('/units')} className="mt-3 text-indigo-600 font-medium">去创建单元 →</button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUnits.map(unit => {
                  const count = storage.getWordCount(unit.id)
                  const checked = selectedUnitIds.includes(unit.id)
                  return (
                    <label key={unit.id} className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${checked ? 'bg-indigo-50 border-2 border-indigo-500' : 'bg-white border border-gray-200'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedUnitIds(prev => checked ? prev.filter(id => id !== unit.id) : [...prev, unit.id])
                        }}
                        className="w-5 h-5 rounded accent-indigo-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{unit.name}</div>
                        {unit.description && <div className="text-sm text-gray-500">{unit.description}</div>}
                      </div>
                      <div className="text-sm text-gray-500">{count}词</div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-3">播报设置</h2>
            <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">每题间隔</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIntervalSec(Math.max(2, interval - 1))} className="w-8 h-8 rounded-full bg-gray-100 font-bold">-</button>
                  <span className="w-12 text-center font-semibold">{interval}秒</span>
                  <button onClick={() => setIntervalSec(Math.min(30, interval + 1))} className="w-8 h-8 rounded-full bg-gray-100 font-bold">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">每词重复</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setRepeatCount(Math.max(1, repeatCount - 1))} className="w-8 h-8 rounded-full bg-gray-100 font-bold">-</button>
                  <span className="w-12 text-center font-semibold">{repeatCount}次</span>
                  <button onClick={() => setRepeatCount(Math.min(3, repeatCount + 1))} className="w-8 h-8 rounded-full bg-gray-100 font-bold">+</button>
                </div>
              </div>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700">乱序播报</span>
                <input
                  type="checkbox"
                  checked={shuffleWords}
                  onChange={e => setShuffleWords(e.target.checked)}
                  className="w-5 h-5 rounded accent-indigo-600"
                />
              </label>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={startDictation}
              disabled={selectedUnitIds.length === 0}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none active:scale-98 transition-transform"
            >
              开始听写 🎤
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'playing') {
    const currentWord = words[currentIndex]
    const progress = ((currentIndex + 1) / words.length) * 100

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-500 via-indigo-600 to-indigo-700 flex flex-col">
        <div className="px-4 py-4 flex items-center justify-between text-white">
          <button onClick={exitDictation} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-xl">✕</button>
          <div className="text-center">
            <div className="text-lg font-semibold">第 {currentIndex + 1} / {words.length} 题</div>
          </div>
          <button onClick={() => setShowAnswer(!showAnswer)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20">👁</button>
        </div>

        <div className="px-4">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-48 h-48 rounded-full bg-white/10 flex items-center justify-center mb-8 relative">
            {isPlaying && (
              <>
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                <div className="absolute inset-4 rounded-full bg-white/30 animate-pulse" />
              </>
            )}
            <div className="text-7xl">{isPlaying ? '🔊' : isPaused ? '⏸' : '👉'}</div>
          </div>

          <div className="text-white/70 text-lg mb-2">
            {mode === 'en2cn' ? '请写出中文意思' : mode === 'cn2en' && subject === SUBJECTS.ENGLISH ? '请写出英文单词' : '请写出汉字'}
          </div>

          {showAnswer && currentWord && (
            <div className="mt-4 bg-white rounded-2xl p-6 shadow-2xl text-center min-w-64">
              <div className="text-3xl font-bold text-gray-900 mb-2">{currentWord.word}</div>
              <div className="text-xl text-gray-600">{currentWord.meaning}</div>
              {currentWord.phonetic && <div className="text-gray-400 mt-1">{currentWord.phonetic}</div>}
            </div>
          )}

          {isPaused && !showAnswer && (
            <div className="mt-4 text-white text-xl font-medium">已暂停</div>
          )}
        </div>

        <div className="px-6 pb-8 pt-4 bg-white/10 backdrop-blur-sm rounded-t-3xl">
          <div className="grid grid-cols-4 gap-3 mb-4">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="flex flex-col items-center gap-1 py-4 rounded-2xl bg-white/20 text-white disabled:opacity-40"
            >
              <span className="text-2xl">⏮</span>
              <span className="text-sm">上一题</span>
            </button>
            <button
              onClick={handleReplay}
              className="flex flex-col items-center gap-1 py-4 rounded-2xl bg-white/20 text-white"
            >
              <span className="text-2xl">🔁</span>
              <span className="text-sm">重播</span>
            </button>
            <button
              onClick={togglePause}
              className="flex flex-col items-center gap-1 py-4 rounded-2xl bg-white/20 text-white"
            >
              <span className="text-2xl">{isPaused ? '▶️' : '⏸'}</span>
              <span className="text-sm">{isPaused ? '继续' : '暂停'}</span>
            </button>
            <button
              onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); stopSpeak(); goNext() }}
              disabled={currentIndex >= words.length - 1}
              className="flex flex-col items-center gap-1 py-4 rounded-2xl bg-white/20 text-white disabled:opacity-40"
            >
              <span className="text-2xl">⏭</span>
              <span className="text-sm">下一题</span>
            </button>
          </div>

          <button
            onClick={() => finishDictation(words)}
            className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-bold text-lg"
          >
            结束听写
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-24">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-xl">←</button>
        <h1 className="text-xl font-bold text-gray-900">听写完成！</h1>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-gray-100 mb-5">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">听写完成！</h2>
          <p className="text-gray-500">共 {words.length} 个单词，请对照检查</p>
        </div>

        <h3 className="text-base font-semibold text-gray-800 mb-3">答案核对</h3>
        <div className="space-y-2">
          {words.map((w, idx) => (
            <div key={w.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">{idx + 1}</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-lg">{w.word}</div>
                {w.phonetic && <div className="text-sm text-gray-400">{w.phonetic}</div>}
              </div>
              <div className="text-right">
                <div className="text-gray-700">{w.meaning}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={() => { setPhase('config'); setCurrentIndex(0) }}
            className="py-4 bg-white text-gray-700 rounded-2xl font-medium border border-gray-200"
          >重新配置</button>
          <button
            onClick={() => startDictation()}
            className="py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200"
          >再听一遍</button>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full py-4 mt-3 text-gray-600 font-medium"
        >返回首页</button>
      </div>
    </div>
  )
}

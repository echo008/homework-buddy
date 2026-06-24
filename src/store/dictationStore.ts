import { create } from 'zustand'
import { dictationApi, logApi } from '@/api'
import type { Question, AnswerItem, DictationConfig, DictationLog } from '@shared/types'

interface DictationResult {
  totalWords: number
  correctCount: number
  wrongCount: number
  accuracy: number
  duration: number
  wrongWords: AnswerItem[]
}

interface DictationStore {
  questions: Question[]
  currentIndex: number
  answers: Map<number, AnswerItem>
  isPlaying: boolean
  startTime: number | null
  unitNames: string[]
  start: (config: DictationConfig) => Promise<void>
  setAnswer: (index: number, userAnswer: string) => void
  next: () => void
  prev: () => void
  setPlaying: (v: boolean) => void
  reset: () => void
  finish: (config: DictationConfig) => Promise<DictationResult>
}

export const useDictationStore = create<DictationStore>((set, get) => ({
  questions: [],
  currentIndex: 0,
  answers: new Map(),
  isPlaying: false,
  startTime: null,
  unitNames: [],

  async start(config: DictationConfig) {
    const res = await dictationApi.start(config)
    if (res.data) {
      set({
        questions: res.data.questions,
        unitNames: res.data.unitNames,
        currentIndex: 0,
        answers: new Map(),
        startTime: Date.now(),
        isPlaying: false
      })
    }
  },

  setAnswer(index: number, userAnswer: string) {
    const { questions, answers } = get()
    const question = questions[index]
    if (!question) return

    const normalizedUserAnswer = userAnswer.trim().toLowerCase()
    const normalizedCorrectAnswer = question.answer.trim().toLowerCase()
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer

    const answerItem: AnswerItem = {
      wordId: question.wordId,
      unitId: question.unitId,
      word: question.word,
      meaning: question.meaning,
      pinyin: question.pinyin,
      subject: question.subject,
      mode: question.mode,
      prompt: question.prompt,
      promptType: question.promptType,
      answer: question.answer,
      answerType: question.answerType,
      correctAnswer: question.answer,
      userAnswer,
      audioUrl: question.audioUrl,
      isCorrect
    }

    const newAnswers = new Map(answers)
    newAnswers.set(index, answerItem)
    set({ answers: newAnswers })
  },

  next() {
    const { currentIndex, questions } = get()
    if (currentIndex < questions.length - 1) {
      set({ currentIndex: currentIndex + 1 })
    }
  },

  prev() {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 })
    }
  },

  setPlaying(v: boolean) {
    set({ isPlaying: v })
  },

  reset() {
    set({
      questions: [],
      currentIndex: 0,
      answers: new Map(),
      isPlaying: false,
      startTime: null,
      unitNames: []
    })
  },

  async finish(config: DictationConfig): Promise<DictationResult> {
    const { questions, answers, startTime, unitNames } = get()
    const endTime = Date.now()
    const duration = startTime ? Math.round((endTime - startTime) / 1000) : 0

    const answerItems: AnswerItem[] = []
    let correctCount = 0

    for (let i = 0; i < questions.length; i++) {
      const answer = answers.get(i)
      if (answer) {
        answerItems.push(answer)
        if (answer.isCorrect) {
          correctCount++
        }
      } else {
        const question = questions[i]
        answerItems.push({
          wordId: question.wordId,
          unitId: question.unitId,
          word: question.word,
          meaning: question.meaning,
          pinyin: question.pinyin,
          subject: question.subject,
          mode: question.mode,
          prompt: question.prompt,
          promptType: question.promptType,
          answer: question.answer,
          answerType: question.answerType,
          correctAnswer: question.answer,
          userAnswer: '',
          audioUrl: question.audioUrl,
          isCorrect: false
        })
      }
    }

    const totalWords = questions.length
    const wrongCount = totalWords - correctCount
    const accuracy = totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 0
    const wrongWords = answerItems.filter(a => !a.isCorrect)

    const logData: Partial<DictationLog> = {
      subject: config.subject,
      mode: config.mode,
      unitIds: config.unitIds,
      unitNames,
      wordCountRange: config.wordCountRange,
      lessonRange: config.lessonRange,
      totalWords,
      correctCount,
      wrongCount,
      accuracy,
      duration,
      questions: answerItems,
      wrongWords
    }

    await logApi.save(logData)

    return {
      totalWords,
      correctCount,
      wrongCount,
      accuracy,
      duration,
      wrongWords
    }
  }
}))

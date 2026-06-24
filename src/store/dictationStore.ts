import { create } from 'zustand'
import { dictationApi, logApi } from '@/api'
import { ANSWER_TYPES, PROMPT_TYPES } from '@shared/constants'
import type { Question, AnswerItem, DictationConfig, DictationLog, Subject } from '@shared/types'

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
  practiceConfig: DictationConfig | null
  start: (config: DictationConfig) => Promise<void>
  setAnswer: (index: number, userAnswer: string) => void
  markWrong: (index: number) => void
  next: () => void
  prev: () => void
  setPlaying: (v: boolean) => void
  reset: () => void
  finish: () => Promise<DictationResult>
  startWrongPractice: (wrongWords: AnswerItem[]) => void
}

function normalizeAnswer(answer: string, answerType: string, subject: Subject): string {
  const trimmed = answer.trim()
  if (answerType === ANSWER_TYPES.ENGLISH || subject === 'english') {
    return trimmed.toLowerCase().replace(/\s+/g, ' ')
  }
  return trimmed.replace(/\s+/g, '')
}

function answersMatch(userAnswer: string, correctAnswer: string, answerType: string, subject: Subject): boolean {
  return normalizeAnswer(userAnswer, answerType, subject) === normalizeAnswer(correctAnswer, answerType, subject)
}

export const useDictationStore = create<DictationStore>((set, get) => ({
  questions: [],
  currentIndex: 0,
  answers: new Map(),
  isPlaying: false,
  startTime: null,
  unitNames: [],
  practiceConfig: null,

  async start(config: DictationConfig) {
    const res = await dictationApi.start(config)
    if (res.data) {
      set({
        questions: res.data.questions,
        unitNames: res.data.unitNames,
        currentIndex: 0,
        answers: new Map(),
        startTime: Date.now(),
        isPlaying: false,
        practiceConfig: config
      })
    }
  },

  setAnswer(index: number, userAnswer: string) {
    const { questions, answers } = get()
    const question = questions[index]
    if (!question) return

    const isCorrect = answersMatch(userAnswer, question.answer, question.answerType, question.subject)

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
      userAnswer: userAnswer.trim(),
      audioUrl: question.audioUrl,
      isCorrect
    }

    const newAnswers = new Map(answers)
    newAnswers.set(index, answerItem)
    set({ answers: newAnswers })
  },

  markWrong(index: number) {
    const { questions, answers } = get()
    const question = questions[index]
    if (!question) return

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
      userAnswer: '',
      audioUrl: question.audioUrl,
      isCorrect: false
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
      unitNames: [],
      practiceConfig: null
    })
  },

  async finish(): Promise<DictationResult> {
    const { questions, answers, startTime, unitNames, practiceConfig } = get()
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

    if (practiceConfig) {
      const logData: Partial<DictationLog> = {
        subject: practiceConfig.subject,
        mode: practiceConfig.mode,
        unitIds: practiceConfig.unitIds,
        unitNames,
        wordCountRange: practiceConfig.wordCountRange,
        lessonRange: practiceConfig.lessonRange,
        totalWords,
        correctCount,
        wrongCount,
        accuracy,
        duration,
        questions: answerItems,
        wrongWords
      }
      await logApi.save(logData)
    }

    return {
      totalWords,
      correctCount,
      wrongCount,
      accuracy,
      duration,
      wrongWords
    }
  },

  startWrongPractice(wrongWords: AnswerItem[]) {
    function resolveLang(promptType: string, subject: Subject): string {
      if (promptType === PROMPT_TYPES.ENGLISH || (subject === 'english' && promptType !== PROMPT_TYPES.CHINESE)) {
        return 'en-US'
      }
      return 'zh-CN'
    }

    const questions: Question[] = wrongWords.map((w, idx) => ({
      index: idx + 1,
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
      audioUrl: w.audioUrl,
      ttsLang: resolveLang(w.promptType, w.subject)
    }))

    const wrongConfig: DictationConfig = {
      subject: wrongWords[0]?.subject || 'english',
      mode: wrongWords[0]?.mode || 'en2cn',
      unitIds: [],
      wordCountRange: { min: wrongWords.length, max: wrongWords.length }
    }

    set({
      questions,
      unitNames: ['错题练习'],
      currentIndex: 0,
      answers: new Map(),
      startTime: Date.now(),
      isPlaying: false,
      practiceConfig: wrongConfig
    })
  }
}))

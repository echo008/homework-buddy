export type Subject = 'english' | 'chinese'
export type DictationMode = 'en2cn' | 'cn2en' | 'pinyin2hanzi' | 'hanzi2pinyin'
export type PromptType = 'english' | 'chinese' | 'pinyin'
export type AnswerType = 'english' | 'chinese' | 'pinyin'

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
}

export interface User {
  id: string
  username: string
  nickname?: string
  createdAt: string
}

export interface Unit {
  id: string
  name: string
  subject: Subject
  grade: string
  semester: string
  textbook: string
  order: number
  wordCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Word {
  id: string
  unitId: string
  word: string
  meaning: string
  pinyin: string
  phonetic: string
  partOfSpeech: string
  audioUrl: string
  lesson: number
  difficulty: number
  examples: string[]
  createdBy: string
  createdAt: string
}

export interface Question {
  index: number
  wordId: string
  unitId: string
  word: string
  meaning: string
  pinyin: string
  subject: Subject
  mode: DictationMode
  prompt: string
  promptType: PromptType
  answer: string
  answerType: AnswerType
  audioUrl: string
}

export interface AnswerItem {
  wordId: string
  unitId: string
  word: string
  meaning: string
  pinyin: string
  subject: Subject
  mode: DictationMode
  prompt: string
  promptType: PromptType
  answer: string
  answerType: AnswerType
  correctAnswer: string
  userAnswer: string
  audioUrl: string
  isCorrect: boolean
}

export interface DictationLog {
  id: string
  userId: string
  subject: Subject
  mode: DictationMode
  unitIds: string[]
  unitNames: string[]
  wordCountRange: { min: number; max: number }
  lessonRange?: { min: number; max: number }
  totalWords: number
  correctCount: number
  wrongCount: number
  accuracy: number
  duration: number
  questions: AnswerItem[]
  wrongWords: AnswerItem[]
  createdAt: string
}

export interface SharedUnitInfo {
  id: string
  name: string
  subject: Subject
  wordCount: number
}

export interface ClassMemberInfo {
  id: string
  nickname?: string
  username: string
}

export interface ClassInfo {
  id: string
  name: string
  subject: Subject
  code: string
  createdBy: string
  creatorName?: string
  members: string[]
  sharedUnitIds: string[]
  sharedUnits?: SharedUnitInfo[]
  memberDetails?: ClassMemberInfo[]
  memberCount: number
  isCreator: boolean
  createdAt: string
  updatedAt: string
}

export interface DictationConfig {
  subject: Subject
  mode: DictationMode
  unitIds: string[]
  wordCountRange: { min: number; max: number }
  lessonRange?: { min: number; max: number }
}

export interface PresetTextbook {
  id: string
  gradeLevel: string
  subject: Subject
  version: string
  name: string
}

export interface PresetUnit {
  id: string
  textbookId: string
  name: string
  contentType: string
  order: number
  wordCount: number
}

export interface PresetWord {
  id: string
  unitId: string
  word: string
  meaning: string
  pinyin: string
  phonetic: string
  audioUrl: string
  lesson: number
}

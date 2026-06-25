export interface PresetWord {
  word: string
  meaning: string
  phonetic?: string
}

export interface PresetUnit {
  id: string
  name: string
  subject: 'english' | 'chinese'
  grade: string
  textbook: string
  words: PresetWord[]
}

export const GRADE_LABELS: Record<string, string> = {
  'primary1': '一年级',
  'primary2': '二年级',
  'primary3': '三年级',
  'primary4': '四年级',
  'primary5': '五年级',
  'primary6': '六年级',
  'junior1': '初一（七年级）',
  'junior2': '初二（八年级）',
  'junior3': '初三（九年级）',
  'senior1': '高一',
  'senior2': '高二',
  'senior3': '高三',
}

export const GRADE_ORDER = [
  'primary1', 'primary2', 'primary3', 'primary4', 'primary5', 'primary6',
  'junior1', 'junior2', 'junior3',
  'senior1', 'senior2', 'senior3'
]

export const SUBJECT_LABELS = {
  english: '英语',
  chinese: '语文'
}

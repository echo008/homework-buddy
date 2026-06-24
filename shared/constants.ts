export const SUBJECTS = {
  CHINESE: 'chinese',
  ENGLISH: 'english'
} as const

export type Subject = typeof SUBJECTS[keyof typeof SUBJECTS]

export const MODES = {
  EN2CN: 'en2cn',
  CN2EN: 'cn2en',
  PINYIN2HANZI: 'pinyin2hanzi',
  HANZI2PINYIN: 'hanzi2pinyin'
} as const

export type DictationMode = typeof MODES[keyof typeof MODES]

export const PROMPT_TYPES = {
  ENGLISH: 'english',
  CHINESE: 'chinese',
  PINYIN: 'pinyin'
} as const

export const ANSWER_TYPES = {
  ENGLISH: 'english',
  CHINESE: 'chinese',
  PINYIN: 'pinyin'
} as const

export const ALLOWED_SUBJECTS = Object.values(SUBJECTS)
export const ALLOWED_MODES = Object.values(MODES)

export const SUBJECT_LABELS: Record<Subject, string> = {
  [SUBJECTS.ENGLISH]: '英语',
  [SUBJECTS.CHINESE]: '语文'
}

export const MODE_LABELS: Record<DictationMode, string> = {
  [MODES.EN2CN]: '英→中',
  [MODES.CN2EN]: '中→英',
  [MODES.PINYIN2HANZI]: '拼音→汉字',
  [MODES.HANZI2PINYIN]: '汉字→拼音'
}

export const GRADE_LEVELS = ['primary', 'junior', 'senior'] as const
export const CONTENT_TYPES = ['poetry', 'word', 'phrase', 'sentence'] as const

export const RESPONSE_CODES = {
  SUCCESS: 0,
  UNKNOWN_ACTION: 1,
  PARAM_ERROR: 2,
  DUPLICATE: 3,
  NOT_FOUND: 4,
  NO_PERMISSION: 5,
  SERVER_ERROR: -1
} as const

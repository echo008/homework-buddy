// cloudfunctions/common/constants.js - 云函数通用常量
// 与 miniprogram/utils/constants.js 保持一致，避免前后端不一致

const SUBJECTS = {
  CHINESE: 'chinese',
  ENGLISH: 'english'
}

const MODES = {
  EN2CN: 'en2cn',
  CN2EN: 'cn2en',
  PINYIN2HANZI: 'pinyin2hanzi',
  HANZI2PINYIN: 'hanzi2pinyin'
}

const GRADE_LEVELS = {
  PRIMARY: 'primary',
  JUNIOR: 'junior',
  SENIOR: 'senior',
  NATIONAL: 'national'
}

const CONTENT_TYPES = {
  POETRY: 'poetry',
  WORD: 'word',
  PHRASE: 'phrase',
  SENTENCE: 'sentence'
}

const PROMPT_TYPES = {
  ENGLISH: 'english',
  CHINESE: 'chinese',
  PINYIN: 'pinyin'
}

const ANSWER_TYPES = {
  ENGLISH: 'english',
  CHINESE: 'chinese',
  PINYIN: 'pinyin'
}

const SUBJECT_LABELS = {
  [SUBJECTS.CHINESE]: '语文',
  [SUBJECTS.ENGLISH]: '英语'
}

const MODE_LABELS = {
  [MODES.EN2CN]: '英→中',
  [MODES.CN2EN]: '中→英',
  [MODES.PINYIN2HANZI]: '拼音→汉字',
  [MODES.HANZI2PINYIN]: '汉字→拼音'
}

const PROMPT_TYPE_LABELS = {
  [PROMPT_TYPES.ENGLISH]: '英文',
  [PROMPT_TYPES.CHINESE]: '中文',
  [PROMPT_TYPES.PINYIN]: '拼音'
}

const ANSWER_TYPE_LABELS = {
  [ANSWER_TYPES.ENGLISH]: '英文',
  [ANSWER_TYPES.CHINESE]: '中文',
  [ANSWER_TYPES.PINYIN]: '拼音'
}

const GRADE_LEVEL_LABELS = {
  [GRADE_LEVELS.PRIMARY]: '小学',
  [GRADE_LEVELS.JUNIOR]: '初中',
  [GRADE_LEVELS.SENIOR]: '高中',
  [GRADE_LEVELS.NATIONAL]: '全国'
}

const CONTENT_TYPE_LABELS = {
  [CONTENT_TYPES.POETRY]: '古诗词',
  [CONTENT_TYPES.WORD]: '单词',
  [CONTENT_TYPES.PHRASE]: '短语',
  [CONTENT_TYPES.SENTENCE]: '句子'
}

const ALLOWED_SUBJECTS = Object.values(SUBJECTS)
const ALLOWED_MODES = Object.values(MODES)
const ALLOWED_GRADE_LEVELS = Object.values(GRADE_LEVELS)
const ALLOWED_CONTENT_TYPES = Object.values(CONTENT_TYPES)

module.exports = {
  SUBJECTS,
  MODES,
  GRADE_LEVELS,
  CONTENT_TYPES,
  PROMPT_TYPES,
  ANSWER_TYPES,
  SUBJECT_LABELS,
  MODE_LABELS,
  PROMPT_TYPE_LABELS,
  ANSWER_TYPE_LABELS,
  GRADE_LEVEL_LABELS,
  CONTENT_TYPE_LABELS,
  ALLOWED_SUBJECTS,
  ALLOWED_MODES,
  ALLOWED_GRADE_LEVELS,
  ALLOWED_CONTENT_TYPES
}

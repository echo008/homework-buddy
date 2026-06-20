// utils/constants.js - 项目通用常量与文案映射

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

/**
 * 根据学科返回默认听写模式
 * @param {string} subject
 */
function getDefaultMode(subject) {
  return subject === SUBJECTS.CHINESE ? MODES.PINYIN2HANZI : MODES.EN2CN
}

module.exports = {
  SUBJECTS,
  MODES,
  GRADE_LEVELS,
  CONTENT_TYPES,
  SUBJECT_LABELS,
  MODE_LABELS,
  GRADE_LEVEL_LABELS,
  CONTENT_TYPE_LABELS,
  getDefaultMode
}

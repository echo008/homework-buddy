import db from '../db/index.js'
import { ALLOWED_MODES, MODES, PROMPT_TYPES, ANSWER_TYPES } from '../../shared/constants.js'
import type { DictationConfig, Question, Subject, DictationMode } from '../../shared/types.js'
import { getUnitIfAccessible } from './unitService.js'

function canUseCustomAudio(mode: string): boolean {
  return mode === MODES.EN2CN || mode === MODES.CN2EN
}

function buildQuestion(word: any, mode: DictationMode, index: number): Question {
  const base: Question = {
    index: index + 1,
    wordId: word.id,
    unitId: word.unit_id,
    word: word.word,
    meaning: word.meaning || '',
    pinyin: word.pinyin || '',
    subject: word.subject || 'english',
    audioUrl: word.audio_url || '',
    mode,
    prompt: '',
    promptType: PROMPT_TYPES.ENGLISH,
    answer: '',
    answerType: ANSWER_TYPES.CHINESE
  }

  switch (mode) {
    case MODES.CN2EN:
      return {
        ...base,
        prompt: word.meaning,
        promptType: PROMPT_TYPES.CHINESE,
        answer: word.word,
        answerType: ANSWER_TYPES.ENGLISH
      }
    case MODES.PINYIN2HANZI:
      return {
        ...base,
        prompt: word.pinyin || '',
        promptType: PROMPT_TYPES.PINYIN,
        answer: word.word,
        answerType: ANSWER_TYPES.CHINESE
      }
    case MODES.HANZI2PINYIN:
      return {
        ...base,
        prompt: word.word,
        promptType: PROMPT_TYPES.CHINESE,
        answer: word.pinyin || '',
        answerType: ANSWER_TYPES.PINYIN
      }
    case MODES.EN2CN:
    default:
      return {
        ...base,
        prompt: word.word,
        promptType: PROMPT_TYPES.ENGLISH,
        answer: word.meaning,
        answerType: ANSWER_TYPES.CHINESE
      }
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function resolveLang(promptType: string, subject: Subject): string {
  if (promptType === PROMPT_TYPES.ENGLISH || (subject === 'english' && promptType !== PROMPT_TYPES.CHINESE)) {
    return 'en-US'
  }
  return 'zh-CN'
}

export function startDictation(config: DictationConfig, userId: string) {
  const { subject, mode, unitIds = [], wordCountRange = { min: 10, max: 10 }, lessonRange } = config

  if (!ALLOWED_MODES.includes(mode)) {
    return { code: 2, message: '听写模式不正确' }
  }
  if (!unitIds || unitIds.length === 0) {
    return { code: 2, message: '请选择至少一个单元' }
  }

  // 校验所有单元可访问
  for (const uid of unitIds) {
    if (!getUnitIfAccessible(uid, userId)) {
      return { code: 5, message: '存在无权限访问的单元' }
    }
  }

  // 查询单词
  const placeholders = unitIds.map(() => '?').join(',')
  let sql = `SELECT w.*, u.subject FROM words w JOIN units u ON w.unit_id = u.id WHERE w.unit_id IN (${placeholders})`
  const params: any[] = [...unitIds]

  if (lessonRange && lessonRange.min && lessonRange.max) {
    sql += ' AND w.lesson >= ? AND w.lesson <= ?'
    params.push(lessonRange.min, lessonRange.max)
  }

  const words = db.prepare(sql).all(...params) as any[]
  if (words.length === 0) {
    return { code: 3, message: '所选单元暂无单词' }
  }

  // 筛选学科
  const filtered = subject ? words.filter(w => w.subject === subject) : words
  if (filtered.length === 0) {
    return { code: 3, message: '所选单元中无对应学科的单词' }
  }

  const shuffled = shuffle(filtered)
  const min = Math.max(1, wordCountRange.min || 1)
  const max = Math.min(shuffled.length, wordCountRange.max || shuffled.length)
  const count = Math.floor(Math.random() * (max - min + 1)) + min
  const selected = shuffled.slice(0, count)

  const questions = selected.map((w, i) => {
    const q = buildQuestion(w, mode, i)
    ;(q as any).ttsLang = resolveLang(q.promptType, q.subject)
    if (!canUseCustomAudio(mode)) {
      q.audioUrl = ''
    }
    return q
  })

  // 单元名称
  const unitNames = unitIds.map(uid => {
    const u = db.prepare('SELECT name FROM units WHERE id = ?').get(uid) as any
    return u?.name || ''
  }).filter(Boolean)

  return {
    code: 0,
    data: { questions, totalCount: questions.length, unitNames }
  }
}

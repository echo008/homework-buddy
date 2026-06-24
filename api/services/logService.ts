import { v4 as uuidv4 } from 'uuid'
import db from '../db/index.js'
import type { DictationLog, AnswerItem } from '../../shared/types.js'

function rowToLog(row: any): DictationLog {
  return {
    id: row.id,
    userId: row.user_id,
    subject: row.subject,
    mode: row.mode,
    unitIds: safeJson(row.unit_ids, []),
    unitNames: safeJson(row.unit_names, []),
    wordCountRange: safeJson(row.word_count_range, { min: 0, max: 0 }),
    lessonRange: safeJson(row.lesson_range, undefined),
    totalWords: row.total_words,
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    accuracy: row.accuracy,
    duration: row.duration || 0,
    questions: safeJson(row.questions, []),
    wrongWords: safeJson(row.wrong_words, []),
    createdAt: row.created_at
  }
}

function safeJson(str: string, fallback: any) {
  try { return JSON.parse(str || 'null') ?? fallback } catch { return fallback }
}

export function saveLog(log: Partial<DictationLog>, userId: string) {
  const { subject, mode, totalWords, correctCount, wrongCount, accuracy, questions = [], wrongWords = [], unitIds = [], unitNames = [], wordCountRange = { min: 0, max: 0 }, lessonRange, duration = 0 } = log as any

  if (!subject || !mode || totalWords == null || correctCount == null) {
    return { code: 2, message: '缺少必要的记录参数' }
  }

  const id = uuidv4()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO dictation_logs (id, user_id, subject, mode, unit_ids, unit_names, word_count_range, lesson_range, total_words, correct_count, wrong_count, accuracy, duration, questions, wrong_words, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, userId, subject, mode,
    JSON.stringify(unitIds), JSON.stringify(unitNames),
    JSON.stringify(wordCountRange), lessonRange ? JSON.stringify(lessonRange) : '{}',
    totalWords, correctCount, wrongCount, accuracy, duration,
    JSON.stringify(questions), JSON.stringify(wrongWords),
    now
  )

  return { code: 0, message: '保存成功', data: { id } }
}

export function listLogs(userId: string, limit = 20) {
  const rows = db.prepare(
    'SELECT * FROM dictation_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(userId, Math.min(Number(limit) || 20, 100)) as any[]
  return { code: 0, data: rows.map(rowToLog) }
}

export function getLog(logId: string, userId: string) {
  const row = db.prepare('SELECT * FROM dictation_logs WHERE id = ? AND user_id = ?').get(logId, userId) as any
  if (!row) return { code: 4, message: '记录不存在' }
  return { code: 0, data: rowToLog(row) }
}

export function deleteLog(logId: string, userId: string) {
  const row = db.prepare('SELECT id FROM dictation_logs WHERE id = ? AND user_id = ?').get(logId, userId)
  if (!row) return { code: 4, message: '记录不存在' }
  db.prepare('DELETE FROM dictation_logs WHERE id = ?').run(logId)
  return { code: 0, message: '删除成功' }
}

export function getWrongWords(userId: string, limit = 50) {
  const rows = db.prepare(
    'SELECT wrong_words FROM dictation_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
  ).all(userId) as any[]
  const wrongMap = new Map<string, AnswerItem>()
  for (const row of rows) {
    const wrongs: AnswerItem[] = safeJson(row.wrong_words, [])
    for (const w of wrongs) {
      if (!wrongMap.has(w.wordId)) wrongMap.set(w.wordId, w)
    }
    if (wrongMap.size >= limit) break
  }
  return { code: 0, data: Array.from(wrongMap.values()).slice(0, limit) }
}

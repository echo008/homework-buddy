import { v4 as uuidv4 } from 'uuid'
import db from '../db/index.js'
import { ALLOWED_SUBJECTS } from '../../shared/constants.js'
import { syncUnitWordCount, getUnitIfAccessible } from './unitService.js'
import type { Word, Subject } from '../../shared/types.js'

function rowToWord(row: any): Word {
  let examples: string[] = []
  try { examples = JSON.parse(row.examples || '[]') } catch {}
  return {
    id: row.id,
    unitId: row.unit_id,
    word: row.word,
    meaning: row.meaning,
    pinyin: row.pinyin || '',
    phonetic: row.phonetic || '',
    partOfSpeech: row.part_of_speech || '',
    audioUrl: row.audio_url || '',
    lesson: row.lesson || 1,
    difficulty: row.difficulty || 3,
    examples,
    createdBy: row.created_by,
    createdAt: row.created_at
  }
}

export function createWord(word: Partial<Word>, userId: string) {
  const { word: text, meaning, unitId, subject = 'english', pinyin = '', lesson = 1, partOfSpeech = '', phonetic = '', audioUrl = '', difficulty = 3 } = word as any

  if (!text || !text.trim() || !meaning || !meaning.trim() || !unitId) {
    return { code: 2, message: '单词/释义/单元ID 不能为空' }
  }
  if (!ALLOWED_SUBJECTS.includes(subject as Subject)) {
    return { code: 2, message: '学科类型不正确' }
  }

  const unitRes = db.prepare('SELECT * FROM units WHERE id = ?').get(unitId) as any
  if (!unitRes) return { code: 4, message: '单元不存在' }
  if (unitRes.created_by !== userId) return { code: 5, message: '无权向他人的单元添加单词' }
  if (unitRes.subject && unitRes.subject !== subject) {
    return { code: 2, message: '单词学科与单元学科不一致' }
  }

  const dup = db.prepare('SELECT id FROM words WHERE word = ? AND unit_id = ?').get(text.trim(), unitId)
  if (dup) return { code: 3, message: '该单元下已存在相同单词' }

  const id = uuidv4()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO words (id, unit_id, word, meaning, pinyin, phonetic, part_of_speech, audio_url, lesson, difficulty, examples, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, unitId, text.trim(), meaning.trim(), pinyin.trim(), phonetic.trim(), partOfSpeech.trim(), audioUrl.trim(), Number(lesson) || 1, Number(difficulty) || 3, '[]', userId, now)

  syncUnitWordCount(unitId as string)
  return { code: 0, message: '添加成功', data: rowToWord(db.prepare('SELECT * FROM words WHERE id = ?').get(id)) }
}

export function updateWord(word: Partial<Word>, userId: string) {
  const { id } = word
  if (!id) return { code: 2, message: '缺少单词 ID' }

  const existing = db.prepare('SELECT * FROM words WHERE id = ?').get(id) as any
  if (!existing) return { code: 3, message: '单词不存在' }
  if (existing.created_by !== userId) return { code: 5, message: '无权修改他人的单词' }

  const updateData: Record<string, any> = {}
  if (word.unitId !== undefined && word.unitId !== existing.unit_id) {
    const targetUnit = db.prepare('SELECT * FROM units WHERE id = ?').get(word.unitId) as any
    if (!targetUnit) return { code: 4, message: '目标单元不存在' }
    if (targetUnit.created_by !== userId) return { code: 5, message: '无权将单词移动到他人的单元' }
    if (targetUnit.subject && targetUnit.subject !== existing.subject) {
      return { code: 2, message: '单词学科与目标单元学科不一致' }
    }
    updateData.unit_id = word.unitId
  }

  const fieldMap: Record<string, string> = {
    word: 'word', meaning: 'meaning', pinyin: 'pinyin', phonetic: 'phonetic',
    partOfSpeech: 'part_of_speech', audioUrl: 'audio_url', lesson: 'lesson', difficulty: 'difficulty'
  }
  for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
    if ((word as any)[jsKey] !== undefined) {
      if (['lesson', 'difficulty'].includes(jsKey)) {
        updateData[dbKey] = Number((word as any)[jsKey]) || 0
      } else {
        updateData[dbKey] = String((word as any)[jsKey]).trim()
      }
    }
  }

  if (Object.keys(updateData).length === 0) return { code: 2, message: '没有要更新的字段' }

  const targetUnitId = updateData.unit_id || existing.unit_id
  const targetWord = updateData.word || existing.word
  if (targetUnitId && targetWord) {
    const dup = db.prepare('SELECT id FROM words WHERE word = ? AND unit_id = ? AND id != ?').get(targetWord, targetUnitId, id)
    if (dup) return { code: 3, message: '该单元下已存在相同单词' }
  }

  const sets = Object.keys(updateData).map(k => `${k} = ?`).join(', ')
  db.prepare(`UPDATE words SET ${sets} WHERE id = ?`).run(...Object.values(updateData), id)

  syncUnitWordCount(targetUnitId)
  const oldUnitId = existing.unit_id
  if (oldUnitId && oldUnitId !== targetUnitId) syncUnitWordCount(oldUnitId)

  return { code: 0, message: '更新成功' }
}

export function deleteWord(wordId: string, userId: string) {
  if (!wordId) return { code: 2, message: '缺少单词 ID' }
  const row = db.prepare('SELECT * FROM words WHERE id = ?').get(wordId) as any
  if (!row) return { code: 3, message: '单词不存在' }
  if (row.created_by !== userId) return { code: 5, message: '无权删除他人的单词' }

  const unitId = row.unit_id
  db.prepare('DELETE FROM words WHERE id = ?').run(wordId)
  if (unitId) syncUnitWordCount(unitId)
  return { code: 0, message: '删除成功' }
}

export function listWords(unitId: string, userId: string) {
  if (!unitId) return { code: 2, message: '缺少单元 ID' }
  const unit = getUnitIfAccessible(unitId, userId)
  if (!unit) return { code: 5, message: '无权查看该单元的单词' }

  const rows = db.prepare('SELECT * FROM words WHERE unit_id = ? ORDER BY lesson ASC, created_at ASC').all(unitId) as any[]
  return { code: 0, data: rows.map(rowToWord) }
}

export function batchImportWords(words: Partial<Word>[], unitId: string, userId: string) {
  if (!unitId) return { code: 2, message: '缺少单元 ID' }
  if (!Array.isArray(words) || words.length === 0) return { code: 2, message: '单词列表不能为空' }

  const unit = db.prepare('SELECT * FROM units WHERE id = ?').get(unitId) as any
  if (!unit) return { code: 4, message: '单元不存在' }
  if (unit.created_by !== userId) return { code: 5, message: '无权向他人的单元导入单词' }

  let imported = 0
  const now = new Date().toISOString()
  const insert = db.prepare(
    `INSERT OR IGNORE INTO words (id, unit_id, word, meaning, pinyin, phonetic, part_of_speech, audio_url, lesson, difficulty, examples, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?)`
  )

  for (const w of words) {
    const text = (w.word || '').trim()
    const meaning = (w.meaning || '').trim()
    if (!text || !meaning) continue
    const id = uuidv4()
    insert.run(id, unitId, text, meaning, (w.pinyin || '').trim(), '', '', '', Number(w.lesson) || 1, Number(w.difficulty) || 3, userId, now)
    imported++
  }

  syncUnitWordCount(unitId)
  return { code: 0, message: `导入成功 ${imported} 个单词`, data: { imported } }
}

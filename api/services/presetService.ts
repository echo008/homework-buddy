import { v4 as uuidv4 } from 'uuid'
import db from '../db/index.js'
import type { PresetTextbook, PresetUnit, PresetWord, Subject } from '../../shared/types.js'

const SEED_DATA = {
  english: [
    {
      gradeLevel: 'primary',
      version: '人教版',
      name: '人教版小学英语（三起）三年级上册',
      units: [
        {
          name: 'Unit 1 Hello',
          words: [
            { word: 'hello', meaning: '你好', phonetic: '/həˈləʊ/' },
            { word: 'hi', meaning: '嗨', phonetic: '/haɪ/' },
            { word: 'goodbye', meaning: '再见', phonetic: '/ˌɡʊdˈbaɪ/' },
            { word: 'bye', meaning: '再见', phonetic: '/baɪ/' },
            { word: 'name', meaning: '名字', phonetic: '/neɪm/' },
            { word: 'I', meaning: '我', phonetic: '/aɪ/' },
            { word: 'am', meaning: '是', phonetic: '/æm/' },
            { word: 'is', meaning: '是', phonetic: '/ɪz/' },
            { word: 'my', meaning: '我的', phonetic: '/maɪ/' },
            { word: 'your', meaning: '你的', phonetic: '/jɔːr/' }
          ]
        },
        {
          name: 'Unit 2 Colours',
          words: [
            { word: 'red', meaning: '红色', phonetic: '/red/' },
            { word: 'yellow', meaning: '黄色', phonetic: '/ˈjeləʊ/' },
            { word: 'green', meaning: '绿色', phonetic: '/ɡriːn/' },
            { word: 'blue', meaning: '蓝色', phonetic: '/bluː/' },
            { word: 'black', meaning: '黑色', phonetic: '/blæk/' },
            { word: 'white', meaning: '白色', phonetic: '/waɪt/' },
            { word: 'orange', meaning: '橙色', phonetic: '/ˈɒrɪndʒ/' },
            { word: 'brown', meaning: '棕色', phonetic: '/braʊn/' }
          ]
        }
      ]
    }
  ],
  chinese: [
    {
      gradeLevel: 'primary',
      version: '部编版',
      name: '部编版语文一年级上册',
      units: [
        {
          name: '识字一',
          words: [
            { word: '一', meaning: '数字一', pinyin: 'yī' },
            { word: '二', meaning: '数字二', pinyin: 'èr' },
            { word: '三', meaning: '数字三', pinyin: 'sān' },
            { word: '上', meaning: '上面', pinyin: 'shàng' },
            { word: '下', meaning: '下面', pinyin: 'xià' },
            { word: '口', meaning: '嘴巴', pinyin: 'kǒu' },
            { word: '目', meaning: '眼睛', pinyin: 'mù' },
            { word: '耳', meaning: '耳朵', pinyin: 'ěr' },
            { word: '手', meaning: '手', pinyin: 'shǒu' },
            { word: '日', meaning: '太阳/日子', pinyin: 'rì' }
          ]
        },
        {
          name: '识字二',
          words: [
            { word: '月', meaning: '月亮/月份', pinyin: 'yuè' },
            { word: '水', meaning: '水', pinyin: 'shuǐ' },
            { word: '火', meaning: '火', pinyin: 'huǒ' },
            { word: '山', meaning: '山', pinyin: 'shān' },
            { word: '石', meaning: '石头', pinyin: 'shí' },
            { word: '田', meaning: '田地', pinyin: 'tián' },
            { word: '禾', meaning: '禾苗', pinyin: 'hé' }
          ]
        }
      ]
    }
  ]
}

let seeded = false

export function seedPresetData() {
  if (seeded) return
  const count = db.prepare('SELECT COUNT(*) as cnt FROM preset_textbooks').get() as any
  if (count.cnt > 0) { seeded = true; return }

  const now = new Date().toISOString()
  const insertTextbook = db.prepare('INSERT INTO preset_textbooks (id, grade_level, subject, version, name, created_at) VALUES (?, ?, ?, ?, ?, ?)')
  const insertUnit = db.prepare('INSERT INTO preset_units (id, textbook_id, name, content_type, order_num, word_count) VALUES (?, ?, ?, ?, ?, ?)')
  const insertWord = db.prepare('INSERT INTO preset_words (id, unit_id, word, meaning, pinyin, phonetic, audio_url, lesson) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')

  for (const [subject, textbooks] of Object.entries(SEED_DATA)) {
    for (const tb of textbooks as any[]) {
      const tbId = uuidv4()
      insertTextbook.run(tbId, tb.gradeLevel, subject, tb.version, tb.name, now)
      tb.units.forEach((u: any, ui: number) => {
        const uId = uuidv4()
        insertUnit.run(uId, tbId, u.name, 'word', ui, u.words.length)
        u.words.forEach((w: any, wi: number) => {
          insertWord.run(uuidv4(), uId, w.word, w.meaning, w.pinyin || '', w.phonetic || '', '', wi + 1)
        })
      })
    }
  }
  seeded = true
}

export function listFilters() {
  return {
    code: 0,
    data: {
      gradeLevels: [
        { value: 'primary', label: '小学' },
        { value: 'junior', label: '初中' },
        { value: 'senior', label: '高中' }
      ],
      subjects: [
        { value: 'english', label: '英语' },
        { value: 'chinese', label: '语文' }
      ]
    }
  }
}

export function listTextbooks(gradeLevel?: string, subject?: string, version?: string) {
  let sql = 'SELECT * FROM preset_textbooks WHERE 1=1'
  const params: any[] = []
  if (gradeLevel) { sql += ' AND grade_level = ?'; params.push(gradeLevel) }
  if (subject) { sql += ' AND subject = ?'; params.push(subject) }
  if (version) { sql += ' AND version = ?'; params.push(version) }
  const rows = db.prepare(sql).all(...params) as any[]
  return {
    code: 0,
    data: rows.map(r => ({
      id: r.id, gradeLevel: r.grade_level, subject: r.subject, version: r.version, name: r.name
    }))
  }
}

export function listPresetUnits(textbookId: string, contentType?: string) {
  let sql = 'SELECT * FROM preset_units WHERE textbook_id = ?'
  const params: any[] = [textbookId]
  if (contentType) { sql += ' AND content_type = ?'; params.push(contentType) }
  sql += ' ORDER BY order_num ASC'
  const rows = db.prepare(sql).all(...params) as any[]
  return {
    code: 0,
    data: rows.map(r => ({
      id: r.id, textbookId: r.textbook_id, name: r.name, contentType: r.content_type, order: r.order_num, wordCount: r.word_count
    }))
  }
}

export function previewPresetWords(unitId: string, limit = 20) {
  const rows = db.prepare('SELECT * FROM preset_words WHERE unit_id = ? ORDER BY lesson ASC LIMIT ?').all(unitId, Math.min(Number(limit) || 20, 100)) as any[]
  return {
    code: 0,
    data: rows.map(r => ({
      id: r.id, unitId: r.unit_id, word: r.word, meaning: r.meaning, pinyin: r.pinyin || '', phonetic: r.phonetic || '', audioUrl: r.audio_url || '', lesson: r.lesson
    }))
  }
}

export function importPresetUnits(presetUnitIds: string[], userId: string) {
  if (!Array.isArray(presetUnitIds) || presetUnitIds.length === 0) {
    return { code: 2, message: '请选择要导入的单元' }
  }

  let imported = 0
  const now = new Date().toISOString()
  const insertUnit = db.prepare(
    'INSERT INTO units (id, name, subject, grade, semester, textbook, order_num, word_count, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertWord = db.prepare(
    'INSERT INTO words (id, unit_id, word, meaning, pinyin, phonetic, part_of_speech, audio_url, lesson, difficulty, examples, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, \'[]\', ?, ?)'
  )

  for (const puId of presetUnitIds) {
    const pu = db.prepare('SELECT * FROM preset_units WHERE id = ?').get(puId) as any
    if (!pu) continue
    const tb = db.prepare('SELECT * FROM preset_textbooks WHERE id = ?').get(pu.textbook_id) as any
    if (!tb) continue

    const newUnitId = uuidv4()
    const words = db.prepare('SELECT * FROM preset_words WHERE unit_id = ? ORDER BY lesson ASC').all(puId) as any[]
    insertUnit.run(newUnitId, pu.name, tb.subject, tb.grade_level || '', '', tb.name, pu.order_num || 0, words.length, userId, now, now)

    for (const pw of words) {
      insertWord.run(uuidv4(), newUnitId, pw.word, pw.meaning, pw.pinyin || '', pw.phonetic || '', '', pw.audio_url || '', pw.lesson || 1, 3, userId, now)
      imported++
    }
  }

  return { code: 0, message: `成功导入 ${presetUnitIds.length} 个单元，共 ${imported} 个单词`, data: { importedUnits: presetUnitIds.length, importedWords: imported } }
}

import { v4 as uuidv4 } from 'uuid'
import db from '../db/index.js'
import { ALLOWED_SUBJECTS } from '../../shared/constants.js'
import type { Unit, Subject } from '../../shared/types.js'

const MAX_NAME_LENGTH = 100

function safeJsonParse<T>(str: string, fallback: T): T {
  try { return JSON.parse(str || 'null') ?? fallback } catch { return fallback }
}

function rowToUnit(row: any): Unit {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    grade: row.grade || '',
    semester: row.semester || '',
    textbook: row.textbook || '',
    order: row.order_num || 0,
    wordCount: row.word_count || 0,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function createUnit(unit: Partial<Unit>, userId: string) {
  const { name, subject, grade = '', semester = '', textbook = '', order = 0 } = unit
  if (!name || !name.trim()) return { code: 2, message: '单元名称不能为空' }
  if (name.trim().length > MAX_NAME_LENGTH) return { code: 2, message: `单元名称不能超过 ${MAX_NAME_LENGTH} 个字符` }
  if (!ALLOWED_SUBJECTS.includes(subject as Subject)) return { code: 2, message: '学科类型不正确' }

  const id = uuidv4()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO units (id, name, subject, grade, semester, textbook, order_num, word_count, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
  ).run(id, name.trim(), subject, grade.trim(), semester.trim(), textbook.trim(), Number(order) || 0, userId, now, now)

  return { code: 0, message: '创建成功', data: rowToUnit(db.prepare('SELECT * FROM units WHERE id = ?').get(id)) }
}

export function updateUnit(unit: Partial<Unit>, userId: string) {
  const { id } = unit
  if (!id) return { code: 2, message: '缺少单元 ID' }

  const existing = db.prepare('SELECT * FROM units WHERE id = ?').get(id) as any
  if (!existing) return { code: 3, message: '单元不存在' }
  if (existing.created_by !== userId) return { code: 5, message: '无权修改他人的单元' }

  const updateData: Record<string, any> = {}
  const fields = ['name', 'subject', 'grade', 'semester', 'textbook', 'order']
  for (const field of fields) {
    if ((unit as any)[field] !== undefined) {
      const key = field === 'order' ? 'order_num' : field
      updateData[key] = field === 'order' ? Number((unit as any)[field]) || 0 : String((unit as any)[field]).trim()
    }
  }

  if (updateData.name && updateData.name.length > MAX_NAME_LENGTH) {
    return { code: 2, message: `单元名称不能超过 ${MAX_NAME_LENGTH} 个字符` }
  }
  if (updateData.subject && !ALLOWED_SUBJECTS.includes(updateData.subject)) {
    return { code: 2, message: '学科类型不正确' }
  }
  if (Object.keys(updateData).length === 0) {
    return { code: 2, message: '没有要更新的字段' }
  }
  updateData.updated_at = new Date().toISOString()

  const sets = Object.keys(updateData).map(k => `${k} = ?`).join(', ')
  const vals = Object.values(updateData)
  db.prepare(`UPDATE units SET ${sets} WHERE id = ?`).run(...vals, id)

  return { code: 0, message: '更新成功' }
}

export function deleteUnit(unitId: string, userId: string) {
  if (!unitId) return { code: 2, message: '缺少单元 ID' }

  const existing = db.prepare('SELECT * FROM units WHERE id = ?').get(unitId) as any
  if (!existing) return { code: 3, message: '单元不存在' }
  if (existing.created_by !== userId) return { code: 5, message: '无权删除他人的单元' }

  const wordCountRow = db.prepare('SELECT COUNT(*) as cnt FROM words WHERE unit_id = ?').get(unitId) as any
  const removedWords = wordCountRow?.cnt || 0

  const classes = db.prepare("SELECT id, shared_unit_ids FROM classes").all() as any[]
  for (const cls of classes) {
    try {
      const shared = safeJsonParse<string[]>(cls.shared_unit_ids, [])
      if (shared.includes(unitId)) {
        const newShared = shared.filter((id: string) => id !== unitId)
        db.prepare('UPDATE classes SET shared_unit_ids = ?, updated_at = ? WHERE id = ?')
          .run(JSON.stringify(newShared), new Date().toISOString(), cls.id)
      }
    } catch {}
  }

  db.prepare('DELETE FROM units WHERE id = ?').run(unitId)
  return { code: 0, message: '删除成功', data: { removedWords } }
}

export function listUnits(subject: string | undefined, userId: string) {
  const params: any[] = [userId]
  let whereSql = 'created_by = ?'
  if (subject && ALLOWED_SUBJECTS.includes(subject as Subject)) {
    whereSql += ' AND subject = ?'
    params.push(subject)
  }
  const myUnits = db.prepare(`SELECT * FROM units WHERE ${whereSql} ORDER BY order_num ASC, created_at DESC`).all(...params) as any[]

  const allClasses = db.prepare("SELECT * FROM classes").all() as any[]
  const myClasses = allClasses.filter(cls => {
    const members = safeJsonParse<string[]>(cls.members, [])
    return cls.created_by === userId || members.includes(userId)
  })

  const sharedIds = new Set<string>()
  myClasses.forEach(cls => {
    const shared = safeJsonParse<string[]>(cls.shared_unit_ids, [])
    shared.forEach((id: string) => sharedIds.add(id))
  })

  let sharedUnits: any[] = []
  if (sharedIds.size > 0) {
    const placeholders = Array.from(sharedIds).map(() => '?').join(',')
    const sparams: any[] = Array.from(sharedIds)
    let swhere = `id IN (${placeholders})`
    if (subject && ALLOWED_SUBJECTS.includes(subject as Subject)) {
      swhere += ' AND subject = ?'
      sparams.push(subject)
    }
    sharedUnits = db.prepare(`SELECT * FROM units WHERE ${swhere} ORDER BY order_num ASC`).all(...sparams) as any[]
  }

  const seen = new Set(myUnits.map(u => u.id))
  const merged = [...myUnits]
  sharedUnits.forEach(u => {
    if (!seen.has(u.id)) {
      seen.add(u.id)
      merged.push(u)
    }
  })

  merged.sort((a, b) => (a.order_num || 0) - (b.order_num || 0))

  return { code: 0, data: merged.map(rowToUnit) }
}

export function getUnitIfAccessible(unitId: string, userId: string): any {
  const unit = db.prepare('SELECT * FROM units WHERE id = ?').get(unitId) as any
  if (!unit) return null
  if (unit.created_by === userId) return unit

  const classes = db.prepare("SELECT * FROM classes").all() as any[]
  for (const cls of classes) {
    const members = safeJsonParse<string[]>(cls.members, [])
    const shared = safeJsonParse<string[]>(cls.shared_unit_ids, [])
    if ((cls.created_by === userId || members.includes(userId)) && shared.includes(unitId)) {
      return unit
    }
  }
  return null
}

export function syncUnitWordCount(unitId: string) {
  const row = db.prepare('SELECT COUNT(*) as cnt FROM words WHERE unit_id = ?').get(unitId) as any
  db.prepare('UPDATE units SET word_count = ?, updated_at = ? WHERE id = ?')
    .run(row?.cnt || 0, new Date().toISOString(), unitId)
}

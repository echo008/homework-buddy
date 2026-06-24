import { v4 as uuidv4 } from 'uuid'
import db from '../db/index.js'
import { ALLOWED_SUBJECTS } from '../../shared/constants.js'
import { generateUniqueCode } from '../utils/codeGenerator.js'
import type { ClassInfo, Subject } from '../../shared/types.js'

function safeJson(str: string, fallback: any) {
  try { return JSON.parse(str || 'null') ?? fallback } catch { return fallback }
}

function rowToClass(row: any, userId?: string): ClassInfo {
  const members = safeJson(row.members, [])
  const sharedUnitIds = safeJson(row.shared_unit_ids, [])
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    code: row.code,
    createdBy: row.created_by,
    members,
    sharedUnitIds,
    memberCount: members.length,
    isCreator: userId ? row.created_by === userId : false,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function createClass(name: string, subject: Subject, userId: string) {
  if (!name || !name.trim()) return { code: 2, message: '班级名称不能为空' }
  if (!ALLOWED_SUBJECTS.includes(subject)) return { code: 2, message: '学科类型不正确' }

  const code = generateUniqueCode()
  const id = uuidv4()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO classes (id, name, subject, code, created_by, members, shared_unit_ids, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '[]', '[]', ?, ?)`
  ).run(id, name.trim(), subject, code, userId, now, now)

  return { code: 0, message: '班级创建成功', data: rowToClass(db.prepare('SELECT * FROM classes WHERE id = ?').get(id), userId) }
}

export function joinClass(code: string, userId: string) {
  if (!code || !code.trim()) return { code: 2, message: '班级码不能为空' }

  const rows = db.prepare('SELECT * FROM classes WHERE code = ? LIMIT 1').all(code.trim()) as any[]
  if (rows.length === 0) return { code: 3, message: '班级码不存在，请检查后重试' }

  const cls = rows[0]
  const members: string[] = safeJson(cls.members, [])
  if (members.includes(userId)) {
    return { code: 0, message: '你已在班级中', data: { classId: cls.id } }
  }
  if (members.length >= 200) return { code: 4, message: '班级人数已满' }

  members.push(userId)
  db.prepare('UPDATE classes SET members = ?, updated_at = ? WHERE id = ?')
    .run(JSON.stringify(members), new Date().toISOString(), cls.id)

  return { code: 0, message: '加入班级成功', data: { classId: cls.id } }
}

export function getClassDetail(classId: string, userId: string) {
  if (!classId) return { code: 2, message: '缺少班级 ID' }
  const row = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any
  if (!row) return { code: 3, message: '班级不存在' }

  const members = safeJson(row.members, [])
  if (!members.includes(userId) && row.created_by !== userId) {
    return { code: 5, message: '你不在该班级中' }
  }

  const cls = rowToClass(row, userId)

  // 查询共享单元详情
  if (cls.sharedUnitIds.length > 0) {
    const placeholders = cls.sharedUnitIds.map(() => '?').join(',')
    const units = db.prepare(`SELECT * FROM units WHERE id IN (${placeholders})`).all(...cls.sharedUnitIds) as any[]
    ;(cls as any).sharedUnits = units.map(u => ({
      id: u.id, name: u.name, subject: u.subject, wordCount: u.word_count
    }))
  } else {
    ;(cls as any).sharedUnits = []
  }

  // 查询成员昵称
  const creator = db.prepare('SELECT nickname FROM users WHERE id = ?').get(cls.createdBy) as any
  ;(cls as any).creatorName = creator?.nickname || ''

  return { code: 0, data: cls }
}

export function getMyClasses(userId: string) {
  const all = db.prepare('SELECT * FROM classes').all() as any[]
  const mine = all.filter(cls => {
    const members = safeJson(cls.members, [])
    return cls.created_by === userId || members.includes(userId)
  }).map(r => rowToClass(r, userId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { code: 0, data: mine }
}

export function shareUnit(classId: string, unitId: string, userId: string) {
  if (!classId || !unitId) return { code: 2, message: '缺少班级 ID 或单元 ID' }

  const clsRow = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any
  if (!clsRow) return { code: 3, message: '班级不存在' }

  const members: string[] = safeJson(clsRow.members, [])
  if (!members.includes(userId) && clsRow.created_by !== userId) {
    return { code: 5, message: '你不在该班级中，无法共享' }
  }

  const unitRow = db.prepare('SELECT * FROM units WHERE id = ?').get(unitId) as any
  if (!unitRow) return { code: 4, message: '单元不存在' }
  if (unitRow.created_by !== userId) return { code: 5, message: '只能共享自己创建的单元' }

  const shared: string[] = safeJson(clsRow.shared_unit_ids, [])
  if (shared.includes(unitId)) return { code: 0, message: '该单元已在共享列表中' }

  shared.push(unitId)
  db.prepare('UPDATE classes SET shared_unit_ids = ?, updated_at = ? WHERE id = ?')
    .run(JSON.stringify(shared), new Date().toISOString(), classId)

  return { code: 0, message: '共享成功' }
}

export function unshareUnit(classId: string, unitId: string, userId: string) {
  if (!classId || !unitId) return { code: 2, message: '缺少班级 ID 或单元 ID' }

  const clsRow = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any
  if (!clsRow) return { code: 3, message: '班级不存在' }

  const isCreator = clsRow.created_by === userId
  const unitRow = db.prepare('SELECT created_by FROM units WHERE id = ?').get(unitId) as any
  const isUnitOwner = unitRow && unitRow.created_by === userId

  if (!isCreator && !isUnitOwner) return { code: 5, message: '无权取消共享' }

  const shared: string[] = safeJson(clsRow.shared_unit_ids, [])
  const newShared = shared.filter(id => id !== unitId)
  db.prepare('UPDATE classes SET shared_unit_ids = ?, updated_at = ? WHERE id = ?')
    .run(JSON.stringify(newShared), new Date().toISOString(), classId)

  return { code: 0, message: '取消共享成功' }
}

export function leaveClass(classId: string, userId: string) {
  if (!classId) return { code: 2, message: '缺少班级 ID' }
  const clsRow = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any
  if (!clsRow) return { code: 3, message: '班级不存在' }
  if (clsRow.created_by === userId) return { code: 6, message: '班级创建者请使用"解散班级"功能' }

  const members: string[] = safeJson(clsRow.members, [])
  if (!members.includes(userId)) return { code: 0, message: '你已不在该班级中' }

  const newMembers = members.filter(m => m !== userId)
  db.prepare('UPDATE classes SET members = ?, updated_at = ? WHERE id = ?')
    .run(JSON.stringify(newMembers), new Date().toISOString(), classId)

  return { code: 0, message: '已退出班级' }
}

export function dismissClass(classId: string, userId: string) {
  if (!classId) return { code: 2, message: '缺少班级 ID' }
  const clsRow = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any
  if (!clsRow) return { code: 3, message: '班级不存在' }
  if (clsRow.created_by !== userId) return { code: 5, message: '只有班级创建者可以解散班级' }

  db.prepare('DELETE FROM classes WHERE id = ?').run(classId)
  return { code: 0, message: '班级已解散' }
}

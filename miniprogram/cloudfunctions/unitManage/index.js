// cloudfunctions/unitManage/index.js
// 单元管理：创建、编辑、删除、列表

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const ALLOWED_SUBJECTS = ['english', 'chinese']

exports.main = async (event) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID || ''

  try {
    switch (action) {
      case 'create':
        return await createUnit(event.unit, openid)
      case 'update':
        return await updateUnit(event.unit, openid)
      case 'delete':
        return await deleteUnit(event.unitId, openid)
      case 'list':
        return await listUnits(event.subject)
      default:
        return { code: 1, message: '未知操作类型' }
    }
  } catch (err) {
    console.error('unitManage error:', err)
    return { code: -1, message: '操作失败，请稍后重试', error: err.message }
  }
}

async function createUnit(unit = {}, openid) {
  const { name, subject, grade = '', semester = '', textbook = '', order = 0 } = unit

  if (!name || !name.trim()) {
    return { code: 2, message: '单元名称不能为空' }
  }
  if (!ALLOWED_SUBJECTS.includes(subject)) {
    return { code: 2, message: '学科类型不正确' }
  }

  const now = new Date().toISOString()
  const data = {
    name: name.trim(),
    subject,
    grade: grade.trim(),
    semester: semester.trim(),
    textbook: textbook.trim(),
    order: Number(order) || 0,
    lessonCount: 0,
    wordCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: openid
  }

  const { _id } = await db.collection('units').add({ data })
  return { code: 0, message: '创建成功', data: { _id, ...data } }
}

async function updateUnit(unit = {}, openid) {
  const { _id } = unit
  if (!_id) return { code: 2, message: '缺少单元 ID' }

  const updateData = {}
  const fields = ['name', 'subject', 'grade', 'semester', 'textbook', 'order']
  fields.forEach((field) => {
    if (unit[field] !== undefined) {
      updateData[field] = field === 'order' ? Number(unit[field]) || 0 : String(unit[field]).trim()
    }
  })

  if (Object.keys(updateData).length === 0) {
    return { code: 2, message: '没有要更新的字段' }
  }

  updateData.updatedAt = new Date().toISOString()

  await db.collection('units').doc(_id).update({ data: updateData })
  return { code: 0, message: '更新成功' }
}

async function deleteUnit(unitId, openid) {
  if (!unitId) return { code: 2, message: '缺少单元 ID' }

  // 删除单元下的所有单词，避免产生孤立数据
  const batchLimit = 100
  let removed = 0
  let hasMore = true
  while (hasMore) {
    const { data } = await db.collection('words')
      .where({ unitId })
      .limit(batchLimit)
      .field({ _id: true })
      .get()

    if (data.length === 0) {
      hasMore = false
      break
    }

    for (const item of data) {
      await db.collection('words').doc(item._id).remove()
      removed += 1
    }
    if (data.length < batchLimit) hasMore = false
  }

  await db.collection('units').doc(unitId).remove()

  return { code: 0, message: '删除成功', data: { removedWords: removed } }
}

async function listUnits(subject) {
  const where = {}
  if (ALLOWED_SUBJECTS.includes(subject)) where.subject = subject

  const { data } = await db.collection('units')
    .where(where)
    .orderBy('order', 'asc')
    .orderBy('createdAt', 'desc')
    .get()

  return { code: 0, data }
}

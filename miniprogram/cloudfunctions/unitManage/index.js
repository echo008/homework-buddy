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
        return await listUnits(event.subject, openid)
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

  // 权限校验：仅创建者可修改自己的单元
  const existing = await db.collection('units').doc(_id).get()
  const current = existing.data || {}
  if (!current._id) {
    return { code: 3, message: '单元不存在' }
  }
  if (current.createdBy !== openid) {
    return { code: 5, message: '无权修改他人的单元' }
  }

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

  // 权限校验：仅创建者可删除自己的单元
  const existing = await db.collection('units').doc(unitId).get()
  const current = existing.data || {}
  if (!current._id) {
    return { code: 3, message: '单元不存在' }
  }
  if (current.createdBy !== openid) {
    return { code: 5, message: '无权删除他人的单元' }
  }

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

  // 同步从所有班级的共享列表中移除该单元
  try {
    const { data: classes } = await db.collection('classes')
      .where({ sharedUnitIds: unitId })
      .field({ _id: true })
      .get()
    for (const cls of classes) {
      await db.collection('classes').doc(cls._id).update({
        data: { sharedUnitIds: _.pull(unitId), updatedAt: new Date().toISOString() }
      })
    }
  } catch (err) {
    console.error('清理班级共享引用失败:', err)
  }

  await db.collection('units').doc(unitId).remove()

  return { code: 0, message: '删除成功', data: { removedWords: removed } }
}

async function listUnits(subject, openid) {
  const where = {}
  if (ALLOWED_SUBJECTS.includes(subject)) where.subject = subject

  // 分页查询当前用户创建的单元（避免单次 100 条限制）
  const myUnits = await paginateQuery(
    db.collection('units')
      .where({ ...where, createdBy: openid })
      .orderBy('order', 'asc')
      .orderBy('createdAt', 'desc')
  )

  // 分页查询当前用户所在班级
  const myClasses = await paginateQuery(
    db.collection('classes')
      .where(_.or([
        { createdBy: openid },
        { members: openid }
      ]))
      .field({ sharedUnitIds: true })
  )

  const sharedUnitIds = new Set()
  myClasses.forEach(cls => {
    (cls.sharedUnitIds || []).forEach(id => sharedUnitIds.add(id))
  })

  let sharedUnits = []
  if (sharedUnitIds.size > 0) {
    sharedUnits = await paginateQuery(
      db.collection('units')
        .where({ ...where, _id: _.in(Array.from(sharedUnitIds)) })
        .orderBy('order', 'asc')
    )
  }

  // 合并去重（自己创建的 + 班级共享的）
  const seenIds = new Set(myUnits.map(u => u._id))
  const merged = [...myUnits]
  sharedUnits.forEach(u => {
    if (!seenIds.has(u._id)) {
      seenIds.add(u._id)
      merged.push(u)
    }
  })

  // 按排序号排序
  merged.sort((a, b) => (a.order || 0) - (b.order || 0))

  return { code: 0, data: merged }
}

/**
 * 分页查询工具：自动翻页直到取完所有数据
 * @param {Object} queryChain 已组装好 where/orderBy/field 的查询链
 * @param {number} pageSize 每页大小
 * @returns {Promise<Array>}
 */
async function paginateQuery(queryChain, pageSize = 100) {
  let allData = []
  let hasMore = true
  while (hasMore) {
    const { data } = await queryChain.skip(allData.length).limit(pageSize).get()
    allData = allData.concat(data)
    if (data.length < pageSize) hasMore = false
  }
  return allData
}

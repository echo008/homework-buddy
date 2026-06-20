// cloudfunctions/classManage/index.js
// 班级共享：创建、加入、查看、共享词库、退出/解散班级
//
// 📌 数据库索引建议（云开发控制台 → 数据库 → 索引管理）：
//   classes 集合：
//     - { createdBy: 1 }              按创建者查询
//     - { members: 1 }                按成员查询（数组索引）
//     - { sharedUnitIds: 1 }          按共享单元查询
//     - { code: 1 }                   按班级码查询（唯一）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const { ALLOWED_SUBJECTS } = require('../common/constants.js')
const MAX_MEMBERS = 200

exports.main = async (event) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID || ''

  try {
    switch (action) {
      case 'create':
        return await createClass(event.name, event.subject, openid)
      case 'join':
        return await joinClass(event.code, openid)
      case 'get':
        return await getClassDetail(event.classId, openid)
      case 'myClasses':
        return await getMyClasses(openid)
      case 'shareUnit':
        return await shareUnit(event.classId, event.unitId, openid)
      case 'unshareUnit':
        return await unshareUnit(event.classId, event.unitId, openid)
      case 'leave':
        return await leaveClass(event.classId, openid)
      case 'dismiss':
        return await dismissClass(event.classId, openid)
      default:
        return { code: 1, message: '未知操作类型' }
    }
  } catch (err) {
    console.error('classManage error:', err)
    return { code: -1, message: '操作失败，请稍后重试', error: err.message }
  }
}

async function createClass(name, subject, openid) {
  if (!name || !name.trim()) {
    return { code: 2, message: '班级名称不能为空' }
  }
  if (!ALLOWED_SUBJECTS.includes(subject)) {
    return { code: 2, message: '学科类型不正确' }
  }

  const code = await generateUniqueCode()
  const now = new Date().toISOString()
  const data = {
    name: name.trim(),
    subject,
    code,
    createdBy: openid,
    members: [openid],
    sharedUnitIds: [],
    createdAt: now,
    updatedAt: now
  }

  const { _id } = await db.collection('classes').add({ data })
  return { code: 0, message: '班级创建成功', data: { _id, ...data } }
}

async function joinClass(code, openid) {
  if (!code || !code.trim()) {
    return { code: 2, message: '班级码不能为空' }
  }

  const { data } = await db.collection('classes')
    .where({ code: code.trim() })
    .limit(1)
    .get()

  if (data.length === 0) {
    return { code: 3, message: '班级码不存在，请检查后重试' }
  }

  const cls = data[0]
  if (cls.members && cls.members.includes(openid)) {
    return { code: 0, message: '你已在班级中', data: { classId: cls._id } }
  }

  // 班级人数上限保护
  const memberCount = (cls.members || []).length
  if (memberCount >= MAX_MEMBERS) {
    return { code: 4, message: '班级人数已满' }
  }

  await db.collection('classes').doc(cls._id).update({
    data: {
      members: _.push(openid),
      updatedAt: new Date().toISOString()
    }
  })

  return { code: 0, message: '加入班级成功', data: { classId: cls._id } }
}

async function getClassDetail(classId, openid) {
  if (!classId) return { code: 2, message: '缺少班级 ID' }

  const { data } = await db.collection('classes').doc(classId).get()
  if (!data) {
    return { code: 3, message: '班级不存在' }
  }

  // 权限校验：仅成员可查看详情
  const members = data.members || []
  if (!members.includes(openid) && data.createdBy !== openid) {
    return { code: 5, message: '你不在该班级中' }
  }

  // 共享单元列表（分页查询）
  let sharedUnits = []
  if (data.sharedUnitIds && data.sharedUnitIds.length > 0) {
    sharedUnits = await paginateQuery(
      db.collection('units')
        .where({ _id: _.in(data.sharedUnitIds) })
        .orderBy('order', 'asc')
    )
  }

  return {
    code: 0,
    data: {
      ...data,
      sharedUnits,
      isCreator: data.createdBy === openid
    }
  }
}

async function getMyClasses(openid) {
  // members 是数组，用 _.or 匹配；分页查询避免 100 条限制
  const data = await paginateQuery(
    db.collection('classes')
      .where(_.or([
        { createdBy: openid },
        { members: openid }
      ]))
      .orderBy('createdAt', 'desc')
  )

  return { code: 0, data }
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

async function shareUnit(classId, unitId, openid) {
  if (!classId || !unitId) {
    return { code: 2, message: '缺少班级 ID 或单元 ID' }
  }

  const clsRes = await db.collection('classes').doc(classId).get()
  const cls = clsRes.data
  if (!cls) return { code: 3, message: '班级不存在' }

  // 权限校验：仅班级成员可共享
  const members = cls.members || []
  if (!members.includes(openid) && cls.createdBy !== openid) {
    return { code: 5, message: '你不在该班级中，无法共享' }
  }

  // 校验单元是否属于当前用户
  const unitRes = await db.collection('units').doc(unitId).get()
  if (!unitRes.data) {
    return { code: 4, message: '单元不存在' }
  }
  if (unitRes.data.createdBy !== openid) {
    return { code: 5, message: '只能共享自己创建的单元' }
  }

  const shared = cls.sharedUnitIds || []
  if (shared.includes(unitId)) {
    return { code: 0, message: '该单元已在共享列表中' }
  }

  await db.collection('classes').doc(classId).update({
    data: {
      sharedUnitIds: _.push(unitId),
      updatedAt: new Date().toISOString()
    }
  })

  return { code: 0, message: '共享成功' }
}

async function unshareUnit(classId, unitId, openid) {
  if (!classId || !unitId) {
    return { code: 2, message: '缺少班级 ID 或单元 ID' }
  }

  const clsRes = await db.collection('classes').doc(classId).get()
  const cls = clsRes.data
  if (!cls) return { code: 3, message: '班级不存在' }

  // 权限校验：仅创建者或单元所有者可取消共享
  const isCreator = cls.createdBy === openid
  const unitRes = await db.collection('units').doc(unitId).get()
  const isUnitOwner = unitRes.data && unitRes.data.createdBy === openid

  if (!isCreator && !isUnitOwner) {
    return { code: 5, message: '无权取消共享' }
  }

  await db.collection('classes').doc(classId).update({
    data: {
      sharedUnitIds: _.pull(unitId),
      updatedAt: new Date().toISOString()
    }
  })

  return { code: 0, message: '取消共享成功' }
}

// 退出班级
async function leaveClass(classId, openid) {
  if (!classId) return { code: 2, message: '缺少班级 ID' }

  const clsRes = await db.collection('classes').doc(classId).get()
  const cls = clsRes.data
  if (!cls) return { code: 3, message: '班级不存在' }

  // 创建者不能退出（需解散班级）
  if (cls.createdBy === openid) {
    return { code: 6, message: '班级创建者请使用"解散班级"功能' }
  }

  const members = cls.members || []
  if (!members.includes(openid)) {
    return { code: 0, message: '你已不在该班级中' }
  }

  await db.collection('classes').doc(classId).update({
    data: {
      members: _.pull(openid),
      updatedAt: new Date().toISOString()
    }
  })

  return { code: 0, message: '已退出班级' }
}

// 解散班级（仅创建者可操作，删除班级记录，不影响单元与单词）
async function dismissClass(classId, openid) {
  if (!classId) return { code: 2, message: '缺少班级 ID' }

  const clsRes = await db.collection('classes').doc(classId).get()
  const cls = clsRes.data
  if (!cls) return { code: 3, message: '班级不存在' }

  if (cls.createdBy !== openid) {
    return { code: 5, message: '只有班级创建者可以解散班级' }
  }

  await db.collection('classes').doc(classId).remove()

  return { code: 0, message: '班级已解散' }
}

async function generateUniqueCode() {
  let code = ''
  let exists = true
  let attempts = 0
  const maxAttempts = 100
  while (exists && attempts < maxAttempts) {
    code = Math.floor(100000 + Math.random() * 900000).toString()
    const { total } = await db.collection('classes').where({ code }).count()
    exists = total > 0
    attempts++
  }
  if (exists) {
    throw new Error('无法生成唯一班级码，请重试')
  }
  return code
}

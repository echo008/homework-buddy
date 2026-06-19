// cloudfunctions/classManage/index.js
// 班级共享：创建、加入、查看、共享词库

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

  // 共享单元列表
  let sharedUnits = []
  if (data.sharedUnitIds && data.sharedUnitIds.length > 0) {
    const res = await db.collection('units')
      .where({ _id: _.in(data.sharedUnitIds) })
      .orderBy('order', 'asc')
      .get()
    sharedUnits = res.data
  }

  return {
    code: 0,
    data: { ...data, sharedUnits }
  }
}

async function getMyClasses(openid) {
  const { data } = await db.collection('classes')
    .where(_.or([
      { createdBy: openid },
      { members: openid }
    ]))
    .orderBy('createdAt', 'desc')
    .get()

  return { code: 0, data }
}

async function shareUnit(classId, unitId, openid) {
  if (!classId || !unitId) {
    return { code: 2, message: '缺少班级 ID 或单元 ID' }
  }

  const cls = await db.collection('classes').doc(classId).get()
  if (!cls.data) return { code: 3, message: '班级不存在' }

  // 仅创建者或班级成员可共享自己创建的单元
  const shared = cls.data.sharedUnitIds || []
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

  await db.collection('classes').doc(classId).update({
    data: {
      sharedUnitIds: _.pull(unitId),
      updatedAt: new Date().toISOString()
    }
  })

  return { code: 0, message: '取消共享成功' }
}

async function generateUniqueCode() {
  let code = ''
  let exists = true
  while (exists) {
    code = Math.floor(100000 + Math.random() * 900000).toString()
    const { total } = await db.collection('classes').where({ code }).count()
    exists = total > 0
  }
  return code
}

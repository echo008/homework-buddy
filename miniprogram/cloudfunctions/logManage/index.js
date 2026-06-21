// cloudfunctions/logManage/index.js
// 听写记录管理：保存与查询（服务端读写，安全加固）
//
// 📌 数据库索引建议（云开发控制台 → 数据库 → 索引管理）：
//   userLogs 集合：
//     - { openid: 1, createdAt: -1 }  按用户+时间倒序查询

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const { ALLOWED_SUBJECTS, ALLOWED_MODES, SUBJECTS, MODES } = require('../common/constants.js')

exports.main = async (event) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID || ''

  if (!openid) {
    return { code: 5, message: '用户未登录' }
  }

  try {
    switch (action) {
      case 'save':
        return await saveLog(event.log, openid)
      case 'list':
        return await listLogs(openid, event.limit)
      default:
        return { code: 1, message: '未知操作类型' }
    }
  } catch (err) {
    console.error('logManage error:', err)
    return { code: -1, message: '操作失败，请稍后重试', error: err.message }
  }
}

async function saveLog(log = {}, openid) {
  const {
    unitIds = [],
    subject = SUBJECTS.ENGLISH,
    mode = MODES.EN2CN,
    wordCountRange = {},
    totalWords = 0,
    correctCount = 0,
    wrongCount = 0,
    accuracy = 0,
    wrongWords = [],
    questions = [],
    status = 'completed'
  } = log

  if (!ALLOWED_SUBJECTS.includes(subject)) {
    return { code: 2, message: '学科类型不正确' }
  }
  if (!ALLOWED_MODES.includes(mode)) {
    return { code: 2, message: '听写模式不正确' }
  }

  const now = new Date().toISOString()
  const data = {
    openid,
    unitIds: Array.isArray(unitIds) ? unitIds : [],
    subject,
    mode,
    wordCountRange: {
      min: Number(wordCountRange.min) || 0,
      max: Number(wordCountRange.max) || 0
    },
    totalWords: Number(totalWords) || 0,
    correctCount: Number(correctCount) || 0,
    wrongCount: Number(wrongCount) || 0,
    accuracy: Number(accuracy) || 0,
    wrongWords: Array.isArray(wrongWords) ? wrongWords : [],
    questions: Array.isArray(questions) ? questions : [],
    status,
    createdAt: now,
    updatedAt: now
  }

  const { _id } = await db.collection('userLogs').add({ data })
  return { code: 0, message: '保存成功', data: { _id, ...data } }
}

async function listLogs(openid, limit = 20) {
  const maxLimit = Math.min(Number(limit) || 20, 100)

  // 分页查询，避免单次 100 条限制；最后一页按需取剩余数量，减少传输
  let allData = []
  let hasMore = true
  while (hasMore && allData.length < maxLimit) {
    const pageSize = Math.min(100, maxLimit - allData.length)
    const { data } = await db.collection('userLogs')
      .where({ openid })
      .orderBy('createdAt', 'desc')
      .skip(allData.length)
      .limit(pageSize)
      .get()
    allData = allData.concat(data)
    if (data.length < pageSize) hasMore = false
  }

  return { code: 0, data: allData }
}

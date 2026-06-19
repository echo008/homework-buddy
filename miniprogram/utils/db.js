// utils/db.js - 云数据库操作封装
// 统一封装集合调用，便于维护与错误处理

function getDb() {
  if (!getDb._db) {
    getDb._db = wx.cloud.database()
  }
  return getDb._db
}

/**
 * 集合名常量，避免硬编码拼写错误
 */
const COLLECTIONS = {
  WORDS: 'words',
  UNITS: 'units',
  USER_LOGS: 'userLogs'
}

/**
 * 查询单元列表
 * @param {Object} options { subject, grade, semester }
 * @returns {Promise<Array>} 单元列表
 */
async function getUnits(options = {}) {
  try {
    const { subject, grade, semester } = options
    const where = {}
    if (subject) where.subject = subject
    if (grade) where.grade = grade
    if (semester) where.semester = semester

    const { data } = await getDb().collection(COLLECTIONS.UNITS)
      .where(where)
      .orderBy('order', 'asc')
      .get()
    return data
  } catch (err) {
    console.error('getUnits error:', err)
    throw err
  }
}

/**
 * 查询单元下的单词数
 * @param {string} unitId
 * @returns {Promise<number>}
 */
async function getWordCountByUnit(unitId) {
  try {
    const { total } = await getDb().collection(COLLECTIONS.WORDS)
      .where({ unitId })
      .count()
    return total
  } catch (err) {
    console.error('getWordCountByUnit error:', err)
    return 0
  }
}

/**
 * 保存听写记录到 userLogs
 * @param {Object} logData 听写记录
 * @returns {Promise<string>} 记录ID
 */
async function saveUserLog(logData) {
  try {
    const { _id } = await getDb().collection(COLLECTIONS.USER_LOGS).add({
      data: {
        ...logData,
        createdAt: new Date().toISOString()
      }
    })
    return _id
  } catch (err) {
    console.error('saveUserLog error:', err)
    throw err
  }
}

/**
 * 查询用户历史听写记录（错题本/历史）
 * @param {string} openid
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function getUserLogs(openid, limit = 20) {
  try {
    const { data } = await getDb().collection(COLLECTIONS.USER_LOGS)
      .where({ openid })
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()
    return data
  } catch (err) {
    console.error('getUserLogs error:', err)
    throw err
  }
}

module.exports = {
  COLLECTIONS,
  getDb,
  getUnits,
  getWordCountByUnit,
  saveUserLog,
  getUserLogs
}

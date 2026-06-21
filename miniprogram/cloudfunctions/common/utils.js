// cloudfunctions/common/utils.js
// 云函数通用工具：分页查询、单元权限校验等

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

/**
 * 判断单个单元是否对当前用户可见（自己创建或所在班级共享）
 * @param {string} unitId
 * @param {string} openid
 * @param {Object} db 云数据库实例
 * @returns {Promise<boolean>}
 */
async function isUnitAccessible(unitId, openid, db) {
  try {
    const unitRes = await db.collection('units').doc(unitId).get()
    if (unitRes.data && unitRes.data.createdBy === openid) return true

    const { data: classes } = await db.collection('classes')
      .where({ sharedUnitIds: unitId, members: openid })
      .limit(1)
      .field({ _id: true })
      .get()
    return classes.length > 0
  } catch (err) {
    console.error('校验单元访问权限失败:', err)
    return false
  }
}

/**
 * 获取当前用户可访问的单元ID集合（自己创建的 + 所在班级共享的）
 * @param {string} openid
 * @param {string} subject 学科过滤，空字符串表示不过滤
 * @param {Object} db 云数据库实例
 * @param {Object} _ db.command
 * @returns {Promise<Set<string>>}
 */
async function getAccessibleUnitIds(openid, subject, db, _) {
  const where = {}
  if (subject) where.subject = subject

  const myUnits = await paginateQuery(
    db.collection('units')
      .where({ ...where, createdBy: openid })
      .field({ _id: true })
  )

  const myClasses = await paginateQuery(
    db.collection('classes')
      .where(_.or([{ createdBy: openid }, { members: openid }]))
      .field({ sharedUnitIds: true })
  )

  const sharedIds = new Set()
  myClasses.forEach(cls => {
    (cls.sharedUnitIds || []).forEach(id => sharedIds.add(id))
  })

  let sharedUnits = []
  if (sharedIds.size > 0) {
    sharedUnits = await paginateQuery(
      db.collection('units')
        .where({ ...where, _id: _.in(Array.from(sharedIds)) })
        .field({ _id: true })
    )
  }

  const idSet = new Set()
  myUnits.forEach(u => idSet.add(u._id))
  sharedUnits.forEach(u => idSet.add(u._id))
  return idSet
}

module.exports = {
  paginateQuery,
  isUnitAccessible,
  getAccessibleUnitIds
}

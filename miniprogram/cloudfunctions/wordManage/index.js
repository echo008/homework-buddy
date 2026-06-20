// cloudfunctions/wordManage/index.js
// 单词管理：创建、编辑、删除、列表
//
// 📌 数据库索引建议（云开发控制台 → 数据库 → 索引管理）：
//   words 集合：
//     - { unitId: 1 }               单元下单词查询
//     - { unitId: 1, word: 1 }      去重校验
//     - { createdBy: 1 }            按创建者查询
//     - { subject: 1, unitId: 1 }   按学科+单元筛选

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const ALLOWED_SUBJECTS = ['english', 'chinese']

exports.main = async (event) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID || ''

  try {
    switch (action) {
      case 'create':
        return await createWord(event.word, openid)
      case 'update':
        return await updateWord(event.word, openid)
      case 'delete':
        return await deleteWord(event.wordId, openid)
      case 'list':
        return await listWords(event.unitId, openid)
      default:
        return { code: 1, message: '未知操作类型' }
    }
  } catch (err) {
    console.error('wordManage error:', err)
    return { code: -1, message: '操作失败，请稍后重试', error: err.message }
  }
}

async function createWord(word = {}, openid) {
  const {
    word: text,
    meaning,
    unitId,
    subject = 'english',
    pinyin = '',
    lesson = 1,
    partOfSpeech = '',
    phonetic = '',
    audioUrl = '',
    difficulty = 3
  } = word

  if (!text || !text.trim() || !meaning || !meaning.trim() || !unitId) {
    return { code: 2, message: '单词/释义/单元ID 不能为空' }
  }
  if (!ALLOWED_SUBJECTS.includes(subject)) {
    return { code: 2, message: '学科类型不正确' }
  }

  // 权限校验：仅单元创建者可往该单元添加单词
  const unitRes = await db.collection('units').doc(unitId).get()
  const unit = unitRes.data
  if (!unit) {
    return { code: 4, message: '单元不存在' }
  }
  if (unit.createdBy !== openid) {
    return { code: 5, message: '无权向他人的单元添加单词' }
  }

  const { total } = await db.collection('words').where({ word: text.trim(), unitId }).count()
  if (total > 0) {
    return { code: 3, message: '该单元下已存在相同单词' }
  }

  const now = new Date().toISOString()
  const data = {
    word: text.trim(),
    meaning: meaning.trim(),
    unitId,
    subject,
    pinyin: pinyin.trim(),
    lesson: Number(lesson) || 1,
    partOfSpeech: partOfSpeech.trim(),
    phonetic: phonetic.trim(),
    audioUrl: audioUrl.trim(),
    difficulty: Number(difficulty) || 3,
    examples: [],
    source: 'manual',
    createdAt: now,
    updatedAt: now,
    createdBy: openid
  }

  const { _id } = await db.collection('words').add({ data })
  await syncUnitWordCount(unitId)

  return { code: 0, message: '添加成功', data: { _id, ...data } }
}

async function updateWord(word = {}, openid) {
  const { _id } = word
  if (!_id) return { code: 2, message: '缺少单词 ID' }

  // 权限校验：仅创建者可修改自己的单词
  const existing = await db.collection('words').doc(_id).get()
  const current = existing.data || {}
  if (!current._id) {
    return { code: 3, message: '单词不存在' }
  }
  if (current.createdBy !== openid) {
    return { code: 5, message: '无权修改他人的单词' }
  }

  const updateData = {}
  const fields = ['word', 'meaning', 'pinyin', 'lesson', 'partOfSpeech', 'phonetic', 'audioUrl', 'difficulty']
  fields.forEach((field) => {
    if (word[field] !== undefined) {
      if (['lesson', 'difficulty'].includes(field)) {
        updateData[field] = Number(word[field]) || 0
      } else {
        updateData[field] = String(word[field]).trim()
      }
    }
  })

  if (Object.keys(updateData).length === 0) {
    return { code: 2, message: '没有要更新的字段' }
  }

  updateData.updatedAt = new Date().toISOString()

  // 如果更新了 word 或 unitId，需要重新校验重复
  if (updateData.word !== undefined) {
    const unitId = word.unitId !== undefined ? word.unitId : current.unitId
    const { total } = await db.collection('words')
      .where({ word: updateData.word, unitId, _id: db.command.neq(_id) })
      .count()
    if (total > 0) {
      return { code: 3, message: '该单元下已存在相同单词' }
    }
    if (word.unitId !== undefined) updateData.unitId = unitId
  }

  await db.collection('words').doc(_id).update({ data: updateData })

  // 同步新旧单元词数
  const after = await db.collection('words').doc(_id).get()
  const newUnitId = after.data && after.data.unitId
  if (newUnitId) await syncUnitWordCount(newUnitId)
  if (word.unitId !== undefined && word.unitId !== newUnitId) {
    await syncUnitWordCount(word.unitId)
  }

  return { code: 0, message: '更新成功' }
}

async function deleteWord(wordId, openid) {
  if (!wordId) return { code: 2, message: '缺少单词 ID' }

  // 权限校验：仅创建者可删除自己的单词
  const doc = await db.collection('words').doc(wordId).get()
  const current = doc.data || {}
  if (!current._id) {
    return { code: 3, message: '单词不存在' }
  }
  if (current.createdBy !== openid) {
    return { code: 5, message: '无权删除他人的单词' }
  }

  const unitId = current.unitId

  await db.collection('words').doc(wordId).remove()
  if (unitId) await syncUnitWordCount(unitId)

  return { code: 0, message: '删除成功' }
}

async function listWords(unitId, openid) {
  if (!unitId) return { code: 2, message: '缺少单元 ID' }
  if (!openid) return { code: 5, message: '用户未登录' }

  // 权限校验：仅单元创建者或班级共享成员可查看单词列表
  const accessible = await isUnitAccessible(unitId, openid)
  if (!accessible) {
    return { code: 5, message: '无权查看该单元的单词' }
  }

  // 分页查询，避免单次 get 默认 100 条限制导致数据丢失
  const PAGE_SIZE = 100
  let allData = []
  let hasMore = true
  while (hasMore) {
    const query = db.collection('words')
      .where({ unitId })
      .orderBy('createdAt', 'desc')
      .skip(allData.length)
      .limit(PAGE_SIZE)
    const { data } = await query.get()
    allData = allData.concat(data)
    if (data.length < PAGE_SIZE) {
      hasMore = false
    }
  }

  return { code: 0, data: allData }
}

/**
 * 判断单元是否对当前用户可见（自己创建或所在班级共享）
 * @param {string} unitId
 * @param {string} openid
 * @returns {Promise<boolean>}
 */
async function isUnitAccessible(unitId, openid) {
  try {
    const unitRes = await db.collection('units').doc(unitId).get()
    if (unitRes.data && unitRes.data.createdBy === openid) return true

    const { data: classes } = await db.collection('classes')
      .where({
        sharedUnitIds: unitId,
        members: openid
      })
      .limit(1)
      .field({ _id: true })
      .get()
    return classes.length > 0
  } catch (err) {
    console.error('校验单元访问权限失败:', err)
    return false
  }
}

async function syncUnitWordCount(unitId) {
  try {
    const { total } = await db.collection('words').where({ unitId }).count()
    await db.collection('units').doc(unitId).update({
      data: { wordCount: total, updatedAt: new Date().toISOString() }
    })
  } catch (err) {
    console.error('同步单元词数失败:', err)
  }
}

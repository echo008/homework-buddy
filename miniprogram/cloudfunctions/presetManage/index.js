// cloudfunctions/presetManage/index.js
// 预置听写内容管理：学段/教材/单元筛选、导入、预览
//
// 📌 数据库集合与结构
//
// 1. presetTextbooks（教材）
//    {
//      name: string,         // 教材名称，如 "人教版小学语文三年级上册"
//      publisher: string,    // 出版社
//      subject: 'chinese' | 'english',
//      gradeLevel: 'primary' | 'junior' | 'senior' | 'national',
//      grade: number,        // 1-12，0 表示不限
//      semester: number,     // 1 | 2，0 表示不限
//      version: string,      // 版本标识，如 'pep'
//      order: number,
//      createdAt, updatedAt
//    }
//
// 2. presetUnits（预置单元）
//    {
//      textbookId: string,
//      name: string,
//      subject, gradeLevel, grade, semester,
//      contentType: 'poetry' | 'word' | 'phrase' | 'sentence',
//      order: number,
//      wordCount: number,
//      createdAt, updatedAt
//    }
//
// 3. presetWords（预置内容）
//    {
//      unitId, textbookId, subject, gradeLevel, contentType,
//      word: string,        // 内容本身：古诗词题目 / 单词 / 短语
//      meaning: string,     // 释义 / 作者 / 备注
//      pinyin?: string,     // 语文拼音
//      phonetic?: string,   // 英语音标
//      partOfSpeech?: string,
//      lesson: number,
//      order: number,
//      createdAt, updatedAt
//    }
//
// 📌 索引建议
//   presetTextbooks: { gradeLevel: 1, subject: 1, order: 1 }
//   presetUnits:     { textbookId: 1, contentType: 1, order: 1 }
//   presetWords:     { unitId: 1, order: 1 }

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const {
  ALLOWED_SUBJECTS,
  ALLOWED_GRADE_LEVELS,
  ALLOWED_CONTENT_TYPES,
  SUBJECTS,
  GRADE_LEVELS,
  CONTENT_TYPES,
  GRADE_LEVEL_LABELS,
  CONTENT_TYPE_LABELS
} = require('../common/constants.js')

const PAGE_SIZE = 100

exports.main = async (event) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID || ''

  if (!openid) {
    return { code: 5, message: '用户未登录' }
  }

  try {
    switch (action) {
      case 'listFilters':
        return await listFilters()
      case 'listTextbooks':
        return await listTextbooks(event)
      case 'listPresetUnits':
        return await listPresetUnits(event)
      case 'previewPresetWords':
        return await previewPresetWords(event)
      case 'importPresetUnit':
        return await importPresetUnit(event, openid)
      case 'importPresetUnits':
        return await importPresetUnits(event, openid)
      case 'listWordsNeedAudio':
        return await listWordsNeedAudio(event)
      case 'saveAudioUrl':
        return await saveAudioUrl(event, openid)
      case 'seed':
        // ⚠️ 仅用于首次部署时初始化示例数据；force=true 可清空并重新导入
        return await seedPresetData(event.force, openid)
      default:
        return { code: 1, message: '未知操作类型' }
    }
  } catch (err) {
    console.error('presetManage error:', err)
    return { code: -1, message: '操作失败，请稍后重试', error: err.message }
  }
}

// 返回固定的筛选维度（学段/教材版本/内容类型）
async function listFilters() {
  const gradeLevels = [
    { value: GRADE_LEVELS.PRIMARY, label: GRADE_LEVEL_LABELS[GRADE_LEVELS.PRIMARY] },
    { value: GRADE_LEVELS.JUNIOR, label: GRADE_LEVEL_LABELS[GRADE_LEVELS.JUNIOR] },
    { value: GRADE_LEVELS.SENIOR, label: GRADE_LEVEL_LABELS[GRADE_LEVELS.SENIOR] },
    { value: GRADE_LEVELS.NATIONAL, label: GRADE_LEVEL_LABELS[GRADE_LEVELS.NATIONAL] }
  ]

  const versions = [
    { value: 'pep', label: '人教版' },
    { value: 'js', label: '江苏版' },
    { value: 'bju', label: '北师大版' },
    { value: 'other', label: '其他' }
  ]

  const contentTypes = [
    { value: CONTENT_TYPES.POETRY, label: CONTENT_TYPE_LABELS[CONTENT_TYPES.POETRY], subject: SUBJECTS.CHINESE },
    { value: CONTENT_TYPES.WORD, label: CONTENT_TYPE_LABELS[CONTENT_TYPES.WORD], subject: SUBJECTS.ENGLISH },
    { value: CONTENT_TYPES.PHRASE, label: CONTENT_TYPE_LABELS[CONTENT_TYPES.PHRASE], subject: SUBJECTS.ENGLISH },
    { value: CONTENT_TYPES.SENTENCE, label: CONTENT_TYPE_LABELS[CONTENT_TYPES.SENTENCE], subject: SUBJECTS.ENGLISH }
  ]

  return { code: 0, data: { gradeLevels, versions, contentTypes } }
}

async function listTextbooks({ gradeLevel, subject, version }) {
  if (!ALLOWED_SUBJECTS.includes(subject)) {
    return { code: 2, message: '学科类型不正确' }
  }

  const where = { subject }
  if (ALLOWED_GRADE_LEVELS.includes(gradeLevel)) {
    where.gradeLevel = gradeLevel
  }
  if (version) {
    where.version = version
  }

  const { data } = await db.collection('presetTextbooks')
    .where(where)
    .orderBy('grade', 'asc')
    .orderBy('semester', 'asc')
    .orderBy('order', 'asc')
    .limit(PAGE_SIZE)
    .get()

  return { code: 0, data }
}

async function listPresetUnits({ textbookId, subject, contentType }) {
  if (!textbookId) {
    return { code: 2, message: '缺少教材 ID' }
  }
  if (!ALLOWED_SUBJECTS.includes(subject)) {
    return { code: 2, message: '学科类型不正确' }
  }

  const where = { textbookId, subject }
  if (ALLOWED_CONTENT_TYPES.includes(contentType)) {
    where.contentType = contentType
  }

  const { data } = await db.collection('presetUnits')
    .where(where)
    .orderBy('order', 'asc')
    .limit(PAGE_SIZE)
    .get()

  return { code: 0, data }
}

async function previewPresetWords({ unitId, limit = 20 }) {
  if (!unitId) {
    return { code: 2, message: '缺少单元 ID' }
  }

  const maxLimit = Math.min(Number(limit) || 20, 100)
  const { data } = await db.collection('presetWords')
    .where({ unitId })
    .orderBy('order', 'asc')
    .limit(maxLimit)
    .get()

  return { code: 0, data }
}

// 将单个预置单元导入到用户自己的 units/words
async function importPresetUnit({ presetUnitId }, openid) {
  if (!presetUnitId) {
    return { code: 2, message: '缺少预置单元 ID' }
  }

  const { data: unitDocs } = await db.collection('presetUnits')
    .where({ _id: presetUnitId })
    .limit(1)
    .get()

  if (unitDocs.length === 0) {
    return { code: 3, message: '预置单元不存在' }
  }

  const presetUnit = unitDocs[0]
  const now = new Date().toISOString()

  // 创建用户单元
  const userUnit = {
    name: presetUnit.name,
    subject: presetUnit.subject,
    gradeLevel: presetUnit.gradeLevel,
    grade: presetUnit.grade,
    semester: presetUnit.semester,
    textbookId: presetUnit.textbookId,
    contentType: presetUnit.contentType,
    order: presetUnit.order,
    createdBy: openid,
    wordCount: 0,
    createdAt: now,
    updatedAt: now
  }

  const { _id: userUnitId } = await db.collection('units').add({ data: userUnit })

  // 复制预置内容到用户 words
  const presetWords = await paginateQuery(
    db.collection('presetWords').where({ unitId: presetUnitId }).orderBy('order', 'asc')
  )

  const userWordIds = []
  for (const pw of presetWords) {
    const { _id } = await db.collection('words').add({
      data: {
        unitId: userUnitId,
        subject: pw.subject,
        word: pw.word,
        meaning: pw.meaning || '',
        pinyin: pw.pinyin || '',
        phonetic: pw.phonetic || '',
        partOfSpeech: pw.partOfSpeech || '',
        lesson: pw.lesson || 1,
        audioUrl: pw.audioUrl || '',
        order: pw.order || 0,
        difficulty: pw.difficulty || 3,
        examples: pw.examples || [],
        source: 'preset',
        createdBy: openid,
        createdAt: now,
        updatedAt: now
      }
    })
    userWordIds.push(_id)
  }

  // 同步单元词数
  const count = userWordIds.length
  await db.collection('units').doc(userUnitId).update({
    data: { wordCount: count, updatedAt: now }
  })

  return {
    code: 0,
    message: '导入成功',
    data: { unitId: userUnitId, wordCount: count }
  }
}

// 批量导入多个预置单元
async function importPresetUnits({ presetUnitIds = [] }, openid) {
  if (!Array.isArray(presetUnitIds) || presetUnitIds.length === 0) {
    return { code: 2, message: '请选择要导入的单元' }
  }

  const results = []
  for (const id of presetUnitIds) {
    const res = await importPresetUnit({ presetUnitId: id }, openid)
    results.push(res)
  }

  const successCount = results.filter(r => r.code === 0).length
  return {
    code: 0,
    message: `成功导入 ${successCount}/${presetUnitIds.length} 个单元`,
    data: { results, successCount }
  }
}

/**
 * 查询指定单元下尚未生成音频的预置单词
 * @param {Object} param
 * @param {string} param.unitId 单元 ID
 * @param {number} param.limit 单次返回数量，默认 50
 */
async function listWordsNeedAudio({ unitId, limit = 50 }) {
  if (!unitId) {
    return { code: 2, message: '缺少单元 ID' }
  }

  const { data } = await db.collection('presetWords')
    .where({
      unitId,
      audioUrl: db.command.or(db.command.eq(''), db.command.eq(null))
    })
    .orderBy('order', 'asc')
    .limit(Number(limit) || 50)
    .get()

  return {
    code: 0,
    data: data.map(item => ({
      wordId: item._id,
      word: item.word,
      subject: item.subject,
      contentType: item.contentType,
      pinyin: item.pinyin || '',
      meaning: item.meaning || ''
    }))
  }
}

/**
 * 保存预置单词的音频 URL
 * @param {Object} param
 * @param {string} param.wordId 单词文档 ID
 * @param {string} param.audioUrl 云存储文件 ID 或 https 链接
 */
async function saveAudioUrl({ wordId, audioUrl }, openid) {
  if (!wordId) {
    return { code: 2, message: '缺少单词 ID' }
  }
  if (typeof audioUrl !== 'string' || !audioUrl.trim()) {
    return { code: 2, message: '音频链接不能为空' }
  }

  // 若配置了预置内容管理员，则仅允许管理员更新音频链接
  const adminOpenid = process.env.PRESET_ADMIN_OPENID || ''
  if (adminOpenid && adminOpenid !== openid) {
    return { code: 5, message: '无权更新预置音频' }
  }

  await db.collection('presetWords').doc(wordId).update({
    data: {
      audioUrl: audioUrl.trim(),
      updatedAt: new Date().toISOString()
    }
  })

  return { code: 0, message: '音频链接保存成功' }
}

async function paginateQuery(query, pageSize = 100) {
  let all = []
  let hasMore = true
  while (hasMore) {
    const { data } = await query.skip(all.length).limit(pageSize).get()
    all = all.concat(data)
    hasMore = data.length === pageSize
  }
  return all
}

// 初始化示例预置数据（幂等：已有数据则跳过；force=true 会清空后重新导入）
async function seedPresetData(force = false, openid = '') {
  // 安全加固：force=true 仅允许配置的管理员 openid 执行，防止数据被恶意清空
  const adminOpenid = process.env.PRESET_ADMIN_OPENID || ''
  if (force) {
    if (!adminOpenid) {
      return { code: 7, message: '未配置管理员，禁止强制覆盖数据' }
    }
    if (adminOpenid !== openid) {
      return { code: 5, message: '无权强制覆盖预置数据' }
    }
    await db.collection('presetTextbooks').where({}).remove()
    await db.collection('presetUnits').where({}).remove()
    await db.collection('presetWords').where({}).remove()
  } else {
    const { data: existing } = await db.collection('presetTextbooks').limit(1).get()
    if (existing.length > 0) {
      return { code: 0, message: '示例数据已存在，无需重复初始化' }
    }
  }

  try {
    const seed = require('./seed.json')
    const now = new Date().toISOString()
    const textbookIds = []

    // 插入教材
    for (const tb of seed.presetTextbooks) {
      const { _id } = await db.collection('presetTextbooks').add({
        data: { ...tb, createdAt: now, updatedAt: now }
      })
      textbookIds.push(_id)
    }

    const unitIds = []
    // 插入单元
    for (const unit of seed.presetUnits) {
      const textbookId = textbookIds[unit.textbookIndex]
      if (!textbookId) continue
      const { _id } = await db.collection('presetUnits').add({
        data: {
          ...unit,
          textbookId,
          wordCount: 0,
          createdAt: now,
          updatedAt: now
        }
      })
      unitIds.push(_id)
    }

    // 统计每个单元词数
    const unitWordCount = {}

    // 插入内容
    for (const word of seed.presetWords) {
      const unitId = unitIds[word.unitIndex]
      const unit = seed.presetUnits[word.unitIndex]
      if (!unitId || !unit) continue
      const textbookId = textbookIds[unit.textbookIndex]
      await db.collection('presetWords').add({
        data: {
          unitId,
          textbookId,
          subject: unit.subject,
          gradeLevel: unit.gradeLevel,
          contentType: unit.contentType,
          word: word.word,
          meaning: word.meaning || '',
          pinyin: word.pinyin || '',
          phonetic: word.phonetic || '',
          partOfSpeech: word.partOfSpeech || '',
          lesson: word.lesson || 1,
          order: word.order || 0,
          createdAt: now,
          updatedAt: now
        }
      })
      unitWordCount[unitId] = (unitWordCount[unitId] || 0) + 1
    }

    // 同步单元词数
    for (const [unitId, count] of Object.entries(unitWordCount)) {
      await db.collection('presetUnits').doc(unitId).update({
        data: { wordCount: count, updatedAt: now }
      })
    }

    return {
      code: 0,
      message: '示例数据初始化成功',
      data: { textbookCount: textbookIds.length, unitCount: unitIds.length }
    }
  } catch (err) {
    console.error('seedPresetData error:', err)
    return { code: -1, message: '初始化示例数据失败', error: err.message }
  }
}

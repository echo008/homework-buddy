// getDictationList/index.js
// 听写引擎核心：根据单元/课次筛选 + Min-Max 数量随机抽题
// 对应 words 集合 JSON Schema: docs/schemas/words.schema.json

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const {
  ALLOWED_SUBJECTS,
  ALLOWED_MODES,
  MODES,
  SUBJECTS,
  PROMPT_TYPES,
  ANSWER_TYPES
} = require('../common/constants.js')

/**
 * Fisher-Yates 洗牌算法，打乱数组顺序（防作弊：避免学生背顺序）
 * @param {Array} arr
 * @returns {Array} 打乱后的新数组
 */
function shuffle(arr) {
  const list = [...arr]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

/**
 * 在 [min, max] 闭区间内随机取一个整数
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomCount(min, max) {
  const low = Math.max(1, Number(min) || 1)
  const high = Math.max(low, Number(max) || low)
  return Math.floor(Math.random() * (high - low + 1)) + low
}

exports.main = async (event) => {
  const {
    unitIds = [],      // 用户自己的单元ID列表
    presetUnitIds = [], // 预置单元ID列表（公开内容，无需权限校验）
    lessons = [],      // 所选课次列表（可选，空表示不限课次）
    subject = SUBJECTS.ENGLISH, // 学科：english / chinese
    wordCountRange = { min: 10, max: 15 }, // 抽题数量上下限
    mode = MODES.EN2CN     // 听写模式：en2cn / cn2en / pinyin2hanzi / hanzi2pinyin
  } = event

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID || ''

  try {
    // 0. 参数与权限校验
    const hasUserUnits = Array.isArray(unitIds) && unitIds.length > 0
    const hasPresetUnits = Array.isArray(presetUnitIds) && presetUnitIds.length > 0
    if (!hasUserUnits && !hasPresetUnits) {
      return { code: 2, message: '请至少选择一个单元' }
    }
    if (!ALLOWED_SUBJECTS.includes(subject)) {
      return { code: 2, message: '学科类型不正确' }
    }
    if (!ALLOWED_MODES.includes(mode)) {
      return { code: 2, message: '听写模式不正确' }
    }

    // 校验抽题数量范围
    const { min, max } = wordCountRange || {}
    const minCount = Number(min) || 0
    const maxCount = Number(max) || 0
    if (minCount < 0 || maxCount < 0 || minCount > maxCount) {
      return { code: 2, message: '听写数量范围不合法' }
    }

    // 校验用户单元是否在当前用户可访问范围内（自己创建的 + 所在班级共享的）
    if (hasUserUnits) {
      const accessibleUnitIds = await getAccessibleUnitIds(openid, subject)
      const invalidUnitIds = unitIds.filter(id => !accessibleUnitIds.has(id))
      if (invalidUnitIds.length > 0) {
        return { code: 5, message: '存在无权访问的单元，请重新选择' }
      }
    }

    // 1. 构建查询条件：按学科 + 单元筛选
    const wordList = []

    if (hasUserUnits) {
      const where = { subject, unitId: _.in(unitIds) }
      if (Array.isArray(lessons) && lessons.length > 0) {
        where.lesson = _.in(lessons)
      }
      const userWords = await paginateQuery(db.collection('words').where(where))
      wordList.push(...userWords)
    }

    if (hasPresetUnits) {
      const presetWhere = { subject, unitId: _.in(presetUnitIds) }
      if (Array.isArray(lessons) && lessons.length > 0) {
        presetWhere.lesson = _.in(lessons)
      }
      const presetWords = await paginateQuery(db.collection('presetWords').where(presetWhere))
      wordList.push(...presetWords)
    }

    if (wordList.length === 0) {
      return {
        code: 1,
        message: '所选范围内暂无单词，请先录入或拍照导入',
        data: { words: [], total: 0 }
      }
    }

    // 3. 确定抽题数量（Min-Max 随机，不超过题库总量）
    const targetCount = Math.min(randomCount(minCount, maxCount), wordList.length)

    // 4. 洗牌后截取目标数量
    const selectedWords = shuffle(wordList).slice(0, targetCount)

    // 5. 按听写模式组装题目（决定展示什么、要求写什么）
    const questions = selectedWords.map((item, index) => {
      return buildQuestion(item, mode, index)
    })

    return {
      code: 0,
      message: 'success',
      data: {
        words: questions,
        total: questions.length,
        mode,
        subject
      }
    }
  } catch (err) {
    console.error('getDictationList error:', err)
    return {
      code: -1,
      message: '获取听写列表失败，请稍后重试',
      error: err.message
    }
  }
}

/**
 * 获取当前用户可访问的单元ID集合（自己创建的 + 所在班级共享的）
 * @param {string} openid
 * @param {string} subject
 * @returns {Promise<Set<string>>}
 */
async function getAccessibleUnitIds(openid, subject) {
  const where = {}
  if (ALLOWED_SUBJECTS.includes(subject)) where.subject = subject

  // 自己创建的单元（分页）
  const myUnits = await paginateQuery(
    db.collection('units')
      .where({ ...where, createdBy: openid })
      .field({ _id: true })
  )

  // 所在班级（分页）
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

/**
 * 分页查询工具：自动翻页直到取完所有数据
 * @param {Object} queryChain 已组装好 where/field 的查询链
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
 * 根据听写模式组装单道题目
 * @param {Object} word 单词文档
 * @param {string} mode 听写模式
 * @param {number} index 序号
 */
function buildQuestion(word, mode, index) {
  const base = {
    index: index + 1,
    wordId: word._id,
    unitId: word.unitId,
    audioUrl: word.audioUrl || ''
  }

  switch (mode) {
    case MODES.CN2EN:
      // 纯中文 -> 默写英文
      return {
        ...base,
        prompt: word.meaning,
        promptType: PROMPT_TYPES.CHINESE,
        answer: word.word,
        answerType: ANSWER_TYPES.ENGLISH
      }
    case MODES.PINYIN2HANZI:
      // 看拼音 -> 写汉字（语文专用）
      return {
        ...base,
        prompt: word.pinyin || word.word,
        promptType: PROMPT_TYPES.PINYIN,
        answer: word.word,
        answerType: ANSWER_TYPES.CHINESE
      }
    case MODES.HANZI2PINYIN:
      // 写拼音 -> 汉字（语文专用）
      return {
        ...base,
        prompt: word.word,
        promptType: PROMPT_TYPES.CHINESE,
        answer: word.pinyin || word.word,
        answerType: ANSWER_TYPES.PINYIN
      }
    case MODES.EN2CN:
    default:
      // 纯英文 -> 默写中文
      return {
        ...base,
        prompt: word.word,        // 播报/展示英文
        promptType: PROMPT_TYPES.ENGLISH,
        answer: word.meaning,     // 标准答案：中文
        answerType: ANSWER_TYPES.CHINESE
      }
  }
}

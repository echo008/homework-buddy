// getDictationList/index.js
// 听写引擎核心：根据单元/课次筛选 + Min-Max 数量随机抽题
// 对应 words 集合 JSON Schema: docs/schemas/words.schema.json

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

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
  const low = Math.max(1, min)
  const high = Math.max(low, max)
  return Math.floor(Math.random() * (high - low + 1)) + low
}

exports.main = async (event) => {
  const {
    unitIds = [],      // 所选单元ID列表
    lessons = [],      // 所选课次列表（可选，空表示不限课次）
    subject = 'english', // 学科：english / chinese
    wordCountRange = { min: 10, max: 15 }, // 抽题数量上下限
    mode = 'en2cn'     // 听写模式：en2cn / cn2en / pinyin2hanzi
  } = event

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID || ''

  try {
    // 0. 参数与权限校验
    if (!Array.isArray(unitIds) || unitIds.length === 0) {
      return { code: 2, message: '请至少选择一个单元' }
    }
    if (!['english', 'chinese'].includes(subject)) {
      return { code: 2, message: '学科类型不正确' }
    }

    // 校验所选单元是否在当前用户可访问范围内（自己创建的 + 所在班级共享的）
    const accessibleUnitIds = await getAccessibleUnitIds(openid, subject)
    const invalidUnitIds = unitIds.filter(id => !accessibleUnitIds.has(id))
    if (invalidUnitIds.length > 0) {
      return { code: 5, message: '存在无权访问的单元，请重新选择' }
    }

    // 1. 构建查询条件：按学科 + 单元筛选
    const where = { subject }
    where.unitId = _.in(unitIds)
    if (lessons.length > 0) {
      where.lesson = _.in(lessons)
    }

    // 2. 查询题库
    const { data: wordList } = await db.collection('words').where(where).get()

    if (wordList.length === 0) {
      return {
        code: 1,
        message: '所选范围内暂无单词，请先录入或拍照导入',
        data: { words: [], total: 0 }
      }
    }

    // 3. 确定抽题数量（Min-Max 随机，不超过题库总量）
    const { min, max } = wordCountRange
    const targetCount = Math.min(randomCount(min, max), wordList.length)

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
  if (['english', 'chinese'].includes(subject)) where.subject = subject

  // 自己创建的单元
  const { data: myUnits } = await db.collection('units')
    .where({ ...where, createdBy: openid })
    .field({ _id: true })
    .get()

  // 所在班级共享的单元
  const { data: myClasses } = await db.collection('classes')
    .where(_.or([{ createdBy: openid }, { members: openid }]))
    .field({ sharedUnitIds: true })
    .get()

  const sharedIds = new Set()
  myClasses.forEach(cls => {
    (cls.sharedUnitIds || []).forEach(id => sharedIds.add(id))
  })

  let sharedUnits = []
  if (sharedIds.size > 0) {
    const res = await db.collection('units')
      .where({ ...where, _id: _.in(Array.from(sharedIds)) })
      .field({ _id: true })
      .get()
    sharedUnits = res.data
  }

  const idSet = new Set()
  myUnits.forEach(u => idSet.add(u._id))
  sharedUnits.forEach(u => idSet.add(u._id))
  return idSet
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
    case 'en2cn':
      // 纯英文 -> 默写中文
      return {
        ...base,
        prompt: word.word,        // 播报/展示英文
        promptType: 'english',
        answer: word.meaning,     // 标准答案：中文
        answerType: 'chinese'
      }
    case 'cn2en':
      // 纯中文 -> 默写英文
      return {
        ...base,
        prompt: word.meaning,
        promptType: 'chinese',
        answer: word.word,
        answerType: 'english'
      }
    case 'pinyin2hanzi':
      // 看拼音 -> 写汉字（语文专用）
      return {
        ...base,
        prompt: word.pinyin || word.word,
        promptType: 'pinyin',
        answer: word.word,
        answerType: 'chinese'
      }
    default:
      return {
        ...base,
        prompt: word.word,
        promptType: 'english',
        answer: word.meaning,
        answerType: 'chinese'
      }
  }
}

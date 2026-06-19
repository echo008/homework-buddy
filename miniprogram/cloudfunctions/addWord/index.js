// addWord/index.js
// 手动添加单词到 words 集合
// 对应 words 集合 JSON Schema: docs/schemas/words.schema.json

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const {
    word,            // 单词/汉字本身（必填）
    meaning,         // 中文释义（必填）
    unitId,          // 所属单元ID（必填）
    subject = 'english', // 学科：english / chinese
    pinyin = '',     // 拼音（语文用）
    lesson = 1,      // 课次
    partOfSpeech = '', // 词性（英语用）
    phonetic = '',   // 音标（英语用）
    difficulty = 3   // 难度 1-5
  } = event

  // 参数校验
  if (!word || !meaning || !unitId) {
    return {
      code: 1,
      message: '参数缺失：word、meaning、unitId 均为必填项'
    }
  }

  const wxContext = cloud.getWXContext()
  const now = new Date().toISOString()

  try {
    // 查重：同单元下相同单词不重复录入
    const { total } = await db.collection('words')
      .where({ word, unitId })
      .count()

    if (total > 0) {
      return {
        code: 2,
        message: `该单元下已存在单词「${word}」，无需重复添加`
      }
    }

    const doc = {
      word,
      pinyin,
      meaning,
      unitId,
      subject,
      lesson,
      partOfSpeech,
      phonetic,
      audioUrl: '',
      difficulty,
      examples: [],
      source: 'manual',
      createdAt: now,
      updatedAt: now,
      createdBy: wxContext.OPENID
    }

    const { _id } = await db.collection('words').add({ data: doc })

    return {
      code: 0,
      message: '添加成功',
      data: { _id, ...doc }
    }
  } catch (err) {
    console.error('addWord error:', err)
    return {
      code: -1,
      message: '添加单词失败，请稍后重试',
      error: err.message
    }
  }
}

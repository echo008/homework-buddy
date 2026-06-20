// parseOcr/index.js
// 拍照识字：火山 OCR 提取课本图片文字 -> 豆包大模型结构化清洗 -> 去重入库
// API Key 均通过云函数环境变量注入，严禁硬编码

const cloud = require('wx-server-sdk')
const { OpenAI } = require('openai')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const { ALLOWED_SUBJECTS, SUBJECTS } = require('../common/constants.js')

// ========== 环境变量（在云函数控制台配置） ==========
const ENV = {
  VOLC_OCR_API_KEY: process.env.VOLC_OCR_API_KEY || '',
  VOLC_OCR_BASE_URL: process.env.VOLC_OCR_BASE_URL || 'https://ai-gateway.vei.volces.com/v1',
  VOLC_OCR_MODEL: process.env.VOLC_OCR_MODEL || 'AG-ocr-agent',

  DOUBAO_API_KEY: process.env.DOUBAO_API_KEY || '',
  DOUBAO_BASE_URL: process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
  DOUBAO_MODEL: process.env.DOUBAO_MODEL || '',

  // 演示开关：未配置真实密钥时返回模拟数据（仅用于本地联调，不写入数据库）
  DEMO_MODE: process.env.DEMO_MODE === 'true'
}

exports.main = async (event) => {
  const { fileID, subject = SUBJECTS.ENGLISH, unitId = '' } = event

  // 参数校验
  if (!fileID) {
    return { code: 1, message: '参数缺失：fileID 为必填项' }
  }
  if (!ALLOWED_SUBJECTS.includes(subject)) {
    return { code: 1, message: 'subject 只能是 english 或 chinese' }
  }
  if (!unitId) {
    return { code: 1, message: '参数缺失：unitId 为必填项' }
  }

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID || ''

  // 权限校验：仅单元创建者可往该单元导入单词
  const unitRes = await db.collection('units').doc(unitId).get()
  const unit = unitRes.data
  if (!unit) {
    return { code: 6, message: '单元不存在' }
  }
  if (unit.createdBy !== openid) {
    return { code: 5, message: '无权向他人的单元导入单词' }
  }

  try {
    // 1. 获取云存储图片临时访问链接
    const { fileList } = await cloud.getTempFileURL({
      fileList: [fileID]
    })
    const tempUrl = fileList && fileList[0] && fileList[0].tempFileURL
    if (!tempUrl) {
      return { code: 2, message: '获取图片临时链接失败' }
    }

    // 2. 下载图片并转 base64
    const imageBuffer = await downloadImage(tempUrl)
    const imageBase64 = imageBuffer.toString('base64')
    const mimeType = inferMimeType(imageBuffer)
    const dataUri = `data:${mimeType};base64,${imageBase64}`

    // 演示模式：未配置密钥直接返回样例，方便开发验证
    const missingKeys = []
    if (!ENV.VOLC_OCR_API_KEY) missingKeys.push('VOLC_OCR_API_KEY')
    if (!ENV.DOUBAO_API_KEY) missingKeys.push('DOUBAO_API_KEY')
    if (!ENV.DOUBAO_MODEL) missingKeys.push('DOUBAO_MODEL')
    if (ENV.DEMO_MODE || missingKeys.length > 0) {
      const demoWords = buildDemoWords(subject, unitId, openid)
      return {
        code: 0,
        message: missingKeys.length > 0
          ? `演示模式：缺少环境变量 ${missingKeys.join(', ')}，已返回示例单词（未写入数据库）`
          : '演示模式：已返回示例单词（未写入数据库）',
        data: {
          words: demoWords,
          count: demoWords.length,
          demo: true
        }
      }
    }

    // 3. 火山 OCR 识别
    const rawText = await callOcrAgent(dataUri)
    if (!rawText || !rawText.trim()) {
      return { code: 3, message: '图片中未识别到有效文字' }
    }

    // 4. 豆包大模型结构化清洗
    const structuredWords = await callStructuringLLM(rawText, subject)
    if (!structuredWords.length) {
      return { code: 4, message: '未从识别结果中提取到可用单词' }
    }

    // 5. 去重：同单元同单词不重复录入
    const deduped = await dedupeWords(structuredWords, unitId, subject)
    if (deduped.length === 0) {
      return { code: 5, message: '识别到的单词均已存在，无需重复导入' }
    }

    // 6. 补充元数据并批量入库
    const now = new Date().toISOString()
    const docs = deduped.map(item => buildWordDoc(item, subject, unitId, openid, now))
    const inserted = await batchInsert(docs)

    // 7. 同步单元单词数缓存
    await syncUnitWordCount(unitId)

    return {
      code: 0,
      message: `成功导入 ${inserted.length} 个单词`,
      data: {
        words: inserted,
        count: inserted.length,
        rawTextLength: rawText.length
      }
    }
  } catch (err) {
    console.error('parseOcr error:', err)
    return {
      code: -1,
      message: 'OCR 识别失败，请稍后重试',
      error: err.message
    }
  }
}

// ========== 图片下载 ==========
async function downloadImage(url) {
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) {
    throw new Error(`下载图片失败：${res.status} ${res.statusText}`)
  }
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

function inferMimeType(buffer) {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'image/jpeg'
  if (buffer[0] === 0x89 && buffer.slice(1, 4).toString('hex') === '504e47') return 'image/png'
  if (buffer.slice(0, 3).toString('ascii') === 'GIF') return 'image/gif'
  if (buffer.slice(0, 2).toString('ascii') === 'BM') return 'image/bmp'
  return 'image/jpeg'
}

// ========== 火山 OCR 智能体调用 ==========
async function callOcrAgent(dataUri) {
  if (!ENV.VOLC_OCR_API_KEY) {
    throw new Error('未配置 VOLC_OCR_API_KEY')
  }
  const client = new OpenAI({
    apiKey: ENV.VOLC_OCR_API_KEY,
    baseURL: ENV.VOLC_OCR_BASE_URL
  })

  const prompt = '请完整、准确地提取这张课本图片中的所有文字内容。保持原文排版，不要解释，只输出识别到的纯文本。'
  const completion = await client.chat.completions.create({
    model: ENV.VOLC_OCR_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: dataUri } }
        ]
      }
    ],
    max_tokens: 2048,
    temperature: 0.1
  })

  return completion.choices[0].message.content || ''
}

// ========== 豆包大模型结构化清洗 ==========
async function callStructuringLLM(rawText, subject) {
  if (!ENV.DOUBAO_API_KEY) {
    throw new Error('未配置 DOUBAO_API_KEY')
  }
  if (!ENV.DOUBAO_MODEL) {
    throw new Error('未配置 DOUBAO_MODEL')
  }

  const client = new OpenAI({
    apiKey: ENV.DOUBAO_API_KEY,
    baseURL: ENV.DOUBAO_BASE_URL
  })

  const prompt = buildPrompt(rawText, subject)
  const completion = await client.chat.completions.create({
    model: ENV.DOUBAO_MODEL,
    messages: [
      { role: 'system', content: '你是一名严谨的教育内容整理助手，只输出合法 JSON 数组，不添加任何额外说明。' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 2048,
    temperature: 0.1
  })

  const content = completion.choices[0].message.content || ''
  const list = extractJsonArray(content)
  return list.filter(item => isValidWord(item, subject))
}

function buildPrompt(rawText, subject) {
  if (subject === SUBJECTS.ENGLISH) {
    return `请从以下英语课本 OCR 文本中提取单词表，整理为 JSON 数组。每个元素包含字段：
- word: 英文单词本身
- meaning: 中文释义（多个释义用分号隔开）
- partOfSpeech: 词性（如 n./v./adj.），若文本中未标明可留空
- phonetic: 音标，若文本中未标明可留空
- lesson: 课次数字，若无法判断可填 1

要求：
1. 仅输出 JSON 数组，不要 Markdown 代码块，不要解释。
2. 过滤掉非单词内容（如标题、页码、例句中的重复词）。
3. 保留常见教材里的核心词汇。

OCR 文本：
${rawText}`
  }

  return `请从以下语文课本 OCR 文本中提取生字/词语表，整理为 JSON 数组。每个元素包含字段：
- word: 汉字或词语本身
- pinyin: 拼音（带声调，如 péng），若文本中未标明可留空
- meaning: 释义或常见组词（如 大鹏）
- lesson: 课次数字，若无法判断可填 1

要求：
1. 仅输出 JSON 数组，不要 Markdown 代码块，不要解释。
2. 过滤掉非生字内容（如标题、页码、自然段）。
3. 优先提取课后“会认字”“会写字”表中的字词。

OCR 文本：
${rawText}`
}

function extractJsonArray(text) {
  if (!text) return []
  // 优先取 ```json ... ``` 中的内容
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const target = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim()

  // 再取第一个 JSON 数组
  const arrMatch = target.match(/\[[\s\S]*\]/)
  if (!arrMatch) return []

  try {
    const parsed = JSON.parse(arrMatch[0])
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('JSON 解析失败:', err, target)
    return []
  }
}

function isValidWord(item, subject) {
  if (!item || typeof item !== 'object') return false
  if (!item.word || !item.word.trim()) return false
  if (!item.meaning || !item.meaning.trim()) return false
  if (subject === SUBJECTS.ENGLISH) {
    // 英文单词只保留基本字符与连字符
    item.word = item.word.trim().replace(/^[^a-zA-Z-]+|[^a-zA-Z-]+$/g, '')
  } else {
    item.word = item.word.trim().replace(/[\s\d，。！？、：；"'（）]+/g, '')
  }
  return !!item.word && !!item.meaning.trim()
}

// ========== 去重与入库 ==========
async function dedupeWords(newWords, unitId, subject) {
  // 分页查询已存在的单词，避免单次 100 条限制导致去重不完整
  const existing = await paginateQuery(
    db.collection('words')
      .where({ unitId, subject })
      .field({ word: true })
  )

  const existedSet = new Set(existing.map(w => normalizeForDedupe(w.word)))
  return newWords.filter(item => {
    const key = normalizeForDedupe(item.word)
    if (existedSet.has(key)) return false
    existedSet.add(key)
    return true
  })
}

/**
 * 分页查询工具：自动翻页直到取完所有数据
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

function normalizeForDedupe(word) {
  return String(word || '').trim().toLowerCase().replace(/\s+/g, '')
}

function buildWordDoc(item, subject, unitId, openid, now) {
  const base = {
    word: item.word.trim(),
    meaning: item.meaning.trim(),
    unitId,
    subject,
    lesson: Number(item.lesson) || 1,
    audioUrl: '',
    difficulty: 3,
    examples: [],
    source: 'ocr',
    createdAt: now,
    updatedAt: now,
    createdBy: openid
  }

  if (subject === SUBJECTS.ENGLISH) {
    return {
      ...base,
      pinyin: '',
      partOfSpeech: (item.partOfSpeech || '').trim(),
      phonetic: (item.phonetic || '').trim()
    }
  }

  return {
    ...base,
    pinyin: (item.pinyin || '').trim(),
    partOfSpeech: '',
    phonetic: ''
  }
}

/**
 * 串行批量插入，避免并发触发云数据库写入限流
 * @param {Array} docs
 * @returns {Promise<Array>} 已插入的文档（含 _id）
 */
async function batchInsert(docs) {
  const results = []
  for (const doc of docs) {
    try {
      const res = await db.collection('words').add({ data: doc })
      results.push({ _id: res._id, ...doc })
    } catch (err) {
      console.error('单词入库失败:', doc.word, err)
      // 单条失败不阻断整体流程，继续插入后续单词
    }
  }
  return results
}

async function syncUnitWordCount(unitId) {
  try {
    const { total } = await db.collection('words').where({ unitId }).count()
    await db.collection('units').doc(unitId).update({
      data: { wordCount: total, updatedAt: new Date().toISOString() }
    })
  } catch (err) {
    console.error('同步单元单词数失败:', err)
  }
}

// ========== 演示数据 ==========
function buildDemoWords(subject, unitId, openid) {
  const now = new Date().toISOString()
  if (subject === SUBJECTS.ENGLISH) {
    return [
      { word: 'apple', meaning: '苹果', partOfSpeech: 'n.', phonetic: '/ˈæpl/', unitId, source: 'ocr', createdBy: openid, createdAt: now },
      { word: 'banana', meaning: '香蕉', partOfSpeech: 'n.', phonetic: '/bəˈnɑːnə/', unitId, source: 'ocr', createdBy: openid, createdAt: now }
    ]
  }
  return [
    { word: '鹏', pinyin: 'péng', meaning: '大鹏', unitId, source: 'ocr', createdBy: openid, createdAt: now },
    { word: '怒', pinyin: 'nù', meaning: '愤怒', unitId, source: 'ocr', createdBy: openid, createdAt: now }
  ]
}

// 导出内部函数便于单元测试
exports._buildPrompt = buildPrompt
exports._extractJsonArray = extractJsonArray
exports._isValidWord = isValidWord
exports._normalizeForDedupe = normalizeForDedupe
exports._buildWordDoc = buildWordDoc

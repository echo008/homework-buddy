// utils/batchTts.js - 批量生成预置内容音频并上传云存储
// 用于开发/运营阶段提前把 TTS 音频录制好，避免用户首次听写时等待合成

const { listPresetWordsNeedAudio, savePresetAudioUrl } = require('./cloudApi.js')
const { synthesize, resolveLang } = require('./tts.js')

/**
 * 为指定预置单元批量生成音频
 * @param {string} unitId 预置单元 ID
 * @param {Object} options
 * @param {number} options.batchSize 每批处理数量，默认 20（防止一次请求过多）
 * @param {Function} options.onProgress 进度回调 (current, total, word) => void
 * @returns {Promise<{ success: number, fail: number, errors: string[] }>}
 */
async function generatePresetUnitAudio(unitId, options = {}) {
  if (!unitId) {
    throw new Error('缺少单元 ID')
  }
  const { batchSize = 20, onProgress } = options

  let allWords = []
  let hasMore = true
  while (hasMore) {
    const res = await listPresetWordsNeedAudio(unitId, batchSize)
    if (res.code !== 0) {
      throw new Error(res.message || '获取待生成音频列表失败')
    }
    const list = res.data || []
    if (list.length === 0) break
    allWords = allWords.concat(list)
    hasMore = list.length === batchSize
  }

  const total = allWords.length
  if (total === 0) {
    return { success: 0, fail: 0, errors: [], message: '该单元所有内容已存在音频' }
  }

  const result = { success: 0, fail: 0, errors: [] }
  for (let i = 0; i < allWords.length; i++) {
    const item = allWords[i]
    if (typeof onProgress === 'function') {
      onProgress(i + 1, total, item.word)
    }
    try {
      const audioUrl = await generateWordAudio(item)
      await savePresetAudioUrl(item.wordId, audioUrl)
      result.success++
    } catch (err) {
      const msg = `${item.word} 生成失败: ${err.message || err}`
      console.error(msg)
      result.fail++
      result.errors.push(msg)
    }
  }
  return result
}

/**
 * 为单个预置单词生成音频并上传云存储
 * @param {Object} item
 * @param {string} item.word 内容本身
 * @param {string} item.subject 学科
 * @param {string} item.contentType 内容类型
 * @param {string} item.pinyin 拼音
 * @returns {Promise<string>} 云存储文件 ID（cloud://...）
 */
async function generateWordAudio(item) {
  const text = resolveAudioText(item)
  const lang = resolveLangForBatch(item)
  const tempFilePath = await synthesize(text, lang)

  const ext = tempFilePath.toLowerCase().endsWith('.mp3') ? 'mp3' : 'mp3'
  const cloudPath = `tts/${item.subject}/${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`
  const uploadRes = await wx.cloud.uploadFile({
    cloudPath,
    filePath: tempFilePath
  })
  return uploadRes.fileID
}

/**
 * 根据内容类型确定要合成音频的文本
 * - 英语：合成单词本身
 * - 语文古诗词：合成诗词题目
 * - 语文拼音字词：合成汉字本身（或拼音，视需求而定）
 */
function resolveAudioText(item) {
  if (item.subject === 'english') {
    return item.word
  }
  if (item.contentType === 'poetry') {
    return item.word
  }
  // 语文看拼音写词语：默认朗读汉字，便于儿童识别；如需朗读拼音，可改为 item.pinyin
  return item.word || item.pinyin
}

/**
 * 根据学科推断 TTS 语言
 */
function resolveLangForBatch(item) {
  return resolveLang(item.subject === 'english' ? 'english' : 'chinese', item.subject)
}

module.exports = {
  generatePresetUnitAudio,
  generateWordAudio
}

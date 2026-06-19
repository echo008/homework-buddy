// utils/aiClient.js - AI 调用封装（前端侧仅做云函数调度）
// 注意：API Key 必须存放在云函数环境变量中，绝不可写在前端
// 本文件封装前端调用 parseOcr 云函数的入口，实际 AI 逻辑在云函数内执行

/**
 * 调用 parseOcr 云函数：上传图片 -> OCR 识别 -> 豆包大模型结构化清洗
 * @param {string} fileID 云存储文件ID
 * @param {Object} options { subject, unitId }
 * @returns {Promise<Object>} { code, message, data: { words: [] } }
 */
function parseOcrImage(fileID, options = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'parseOcr',
      data: {
        fileID,
        subject: options.subject || 'english',
        unitId: options.unitId || ''
      },
      success(res) {
        resolve(res.result)
      },
      fail(err) {
        console.error('parseOcrImage 调用失败:', err)
        reject(err)
      }
    })
  })
}

/**
 * 调用 getDictationList 云函数：随机抽取听写单词
 * @param {Object} params { unitIds, lessons, subject, wordCountRange, mode }
 * @returns {Promise<Object>}
 */
function getDictationList(params) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'getDictationList',
      data: params,
      success(res) {
        resolve(res.result)
      },
      fail(err) {
        console.error('getDictationList 调用失败:', err)
        reject(err)
      }
    })
  })
}

/**
 * 调用 addWord 云函数：手动添加单词
 * @param {Object} wordData 单词数据
 * @returns {Promise<Object>}
 */
function addWord(wordData) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'addWord',
      data: wordData,
      success(res) {
        resolve(res.result)
      },
      fail(err) {
        console.error('addWord 调用失败:', err)
        reject(err)
      }
    })
  })
}

module.exports = {
  parseOcrImage,
  getDictationList,
  addWord
}

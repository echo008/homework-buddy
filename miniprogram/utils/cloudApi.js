// utils/cloudApi.js - 云函数统一调用封装
// 前端侧只做调度，所有业务逻辑与密钥均放在云函数

/**
 * 调用云函数
 * @param {string} name 云函数名
 * @param {Object} data 入参
 * @returns {Promise<Object>} 云函数返回的 result，保证非空且含 code 字段
 */
function callCloud(name, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success(res) {
        // 防御云函数返回空 result 的情况
        const result = res && res.result
        if (!result) {
          resolve({ code: -1, message: '服务异常，请稍后重试' })
          return
        }
        // 保证 result 有 code 字段，便于前端统一处理
        if (typeof result.code === 'undefined') {
          resolve({ code: -1, message: '服务返回异常', data: result })
          return
        }
        resolve(result)
      },
      fail(err) {
        console.error(`云函数 ${name} 调用失败:`, err)
        // 网络错误统一包装为 reject，前端 catch 中可提示重试
        reject(err)
      }
    })
  })
}

// ========== AI / OCR / 听写 ==========

function parseOcrImage(fileID, options = {}) {
  return callCloud('parseOcr', {
    fileID,
    subject: options.subject || 'english',
    unitId: options.unitId || ''
  })
}

function getDictationList(params) {
  return callCloud('getDictationList', params)
}

// ========== 单元管理 ==========

function saveUnit(unit) {
  const action = unit._id ? 'update' : 'create'
  return callCloud('unitManage', { action, unit })
}

function deleteUnit(unitId) {
  return callCloud('unitManage', { action: 'delete', unitId })
}

function getManagedUnits(subject) {
  return callCloud('unitManage', { action: 'list', subject })
}

// ========== 单词管理 ==========

function getWordsByUnit(unitId) {
  return callCloud('wordManage', { action: 'list', unitId })
}

function saveWord(word) {
  const action = word._id ? 'update' : 'create'
  return callCloud('wordManage', { action, word })
}

function deleteWord(wordId) {
  return callCloud('wordManage', { action: 'delete', wordId })
}

// ========== 预置内容 ==========

function listPresetFilters() {
  return callCloud('presetManage', { action: 'listFilters' })
}

function listPresetTextbooks({ gradeLevel, subject, version }) {
  return callCloud('presetManage', { action: 'listTextbooks', gradeLevel, subject, version })
}

function listPresetUnits({ textbookId, subject, contentType }) {
  return callCloud('presetManage', { action: 'listPresetUnits', textbookId, subject, contentType })
}

function previewPresetWords(unitId, limit = 20) {
  return callCloud('presetManage', { action: 'previewPresetWords', unitId, limit })
}

function importPresetUnits(params = {}) {
  // 兼容直接传数组或 { presetUnitIds: [...] } 对象
  const presetUnitIds = Array.isArray(params) ? params : (params.presetUnitIds || [])
  return callCloud('presetManage', { action: 'importPresetUnits', presetUnitIds })
}

function listPresetWordsNeedAudio(unitId, limit = 50) {
  return callCloud('presetManage', { action: 'listWordsNeedAudio', unitId, limit })
}

function savePresetAudioUrl(wordId, audioUrl) {
  return callCloud('presetManage', { action: 'saveAudioUrl', wordId, audioUrl })
}

// ========== 听写记录 ==========

function saveUserLog(log) {
  return callCloud('logManage', { action: 'save', log })
}

function getUserLogs(limit = 20) {
  return callCloud('logManage', { action: 'list', limit })
}

// ========== 班级共享 ==========

function createClass(name, subject) {
  return callCloud('classManage', { action: 'create', name, subject })
}

function joinClass(code) {
  return callCloud('classManage', { action: 'join', code })
}

function getClassDetail(classId) {
  return callCloud('classManage', { action: 'get', classId })
}

function getMyClasses() {
  return callCloud('classManage', { action: 'myClasses' })
}

function shareUnitToClass(classId, unitId) {
  return callCloud('classManage', { action: 'shareUnit', classId, unitId })
}

function unshareUnitFromClass(classId, unitId) {
  return callCloud('classManage', { action: 'unshareUnit', classId, unitId })
}

function leaveClass(classId) {
  return callCloud('classManage', { action: 'leave', classId })
}

function dismissClass(classId) {
  return callCloud('classManage', { action: 'dismiss', classId })
}

module.exports = {
  callCloud,
  parseOcrImage,
  getDictationList,
  saveUnit,
  deleteUnit,
  getManagedUnits,
  getWordsByUnit,
  saveWord,
  deleteWord,
  createClass,
  joinClass,
  getClassDetail,
  getMyClasses,
  shareUnitToClass,
  unshareUnitFromClass,
  leaveClass,
  dismissClass,
  saveUserLog,
  getUserLogs,
  listPresetFilters,
  listPresetTextbooks,
  listPresetUnits,
  previewPresetWords,
  importPresetUnits,
  listPresetWordsNeedAudio,
  savePresetAudioUrl
}

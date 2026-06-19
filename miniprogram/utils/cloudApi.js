// utils/cloudApi.js - 云函数统一调用封装
// 前端侧只做调度，所有业务逻辑与密钥均放在云函数

function callCloud(name, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success(res) {
        resolve(res.result)
      },
      fail(err) {
        console.error(`云函数 ${name} 调用失败:`, err)
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

function addWord(wordData) {
  return callCloud('addWord', wordData)
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

module.exports = {
  callCloud,
  parseOcrImage,
  getDictationList,
  addWord,
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
  unshareUnitFromClass
}

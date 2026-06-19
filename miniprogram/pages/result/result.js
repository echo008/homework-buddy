// pages/result/result.js - 结果批改页
const { saveUserLog } = require('../../utils/db.js')

Page({
  data: {
    answers: [],
    total: 0,
    correctCount: 0,
    wrongCount: 0,
    accuracy: 0,
    wrongWords: [],
    saved: false
  },

  onLoad() {
    const eventChannel = this.getOpenerEventChannel()
    if (!eventChannel || !eventChannel.on) {
      wx.showToast({ title: '数据加载异常', icon: 'none' })
      return
    }
    eventChannel.on('resultData', (data) => {
      const wrongWords = (data.answers || []).filter(a => !a.isCorrect)
      this.setData({
        answers: data.answers || [],
        total: data.total || 0,
        correctCount: data.correctCount || 0,
        wrongCount: data.wrongCount || 0,
        accuracy: data.accuracy || 0,
        wrongWords
      })
      this.saveLog({ ...data, wrongWords })
    })
  },

  // 保存听写记录
  async saveLog(data) {
    try {
      const app = getApp()
      const openid = app.globalData.openid || ''
      await saveUserLog({
        openid,
        unitIds: data.unitIds || [],
        subject: data.subject || 'english',
        mode: data.mode || 'en2cn',
        wordCountRange: { min: data.total || 0, max: data.total || 0 },
        totalWords: data.total || 0,
        correctCount: data.correctCount || 0,
        wrongCount: data.wrongCount || 0,
        accuracy: data.accuracy || 0,
        wrongWords: data.wrongWords || [],
        status: 'completed'
      })
      this.setData({ saved: true })
    } catch (err) {
      console.error('保存听写记录失败:', err)
      wx.showToast({ title: '记录保存失败', icon: 'none' })
    }
  },

  // 一键重测错题
  onRetryWrong() {
    if (this.data.wrongWords.length === 0) {
      wx.showToast({ title: '没有错题，棒极了！', icon: 'none' })
      return
    }
    wx.redirectTo({
      url: '/pages/dictation/dictation?mode=retry',
      success: (nav) => {
        nav.eventChannel.emit('dictationData', {
          questions: this.data.wrongWords.map((w, i) => ({
            index: i + 1,
            wordId: w.wordId,
            unitId: '',
            audioUrl: '',
            prompt: w.word,
            promptType: w.promptType || 'english',
            answer: w.correctAnswer,
            answerType: w.answerType || 'chinese'
          })),
          total: this.data.wrongWords.length,
          unitIds: []
        })
      }
    })
  },

  onBackHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
